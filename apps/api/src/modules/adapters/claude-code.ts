import Database from "better-sqlite3";
import { AdapterContract, AdapterTarget, RenderedOutput } from "./contract.js";
import { consolidateMarkdownFiles } from "./render-helpers.js";
import { hashContent } from "../../lib/hashing.js";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { joinHostPath, toFsPath, resolveHostHome } from "../../lib/paths.js";

export function createClaudeCodeAdapter(db: Database.Database): AdapterContract {
  const platform = "claude_code";

  function resolveTargets(ownerType: string, ownerId: number): AdapterTarget[] {
    const targets: AdapterTarget[] = [];

    if (ownerType === "project") {
      const project = db.prepare("SELECT root_path FROM governed_projects WHERE id = ?").get(ownerId) as any;
      if (project?.root_path) {
        targets.push({
          platform,
          targetPath: joinHostPath(project.root_path, "CLAUDE.md"),
          artifactType: "claude_md",
        });
      }
    }

    if (ownerType === "dev_application") {
      const app = db.prepare(
        "SELECT root_path, platform FROM governed_dev_applications WHERE id = ?"
      ).get(ownerId) as any;
      if (!app || app.platform !== platform) return targets;

      const base = app.root_path || joinHostPath(resolveHostHome(), ".claude");
      targets.push({
        platform,
        targetPath: joinHostPath(base, "CLAUDE.md"),
        artifactType: "claude_global_md",
      });
    }

    return targets;
  }

  function render(policyContent: string, standardFiles: { relativePath: string; content: string }[]): RenderedOutput {
    const consolidated = consolidateMarkdownFiles(standardFiles, policyContent);
    return {
      platform,
      content: consolidated,
      targets: [],
    };
  }

  function validate(output: RenderedOutput): string[] {
    const errors: string[] = [];
    if (!output.content || output.content.trim().length === 0) {
      errors.push("Empty rendered content");
    }
    return errors;
  }

  async function write(targets: AdapterTarget[], output: RenderedOutput): Promise<{ written: string[]; errors: string[] }> {
    const written: string[] = [];
    const errors: string[] = [];

    for (const target of targets) {
      try {
        const fsPath = toFsPath(target.targetPath);
        mkdirSync(dirname(fsPath), { recursive: true });
        writeFileSync(fsPath, output.content, "utf-8");
        written.push(target.targetPath);
      } catch (e: any) {
        errors.push(`${target.targetPath}: ${e.message}`);
      }
    }

    return { written, errors };
  }

  async function verify(targets: AdapterTarget[], expectedHash: string): Promise<{ targetPath: string; match: boolean }[]> {
    return targets.map((t) => {
      try {
        const fsPath = toFsPath(t.targetPath);
        if (!existsSync(fsPath)) return { targetPath: t.targetPath, match: false };
        const content = readFileSync(fsPath, "utf-8");
        const actualHash = hashContent(content);
        return { targetPath: t.targetPath, match: actualHash === expectedHash };
      } catch {
        return { targetPath: t.targetPath, match: false };
      }
    });
  }

  return { platform, resolveTargets, render, validate, write, verify };
}
