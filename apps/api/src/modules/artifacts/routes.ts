import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import { nowISO } from "../../lib/clock.js";
import { hashContent } from "../../lib/hashing.js";
import { readFileSync, existsSync } from "node:fs";
import { toFsPath } from "../../lib/paths.js";

export function registerArtifactRoutes(app: FastifyInstance, db: Database.Database): void {
  app.get("/artifacts", async () => {
    const artifacts = db.prepare("SELECT * FROM governed_artifacts ORDER BY platform, artifact_type").all();
    return { artifacts };
  });

  app.get("/artifacts/:id", async (req) => {
    const { id } = req.params as { id: string };
    const artifact = db.prepare("SELECT * FROM governed_artifacts WHERE id = ?").get(Number(id));
    return artifact ? { artifact } : { error: "not found" };
  });

  app.post("/artifacts/:id/path", async (req) => {
    const { id } = req.params as { id: string };
    const { configuredPath } = req.body as { configuredPath: string };
    db.prepare(
      "UPDATE governed_artifacts SET configured_path = ?, path_source = 'manual', path_updated_at = ? WHERE id = ?"
    ).run(configuredPath, nowISO(), Number(id));
    return { ok: true };
  });

  app.post("/artifacts/:id/validate", async (req) => {
    const { id } = req.params as { id: string };
    const artifact = db.prepare("SELECT * FROM governed_artifacts WHERE id = ?").get(Number(id)) as any;
    if (!artifact) return { error: "not found" };

    const effectivePath = artifact.configured_path || artifact.target_path;
    const fsPath = toFsPath(effectivePath);
    const exists = existsSync(fsPath);
    let hash = null;

    if (exists) {
      try {
        const content = readFileSync(fsPath, "utf-8");
        hash = hashContent(content);
      } catch { /* read error */ }
    }

    const drifted = hash !== null && artifact.last_observed_hash !== null && hash !== artifact.last_observed_hash;

    db.prepare(
      "UPDATE governed_artifacts SET last_observed_hash = ?, path_updated_at = ? WHERE id = ?"
    ).run(hash, nowISO(), Number(id));

    return {
      exists,
      observedHash: hash,
      expectedHash: artifact.last_observed_hash,
      drifted,
      effectivePath,
    };
  });

  app.get("/artifacts/by-owner", async (req) => {
    const { ownerType, ownerId } = req.query as { ownerType: string; ownerId: string };
    const artifacts = db.prepare(
      "SELECT * FROM governed_artifacts WHERE owner_type = ? AND owner_id = ? ORDER BY platform"
    ).all(ownerType, Number(ownerId));
    return { artifacts };
  });
}
