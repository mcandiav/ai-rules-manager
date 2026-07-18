import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import { composeEffectivePolicy } from "./service.js";

export function registerPolicyRoutes(app: FastifyInstance, db: Database.Database): void {
  app.post("/policies/compose", async (req) => {
    const { ownerType, ownerId, canonicalVersionId } = req.body as {
      ownerType: string;
      ownerId: number;
      canonicalVersionId: number;
    };

    const result = composeEffectivePolicy(db, ownerType, ownerId, canonicalVersionId);
    return result;
  });

  app.get("/policies/:id", async (req) => {
    const { id } = req.params as { id: string };
    const policy = db.prepare("SELECT * FROM effective_policies WHERE id = ?").get(Number(id));
    return policy ? { policy } : { error: "not found" };
  });
}
