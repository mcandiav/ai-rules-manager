import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import { pollForChanges } from "./service.js";

export function registerCanonicalRoutes(app: FastifyInstance, db: Database.Database, rulesPath: string): void {
  app.get("/canonical/versions", async () => {
    const versions = db.prepare(
      "SELECT id, version_number, global_hash, status, change_summary, created_at FROM canonical_versions ORDER BY version_number DESC"
    ).all();
    return { versions };
  });

  app.get("/canonical/current", async () => {
    const version = db.prepare(
      "SELECT cv.id, cv.version_number, cv.global_hash, cv.status, cv.created_at FROM canonical_versions cv JOIN standard_rule_sets srs ON srs.current_version_id = cv.id LIMIT 1"
    ).get() as any;
    return version ? { version } : { version: null };
  });

  app.post("/canonical/scan", async () => {
    const result = pollForChanges(db, rulesPath);
    return result;
  });

  app.get("/canonical/versions/:id/files", async (req) => {
    const { id } = req.params as { id: string };
    const files = db.prepare(
      "SELECT id, relative_path, content_hash FROM canonical_rule_files WHERE canonical_version_id = ?"
    ).all(Number(id));
    return { files };
  });
}
