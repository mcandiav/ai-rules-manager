import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";

export function registerSyncRoutes(app: FastifyInstance, db: Database.Database): void {
  app.get("/sync/status", async () => {
    const records = db.prepare(
      "SELECT * FROM synchronization_records ORDER BY synced_at DESC LIMIT 50"
    ).all();
    return { records };
  });

  app.get("/sync/drift", async () => {
    const events = db.prepare(
      "SELECT * FROM drift_events ORDER BY detected_at DESC LIMIT 50"
    ).all();
    return { events };
  });

  app.get("/sync/operations", async () => {
    const ops = db.prepare(
      "SELECT * FROM publish_operations ORDER BY started_at DESC LIMIT 20"
    ).all();
    return { operations: ops };
  });
}
