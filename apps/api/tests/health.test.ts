import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { buildApp } from "../src/app";
import { loadEnv } from "../src/config/env";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("health endpoint", () => {
  let db: Database.Database;
  let app: ReturnType<typeof buildApp>;

  beforeAll(() => {
    const config = loadEnv();
    db = new Database(":memory:");
    // Run migrations to create tables before building app (adapters table needed)
    const migrationsDir = join(__dirname, "..", "src", "db", "migrations");
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), "utf-8");
      db.exec(sql);
    }
    app = buildApp(config, db);
  });

  afterAll(() => {
    db.close();
  });

  it("returns ok status", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("ok");
    expect(body.version).toBe("0.1.0");
  });
});
