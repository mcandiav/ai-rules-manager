import Database from "better-sqlite3";
import { AdapterContract, AdapterTarget, RenderedOutput, RenderedFile } from "./contract.js";
import { consolidateMarkdownFiles } from "./render-helpers.js";
import { hashContent } from "../../lib/hashing.js";
import { writeFileSync, mkdirSync, existsSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { joinHostPath, toFsPath, resolveHostHome } from "../../lib/paths.js";
import { getActiveParsedRules, parseRuleContent, ParsedRule } from "./parser.js";

export function createAntigravityAdapter(db: Database.Database): AdapterContract {
  const platform = "antigravity";

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
        baseDir = app.root_path || joinHostPath(resolveHostHome(), ".gemini");
      }
    }

    if (baseDir) {
      targets.push({
        platform,
        targetPath: joinHostPath(baseDir, "GEMINI.md"),
        artifactType: "antigravity_gemini_md",
      });

      for (const rule of activeRules) {
        if (rule.activation === "skill") {
          targets.push({
            platform,
            targetPath: joinHostPath(baseDir, ".agents", "skills", rule.id, "SKILL.md"),
            artifactType: `antigravity_skill::${rule.id}`,
          });
        } else {
          targets.push({
            platform,
            targetPath: joinHostPath(baseDir, ".agents", "rules", `${rule.id}.md`),
            artifactType: `antigravity_rule::${rule.id}`,
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
        
        const ruleContent = `---
description: ${parsed.description || parsed.title}
activation: always
---

${parsed.body}`;
        files.push({
          relativePath: `.agents/rules/${parsed.id}.md`,
          content: ruleContent,
        });
      } else if (parsed.activation === "skill") {
        skillRules.push(parsed);
      } else {
        const ruleContent = `---
description: ${parsed.description || parsed.title}
activation: ${parsed.activation}
${parsed.globs.length > 0 ? `globs: ${JSON.stringify(parsed.globs)}\n` : ""}---

${parsed.body}`;
        files.push({
          relativePath: `.agents/rules/${parsed.id}.md`,
          content: ruleContent,
        });
      }
    }

    let geminiContent = consolidateMarkdownFiles(alwaysFiles, policyContent);

    if (skillRules.length > 0) {
      geminiContent += "\n\n# Specialized Skills Index\n\nThe following skills are available:\n";
      for (const skill of skillRules) {
        geminiContent += `- **${skill.id}**: ${skill.description || skill.title}\n`;
      }
    }

    files.push({
      relativePath: "GEMINI.md",
      content: geminiContent,
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
      content: geminiContent,
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

  function cleanupLegacyProjectRules(projectRoot: string): void {
    const legacyDir = toFsPath(joinHostPath(projectRoot, ".antigravityrules"));
    if (!existsSync(legacyDir)) return;
    try {
      rmSync(legacyDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup
    }
  }

  async function write(targets: AdapterTarget[], output: RenderedOutput): Promise<{ written: string[]; errors: string[] }> {
    const written: string[] = [];
    const errors: string[] = [];
    const files = output.files || [];

    for (const target of targets) {
      try {
        const fsPath = toFsPath(target.targetPath);
        mkdirSync(dirname(fsPath), { recursive: true });

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

        if (target.artifactType === "antigravity_gemini_md") {
          cleanupLegacyProjectRules(dirname(target.targetPath));
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
