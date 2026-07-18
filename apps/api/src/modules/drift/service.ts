import Database from "better-sqlite3";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { hashContent } from "../../lib/hashing.js";
import { nowISO } from "../../lib/clock.js";

export function verifyAllArtifacts(db: Database.Database): { drifted: number; ok: number; errors: number } {
  const artifacts = db.prepare("SELECT * FROM governed_artifacts").all() as any[];
  let drifted = 0, ok = 0, errors = 0;

  for (const artifact of artifacts) {
    const effectivePath = artifact.configured_path || artifact.target_path;
    if (!effectivePath) continue;

    let observedHash: string | null = null;
    try {
      if (!existsSync(effectivePath)) {
        observedHash = null;
      } else {
        let content = "";
        if (statSync(effectivePath).isDirectory()) {
          const files = readdirSync(effectivePath).filter((f) => f.endsWith(".mdc") || f.endsWith(".md"));
          for (const f of files) {
            content += readFileSync(resolve(effectivePath, f), "utf-8");
          }
        } else {
          content = readFileSync(effectivePath, "utf-8");
        }
        observedHash = hashContent(content);
      }
    } catch {
      errors++;
      continue;
    }

    // Update last observed hash
    db.prepare("UPDATE governed_artifacts SET last_observed_hash = ? WHERE id = ?")
      .run(observedHash, artifact.id);

    // Get last expected hash from sync records
    const target = db.prepare(
      "SELECT id FROM project_targets WHERE owner_type = ? AND owner_id = ? AND platform = ?"
    ).get(artifact.owner_type, artifact.owner_id, artifact.platform) as any;

    if (!target) continue;

    const lastSync = db.prepare(
      "SELECT expected_hash FROM synchronization_records WHERE project_target_id = ? ORDER BY synced_at DESC LIMIT 1"
    ).get(target.id) as { expectedHash: string } | undefined;

    if (!lastSync) continue;

    if (observedHash !== lastSync.expectedHash) {
      // Check if there's already an open drift event
      const open = db.prepare(
        "SELECT id FROM drift_events WHERE project_target_id = ? AND status = 'open'"
      ).get(target.id);

      if (!open) {
        db.prepare(
          "INSERT INTO drift_events (project_target_id, expected_hash, observed_hash, detected_at, status) VALUES (?, ?, ?, ?, 'open')"
        ).run(target.id, lastSync.expectedHash, observedHash || "", nowISO());
      }
      drifted++;
    } else {
      ok++;
    }
  }

  return { drifted, ok, errors };
}

export function verifyProjectTarget(db: Database.Database, targetId: number): { drifted: boolean; eventId: number | null } {
  const target = db.prepare("SELECT * FROM project_targets WHERE id = ?").get(targetId) as any;
  if (!target) return { drifted: false, eventId: null };

  let observedHash: string | null = null;
  try {
    if (existsSync(target.target_path)) {
      const content = readFileSync(target.target_path, "utf-8");
      observedHash = hashContent(content);
    }
  } catch {
    return { drifted: false, eventId: null };
  }

  const lastSync = db.prepare(
    "SELECT expected_hash FROM synchronization_records WHERE project_target_id = ? ORDER BY synced_at DESC LIMIT 1"
  ).get(targetId) as { expectedHash: string } | undefined;

  if (!lastSync || observedHash === lastSync.expectedHash) {
    return { drifted: false, eventId: null };
  }

  const result = db.prepare(
    "INSERT INTO drift_events (project_target_id, expected_hash, observed_hash, detected_at, status) VALUES (?, ?, ?, ?, 'open')"
  ).run(targetId, lastSync.expectedHash, observedHash || "", nowISO());

  return { drifted: true, eventId: result.lastInsertRowid as number };
}

export function acknowledgeDrift(db: Database.Database, eventId: number): void {
  db.prepare("UPDATE drift_events SET status = 'acknowledged' WHERE id = ?").run(eventId);
}

export function resolveDrift(db: Database.Database, eventId: number): void {
  db.prepare("UPDATE drift_events SET status = 'resolved' WHERE id = ?").run(eventId);
}
