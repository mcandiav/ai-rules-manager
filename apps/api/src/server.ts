import "dotenv/config";
import { loadEnv } from "./config/env";
import { getDb } from "./db/client";
import { migrate } from "./db/migrate";
import { buildApp } from "./app";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pollForChanges } from "./modules/canonical-rules/service.js";
import { verifyAllArtifacts } from "./modules/drift/service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const config = loadEnv();

  const db = getDb(config.sqlitePath);

  const migrationsDir = join(__dirname, "db", "migrations");
  migrate(db, migrationsDir);

  const app = buildApp(config, db);

  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
    console.log(`API running on http://localhost:${config.port}`);
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }

  // Background polling: detect changes in Reglas Estandar
  if (config.pollIntervalMs > 0) {
    console.log(`Polling interval: ${config.pollIntervalMs}ms`);

    setInterval(() => {
      try {
        const { changed, versionId } = pollForChanges(db, config.standardRulesPath);
        if (changed) {
          console.log(`Canonical change detected, new version: ${versionId}`);
        }
      } catch (err) {
        console.error("Polling error (canonical):", err);
      }
    }, config.pollIntervalMs);

    // Drift check every 5 poll cycles
    setInterval(() => {
      try {
        const { drifted, ok, errors } = verifyAllArtifacts(db);
        if (drifted > 0 || errors > 0) {
          console.log(`Drift check: ${drifted} drifted, ${ok} ok, ${errors} errors`);
        }
      } catch (err) {
        console.error("Polling error (drift):", err);
      }
    }, config.pollIntervalMs * 5);
  }
}

main();
