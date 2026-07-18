import Database from "better-sqlite3";
import { AdapterContract, AdapterTarget, RenderedOutput } from "./contract.js";
import { consolidateMarkdownFiles } from "./render-helpers.js";
import { hashContent } from "../../lib/hashing.js";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { joinHostPath, toFsPath } from "../../lib/paths.js";

export function createAntigravityAdapter(db: Database.Database): AdapterContract {
  const platform = "antigravity";

  function resolveTargets(ownerType: string, ownerId: number): AdapterTarget[] {
    const targets: AdapterTarget[] = [];

    if (ownerType === "project") {
      const project = db.prepare("SELECT root_path FROM governed_projects WHERE id = ?").get(ownerId) as any;
      if (project?.root_path) {
        targets.push({
          platform,
          targetPath: joinHostPath(project.root_path, ".antigravityrules"),
          artifactType: "antigravity_rules",
        });
      }
    }

    return targets;
  }

  function render(policyContent: string, standardFiles: { relativePath: string; content: string }[]): RenderedOutput {
    return {
      platform,
      content: consolidateMarkdownFiles(standardFiles, policyContent),
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
        const fsDir = toFsPath(target.targetPath);
        mkdirSync(fsDir, { recursive: true });
        const filePath = resolve(fsDir, "rules.txt");
        writeFileSync(filePath, output.content, "utf-8");
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
        const fsDir = toFsPath(t.targetPath);
        if (!existsSync(fsDir)) return { targetPath: t.targetPath, match: false };
        const filePath = resolve(fsDir, "rules.txt");
        if (!existsSync(filePath)) return { targetPath: t.targetPath, match: false };
        const content = readFileSync(filePath, "utf-8");
        const actualHash = hashContent(content);
        return { targetPath: t.targetPath, match: actualHash === expectedHash };
      } catch {
        return { targetPath: t.targetPath, match: false };
      }
    });
  }

  return { platform, resolveTargets, render, validate, write, verify };
}
