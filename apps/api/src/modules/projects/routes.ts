import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import { nowISO } from "../../lib/clock.js";
import { existsSync } from "node:fs";
import { getAllAdapters } from "../adapters/registry.js";
import { toFsPath } from "../../lib/paths.js";

export function registerProjectArtifacts(db: Database.Database, projectId: number): void {
  for (const adapter of getAllAdapters()) {
    const targets = adapter.resolveTargets("project", projectId);

    for (const target of targets) {
      const existing = db.prepare(
        "SELECT id FROM governed_artifacts WHERE owner_type = ? AND owner_id = ? AND platform = ? AND artifact_type = ?"
      ).get("project", projectId, target.platform, target.artifactType);

      if (existing) continue;

      db.prepare(
        "INSERT INTO governed_artifacts (owner_type, owner_id, platform, artifact_type, target_path, managed, path_source, path_updated_at) VALUES (?, ?, ?, ?, ?, 1, 'adapter', ?)"
      ).run("project", projectId, target.platform, target.artifactType, target.targetPath, nowISO());
    }
  }
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
