import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";

export function registerHealthRoutes(app: FastifyInstance, db: Database.Database): void {
  app.get("/health", async () => {
    let dbOk = false;
    try {
      db.prepare("SELECT 1").get();
      dbOk = true;
    } catch {
      dbOk = false;
    }

    return {
      status: dbOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      version: "0.1.0",
      database: dbOk ? "connected" : "error",
    };
  });
}
