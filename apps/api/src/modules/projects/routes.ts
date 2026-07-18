import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import { nowISO } from "../../lib/clock.js";
import { existsSync } from "node:fs";
import { toFsPath } from "../../lib/paths.js";
import { syncOwnerArtifacts } from "../artifacts/sync-artifacts.js";

export function registerProjectArtifacts(db: Database.Database, projectId: number): void {
  syncOwnerArtifacts(db, "project", projectId);
}

export function registerProjectRoutes(app: FastifyInstance, db: Database.Database): void {
  app.get("/projects", async () => {
    const projects = db.prepare("SELECT * FROM governed_projects ORDER BY name").all();
    return { projects };
  });

  app.post("/projects", async (req, reply) => {
    const { name, rootPath } = req.body as { name: string; rootPath: string };
    if (!name || !rootPath) {
      return reply.code(400).send({ error: "name and rootPath are required" });
    }
    const fsRoot = toFsPath(rootPath);
    if (!existsSync(fsRoot)) {
      return reply.code(400).send({ error: "rootPath does not exist" });
    }
    const result = db.prepare(
      "INSERT INTO governed_projects (name, root_path, governance_status, created_at, last_seen_at) VALUES (?, ?, 'active', ?, ?)"
    ).run(name, rootPath, nowISO(), nowISO());
    const projectId = result.lastInsertRowid as number;
    registerProjectArtifacts(db, projectId);
    return { id: projectId };
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
