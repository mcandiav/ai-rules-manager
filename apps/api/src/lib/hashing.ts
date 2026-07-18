import { createHash } from "node:crypto";

export function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

export function hashComposite(parts: string[]): string {
  const h = createHash("sha256");
  for (const part of parts.sort()) {
    h.update(part, "utf-8");
  }
  return h.digest("hex");
}
