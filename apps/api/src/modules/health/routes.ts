import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";
import { readReleaseLabel } from "../../lib/version.js";

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
      version: readReleaseLabel(),
      database: dbOk ? "connected" : "error",
    };
  });
}
