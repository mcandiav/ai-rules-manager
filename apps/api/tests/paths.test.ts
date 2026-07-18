import { describe, it, expect, beforeEach } from "vitest";
import {
  joinHostPath,
  setPathMapping,
  toFsPath,
} from "../src/lib/paths.js";

describe("path mapping", () => {
  beforeEach(() => {
    setPathMapping({});
  });

  it("joins windows host paths without rewriting separators", () => {
    expect(joinHostPath("D:\\MCP\\workspace\\antigravity", ".antigravityrules"))
      .toBe("D:\\MCP\\workspace\\antigravity\\.antigravityrules");
    expect(joinHostPath("D:/MCP/workspace/antigravity", "AGENTS.md"))
      .toBe("D:/MCP/workspace/antigravity/AGENTS.md");
  });

  it("maps host workspace paths to container paths", () => {
    setPathMapping({
      hostWorkspaceRoot: "D:/MCP/workspace",
      containerWorkspaceRoot: "/host/workspace",
    });

    expect(toFsPath("D:\\MCP\\workspace\\antigravity\\.antigravityrules"))
      .toBe("/host/workspace/antigravity/.antigravityrules");
    expect(toFsPath("D:/MCP/workspace/antigravity/AGENTS.md"))
      .toBe("/host/workspace/antigravity/AGENTS.md");
  });

  it("leaves unmapped paths unchanged", () => {
    setPathMapping({
      hostWorkspaceRoot: "D:/MCP/workspace",
      containerWorkspaceRoot: "/host/workspace",
    });

    expect(toFsPath("C:\\Users\\Chile\\.codex\\AGENTS.md"))
      .toBe("C:\\Users\\Chile\\.codex\\AGENTS.md");
  });
});
