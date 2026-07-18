import { describe, expect, it, afterEach } from "vitest";
import { findKnownGlobalApp, listKnownGlobalApps } from "../src/modules/dev-applications/known-globals.js";
import { resolveHostHome } from "../src/lib/paths.js";

describe("known global apps catalog", () => {
  const home = "C:\\Users\\Chile";
  const previousHome = process.env.HOST_HOME_ROOT;

  afterEach(() => {
    if (previousHome === undefined) delete process.env.HOST_HOME_ROOT;
    else process.env.HOST_HOME_ROOT = previousHome;
  });

  it("uses HOST_HOME_ROOT instead of container homedir", () => {
    process.env.HOST_HOME_ROOT = "C:\\Users\\Chile";
    expect(resolveHostHome()).toBe("C:\\Users\\Chile");
    expect(listKnownGlobalApps()[0].rootPath).toBe("C:\\Users\\Chile\\.codex");
  });

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
