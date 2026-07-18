import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootCandidates = [
  resolve(process.cwd()),
  resolve(process.cwd(), "..", ".."),
  resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", ".."),
];

function readFirstLine(fileName: string): string | null {
  for (const root of rootCandidates) {
    const candidate = resolve(root, fileName);
    if (!existsSync(candidate)) continue;
    const value = readFileSync(candidate, "utf-8").trim();
    if (value) return value;
  }
  return null;
}

/** Product version from the VERSION file (single source of truth). */
export function readAppVersion(): string {
  return readFirstLine("VERSION") || "0.0.0";
}

/** Short git hash baked into the image as GIT_HASH at Docker build time. */
export function readGitHash(): string {
  return readFirstLine("GIT_HASH") || "dev";
}

/** Deployed release label: VERSION@GIT_HASH */
export function readReleaseLabel(): string {
  return `${readAppVersion()}@${readGitHash()}`;
}
