import { joinHostPath, resolveHostHome } from "../../lib/paths.js";

export interface KnownGlobalApp {
  key: string;
  name: string;
  platform: string;
  scope: "global_user";
  /** Suggested host root for this global app. */
  rootPath: string;
  /**
   * Can appear in the "govern this global" combo.
   * false = listed as unavailable until a real artifact path is confirmed.
   */
  governable: boolean;
  notes?: string;
}

/** Catalog of known global AI apps. Nothing is governed until the user opts in. */
export function listKnownGlobalApps(home: string = resolveHostHome()): KnownGlobalApp[] {
  return [
    {
      key: "codex-global",
      name: "Codex (global)",
      platform: "codex",
      scope: "global_user",
      rootPath: joinHostPath(home, ".codex"),
      governable: true,
      notes: "Artifact: AGENTS.md",
    },
    {
      key: "claude-code-global",
      name: "Claude Code (global)",
      platform: "claude_code",
      scope: "global_user",
      rootPath: joinHostPath(home, ".claude"),
      governable: true,
      notes: "Artifact: CLAUDE.md",
    },
    {
      key: "cursor-global",
      name: "Cursor (global)",
      platform: "cursor",
      scope: "global_user",
      rootPath: joinHostPath(home, ".cursor"),
      governable: true,
      notes: "Artifact dir: .cursor/rules (*.mdc)",
    },
    {
      key: "antigravity-global",
      name: "Antigravity (global)",
      platform: "antigravity",
      scope: "global_user",
      rootPath: joinHostPath(home, ".gemini"),
      governable: true,
      notes: "Artifact: GEMINI.md (official Antigravity global rules)",
    },
    {
      key: "perplexity-global",
      name: "Perplexity (global)",
      platform: "perplexity",
      scope: "global_user",
      rootPath: joinHostPath(home, ".perplexity"),
      governable: false,
      notes: "No confirmed local rules artifact yet",
    },
    {
      key: "chatgpt-global",
      name: "ChatGPT (global)",
      platform: "chatgpt",
      scope: "global_user",
      rootPath: joinHostPath(home, ".chatgpt"),
      governable: false,
      notes: "No confirmed local rules artifact yet (cloud-managed)",
    },
  ];
}

export function findKnownGlobalApp(key: string, home: string = resolveHostHome()): KnownGlobalApp | undefined {
  return listKnownGlobalApps(home).find((item) => item.key === key);
}
