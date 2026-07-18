import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import { nowISO } from "../../lib/clock.js";

export function registerDevApplicationRoutes(app: FastifyInstance, db: Database.Database): void {
  app.get("/dev-applications", async () => {
    const apps = db.prepare("SELECT * FROM governed_dev_applications ORDER BY name").all();
    return { applications: apps };
  });

  app.post("/dev-applications", async (req) => {
    const { name, platform, scope, rootPath } = req.body as {
      name: string; platform: string; scope: string; rootPath: string;
    };
    const result = db.prepare(
      "INSERT INTO governed_dev_applications (name, platform, scope, root_path, status, created_at) VALUES (?, ?, ?, ?, 'active', ?)"
    ).run(name, platform, scope, rootPath, nowISO());
    return { id: result.lastInsertRowid };
  });

  app.get("/dev-applications/:id", async (req) => {
    const { id } = req.params as { id: string };
    const app = db.prepare("SELECT * FROM governed_dev_applications WHERE id = ?").get(Number(id));
    if (!app) return { error: "not found" };
    const artifacts = db.prepare(
      "SELECT * FROM governed_artifacts WHERE owner_type = 'dev_application' AND owner_id = ?"
    ).all(Number(id));
    return { application: app, artifacts };
  });

  app.delete("/dev-applications/:id", async (req) => {
    const { id } = req.params as { id: string };
    db.transaction(() => {
      db.prepare("DELETE FROM governed_artifacts WHERE owner_type = 'dev_application' AND owner_id = ?").run(Number(id));
      db.prepare("DELETE FROM governed_dev_applications WHERE id = ?").run(Number(id));
    })();
    return { ok: true };
  });
}
