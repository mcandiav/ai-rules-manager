import { describe, it, expect, beforeEach } from "vitest";
import {
  joinHostPath,
  setPathMapping,
  toFsPath,
} from "../src/lib/paths.js";

describe("path mapping", () => {
  beforeEach(() => {
    setPathMapping({ mappings: [] });
  });

  it("joins windows host paths without rewriting separators", () => {
    expect(joinHostPath("D:\\MCP\\workspace\\antigravity", ".antigravityrules"))
      .toBe("D:\\MCP\\workspace\\antigravity\\.antigravityrules");
    expect(joinHostPath("D:/MCP/workspace/antigravity", "AGENTS.md"))
      .toBe("D:/MCP/workspace/antigravity/AGENTS.md");
  });

  it("maps host workspace and home paths to container paths", () => {
    setPathMapping({
      mappings: [
        { hostRoot: "D:/MCP/workspace", containerRoot: "/host/workspace" },
        { hostRoot: "C:/Users/Chile", containerRoot: "/host/home" },
      ],
    });

    expect(toFsPath("D:\\MCP\\workspace\\antigravity\\.antigravityrules"))
      .toBe("/host/workspace/antigravity/.antigravityrules");
    expect(toFsPath("C:\\Users\\Chile\\.codex\\AGENTS.md"))
      .toBe("/host/home/.codex/AGENTS.md");
  });

  it("leaves unmapped paths unchanged", () => {
    setPathMapping({
      mappings: [
        { hostRoot: "D:/MCP/workspace", containerRoot: "/host/workspace" },
      ],
    });

    expect(toFsPath("C:\\Users\\Chile\\.codex\\AGENTS.md"))
      .toBe("C:\\Users\\Chile\\.codex\\AGENTS.md");
  });
});
