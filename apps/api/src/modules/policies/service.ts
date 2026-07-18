import Database from "better-sqlite3";
import { hashComposite } from "../../lib/hashing.js";
import { nowISO } from "../../lib/clock.js";

export function composeEffectivePolicy(
  db: Database.Database,
  ownerType: string,
  ownerId: number,
  canonicalVersionId: number
): { id: number; policyHash: string } {
  const standardFiles = db.prepare(
    "SELECT relative_path, content FROM canonical_rule_files WHERE canonical_version_id = ?"
  ).all(canonicalVersionId) as { relativePath: string; content: string }[];

  const projectRules = db.prepare(
    "SELECT rule_key, content, precedence_mode FROM project_rules WHERE owner_type = ? AND owner_id = ? AND is_active = 1"
  ).all(ownerType, ownerId) as { ruleKey: string; content: string; precedenceMode: string }[];

  const parts: string[] = standardFiles.map((f) => f.content);

  for (const rule of projectRules) {
    if (rule.precedenceMode === "disable") continue;
    if (rule.precedenceMode === "replace") {
      const idx = parts.findIndex((p) => p.includes(rule.ruleKey));
      if (idx >= 0) parts[idx] = rule.content;
      else parts.push(rule.content);
    } else {
      parts.push(rule.content);
    }
  }

  const policyHash = hashComposite(parts);

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
