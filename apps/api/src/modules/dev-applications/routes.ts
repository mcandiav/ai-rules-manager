import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import { nowISO } from "../../lib/clock.js";
import { findKnownGlobalApp, listKnownGlobalApps } from "./known-globals.js";
import { syncOwnerArtifacts } from "../artifacts/sync-artifacts.js";

function registerDevAppArtifacts(db: Database.Database, appId: number): void {
  syncOwnerArtifacts(db, "dev_application", appId);
}

export function registerDevApplicationRoutes(app: FastifyInstance, db: Database.Database): void {
  app.get("/dev-applications", async () => {
    const apps = db.prepare("SELECT * FROM governed_dev_applications ORDER BY name").all();
    return { applications: apps };
  });

  app.get("/dev-applications/catalog", async () => {
    const governed = db.prepare(
      "SELECT platform, scope FROM governed_dev_applications WHERE scope = 'global_user'"
    ).all() as { platform: string; scope: string }[];
    const governedKeys = new Set(governed.map((g) => `${g.platform}:${g.scope}`));

    const catalog = listKnownGlobalApps().map((item) => ({
      ...item,
      alreadyGoverned: governedKeys.has(`${item.platform}:${item.scope}`),
    }));

    return { catalog };
  });

  /** Explicit opt-in: user selects one known global from the catalog. */
  app.post("/dev-applications/govern-global", async (req, reply) => {
    const { key, rootPath } = req.body as { key?: string; rootPath?: string };
    if (!key) {
      return reply.code(400).send({ error: "key is required" });
    }

    const known = findKnownGlobalApp(key);
    if (!known) {
      return reply.code(404).send({ error: "unknown global app key" });
    }
    if (!known.governable) {
      return reply.code(400).send({ error: "this global app is not governable yet", notes: known.notes });
    }

    const existing = db.prepare(
      "SELECT id FROM governed_dev_applications WHERE platform = ? AND scope = ?"
    ).get(known.platform, known.scope) as { id: number } | undefined;

    if (existing) {
      return reply.code(409).send({ error: "already governed", id: existing.id });
    }

    const effectiveRoot = (rootPath || known.rootPath || "").trim();
    if (!effectiveRoot) {
      return reply.code(400).send({ error: "rootPath is required" });
    }

    const result = db.prepare(
      "INSERT INTO governed_dev_applications (name, platform, scope, root_path, status, created_at) VALUES (?, ?, ?, ?, 'active', ?)"
    ).run(known.name, known.platform, known.scope, effectiveRoot, nowISO());
    const id = result.lastInsertRowid as number;
    registerDevAppArtifacts(db, id);
    return { id, name: known.name, platform: known.platform };
  });

  app.post("/dev-applications", async (req) => {
    const { name, platform, scope, rootPath } = req.body as {
      name: string; platform: string; scope: string; rootPath: string;
    };
    const result = db.prepare(
      "INSERT INTO governed_dev_applications (name, platform, scope, root_path, status, created_at) VALUES (?, ?, ?, ?, 'active', ?)"
    ).run(name, platform, scope, rootPath || null, nowISO());
    const id = result.lastInsertRowid as number;
    registerDevAppArtifacts(db, id);
    return { id };
  });

  app.get("/dev-applications/:id", async (req) => {
    const { id } = req.params as { id: string };
    const application = db.prepare("SELECT * FROM governed_dev_applications WHERE id = ?").get(Number(id));
    if (!application) return { error: "not found" };
    const artifacts = db.prepare(
      "SELECT * FROM governed_artifacts WHERE owner_type = 'dev_application' AND owner_id = ?"
    ).all(Number(id));
    return { application, artifacts };
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
