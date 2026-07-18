import Database from "better-sqlite3";
import { AdapterContract, AdapterTarget, RenderedOutput } from "./contract.js";
import { hashRenderedOutput, toCursorMdcFiles } from "./render-helpers.js";
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { joinHostPath, toFsPath } from "../../lib/paths.js";

export function createCursorAdapter(db: Database.Database): AdapterContract {
  const platform = "cursor";

  function resolveTargets(ownerType: string, ownerId: number): AdapterTarget[] {
    const targets: AdapterTarget[] = [];

    if (ownerType === "project") {
      const project = db.prepare("SELECT root_path FROM governed_projects WHERE id = ?").get(ownerId) as any;
      if (project?.root_path) {
        targets.push({
          platform,
          targetPath: joinHostPath(project.root_path, ".cursor", "rules"),
          artifactType: "cursor_rules_dir",
        });
      }
    }

    if (ownerType === "dev_application") {
      const app = db.prepare("SELECT root_path, scope FROM governed_dev_applications WHERE id = ?").get(ownerId) as any;
      if (app?.root_path) {
        targets.push({
          platform,
          targetPath: joinHostPath(app.root_path, "rules"),
          artifactType: "cursor_rules_dir",
        });
      }
    }

    return targets;
  }

  function render(policyContent: string, standardFiles: { relativePath: string; content: string }[]): RenderedOutput {
    const files = toCursorMdcFiles(standardFiles, policyContent);
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
        const fsDir = toFsPath(target.targetPath);
        mkdirSync(fsDir, { recursive: true });

        // Remove previous managed .mdc files (including the broken rule-N.mdc set).
        for (const name of readdirSyncSimple(fsDir).filter((n) => n.endsWith(".mdc"))) {
          unlinkSync(resolve(fsDir, name));
        }

        for (const file of files) {
          const outPath = resolve(fsDir, file.relativePath);
          mkdirSync(dirname(outPath), { recursive: true });
          writeFileSync(outPath, file.content, "utf-8");
        }

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

        const files = readdirSyncSimple(fsDir)
          .filter((n) => n.endsWith(".mdc"))
          .sort((a, b) => a.localeCompare(b))
          .map((name) => ({
            relativePath: name,
            content: readFileSync(resolve(fsDir, name), "utf-8"),
          }));

        const actualHash = hashRenderedOutput({ platform, content: "", targets: [], files });
        return { targetPath: t.targetPath, match: actualHash === expectedHash };
      } catch {
        return { targetPath: t.targetPath, match: false };
      }
    });
  }

  return { platform, resolveTargets, render, validate, write, verify };
}

function readdirSyncSimple(dir: string): string[] {
  try { return readdirSync(dir); } catch { return []; }
}
