import Database from "better-sqlite3";
import { buildEffectivePolicyFiles } from "../policies/service.js";

export interface ParsedRule {
  id: string;
  title: string;
  description: string;
  alwaysApply: boolean;
  globs: string[];
  activation: "always" | "glob" | "skill" | "model_decision" | "manual" | "workflow";
  body: string;
  sourcePath: string;
}

export function parseRuleContent(relativePath: string, rawContent: string): ParsedRule {
  const normalized = rawContent.replace(/\r\n/g, "\n");
  const fmRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = normalized.match(fmRegex);

  let fmText = "";
  let body = normalized;

  if (match) {
    fmText = match[1];
    body = match[2];
  }

  // Parse YAML lines
  const metadata: Record<string, any> = {};
  for (const line of fmText.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx).trim();
      const val = line.substring(colonIdx + 1).trim();
      if (val.startsWith("[") && val.endsWith("]")) {
        try {
          metadata[key] = JSON.parse(val.replace(/'/g, '"'));
        } catch {
          metadata[key] = val
            .slice(1, -1)
            .split(",")
            .map((s) => s.trim().replace(/^["']|["']$/g, ""));
        }
      } else if (val === "true") {
        metadata[key] = true;
      } else if (val === "false") {
        metadata[key] = false;
      } else {
        metadata[key] = val.replace(/^["']|["']$/g, "");
      }
    }
  }

  const id = relativePath.replace(/\\/g, "/").split("/").pop()?.replace(/\.md$/i, "") || "unknown";

  // Find first H1 for title
  const h1Match = body.match(/^#\s+(.+)$/m);
  const title = h1Match ? h1Match[1].trim() : id;

  const alwaysApply = metadata.alwaysApply !== false;
  const globs: string[] = Array.isArray(metadata.globs) ? metadata.globs : (metadata.globs ? [metadata.globs] : []);
  const description = metadata.description || "";

  // Derive activation according to V3.1 Table
  let activation: ParsedRule["activation"] = "manual";
  if (alwaysApply) {
    activation = "always";
  } else if (globs.length > 0 && !globs.includes("**/*")) {
    activation = "glob";
  } else if (globs.includes("**/*")) {
    if (id === "10-agents" || id === "10-analysis" || id === "10-coding") {
      activation = "skill";
    } else if (id === "10-benchmark") {
      activation = "manual";
    } else {
      activation = "skill";
    }
  }

  return {
    id,
    title,
    description,
    alwaysApply,
    globs,
    activation,
    body: body.trim(),
    sourcePath: relativePath,
  };
}

export function getActiveParsedRules(
  db: Database.Database,
  ownerType: string,
  ownerId: number
): ParsedRule[] {
  const version = db.prepare(
    "SELECT cv.id FROM canonical_versions cv JOIN standard_rule_sets srs ON srs.current_version_id = cv.id LIMIT 1"
  ).get() as { id: number } | undefined;

  if (!version) return [];

  const effectiveFiles = buildEffectivePolicyFiles(db, ownerType, ownerId, version.id);
  return effectiveFiles.map((file) => parseRuleContent(file.relativePath, file.content));
}

