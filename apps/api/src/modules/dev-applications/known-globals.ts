import { homedir } from "node:os";
import { joinHostPath } from "../../lib/paths.js";

export interface KnownGlobalApp {
  name: string;
  platform: string;
  scope: "global_user";
  /** Host path to the app config root (not always the artifact file itself). */
  rootPath: string;
  /** Whether this entry can be auto-seeded (path is known). */
  seedable: boolean;
  notes?: string;
}

/** Resolve known global app roots for the current host user. */
export function listKnownGlobalApps(home: string = homedir()): KnownGlobalApp[] {
  return [
    {
      name: "Codex (global)",
      platform: "codex",
      scope: "global_user",
      rootPath: joinHostPath(home, ".codex"),
      seedable: true,
      notes: "Artifact: AGENTS.md",
    },
    {
      name: "Claude Code (global)",
      platform: "claude_code",
      scope: "global_user",
      rootPath: joinHostPath(home, ".claude"),
      seedable: true,
      notes: "Artifact: CLAUDE.md",
    },
    {
      name: "Cursor (global)",
      platform: "cursor",
      scope: "global_user",
      rootPath: joinHostPath(home, ".cursor"),
      seedable: true,
      notes: "Suggested artifact dir: .cursor/rules — edit path in UI if your install differs",
    },
    {
      name: "Antigravity (global)",
      platform: "antigravity",
      scope: "global_user",
      rootPath: joinHostPath(home, ".antigravity"),
      seedable: false,
      notes: "Global path not confirmed yet — discover on host before seeding",
    },
    {
      name: "Perplexity (global)",
      platform: "perplexity",
      scope: "global_user",
      rootPath: joinHostPath(home, ".perplexity"),
      seedable: false,
      notes: "No confirmed local rules artifact yet",
    },
    {
      name: "ChatGPT (global)",
      platform: "chatgpt",
      scope: "global_user",
      rootPath: joinHostPath(home, ".chatgpt"),
      seedable: false,
      notes: "No confirmed local rules artifact yet (cloud-managed)",
    },
  ];
}
