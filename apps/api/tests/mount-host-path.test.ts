import { describe, expect, it } from "vitest";
import {
  decodeMountEscapes,
  toHostPathFromMountRoot,
  resolveHostPathFromMountinfo,
} from "../src/lib/mount-host-path.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("mount host path resolution", () => {
  it("decodes mountinfo escapes", () => {
    expect(decodeMountEscapes("/AI\\040Rules\\040Manager/Reglas\\040Estandar"))
      .toBe("/AI Rules Manager/Reglas Estandar");
  });

  it("maps Docker Desktop 9p root + path=D:\\ to Windows host path", () => {
    expect(
      toHostPathFromMountRoot(
        "/MCP/workspace/AI\\040Rules\\040Manager/Reglas\\040Estandar",
        "rw,aname=drvfs;path=D:\\;uid=0"
      )
    ).toBe("D:/MCP/workspace/AI Rules Manager/Reglas Estandar");
  });

  it("maps /host_mnt style paths", () => {
    expect(toHostPathFromMountRoot("/host_mnt/c/Users/Chile/.gemini", ""))
      .toBe("C:/Users/Chile/.gemini");
  });

  it("resolves from a mountinfo fixture", () => {
    const dir = join(tmpdir(), `arm-mountinfo-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, "mountinfo");
    writeFileSync(
      file,
      "892 883 0:69 /MCP/workspace/AI\\040Rules\\040Manager/Reglas\\040Estandar /Reglas\\040Estandar ro,noatime - 9p D:\\134 rw,aname=drvfs;path=D:\\;uid=0\n",
      "utf-8"
    );

    expect(resolveHostPathFromMountinfo("/Reglas Estandar", file))
      .toBe("D:/MCP/workspace/AI Rules Manager/Reglas Estandar");
  });
});
