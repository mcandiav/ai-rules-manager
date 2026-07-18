import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import { nowISO } from "../../lib/clock.js";
import { getAllAdapters } from "../adapters/registry.js";
import { listKnownGlobalApps } from "./known-globals.js";

function registerDevAppArtifacts(db: Database.Database, appId: number): void {
  for (const adapter of getAllAdapters()) {
    const targets = adapter.resolveTargets("dev_application", appId);
    for (const target of targets) {
      const existing = db.prepare(
        "SELECT id FROM governed_artifacts WHERE owner_type = ? AND owner_id = ? AND platform = ? AND artifact_type = ?"
      ).get("dev_application", appId, target.platform, target.artifactType);
      if (existing) continue;

      db.prepare(
        "INSERT INTO governed_artifacts (owner_type, owner_id, platform, artifact_type, target_path, managed, path_source, path_updated_at) VALUES (?, ?, ?, ?, ?, 1, 'adapter', ?)"
      ).run("dev_application", appId, target.platform, target.artifactType, target.targetPath, nowISO());
    }
  }
}

export function seedKnownGlobalApps(db: Database.Database): {
  created: { id: number; name: string; platform: string }[];
  skipped: { name: string; platform: string; reason: string }[];
} {
  const created: { id: number; name: string; platform: string }[] = [];
  const skipped: { name: string; platform: string; reason: string }[] = [];

  for (const known of listKnownGlobalApps()) {
    if (!known.seedable) {
      skipped.push({ name: known.name, platform: known.platform, reason: known.notes || "not seedable" });
      continue;
    }

    const existing = db.prepare(
      "SELECT id FROM governed_dev_applications WHERE platform = ? AND scope = ?"
    ).get(known.platform, known.scope) as { id: number } | undefined;

    if (existing) {
      skipped.push({ name: known.name, platform: known.platform, reason: "already registered" });
      registerDevAppArtifacts(db, existing.id);
      continue;
    }

    const result = db.prepare(
      "INSERT INTO governed_dev_applications (name, platform, scope, root_path, status, created_at) VALUES (?, ?, ?, ?, 'active', ?)"
    ).run(known.name, known.platform, known.scope, known.rootPath, nowISO());
    const id = result.lastInsertRowid as number;
    registerDevAppArtifacts(db, id);
    created.push({ id, name: known.name, platform: known.platform });
  }

  return { created, skipped };
}

export function registerDevApplicationRoutes(app: FastifyInstance, db: Database.Database): void {
  app.get("/dev-applications", async () => {
    const apps = db.prepare("SELECT * FROM governed_dev_applications ORDER BY name").all();
    return { applications: apps };
  });

  app.get("/dev-applications/catalog", async () => {
    return { catalog: listKnownGlobalApps() };
  });

  app.post("/dev-applications/seed-globals", async () => {
    return seedKnownGlobalApps(db);
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
