import Database from "better-sqlite3";
import { AdapterContract, AdapterTarget, RenderedOutput, RenderedFile } from "./contract.js";
import { consolidateMarkdownFiles } from "./render-helpers.js";
import { hashContent } from "../../lib/hashing.js";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { joinHostPath, toFsPath, resolveHostHome } from "../../lib/paths.js";
import { getActiveParsedRules, parseRuleContent, ParsedRule } from "./parser.js";

export function createCodexAdapter(db: Database.Database): AdapterContract {
  const platform = "codex";

  function resolveTargets(ownerType: string, ownerId: number): AdapterTarget[] {
    const targets: AdapterTarget[] = [];
    const activeRules = getActiveParsedRules(db, ownerType, ownerId);

    let baseDir = "";
    if (ownerType === "project") {
      const project = db.prepare("SELECT root_path FROM governed_projects WHERE id = ?").get(ownerId) as any;
      if (project?.root_path) {
        baseDir = project.root_path;
      }
    } else if (ownerType === "dev_application") {
      const app = db.prepare(
        "SELECT root_path, platform FROM governed_dev_applications WHERE id = ?"
      ).get(ownerId) as any;
      if (app && app.platform === platform) {
        baseDir = app.root_path || joinHostPath(resolveHostHome(), ".codex");
      }
    }

    if (baseDir) {
      targets.push({
        platform,
        targetPath: joinHostPath(baseDir, "AGENTS.md"),
        artifactType: "codex_agents_md",
      });

      for (const rule of activeRules) {
        if (rule.activation !== "always") {
          targets.push({
            platform,
            targetPath: joinHostPath(baseDir, ".agents", "skills", rule.id, "SKILL.md"),
            artifactType: `codex_skill::${rule.id}`,
          });
        }
      }
    }

    return targets;
  }

  function render(policyContent: string, standardFiles: { relativePath: string; content: string }[]): RenderedOutput {
    const files: RenderedFile[] = [];
    const alwaysFiles: { relativePath: string; content: string }[] = [];
    const skillRules: ParsedRule[] = [];

    for (const file of standardFiles) {
      const parsed = parseRuleContent(file.relativePath, file.content);
      if (parsed.activation === "always") {
        alwaysFiles.push(file);
      } else {
        skillRules.push(parsed);
      }
    }

    let agentsContent = consolidateMarkdownFiles(alwaysFiles, policyContent);

    if (skillRules.length > 0) {
      agentsContent += "\n\n# Specialized Skills Index\n\nThe following skills are available and loaded under demand:\n";
      for (const skill of skillRules) {
        agentsContent += `- **${skill.id}**: ${skill.description || skill.title}\n`;
      }
    }

    files.push({
      relativePath: "AGENTS.md",
      content: agentsContent,
    });

    for (const skill of skillRules) {
      const skillContent = `---
name: ${skill.id}
description: ${skill.description || skill.title}
---

${skill.body}`;
      
      files.push({
        relativePath: `.agents/skills/${skill.id}/SKILL.md`,
        content: skillContent,
      });
    }

    return {
      platform,
      content: agentsContent,
      files,
      targets: [],
    };
  }

  function validate(output: RenderedOutput): string[] {
    const errors: string[] = [];
    if (!output.files || output.files.length === 0) {
      errors.push("Empty rendered content");
    }
    return errors;
  }

  async function write(targets: AdapterTarget[], output: RenderedOutput): Promise<{ written: string[]; errors: string[] }> {
    const written: string[] = [];
    const errors: string[] = [];
    const files = output.files || [];

    for (const target of targets) {
      try {
        const fsPath = toFsPath(target.targetPath);
        mkdirSync(dirname(fsPath), { recursive: true });

        // Match by end of path (e.g. '.agents/skills/<id>/SKILL.md' or 'AGENTS.md')
        const normTarget = target.targetPath.replace(/\\/g, "/").toLowerCase();
        const matchFile = files.find((f) => 
          normTarget.endsWith(f.relativePath.toLowerCase().replace(/\\/g, "/"))
        );

        if (matchFile) {
          writeFileSync(fsPath, matchFile.content, "utf-8");
          written.push(target.targetPath);
        } else {
          writeFileSync(fsPath, output.content, "utf-8");
          written.push(target.targetPath);
        }
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
