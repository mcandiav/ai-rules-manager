import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import { verifyAllArtifacts, verifyProjectTarget, acknowledgeDrift, resolveDrift } from "./service.js";

export function registerDriftRoutes(app: FastifyInstance, db: Database.Database): void {
  app.get("/drift/events", async () => {
    const events = db.prepare(
      "SELECT de.*, pt.target_path, pt.platform FROM drift_events de LEFT JOIN project_targets pt ON pt.id = de.project_target_id ORDER BY de.detected_at DESC LIMIT 100"
    ).all();
    return { events };
  });

  app.post("/drift/verify", async () => {
    const result = verifyAllArtifacts(db);
    return result;
  });

  app.post("/drift/verify/:targetId", async (req) => {
    const { targetId } = req.params as { targetId: string };
    const result = verifyProjectTarget(db, Number(targetId));
    return result;
  });

  app.post("/drift/acknowledge/:id", async (req) => {
    const { id } = req.params as { id: string };
    acknowledgeDrift(db, Number(id));
    return { ok: true };
  });

  app.post("/drift/resolve/:id", async (req) => {
    const { id } = req.params as { id: string };
    resolveDrift(db, Number(id));
    return { ok: true };
  });
}
