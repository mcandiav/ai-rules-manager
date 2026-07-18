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
    expect(joinHostPath("D:\\MCP\\workspace\\antigravity", "GEMINI.md"))
      .toBe("D:\\MCP\\workspace\\antigravity\\GEMINI.md");
    expect(joinHostPath("D:/MCP/workspace/antigravity", "AGENTS.md"))
      .toBe("D:/MCP/workspace/antigravity/AGENTS.md");
    expect(joinHostPath("C:\\Users\\Chile", ".gemini", "GEMINI.md"))
      .toBe("C:\\Users\\Chile\\.gemini\\GEMINI.md");
  });

  it("maps host workspace and home paths to container paths", () => {
    setPathMapping({
      mappings: [
        { hostRoot: "D:/MCP/workspace", containerRoot: "/host/workspace" },
        { hostRoot: "C:/Users/Chile", containerRoot: "/host/home" },
      ],
    });

    expect(toFsPath("D:\\MCP\\workspace\\antigravity\\GEMINI.md"))
      .toBe("/host/workspace/antigravity/GEMINI.md");
    expect(toFsPath("C:\\Users\\Chile\\.codex\\AGENTS.md"))
      .toBe("/host/home/.codex/AGENTS.md");
    expect(toFsPath("C:\\Users\\Chile\\.gemini\\GEMINI.md"))
      .toBe("/host/home/.gemini/GEMINI.md");
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
