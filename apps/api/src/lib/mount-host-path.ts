import { readFileSync, existsSync } from "node:fs";

/** Decode mountinfo octal escapes: \040 → space, \134 → \ */
export function decodeMountEscapes(value: string): string {
  return value.replace(/\\([0-7]{3})/g, (_, oct: string) =>
    String.fromCharCode(Number.parseInt(oct, 8))
  );
}

/**
 * Convert Docker Desktop / WSL-style mount roots into a host path.
 * Examples:
 *   /MCP/workspace/App + path=D:\  → D:/MCP/workspace/App
 *   /host_mnt/d/foo                → D:/foo
 *   /run/desktop/mnt/host/c/Users  → C:/Users
 *   /home/user/proj                → /home/user/proj (Linux bind)
 */
export function toHostPathFromMountRoot(root: string, superOptions: string = ""): string {
  const decoded = decodeMountEscapes(root);

  const pathOpt = /(?:^|[,;])path=([A-Za-z]):\\?/.exec(superOptions);
  if (pathOpt) {
    const drive = pathOpt[1]!.toUpperCase();
    const rest = decoded.replace(/^\//, "");
    return `${drive}:/${rest}`;
  }

  const hostMnt = /^\/host_mnt\/([a-z])(\/.*)?$/i.exec(decoded);
  if (hostMnt) {
    return `${hostMnt[1]!.toUpperCase()}:${hostMnt[2] || "/"}`;
  }

  const desktop = /^\/run\/desktop\/mnt\/host\/([a-z])(\/.*)?$/i.exec(decoded);
  if (desktop) {
    return `${desktop[1]!.toUpperCase()}:${desktop[2] || "/"}`;
  }

  return decoded;
}

/**
 * Resolve the host filesystem path for a container path using /proc/self/mountinfo.
 * Portable across install locations: wherever compose mounts ./Reglas Estandar.
 */
export function resolveHostPathFromMountinfo(
  containerPath: string,
  mountinfoPath: string = "/proc/self/mountinfo"
): string | null {
  if (!existsSync(mountinfoPath)) return null;

  const target = decodeMountEscapes(containerPath.replace(/\\/g, "/")).replace(/\/+$/, "") || "/";
  const lines = readFileSync(mountinfoPath, "utf-8").split("\n").filter(Boolean);

  let best: { mountPointLen: number; hostPath: string } | null = null;

  for (const line of lines) {
    const sep = line.indexOf(" - ");
    if (sep < 0) continue;
    const left = line.slice(0, sep).trim();
    const right = line.slice(sep + 3).trim();
    const leftParts = left.split(" ");
    const rightParts = right.split(" ");
    if (leftParts.length < 5 || rightParts.length < 2) continue;

    const root = leftParts[3]!;
    const mountPoint = decodeMountEscapes(leftParts[4]!).replace(/\/+$/, "") || "/";
    const superOptions = rightParts.slice(2).join(" ");

    const isMatch =
      target === mountPoint ||
      target.startsWith(`${mountPoint}/`) ||
      mountPoint === target;

    if (!isMatch) continue;

    const hostRoot = toHostPathFromMountRoot(root, superOptions);
    let hostPath = hostRoot;
    if (target !== mountPoint && target.startsWith(`${mountPoint}/`)) {
      const suffix = target.slice(mountPoint.length);
      hostPath = `${hostRoot.replace(/\/+$/, "")}${suffix}`;
    }

    if (!best || mountPoint.length > best.mountPointLen) {
      best = { mountPointLen: mountPoint.length, hostPath };
    }
  }

  return best?.hostPath ?? null;
}

/** Optional env override, else discover from the bind mount of STANDARD_RULES_PATH. */
export function resolveStandardRulesHostPath(
  containerPath: string,
  env: NodeJS.ProcessEnv = process.env
): string | null {
  const configured = env.HOST_STANDARD_RULES_PATH?.trim();
  if (configured) return configured;
  return resolveHostPathFromMountinfo(containerPath);
}
