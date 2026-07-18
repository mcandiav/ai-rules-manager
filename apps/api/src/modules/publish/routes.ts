import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import { buildPublishPlan, executePublish } from "./service.js";

export function registerPublishRoutes(app: FastifyInstance, db: Database.Database): void {
  app.post("/publish/plan", async (req) => {
    const { ownerType, ownerId, platform } = req.body as {
      ownerType?: string; ownerId?: number; platform?: string;
    };
    const plan = buildPublishPlan(db, ownerType, ownerId, platform);
    return { plan };
  });

  app.post("/publish/execute", async (req) => {
    const { ownerType, ownerId, platform, triggeredBy } = req.body as {
      ownerType?: string; ownerId?: number; platform?: string; triggeredBy?: string;
    };
    const plan = buildPublishPlan(db, ownerType, ownerId, platform);
    if (plan.length === 0) {
      return { error: "No items to publish. Register a surface and canonical version first." };
    }
    const result = await executePublish(db, plan, triggeredBy || "manual");
    return result;
  });

  app.get("/publish/history", async () => {
    const ops = db.prepare(
      "SELECT * FROM publish_operations ORDER BY started_at DESC LIMIT 20"
    ).all();
    return { operations: ops };
  });
}
