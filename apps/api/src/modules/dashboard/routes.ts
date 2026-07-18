import { FastifyInstance } from "fastify";
import Database from "better-sqlite3";

export function registerDashboardRoutes(app: FastifyInstance, db: Database.Database): void {
  app.get("/dashboard", async () => {
    const canonicalVersion = db.prepare(
      "SELECT cv.id, cv.version_number, cv.global_hash, cv.status, cv.created_at FROM canonical_versions cv JOIN standard_rule_sets srs ON srs.current_version_id = cv.id LIMIT 1"
    ).get() as any;

    const projectCount = (db.prepare("SELECT COUNT(*) as c FROM governed_projects").get() as any).c;
    const devAppCount = (db.prepare("SELECT COUNT(*) as c FROM governed_dev_applications").get() as any).c;
    const aiSurfaceCount = (db.prepare("SELECT COUNT(*) as c FROM governed_ai_surfaces").get() as any).c;
    const artifactCount = (db.prepare("SELECT COUNT(*) as c FROM governed_artifacts").get() as any).c;

    const driftCount = (db.prepare("SELECT COUNT(*) as c FROM drift_events WHERE status = 'open'").get() as any).c;
    const pendingPublish = (db.prepare(
      "SELECT COUNT(*) as c FROM synchronization_records WHERE sync_status = 'pending_publish'"
    ).get() as any).c;

    const conflictingProjects = (db.prepare(
      "SELECT COUNT(*) as c FROM governed_projects WHERE governance_status = 'error'"
    ).get() as any).c;
    const conflictingDevApps = (db.prepare(
      "SELECT COUNT(*) as c FROM governed_dev_applications WHERE status = 'error'"
    ).get() as any).c;
    const conflictingAiSurfaces = (db.prepare(
      "SELECT COUNT(*) as c FROM governed_ai_surfaces WHERE status = 'error'"
    ).get() as any).c;

    const projects = db.prepare("SELECT id, name, root_path, governance_status, last_seen_at FROM governed_projects ORDER BY name").all();
    const devApps = db.prepare("SELECT id, name, platform, scope, root_path, status FROM governed_dev_applications ORDER BY name").all();
    const aiSurfaces = db.prepare("SELECT id, name, platform, scope, adapter_key, status FROM governed_ai_surfaces ORDER BY name").all();

    const lastSync = db.prepare(
      "SELECT synced_at FROM synchronization_records ORDER BY synced_at DESC LIMIT 1"
    ).get() as { syncedAt: string } | undefined;

    const lastPublish = db.prepare(
      "SELECT * FROM publish_operations ORDER BY started_at DESC LIMIT 5"
    ).all();

    return {
      canonicalVersion: canonicalVersion || null,
      counts: {
        projects: projectCount,
        devApplications: devAppCount,
        aiSurfaces: aiSurfaceCount,
        artifacts: artifactCount,
      },
      pending: pendingPublish,
      drift: driftCount,
      conflicts: {
        total: conflictingProjects + conflictingDevApps + conflictingAiSurfaces,
        projects: conflictingProjects,
        devApplications: conflictingDevApps,
        aiSurfaces: conflictingAiSurfaces,
      },
      projects,
      devApplications: devApps,
      aiSurfaces,
      lastSync: lastSync?.syncedAt || null,
      lastPublishes: lastPublish,
    };
  });
}
