import Database from "better-sqlite3";
import { AdapterContract } from "./contract.js";
import { createClaudeCodeAdapter } from "./claude-code.js";
import { createCursorAdapter } from "./cursor.js";
import { createCodexAdapter } from "./codex.js";
import { createAntigravityAdapter } from "./antigravity.js";

const _adapters: Map<string, AdapterContract> = new Map();

export function registerAdapters(db: Database.Database): void {
  const adapters = [
    createClaudeCodeAdapter(db),
    createCursorAdapter(db),
    createCodexAdapter(db),
    createAntigravityAdapter(db),
  ];

  for (const a of adapters) {
    _adapters.set(a.platform, a);
    // Upsert into adapters table
    const existing = db.prepare("SELECT id FROM adapters WHERE platform = ?").get(a.platform);
    if (!existing) {
      db.prepare("INSERT INTO adapters (platform, output_format, target_kind, enabled) VALUES (?, ?, ?, 1)")
        .run(a.platform, "file", "rule_file");
    }
  }
}

export function getAdapter(platform: string): AdapterContract | undefined {
  return _adapters.get(platform);
}

export function getAllAdapters(): AdapterContract[] {
  return Array.from(_adapters.values());
}

export function getEnabledPlatforms(db: Database.Database): string[] {
  return (db.prepare("SELECT platform FROM adapters WHERE enabled = 1").all() as any[])
    .map((r: any) => r.platform);
}
