import Database from "better-sqlite3";
import { AdapterTarget } from "../adapters/contract.js";
import { getAdapter, getEnabledPlatforms } from "../adapters/registry.js";
import { buildEffectivePolicyFiles, composeEffectivePolicy } from "../policies/service.js";
import { hashRenderedOutput } from "../adapters/render-helpers.js";
import { nowISO } from "../../lib/clock.js";
import { syncOwnerArtifacts } from "../artifacts/sync-artifacts.js";
import { hashContent } from "../../lib/hashing.js";

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

function ensureOwnerArtifacts(db: Database.Database, ownerType: string, ownerId: number): void {
  if (ownerType === "project" || ownerType === "dev_application") {
    syncOwnerArtifacts(db, ownerType, ownerId);
  }
}

function getEffectiveContent(
  db: Database.Database,
  ownerType: string,
  ownerId: number,
): { content: string; standardFiles: { relativePath: string; content: string }[] } {
  const version = db.prepare(
    "SELECT cv.id FROM canonical_versions cv JOIN standard_rule_sets srs ON srs.current_version_id = cv.id LIMIT 1"
  ).get() as { id: number } | undefined;

  if (!version) return { content: "", standardFiles: [] };

  const standardFiles = buildEffectivePolicyFiles(db, ownerType, ownerId, version.id);
  composeEffectivePolicy(db, ownerType, ownerId, version.id);
  return { content: "", standardFiles };
}

function resolveManagedTargets(
  db: Database.Database,
  ownerType: string,
  ownerId: number,
  platform: string,
  fallbackTargets: AdapterTarget[],
): AdapterTarget[] {
  const artifacts = db.prepare(
    "SELECT artifact_type, target_path, configured_path FROM governed_artifacts WHERE owner_type = ? AND owner_id = ? AND platform = ? ORDER BY id"
  ).all(ownerType, ownerId, platform) as { artifact_type: string; target_path: string | null; configured_path: string | null }[];

  const managedTargets = artifacts
    .map((artifact) => ({
      platform,
      targetPath: artifact.configured_path || artifact.target_path || "",
      artifactType: artifact.artifact_type,
    }))
    .filter((target) => target.targetPath);

  if (managedTargets.length > 0) return managedTargets;
  return fallbackTargets;
}

export function buildPublishPlan(
  db: Database.Database,
  ownerType?: string,
  ownerId?: number,
  platform?: string,
): PublishPlanItem[] {
  const items: PublishPlanItem[] = [];
  const platforms = platform ? [platform] : getEnabledPlatforms(db);

  const surfaces: { type: string; id: number; name: string }[] = [];

  if (ownerType && ownerId !== undefined) {
    ensureOwnerArtifacts(db, ownerType, ownerId);
    const name = getOwnerName(db, ownerType, ownerId);
    if (name) surfaces.push({ type: ownerType, id: ownerId, name });
  } else {
    const projects = db.prepare("SELECT id, name FROM governed_projects").all() as any[];
    for (const p of projects) {
      ensureOwnerArtifacts(db, "project", p.id);
      surfaces.push({ type: "project", id: p.id, name: p.name });
    }

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
      const targets = resolveManagedTargets(
        db,
        surface.type,
        surface.id,
        p,
        adapter.resolveTargets(surface.type, surface.id)
      );

      for (const target of targets) {
        let fileContent = output.content;
        if (output.files && output.files.length > 0) {
          const normTarget = target.targetPath.replace(/\\/g, "/").toLowerCase();
          const matchFile = output.files.find((f) => {
            const normRel = f.relativePath.replace(/\\/g, "/").toLowerCase();
            return normTarget.endsWith(normRel);
          });
          if (matchFile) {
            fileContent = matchFile.content;
          }
        }
        const fileHash = hashContent(fileContent);

        items.push({
          ownerType: surface.type,
          ownerId: surface.id,
          ownerName: surface.name,
          platform: p,
          targetPath: target.targetPath,
          artifactType: target.artifactType,
          estimatedHash: fileHash,
          contentPreview: fileContent.substring(0, 200),
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

    const targets = resolveManagedTargets(
      db,
      item.ownerType,
      item.ownerId,
      item.platform,
      adapter.resolveTargets(item.ownerType, item.ownerId)
    );
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
      let targetDb = db.prepare(
        "SELECT id FROM project_targets WHERE owner_type = ? AND owner_id = ? AND platform = ? AND target_path = ?"
      ).get(item.ownerType, item.ownerId, item.platform, item.targetPath) as any;

      if (!targetDb) {
        const r = db.prepare(
          "INSERT INTO project_targets (owner_type, owner_id, platform, target_path, managed) VALUES (?, ?, ?, ?, 1)"
        ).run(item.ownerType, item.ownerId, item.platform, item.targetPath);
        targetDb = { id: r.lastInsertRowid };
      }

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
