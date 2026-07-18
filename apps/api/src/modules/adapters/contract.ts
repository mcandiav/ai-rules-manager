export interface AdapterTarget {
  platform: string;
  targetPath: string;
  artifactType: string;
}

export interface RenderedFile {
  /** Relative path inside the target directory or logical name for hashing. */
  relativePath: string;
  content: string;
}

export interface RenderedOutput {
  platform: string;
  /** Single-file adapters write this. Multi-file adapters also set files[]. */
  content: string;
  targets: AdapterTarget[];
  /** Cursor: one entry per standard rule file (.md → .mdc). */
  files?: RenderedFile[];
}

export interface AdapterContract {
  platform: string;
  resolveTargets(ownerType: string, ownerId: number): AdapterTarget[];
  render(policyContent: string, standardFiles: { relativePath: string; content: string }[]): RenderedOutput;
  validate(output: RenderedOutput): string[];
  write(targets: AdapterTarget[], output: RenderedOutput): Promise<{ written: string[]; errors: string[] }>;
  verify(targets: AdapterTarget[], expectedHash: string): Promise<{ targetPath: string; match: boolean }[]>;
}
