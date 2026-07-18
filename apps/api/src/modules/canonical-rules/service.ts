import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import Database from "better-sqlite3";
import { hashContent, hashComposite } from "../../lib/hashing.js";
import { nowISO } from "../../lib/clock.js";

export interface ScannedFile {
  relativePath: string;
  content: string;
  hash: string;
}

export function scanRulesDirectory(rulesPath: string): ScannedFile[] {
  const files: ScannedFile[] = [];

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const content = readFileSync(full, "utf-8");
        const rel = relative(rulesPath, full);
        files.push({
          relativePath: rel,
          content,
          hash: hashContent(content),
        });
      }
    }
  }

  walk(rulesPath);
  return files;
}

export function computeGlobalHash(files: ScannedFile[]): string {
  return hashComposite(files.map((f) => f.hash));
}

export function detectChanges(
  db: Database.Database,
  ruleSetId: number,
  files: ScannedFile[]
): { changed: boolean; globalHash: string } {
  const globalHash = computeGlobalHash(files);

  const latest = db.prepare(
    "SELECT global_hash FROM canonical_versions WHERE rule_set_id = ? ORDER BY version_number DESC LIMIT 1"
  ).get(ruleSetId) as { global_hash?: string; globalHash?: string } | undefined;

  if (!latest) return { changed: true, globalHash };
  const previousHash = latest.global_hash ?? latest.globalHash;
  return { changed: previousHash !== globalHash, globalHash };
}

export function createSnapshot(
  db: Database.Database,
  ruleSetId: number,
  files: ScannedFile[],
  globalHash: string
): number {
  const latest = db.prepare(
    "SELECT MAX(version_number) as max_v FROM canonical_versions WHERE rule_set_id = ?"
  ).get(ruleSetId) as { max_v?: number | null; maxV?: number | null };

  const versionNumber = (latest?.max_v ?? latest?.maxV ?? 0) + 1;

  const added: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];

  const prevFiles = db.prepare(
    "SELECT relative_path, content_hash FROM canonical_rule_files WHERE canonical_version_id = (SELECT id FROM canonical_versions WHERE rule_set_id = ? ORDER BY version_number DESC LIMIT 1)"
  ).all(ruleSetId) as { relative_path?: string; content_hash?: string; relativePath?: string; contentHash?: string }[];

  const prevMap = new Map(
    prevFiles.map((f) => [
      f.relative_path ?? f.relativePath ?? "",
      f.content_hash ?? f.contentHash ?? "",
    ]).filter(([path]) => Boolean(path))
  );
  const currentPaths = new Set(files.map((f) => f.relativePath));

  for (const f of files) {
    const prevHash = prevMap.get(f.relativePath);
    if (prevHash === undefined) {
      added.push(f.relativePath);
    } else if (prevHash !== f.hash) {
      changed.push(f.relativePath);
    } else {
      unchanged.push(f.relativePath);
    }
  }

  for (const [relPath] of prevMap) {
    if (!currentPaths.has(relPath)) {
      changed.push(`[removed] ${relPath}`);
    }
  }

  const changeSummary = JSON.stringify({ added, changed, unchanged });

  const result = db.prepare(
    "INSERT INTO canonical_versions (rule_set_id, version_number, global_hash, status, change_summary, created_at) VALUES (?, ?, ?, 'detected', ?, ?)"
  ).run(ruleSetId, versionNumber, globalHash, changeSummary, nowISO());

  const versionId = result.lastInsertRowid as number;

  const insertFile = db.prepare(
    "INSERT INTO canonical_rule_files (canonical_version_id, relative_path, content_hash, content) VALUES (?, ?, ?, ?)"
  );

  const tx = db.transaction(() => {
    for (const f of files) {
      insertFile.run(versionId, f.relativePath, f.hash, f.content);
    }
  });
  tx();

  db.prepare("UPDATE standard_rule_sets SET current_version_id = ?, updated_at = ? WHERE id = ?")
    .run(versionId, nowISO(), ruleSetId);

  return versionId;
}

export function pollForChanges(
  db: Database.Database,
  rulesPath: string
): { changed: boolean; versionId: number | null } {
  let ruleSet = db.prepare("SELECT id, root_path FROM standard_rule_sets LIMIT 1").get() as { id: number; rootPath: string } | undefined;

  if (!ruleSet) {
    db.prepare(
      "INSERT INTO standard_rule_sets (name, root_path) VALUES (?, ?)"
    ).run("Reglas Estandar", rulesPath);
    ruleSet = db.prepare("SELECT id, root_path FROM standard_rule_sets LIMIT 1").get() as { id: number; rootPath: string };
  }

  const files = scanRulesDirectory(rulesPath);
  const { changed, globalHash } = detectChanges(db, ruleSet.id, files);

  if (!changed) return { changed: false, versionId: null };

  const versionId = createSnapshot(db, ruleSet.id, files, globalHash);
  return { changed: true, versionId };
}
