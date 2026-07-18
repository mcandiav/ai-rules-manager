import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import { nowISO } from "../../lib/clock.js";

export function registerAiSurfaceRoutes(app: FastifyInstance, db: Database.Database): void {
  app.get("/ai-surfaces", async () => {
    const surfaces = db.prepare("SELECT * FROM governed_ai_surfaces ORDER BY name").all();
    return { surfaces };
  });

  app.post("/ai-surfaces", async (req) => {
    const { name, platform, scope, rootPath, adapterKey } = req.body as {
      name: string; platform: string; scope: string; rootPath?: string; adapterKey: string;
    };
    const result = db.prepare(
      "INSERT INTO governed_ai_surfaces (name, platform, scope, root_path, status, adapter_key, created_at) VALUES (?, ?, ?, ?, 'active', ?, ?)"
    ).run(name, platform, scope, rootPath || null, adapterKey, nowISO());
    return { id: result.lastInsertRowid };
  });

  app.get("/ai-surfaces/:id", async (req) => {
    const { id } = req.params as { id: string };
    const surface = db.prepare("SELECT * FROM governed_ai_surfaces WHERE id = ?").get(Number(id));
    if (!surface) return { error: "not found" };
    const artifacts = db.prepare(
      "SELECT * FROM governed_artifacts WHERE owner_type = 'ai_surface' AND owner_id = ?"
    ).all(Number(id));
    return { surface, artifacts };
  });

  app.delete("/ai-surfaces/:id", async (req) => {
    const { id } = req.params as { id: string };
    db.transaction(() => {
      db.prepare("DELETE FROM governed_artifacts WHERE owner_type = 'ai_surface' AND owner_id = ?").run(Number(id));
      db.prepare("DELETE FROM governed_ai_surfaces WHERE id = ?").run(Number(id));
    })();
    return { ok: true };
  });
}
