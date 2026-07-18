export interface AdapterTarget {
  platform: string;
  targetPath: string;
  artifactType: string;
}

export interface RenderedOutput {
  platform: string;
  content: string;
  targets: AdapterTarget[];
}

export interface AdapterContract {
  platform: string;
  resolveTargets(ownerType: string, ownerId: number): AdapterTarget[];
  render(policyContent: string, standardFiles: { relativePath: string; content: string }[]): RenderedOutput;
  validate(output: RenderedOutput): string[];
  write(targets: AdapterTarget[], output: RenderedOutput): Promise<{ written: string[]; errors: string[] }>;
  verify(targets: AdapterTarget[], expectedHash: string): Promise<{ targetPath: string; match: boolean }[]>;
}
