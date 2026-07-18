import Database from "better-sqlite3";
import { getAdapter, getEnabledPlatforms } from "../adapters/registry.js";
import { composeEffectivePolicy } from "../policies/service.js";
import { hashContent } from "../../lib/hashing.js";
import { nowISO } from "../../lib/clock.js";

export interface PublishPlanItem {
  ownerType: string;
  ownerId: number;
  ownerName: string;
  platform: string;
  targetPath: string;
  artifactType: string;
  estimatedHash: string;
  contentPreview: string;
}

export interface PublishResult {
  operationId: number;
  items: {
    ownerType: string;
    ownerId: number;
    platform: string;
    targetPath: string;
    written: boolean;
    verified: boolean;
    syncId: number | null;
    error?: string;
  }[];
}

function getEffectiveContent(
  db: Database.Database,
  ownerType: string,
  ownerId: number,
): { content: string; standardFiles: { relativePath: string; content: string }[] } {
  // Get latest canonical version
  const version = db.prepare(
    "SELECT cv.id FROM canonical_versions cv JOIN standard_rule_sets srs ON srs.current_version_id = cv.id LIMIT 1"
  ).get() as { id: number } | undefined;

  if (!version) return { content: "", standardFiles: [] };

  const standardFiles = db.prepare(
    "SELECT relative_path, content FROM canonical_rule_files WHERE canonical_version_id = ?"
  ).all(version.id) as { relativePath: string; content: string }[];

  // Build composite content from standard + custom rules
  const policy = composeEffectivePolicy(db, ownerType, ownerId, version.id);
  const customRules = db.prepare(
    "SELECT content FROM project_rules WHERE owner_type = ? AND owner_id = ? AND is_active = 1 AND precedence_mode != 'disable'"
  ).all(ownerType, ownerId) as { content: string }[];

  const parts: string[] = standardFiles.map((f) => f.content);
  for (const r of customRules) parts.push(r.content);

  return { content: parts.join("\n\n"), standardFiles };
}

export function buildPublishPlan(
  db: Database.Database,
  ownerType?: string,
  ownerId?: number,
  platform?: string,
): PublishPlanItem[] {
  const items: PublishPlanItem[] = [];
  const platforms = platform ? [platform] : getEnabledPlatforms(db);

  // Determine what to publish
  const surfaces: { type: string; id: number; name: string }[] = [];

  if (ownerType && ownerId !== undefined) {
    const name = getOwnerName(db, ownerType, ownerId);
    if (name) surfaces.push({ type: ownerType, id: ownerId, name });
  } else {
    // All surfaces
    const projects = db.prepare("SELECT id, name FROM governed_projects").all() as any[];
    for (const p of projects) surfaces.push({ type: "project", id: p.id, name: p.name });

    const devApps = db.prepare("SELECT id, name FROM governed_dev_applications").all() as any[];
    for (const a of devApps) surfaces.push({ type: "dev_application", id: a.id, name: a.name });

    const aiSurfaces = db.prepare("SELECT id, name FROM governed_ai_surfaces").all() as any[];
    for (const s of aiSurfaces) surfaces.push({ type: "ai_surface", id: s.id, name: s.name });
  }

  for (const surface of surfaces) {
    const { content, standardFiles } = getEffectiveContent(db, surface.type, surface.id);

    for (const p of platforms) {
      const adapter = getAdapter(p);
      if (!adapter) continue;

      const output = adapter.render(content, standardFiles);
      const targets = adapter.resolveTargets(surface.type, surface.id);

      for (const target of targets) {
        items.push({
          ownerType: surface.type,
          ownerId: surface.id,
          ownerName: surface.name,
          platform: p,
          targetPath: target.targetPath,
          artifactType: target.artifactType,
          estimatedHash: hashContent(output.content),
          contentPreview: output.content.substring(0, 200),
        });
      }
    }
  }

  return items;
}

export async function executePublish(
  db: Database.Database,
  planItems: PublishPlanItem[],
  triggeredBy: string = "manual",
): Promise<PublishResult> {
  const opResult = db.prepare(
    "INSERT INTO publish_operations (scope_type, scope_id, started_at, result, triggered_by) VALUES (?, ?, ?, 'running', ?)"
  ).run("bulk", JSON.stringify(planItems.map(i => ({ t: i.ownerType, id: i.ownerId, p: i.platform }))), nowISO(), triggeredBy);
  const operationId = opResult.lastInsertRowid as number;

  const results: PublishResult["items"] = [];

  for (const item of planItems) {
    const adapter = getAdapter(item.platform);
    if (!adapter) {
      results.push({ ...item, written: false, verified: false, syncId: null, error: "Unknown adapter" });
      continue;
    }

    const { content, standardFiles } = getEffectiveContent(db, item.ownerType, item.ownerId);
    const output = adapter.render(content, standardFiles);
    const errors = adapter.validate(output);

    if (errors.length > 0) {
      results.push({ ...item, written: false, verified: false, syncId: null, error: `Validation: ${errors.join(", ")}` });
      continue;
    }

    const targets = adapter.resolveTargets(item.ownerType, item.ownerId);
    const filtered = targets.filter((t) => t.targetPath === item.targetPath);

    if (filtered.length === 0) {
      results.push({ ...item, written: false, verified: false, syncId: null, error: "Target not found" });
      continue;
    }

    const writeResult = await adapter.write(filtered, output);
    const verifyResult = await adapter.verify(filtered, item.estimatedHash);

    const written = writeResult.written.length > 0;
    const verified = verifyResult.every((v) => v.match);

    let syncId: number | null = null;
    if (written) {
      // Register or find target
      let targetDb = db.prepare(
        "SELECT id FROM project_targets WHERE owner_type = ? AND owner_id = ? AND platform = ? AND target_path = ?"
      ).get(item.ownerType, item.ownerId, item.platform, item.targetPath) as any;

      if (!targetDb) {
        const r = db.prepare(
          "INSERT INTO project_targets (owner_type, owner_id, platform, target_path, managed) VALUES (?, ?, ?, ?, 1)"
        ).run(item.ownerType, item.ownerId, item.platform, item.targetPath);
        targetDb = { id: r.lastInsertRowid };
      }

      // Get canonical version
      const version = db.prepare(
        "SELECT cv.id FROM canonical_versions cv JOIN standard_rule_sets srs ON srs.current_version_id = cv.id LIMIT 1"
      ).get() as { id: number } | undefined;

      if (version) {
        const sr = db.prepare(
          "INSERT INTO synchronization_records (project_target_id, canonical_version_id, expected_hash, applied_hash, sync_status, synced_at) VALUES (?, ?, ?, ?, ?, ?)"
        ).run(targetDb.id, version.id, item.estimatedHash, item.estimatedHash, verified ? "up_to_date" : "outdated", nowISO());
        syncId = sr.lastInsertRowid as number;
      }
    }

    results.push({
      ownerType: item.ownerType,
      ownerId: item.ownerId,
      platform: item.platform,
      targetPath: item.targetPath,
      written,
      verified,
      syncId,
      error: writeResult.errors.length > 0 ? writeResult.errors.join(", ") : undefined,
    });
  }

  const allOk = results.every((r) => r.written && r.verified);
  db.prepare("UPDATE publish_operations SET finished_at = ?, result = ? WHERE id = ?")
    .run(nowISO(), allOk ? "success" : "partial", operationId);

  return { operationId, items: results };
}

function getOwnerName(db: Database.Database, type: string, id: number): string | undefined {
  const table: Record<string, string> = {
    project: "governed_projects",
    dev_application: "governed_dev_applications",
    ai_surface: "governed_ai_surfaces",
  };
  const tbl = table[type];
  if (!tbl) return undefined;
  const row = db.prepare(`SELECT name FROM ${tbl} WHERE id = ?`).get(id) as any;
  return row?.name;
}
