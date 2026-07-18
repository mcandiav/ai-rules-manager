import { relative, resolve } from "node:path";

export interface PathMappingConfig {
  hostWorkspaceRoot?: string;
  containerWorkspaceRoot?: string;
}

function normalizeSlashes(path: string): string {
  return path.replace(/\\/g, "/");
}

function stripTrailingSlash(path: string): string {
  return path.replace(/[\\/]+$/, "");
}

function isWindowsStylePath(path: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(path) || path.includes("\\");
}

export function loadPathMappingFromEnv(
  env: NodeJS.ProcessEnv = process.env
): PathMappingConfig {
  const hostWorkspaceRoot = env.HOST_WORKSPACE_ROOT?.trim() || undefined;
  const containerWorkspaceRoot =
    env.CONTAINER_WORKSPACE_ROOT?.trim() ||
    (hostWorkspaceRoot ? "/host/workspace" : undefined);

  return { hostWorkspaceRoot, containerWorkspaceRoot };
}

let activeMapping: PathMappingConfig = loadPathMappingFromEnv();

export function setPathMapping(mapping: PathMappingConfig): void {
  activeMapping = {
    hostWorkspaceRoot: mapping.hostWorkspaceRoot?.trim() || undefined,
    containerWorkspaceRoot:
      mapping.containerWorkspaceRoot?.trim() ||
      (mapping.hostWorkspaceRoot ? "/host/workspace" : undefined),
  };
}

export function getPathMapping(): PathMappingConfig {
  return { ...activeMapping };
}

/** Join path segments preserving host path style (Windows or POSIX). */
export function joinHostPath(root: string, ...segments: string[]): string {
  const lastSepIdx = Math.max(root.lastIndexOf("/"), root.lastIndexOf("\\"));
  const sep =
    lastSepIdx >= 0
      ? root[lastSepIdx]!
      : isWindowsStylePath(root)
        ? "\\"
        : "/";
  const normalizedRoot = stripTrailingSlash(root);
  const rest = segments
    .map((segment) => segment.replace(/^[\\/]+|[\\/]+$/g, ""))
    .filter(Boolean)
    .join(sep);
  return rest ? `${normalizedRoot}${sep}${rest}` : normalizedRoot;
}

/**
 * Convert a host/display path into a filesystem path usable inside the
 * current runtime (Docker container or native host).
 */
export function toFsPath(
  hostPath: string,
  mapping: PathMappingConfig = activeMapping
): string {
  const hostRoot = mapping.hostWorkspaceRoot;
  const containerRoot = mapping.containerWorkspaceRoot;
  if (!hostRoot || !containerRoot) return hostPath;

  const normalizedHost = stripTrailingSlash(normalizeSlashes(hostPath));
  const normalizedRoot = stripTrailingSlash(normalizeSlashes(hostRoot));
  const hostLower = normalizedHost.toLowerCase();
  const rootLower = normalizedRoot.toLowerCase();

  if (hostLower === rootLower) {
    return stripTrailingSlash(containerRoot);
  }

  if (hostLower.startsWith(`${rootLower}/`)) {
    const relativePart = normalizedHost.slice(normalizedRoot.length).replace(/^\//, "");
    return `${stripTrailingSlash(containerRoot)}/${relativePart}`;
  }

  return hostPath;
}

export function resolveTargetPath(base: string, segments: string[]): string {
  return resolve(toFsPath(base), ...segments);
}

export function relativePath(from: string, to: string): string {
  return relative(from, to);
}
