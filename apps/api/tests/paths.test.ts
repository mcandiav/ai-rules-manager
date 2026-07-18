import { describe, it, expect, beforeEach } from "vitest";
import {
  joinHostPath,
  parseDriveMappings,
  setPathMapping,
  toFsPath,
  loadPathMappingFromEnv,
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

  it("parses Windows drive mappings", () => {
    expect(parseDriveMappings("C:/:/host/c;D:/:/host/d;F:/:/host/f")).toEqual([
      { hostRoot: "C:", containerRoot: "/host/c" },
      { hostRoot: "D:", containerRoot: "/host/d" },
      { hostRoot: "F:", containerRoot: "/host/f" },
    ]);
    expect(parseDriveMappings("C:|/host/c;F:|/host/f")).toEqual([
      { hostRoot: "C:", containerRoot: "/host/c" },
      { hostRoot: "F:", containerRoot: "/host/f" },
    ]);
  });

  it("maps C: and D: project paths via HOST_DRIVE_MAPPINGS", () => {
    setPathMapping(loadPathMappingFromEnv({
      HOST_DRIVE_MAPPINGS: "C:/:/host/c;D:/:/host/d",
      HOST_HOME_ROOT: "C:/Users/Chile",
    }));

    expect(toFsPath("D:\\MCP\\workspace\\app\\GEMINI.md"))
      .toBe("/host/d/MCP/workspace/app/GEMINI.md");
    expect(toFsPath("C:\\Users\\Chile\\.codex\\AGENTS.md"))
      .toBe("/host/c/Users/Chile/.codex/AGENTS.md");
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
