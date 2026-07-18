import { describe, expect, it } from "vitest";
import { findKnownGlobalApp, listKnownGlobalApps } from "../src/modules/dev-applications/known-globals.js";

describe("known global apps catalog", () => {
  const home = "C:\\Users\\Chile";

  it("exposes governable globals with official artifacts", () => {
    const catalog = listKnownGlobalApps(home);
    const byKey = Object.fromEntries(catalog.map((item) => [item.key, item]));

    expect(byKey["codex-global"]).toMatchObject({
      platform: "codex",
      rootPath: "C:\\Users\\Chile\\.codex",
      governable: true,
    });
    expect(byKey["claude-code-global"]).toMatchObject({
      platform: "claude_code",
      rootPath: "C:\\Users\\Chile\\.claude",
      governable: true,
    });
    expect(byKey["cursor-global"]).toMatchObject({
      platform: "cursor",
      rootPath: "C:\\Users\\Chile\\.cursor",
      governable: true,
    });
    expect(byKey["antigravity-global"]).toMatchObject({
      platform: "antigravity",
      rootPath: "C:\\Users\\Chile\\.gemini",
      governable: true,
      notes: expect.stringContaining("GEMINI.md"),
    });
    expect(byKey["perplexity-global"].governable).toBe(false);
    expect(byKey["chatgpt-global"].governable).toBe(false);
  });

  it("finds antigravity by key", () => {
    expect(findKnownGlobalApp("antigravity-global", home)?.rootPath)
      .toBe("C:\\Users\\Chile\\.gemini");
  });
});
