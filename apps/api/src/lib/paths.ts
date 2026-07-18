import { resolve, relative } from "node:path";

export function resolveTargetPath(base: string, segments: string[]): string {
  return resolve(base, ...segments);
}

export function relativePath(from: string, to: string): string {
  return relative(from, to);
}
