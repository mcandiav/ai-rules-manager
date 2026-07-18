import Database from "better-sqlite3";
import { hashContent } from "../../lib/hashing.js";
import { nowISO } from "../../lib/clock.js";

export function recordSync(
  db: Database.Database,
  projectTargetId: number,
  canonicalVersionId: number,
  appliedContent: string,
  status: string
): number {
  const expectedHash = hashContent(appliedContent);

  const result = db.prepare(
    "INSERT INTO synchronization_records (project_target_id, canonical_version_id, expected_hash, applied_hash, sync_status, synced_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(projectTargetId, canonicalVersionId, expectedHash, expectedHash, status, nowISO());

  return result.lastInsertRowid as number;
}

export function checkDrift(
  db: Database.Database,
  projectTargetId: number,
  observedContent: string
): { drifted: boolean; eventId: number | null } {
  const lastSync = db.prepare(
    "SELECT expected_hash FROM synchronization_records WHERE project_target_id = ? ORDER BY synced_at DESC LIMIT 1"
  ).get(projectTargetId) as { expectedHash: string } | undefined;

  if (!lastSync) return { drifted: false, eventId: null };

  const observedHash = hashContent(observedContent);
  if (observedHash === lastSync.expectedHash) return { drifted: false, eventId: null };

  const result = db.prepare(
    "INSERT INTO drift_events (project_target_id, expected_hash, observed_hash, detected_at, status) VALUES (?, ?, ?, ?, 'open')"
  ).run(projectTargetId, lastSync.expectedHash, observedHash, nowISO());

  return { drifted: true, eventId: result.lastInsertRowid as number };
}
