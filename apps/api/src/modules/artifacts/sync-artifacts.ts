import Database from "better-sqlite3";
import { nowISO } from "../../lib/clock.js";
import { getAllAdapters } from "../adapters/registry.js";

/**
 * Keep governed_artifacts aligned with current adapter targets.
 * - Inserts missing adapter artifacts
 * - Updates adapter paths when the adapter default changed (unless user configured_path)
 * - Removes obsolete adapter artifacts no longer emitted by adapters
 */
export function syncOwnerArtifacts(
  db: Database.Database,
  ownerType: string,
  ownerId: number,
): void {
  const desiredKeys = new Set<string>();

  for (const adapter of getAllAdapters()) {
    const targets = adapter.resolveTargets(ownerType, ownerId);
    for (const target of targets) {
      const key = `${target.platform}::${target.artifactType}`;
      desiredKeys.add(key);

      const existing = db.prepare(
        "SELECT id, target_path, configured_path, path_source FROM governed_artifacts WHERE owner_type = ? AND owner_id = ? AND platform = ? AND artifact_type = ?"
      ).get(ownerType, ownerId, target.platform, target.artifactType) as {
        id: number;
        target_path: string | null;
        configured_path: string | null;
        path_source: string | null;
      } | undefined;

      if (!existing) {
        db.prepare(
          "INSERT INTO governed_artifacts (owner_type, owner_id, platform, artifact_type, target_path, managed, path_source, path_updated_at) VALUES (?, ?, ?, ?, ?, 1, 'adapter', ?)"
        ).run(ownerType, ownerId, target.platform, target.artifactType, target.targetPath, nowISO());
        continue;
      }

      const userOverride = Boolean(existing.configured_path);
      if (!userOverride && existing.target_path !== target.targetPath) {
        db.prepare(
          "UPDATE governed_artifacts SET target_path = ?, path_source = 'adapter', path_updated_at = ? WHERE id = ?"
        ).run(target.targetPath, nowISO(), existing.id);
      }
    }
  }

  const current = db.prepare(
    "SELECT id, platform, artifact_type, configured_path, path_source FROM governed_artifacts WHERE owner_type = ? AND owner_id = ?"
  ).all(ownerType, ownerId) as {
    id: number;
    platform: string;
    artifact_type: string;
    configured_path: string | null;
    path_source: string | null;
  }[];

  for (const row of current) {
    const key = `${row.platform}::${row.artifact_type}`;
    if (desiredKeys.has(key)) continue;
    if (row.configured_path) continue;
    if (row.path_source !== "adapter") continue;
    db.prepare("DELETE FROM governed_artifacts WHERE id = ?").run(row.id);
  }
}
