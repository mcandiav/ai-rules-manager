import Database from "better-sqlite3";
import { AdapterContract, AdapterTarget, RenderedOutput } from "./contract.js";
import { hashContent } from "../../lib/hashing.js";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { homedir } from "node:os";

export function createCodexAdapter(db: Database.Database): AdapterContract {
  const platform = "codex";

  function resolveTargets(ownerType: string, ownerId: number): AdapterTarget[] {
    const targets: AdapterTarget[] = [];

    if (ownerType === "project") {
      const project = db.prepare("SELECT root_path FROM governed_projects WHERE id = ?").get(ownerId) as any;
      if (project) {
        targets.push({
          platform,
          targetPath: resolve(project.root_path, "AGENTS.md"),
          artifactType: "codex_project_agents",
        });
      }
    }

    if (ownerType === "dev_application") {
      targets.push({
        platform,
        targetPath: resolve(homedir(), ".codex", "AGENTS.md"),
        artifactType: "codex_global_agents",
      });
    }

    return targets;
  }

  function render(policyContent: string, standardFiles: { relativePath: string; content: string }[]): RenderedOutput {
    const lines: string[] = [];
    lines.push("<!-- generated-by: ai-rules-manager -->");
    lines.push("");
    lines.push("# Reglas consolidadas");
    lines.push("");

    for (const file of standardFiles) {
      lines.push(`## Fuente: \`${file.relativePath}\``);
      lines.push("");
      lines.push(file.content.trim());
      lines.push("");
    }

    if (policyContent) {
      lines.push("## Reglas particulares");
      lines.push("");
      lines.push(policyContent.trim());
      lines.push("");
    }

    const content = lines.join("\n");

    return {
      platform,
      content,
      targets: [],
    };
  }

  function validate(output: RenderedOutput): string[] {
    const errors: string[] = [];
    if (!output.content || output.content.trim().length === 0) {
      errors.push("Empty rendered content");
    }
    if (!output.content.includes("# Reglas consolidadas")) {
      errors.push("Missing main heading");
    }
    return errors;
  }

  async function write(targets: AdapterTarget[], output: RenderedOutput): Promise<{ written: string[]; errors: string[] }> {
    const written: string[] = [];
    const errors: string[] = [];

    for (const target of targets) {
      try {
        mkdirSync(dirname(target.targetPath), { recursive: true });
        writeFileSync(target.targetPath, output.content, "utf-8");
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
        if (!existsSync(t.targetPath)) return { targetPath: t.targetPath, match: false };
        const content = readFileSync(t.targetPath, "utf-8");
        const actualHash = hashContent(content);
        return { targetPath: t.targetPath, match: actualHash === expectedHash };
      } catch {
        return { targetPath: t.targetPath, match: false };
      }
    });
  }

  return { platform, resolveTargets, render, validate, write, verify };
}
