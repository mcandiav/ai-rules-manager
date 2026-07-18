import { hashContent } from "../../lib/hashing.js";
import type { RenderedOutput } from "../adapters/contract.js";

/** Deterministic hash for single-file or multi-file adapter output. */
export function hashRenderedOutput(output: RenderedOutput): string {
  if (output.files && output.files.length > 0) {
    const normalized = [...output.files]
      .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
      .map((file) => `${file.relativePath}\n${file.content}`)
      .join("\n\0\n");
    return hashContent(normalized);
  }
  return hashContent(output.content);
}

/** Concatenate standard MD files into one document (Codex / Claude / similar). */
export function consolidateMarkdownFiles(
  standardFiles: { relativePath: string; content: string }[],
  policyContent = "",
): string {
  const parts: string[] = [];

  for (const file of standardFiles) {
    const body = (file.content || "").replace(/\r\n/g, "\n").trimEnd();
    if (!body) continue;
    parts.push(`## Fuente: \`${file.relativePath || "unknown"}\`\n\n${body}`);
  }

  if (policyContent.trim()) {
    parts.push(`## Fuente: \`project-rules\`\n\n${policyContent.trim()}`);
  }

  return parts.join("\n\n");
}

/** Cursor: keep file content as-is; only rename .md → .mdc. */
export function toCursorMdcFiles(
  standardFiles: { relativePath: string; content: string }[],
  policyContent = "",
): { relativePath: string; content: string }[] {
  const files = standardFiles.map((file) => {
    const source = (file.relativePath || "rule.md").replace(/\\/g, "/");
    const relativePath = source.replace(/\.md$/i, ".mdc");
    return {
      relativePath: relativePath.endsWith(".mdc") ? relativePath : `${relativePath}.mdc`,
      content: file.content ?? "",
    };
  });

  if (policyContent.trim()) {
    files.push({
      relativePath: "project-rules.mdc",
      content: policyContent,
    });
  }

  return files;
}
