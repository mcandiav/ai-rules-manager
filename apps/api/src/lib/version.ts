import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const candidates = [
  resolve(process.cwd(), "VERSION"),
  resolve(process.cwd(), "..", "..", "VERSION"),
  resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "VERSION"),
];

export function readAppVersion(): string {
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const value = readFileSync(candidate, "utf-8").trim();
    if (value) return value;
  }
  return "0.0.0";
}

export function readReleaseLabel(env: NodeJS.ProcessEnv = process.env): string {
  const version = env.APP_VERSION?.trim() || readAppVersion();
  const hash = env.GIT_HASH?.trim() || env.UI_VERSION?.trim() || "dev";
  return `${version}@${hash}`;
}
