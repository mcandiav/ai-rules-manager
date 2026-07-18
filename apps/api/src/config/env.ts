import { resolve } from "node:path";

export interface EnvConfig {
  port: number;
  sqlitePath: string;
  pollIntervalMs: number;
  nodeEnv: string;
  standardRulesPath: string;
}

function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function getEnvInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? fallback : n;
}

export function loadEnv(): EnvConfig {
  return {
    port: getEnvInt("API_PORT", 8000),
    sqlitePath: getEnv("SQLITE_PATH", "./data/sqlite/rules-manager.db"),
    pollIntervalMs: getEnvInt("POLL_INTERVAL_MS", 30000),
    nodeEnv: getEnv("NODE_ENV", "development"),
    standardRulesPath: getEnv("STANDARD_RULES_PATH", resolve(process.cwd(), "..", "..", "Reglas Estandar")),
  };
}
