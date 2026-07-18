import { relative, resolve } from "node:path";

export interface PathRootMapping {
  hostRoot: string;
  containerRoot: string;
}

export interface PathMappingConfig {
  /** @deprecated prefer mappings[] */
  hostWorkspaceRoot?: string;
  containerWorkspaceRoot?: string;
  mappings: PathRootMapping[];
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

function buildMappings(env: NodeJS.ProcessEnv): PathRootMapping[] {
  const mappings: PathRootMapping[] = [];

  const hostWorkspace = env.HOST_WORKSPACE_ROOT?.trim();
  if (hostWorkspace) {
    mappings.push({
      hostRoot: hostWorkspace,
      containerRoot: env.CONTAINER_WORKSPACE_ROOT?.trim() || "/host/workspace",
    });
  }

  const hostHome = env.HOST_HOME_ROOT?.trim();
  if (hostHome) {
    mappings.push({
      hostRoot: hostHome,
      containerRoot: env.CONTAINER_HOME_ROOT?.trim() || "/host/home",
    });
  }

  return mappings;
}

export function loadPathMappingFromEnv(
  env: NodeJS.ProcessEnv = process.env
): PathMappingConfig {
  const mappings = buildMappings(env);
  const workspace = mappings.find((m) => m.containerRoot.includes("workspace"));
  return {
    hostWorkspaceRoot: workspace?.hostRoot,
    containerWorkspaceRoot: workspace?.containerRoot,
    mappings,
  };
}

let activeMapping: PathMappingConfig = loadPathMappingFromEnv();

export function setPathMapping(mapping: PathMappingConfig): void {
  const mappings =
    mapping.mappings?.length
      ? mapping.mappings
      : buildMappings({
          HOST_WORKSPACE_ROOT: mapping.hostWorkspaceRoot,
          CONTAINER_WORKSPACE_ROOT: mapping.containerWorkspaceRoot,
        });

  const workspace = mappings.find((m) => m.containerRoot.includes("workspace"));
  activeMapping = {
    hostWorkspaceRoot: workspace?.hostRoot || mapping.hostWorkspaceRoot,
    containerWorkspaceRoot: workspace?.containerRoot || mapping.containerWorkspaceRoot,
    mappings,
  };
}

export function getPathMapping(): PathMappingConfig {
  return {
    ...activeMapping,
    mappings: [...activeMapping.mappings],
  };
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
  const normalizedHost = stripTrailingSlash(normalizeSlashes(hostPath));

  const ordered = [...mapping.mappings].sort(
    (a, b) => normalizeSlashes(b.hostRoot).length - normalizeSlashes(a.hostRoot).length
  );

  for (const entry of ordered) {
    const normalizedRoot = stripTrailingSlash(normalizeSlashes(entry.hostRoot));
    const hostLower = normalizedHost.toLowerCase();
    const rootLower = normalizedRoot.toLowerCase();

    if (hostLower === rootLower) {
      return stripTrailingSlash(entry.containerRoot);
    }

    if (hostLower.startsWith(`${rootLower}/`)) {
      const relativePart = normalizedHost.slice(normalizedRoot.length).replace(/^\//, "");
      return `${stripTrailingSlash(entry.containerRoot)}/${relativePart}`;
    }
  }

  return hostPath;
}

export function resolveTargetPath(base: string, segments: string[]): string {
  return resolve(toFsPath(base), ...segments);
}

export function relativePath(from: string, to: string): string {
  return relative(from, to);
}
