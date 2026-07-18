import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { buildApp } from "../src/app";
import { readFileSync, readdirSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createTestApp(standardRulesPath: string) {
  const db = new Database(":memory:");
  const migrationsDir = join(__dirname, "..", "src", "db", "migrations");
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    db.exec(sql);
  }

  const app = buildApp({
    port: 0,
    sqlitePath: ":memory:",
    pollIntervalMs: 30000,
    nodeEnv: "test",
    standardRulesPath,
    pathMapping: {},
  }, db);

  return { app, db };
}

describe("project sync flow", () => {
  let workspaceDir: string;
  let rulesDir: string;
  let projectDir: string;
  let db: Database.Database;
  let app: ReturnType<typeof buildApp>;

  beforeEach(async () => {
    workspaceDir = mkdtempSync(join(tmpdir(), "ai-rules-manager-"));
    rulesDir = join(workspaceDir, "Reglas Estandar");
    projectDir = join(workspaceDir, "project-a");

    mkdirSync(rulesDir, { recursive: true });
    mkdirSync(projectDir, { recursive: true });

    writeFileSync(join(rulesDir, "00-base.md"), "RULE_ALPHA\nBase rule content", "utf-8");

    const created = createTestApp(rulesDir);
    app = created.app;
    db = created.db;

    await app.inject({ method: "POST", url: "/canonical/scan" });
  });

  afterEach(async () => {
    await app.close();
    db.close();
    rmSync(workspaceDir, { recursive: true, force: true });
  });

  it("registers artifacts for new projects", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: "/projects",
      payload: { name: "Project A", rootPath: projectDir },
    });

    expect(createRes.statusCode).toBe(200);
    const created = JSON.parse(createRes.body);

    const artifactsRes = await app.inject({
      method: "GET",
      url: `/artifacts/by-owner?ownerType=project&ownerId=${created.id}`,
    });

    const artifactsBody = JSON.parse(artifactsRes.body);
    expect(artifactsBody.artifacts.length).toBeGreaterThanOrEqual(4);
    expect(artifactsBody.artifacts.some((artifact: any) => artifact.platform === "codex")).toBe(true);
    expect(artifactsBody.artifacts.some((artifact: any) => artifact.platform === "cursor")).toBe(true);
  });

  it("publishes a project using the configured artifact path and effective policy", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: "/projects",
      payload: { name: "Project A", rootPath: projectDir },
    });
    const created = JSON.parse(createRes.body);

    const artifactsRes = await app.inject({
      method: "GET",
      url: `/artifacts/by-owner?ownerType=project&ownerId=${created.id}`,
    });
    const artifactsBody = JSON.parse(artifactsRes.body);
    const codexArtifact = artifactsBody.artifacts.find((artifact: any) => artifact.platform === "codex");
    const configuredPath = join(projectDir, "governed", "custom", "AGENTS.md");

    const configureRes = await app.inject({
      method: "POST",
      url: `/artifacts/${codexArtifact.id}/path`,
      payload: { configuredPath },
    });
    expect(configureRes.statusCode).toBe(200);

    const ruleRes = await app.inject({
      method: "POST",
      url: "/rules",
      payload: {
        ownerType: "project",
        ownerId: created.id,
        ruleKey: "RULE_ALPHA",
        title: "Replace base rule",
        content: "RULE_ALPHA\nReplaced rule content",
        precedenceMode: "replace",
      },
    });
    expect(ruleRes.statusCode).toBe(200);

    const publishRes = await app.inject({
      method: "POST",
      url: "/publish/execute",
      payload: {
        ownerType: "project",
        ownerId: created.id,
        platform: "codex",
        triggeredBy: "test",
      },
    });

    expect(publishRes.statusCode).toBe(200);
    const publishBody = JSON.parse(publishRes.body);
    expect(publishBody.items).toHaveLength(1);
    expect(publishBody.items[0].written).toBe(true);
    expect(publishBody.items[0].verified).toBe(true);
    expect(publishBody.items[0].targetPath).toBe(configuredPath);

    const writtenContent = readFileSync(configuredPath, "utf-8");
    expect(writtenContent).toContain("Replaced rule content");
    expect(writtenContent).not.toContain("Base rule content");
  });

  it("publishes all enabled platforms without crashing on relativePath", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: "/projects",
      payload: { name: "Project A", rootPath: projectDir },
    });
    const created = JSON.parse(createRes.body);

    const publishRes = await app.inject({
      method: "POST",
      url: "/publish/execute",
      payload: {
        ownerType: "project",
        ownerId: created.id,
        triggeredBy: "test",
      },
    });

    expect(publishRes.statusCode).toBe(200);
    const publishBody = JSON.parse(publishRes.body);
    expect(publishBody.items.length).toBeGreaterThanOrEqual(4);
    expect(publishBody.items.every((item: any) => item.written && item.verified)).toBe(true);
    expect(publishBody.items.some((item: any) => item.platform === "cursor")).toBe(true);
    expect(publishBody.items.find((item: any) => item.platform === "codex").targetPath)
      .toContain("AGENTS.md");
  });

  it("rejects projects with missing paths", async () => {
    const missingRes = await app.inject({
      method: "POST",
      url: "/projects",
      payload: { name: "Broken", rootPath: join(workspaceDir, "missing-project") },
    });

    expect(missingRes.statusCode).toBe(400);
    expect(JSON.parse(missingRes.body).error).toBe("rootPath does not exist");
  });
});
