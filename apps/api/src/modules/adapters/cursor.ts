import Database from "better-sqlite3";
import { AdapterContract, AdapterTarget, RenderedOutput, RenderedFile } from "./contract.js";
import { hashContent } from "../../lib/hashing.js";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { joinHostPath, toFsPath } from "../../lib/paths.js";
import { getActiveParsedRules, parseRuleContent, ParsedRule } from "./parser.js";

export function createCursorAdapter(db: Database.Database): AdapterContract {
  const platform = "cursor";

  function resolveTargets(ownerType: string, ownerId: number): AdapterTarget[] {
    const targets: AdapterTarget[] = [];
    const activeRules = getActiveParsedRules(db, ownerType, ownerId);

    let baseDir = "";
    if (ownerType === "project") {
      const project = db.prepare("SELECT root_path FROM governed_projects WHERE id = ?").get(ownerId) as any;
      if (project?.root_path) {
        baseDir = joinHostPath(project.root_path, ".cursor", "rules");
      }
    } else if (ownerType === "dev_application") {
      const app = db.prepare(
        "SELECT root_path, platform FROM governed_dev_applications WHERE id = ?"
      ).get(ownerId) as any;
      if (app && app.platform === platform && app.root_path) {
        const root = String(app.root_path).replace(/[\\/]+$/, "");
        baseDir = /[\\/]rules$/i.test(root) ? root : joinHostPath(root, "rules");
      }
    }

    if (baseDir) {
      for (const rule of activeRules) {
        targets.push({
          platform,
          targetPath: joinHostPath(baseDir, `${rule.id}.mdc`),
          artifactType: `cursor_rule::${rule.id}`,
        });
      }
    }

    return targets;
  }

  function buildMdcContent(parsed: ParsedRule): string {
    const fm: string[] = [];
    fm.push("---");
    if (parsed.description) {
      fm.push(`description: ${parsed.description}`);
    }
    if (parsed.activation === "always") {
      fm.push("alwaysApply: true");
    } else {
      fm.push("alwaysApply: false");
      if (parsed.globs && parsed.globs.length > 0) {
        fm.push(`globs: ${JSON.stringify(parsed.globs)}`);
      }
    }
    fm.push("---");
    fm.push("");
    fm.push(parsed.body);
    return fm.join("\n");
  }

  function render(policyContent: string, standardFiles: { relativePath: string; content: string }[]): RenderedOutput {
    const files: RenderedFile[] = [];

    for (const file of standardFiles) {
      const parsed = parseRuleContent(file.relativePath, file.content);
      const mdcContent = buildMdcContent(parsed);
      files.push({
        relativePath: `${parsed.id}.mdc`,
        content: mdcContent,
      });
    }

    return {
      platform,
      content: files.map((f) => f.content).join("\n"),
      files,
      targets: [],
    };
  }

  function validate(output: RenderedOutput): string[] {
    const errors: string[] = [];
    if (!output.files || output.files.length === 0) {
      errors.push("No cursor rule files to publish");
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

        const fileName = fsPath.replace(/\\/g, "/").split("/").pop() || "";
        const matchFile = files.find((f) => f.relativePath.toLowerCase() === fileName.toLowerCase());

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
