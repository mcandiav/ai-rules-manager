import Database from "better-sqlite3";
import { hashComposite } from "../../lib/hashing.js";
import { nowISO } from "../../lib/clock.js";

export interface EffectivePolicyFile {
  relativePath: string;
  content: string;
}

interface ProjectRuleRow {
  ruleKey: string;
  content: string;
  precedenceMode: string;
}

export function buildEffectivePolicyFiles(
  db: Database.Database,
  ownerType: string,
  ownerId: number,
  canonicalVersionId: number
): EffectivePolicyFile[] {
  const standardFiles = db.prepare(
    "SELECT relative_path AS relativePath, content FROM canonical_rule_files WHERE canonical_version_id = ?"
  ).all(canonicalVersionId) as { relativePath: string; content: string }[];

  const projectRules = db.prepare(
    "SELECT rule_key AS ruleKey, content, precedence_mode AS precedenceMode FROM project_rules WHERE owner_type = ? AND owner_id = ? AND is_active = 1"
  ).all(ownerType, ownerId) as ProjectRuleRow[];

  const files: EffectivePolicyFile[] = standardFiles.map((file) => ({
    relativePath: file.relativePath,
    content: file.content,
  }));

  for (const rule of projectRules) {
    const idx = files.findIndex((file) => file.content.includes(rule.ruleKey));

    if (rule.precedenceMode === "disable") {
      if (idx >= 0) files.splice(idx, 1);
      continue;
    }

    if (rule.precedenceMode === "replace") {
      if (idx >= 0) {
        files[idx] = { ...files[idx], content: rule.content };
      } else {
        files.push({
          relativePath: `project-rules/${rule.ruleKey}.md`,
          content: rule.content,
        });
      }
      continue;
    }

    files.push({
      relativePath: `project-rules/${rule.ruleKey}.md`,
      content: rule.content,
    });
  }

  return files;
}

export function composeEffectivePolicy(
  db: Database.Database,
  ownerType: string,
  ownerId: number,
  canonicalVersionId: number
): { id: number; policyHash: string } {
  const files = buildEffectivePolicyFiles(db, ownerType, ownerId, canonicalVersionId);
  const policyHash = hashComposite(files.map((file) => file.content));

  // Check if policy already exists
  const existing = db.prepare(
    "SELECT id FROM effective_policies WHERE owner_type = ? AND owner_id = ? AND canonical_version_id = ? AND policy_hash = ?"
  ).get(ownerType, ownerId, canonicalVersionId, policyHash) as { id: number } | undefined;

  if (existing) return { id: existing.id, policyHash };

  const result = db.prepare(
    "INSERT INTO effective_policies (owner_type, owner_id, canonical_version_id, policy_hash, generated_at) VALUES (?, ?, ?, ?, ?)"
  ).run(ownerType, ownerId, canonicalVersionId, policyHash, nowISO());

  return { id: result.lastInsertRowid as number, policyHash };
}
