import Fastify from "fastify";
import { EnvConfig } from "./config/env.js";
import Database from "better-sqlite3";
import { registerHealthRoutes } from "./modules/health/routes.js";
import { registerCanonicalRoutes } from "./modules/canonical-rules/routes.js";
import { registerProjectRoutes } from "./modules/projects/routes.js";
import { registerDevApplicationRoutes } from "./modules/dev-applications/routes.js";
import { registerAiSurfaceRoutes } from "./modules/ai-surfaces/routes.js";
import { registerArtifactRoutes } from "./modules/artifacts/routes.js";
import { registerProjectRuleRoutes } from "./modules/project-rules/routes.js";
import { registerPolicyRoutes } from "./modules/policies/routes.js";
import { registerSyncRoutes } from "./modules/sync/routes.js";
import { registerDashboardRoutes } from "./modules/dashboard/routes.js";
import { registerPublishRoutes } from "./modules/publish/routes.js";
import { registerDriftRoutes } from "./modules/drift/routes.js";
import { registerAdapters } from "./modules/adapters/registry.js";

export function buildApp(config: EnvConfig, db: Database.Database) {
  const app = Fastify({ logger: true });

  // Initialize adapters
  registerAdapters(db);

  // Register routes
  registerHealthRoutes(app, db);
  registerCanonicalRoutes(app, db, config.standardRulesPath);
  registerProjectRoutes(app, db);
  registerDevApplicationRoutes(app, db);
  registerAiSurfaceRoutes(app, db);
  registerArtifactRoutes(app, db);
  registerProjectRuleRoutes(app, db);
  registerPolicyRoutes(app, db);
  registerSyncRoutes(app, db);
  registerDashboardRoutes(app, db);
  registerPublishRoutes(app, db);
  registerDriftRoutes(app, db);

  return app;
}
