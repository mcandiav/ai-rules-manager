import Database from "better-sqlite3";
import { AdapterContract, AdapterTarget, RenderedOutput } from "./contract.js";
import { hashContent } from "../../lib/hashing.js";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function createAntigravityAdapter(db: Database.Database): AdapterContract {
  const platform = "antigravity";

  function resolveTargets(ownerType: string, ownerId: number): AdapterTarget[] {
    const targets: AdapterTarget[] = [];

    if (ownerType === "project") {
      const project = db.prepare("SELECT root_path FROM governed_projects WHERE id = ?").get(ownerId) as any;
      if (project) {
        targets.push({
          platform,
          targetPath: resolve(project.root_path, ".antigravityrules"),
          artifactType: "antigravity_rules",
        });
      }
    }

    return targets;
  }

  function render(policyContent: string, standardFiles: { relativePath: string; content: string }[]): RenderedOutput {
    const lines: string[] = [];
    lines.push("; AI Rules Manager — Antigravity rules (V1 limited)");
    lines.push("");

    for (const file of standardFiles) {
      lines.push(`;; ${file.relativePath}`);
      lines.push(file.content.trim());
      lines.push("");
    }

    if (policyContent) {
      lines.push(";; Project-specific rules");
      lines.push(policyContent.trim());
    }

    return {
      platform,
      content: lines.join("\n"),
      targets: [],
    };
  }

  function validate(_output: RenderedOutput): string[] {
    return []; // Antigravity V1: no strict validation
  }

  async function write(targets: AdapterTarget[], output: RenderedOutput): Promise<{ written: string[]; errors: string[] }> {
    const written: string[] = [];
    const errors: string[] = [];

    for (const target of targets) {
      try {
        mkdirSync(target.targetPath, { recursive: true });
        const filePath = resolve(target.targetPath, "rules.txt");
        writeFileSync(filePath, output.content, "utf-8");
        written.push(filePath);
      } catch (e: any) {
        errors.push(`${target.targetPath}: ${e.message}`);
      }
    }

    return { written, errors };
  }

  async function verify(targets: AdapterTarget[], expectedHash: string): Promise<{ targetPath: string; match: boolean }[]> {
    return targets.map((t) => {
      try {
        if (!existsSync(t.targetPath)) return { targetPath: t.targetPath, match: false };
        const filePath = resolve(t.targetPath, "rules.txt");
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
