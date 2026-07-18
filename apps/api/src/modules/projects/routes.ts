import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import { nowISO } from "../../lib/clock.js";

export function registerProjectRoutes(app: FastifyInstance, db: Database.Database): void {
  app.get("/projects", async () => {
    const projects = db.prepare("SELECT * FROM governed_projects ORDER BY name").all();
    return { projects };
  });

  app.post("/projects", async (req) => {
    const { name, rootPath } = req.body as { name: string; rootPath: string };
    const result = db.prepare(
      "INSERT INTO governed_projects (name, root_path, governance_status, created_at, last_seen_at) VALUES (?, ?, 'active', ?, ?)"
    ).run(name, rootPath, nowISO(), nowISO());
    return { id: result.lastInsertRowid };
  });

  app.get("/projects/:id", async (req) => {
    const { id } = req.params as { id: string };
    const project = db.prepare("SELECT * FROM governed_projects WHERE id = ?").get(Number(id));
    return project ? { project } : { error: "not found" };
  });

  app.delete("/projects/:id", async (req) => {
    const { id } = req.params as { id: string };
    db.prepare("DELETE FROM governed_projects WHERE id = ?").run(Number(id));
    return { ok: true };
  });
}
