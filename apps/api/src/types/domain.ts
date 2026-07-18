export interface StandardRuleSet {
  id: number;
  name: string;
  rootPath: string;
  currentVersionId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalVersion {
  id: number;
  ruleSetId: number;
  versionNumber: number;
  globalHash: string;
  status: "detected" | "ready" | "published_partial" | "published_complete";
  changeSummary: string | null;
  createdAt: string;
}

export interface CanonicalRuleFile {
  id: number;
  canonicalVersionId: number;
  relativePath: string;
  contentHash: string;
  content: string;
}

export interface GovernedProject {
  id: number;
  name: string;
  rootPath: string;
  governanceStatus: "adopting" | "active" | "paused" | "error";
  createdAt: string;
  lastSeenAt: string;
}

export interface GovernedDevApplication {
  id: number;
  name: string;
  platform: string;
  scope: string;
  rootPath: string;
  status: string;
  createdAt: string;
}

export interface GovernedAiSurface {
  id: number;
  name: string;
  platform: string;
  scope: string;
  rootPath: string | null;
  status: string;
  adapterKey: string;
  createdAt: string;
}

export interface GovernedArtifact {
  id: number;
  ownerType: string;
  ownerId: number;
  platform: string;
  artifactType: string;
  targetPath: string | null;
  managed: boolean;
  lastObservedHash: string | null;
  configuredPath: string | null;
  pathSource: string;
  pathUpdatedAt: string;
}

export interface ProjectRule {
  id: number;
  ownerType: string;
  ownerId: number;
  ruleKey: string;
  title: string;
  content: string;
  precedenceMode: "extend" | "replace" | "disable";
  updatedAt: string;
  isActive: boolean;
}

export interface EffectivePolicy {
  id: number;
  ownerType: string;
  ownerId: number;
  canonicalVersionId: number;
  policyHash: string;
  generatedAt: string;
}

export interface Adapter {
  id: number;
  platform: string;
  outputFormat: string;
  targetKind: string;
  enabled: boolean;
}

export interface Projection {
  id: number;
  effectivePolicyId: number;
  adapterId: number;
  outputHash: string;
  renderedContent: string;
  generatedAt: string;
}

export interface ProjectTarget {
  id: number;
  ownerType: string;
  ownerId: number;
  platform: string;
  targetPath: string;
  managed: boolean;
}

export interface SynchronizationRecord {
  id: number;
  projectTargetId: number;
  canonicalVersionId: number;
  expectedHash: string;
  appliedHash: string | null;
  syncStatus: string;
  syncedAt: string;
}

export interface DriftEvent {
  id: number;
  projectTargetId: number;
  expectedHash: string;
  observedHash: string;
  detectedAt: string;
  status: "open" | "acknowledged" | "resolved";
}

export interface PublishOperation {
  id: number;
  scopeType: string;
  scopeId: string;
  startedAt: string;
  finishedAt: string | null;
  result: string;
  triggeredBy: string;
}
