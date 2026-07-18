CREATE TABLE IF NOT EXISTS standard_rule_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  root_path TEXT NOT NULL,
  current_version_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS canonical_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_set_id INTEGER NOT NULL REFERENCES standard_rule_sets(id),
  version_number INTEGER NOT NULL,
  global_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'detected',
  change_summary TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS canonical_rule_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  canonical_version_id INTEGER NOT NULL REFERENCES canonical_versions(id),
  relative_path TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS governed_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  root_path TEXT NOT NULL UNIQUE,
  governance_status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS governed_dev_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  scope TEXT NOT NULL,
  root_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS governed_ai_surfaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'global',
  root_path TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  adapter_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS governed_artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_type TEXT NOT NULL,
  owner_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  target_path TEXT,
  managed INTEGER NOT NULL DEFAULT 1,
  last_observed_hash TEXT,
  configured_path TEXT,
  path_source TEXT NOT NULL DEFAULT 'adapter',
  path_updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_type TEXT NOT NULL,
  owner_id INTEGER NOT NULL,
  rule_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  precedence_mode TEXT NOT NULL DEFAULT 'extend',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS effective_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_type TEXT NOT NULL,
  owner_id INTEGER NOT NULL,
  canonical_version_id INTEGER NOT NULL REFERENCES canonical_versions(id),
  policy_hash TEXT NOT NULL,
  generated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS adapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL UNIQUE,
  output_format TEXT NOT NULL,
  target_kind TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS projections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  effective_policy_id INTEGER NOT NULL REFERENCES effective_policies(id),
  adapter_id INTEGER NOT NULL REFERENCES adapters(id),
  output_hash TEXT NOT NULL,
  rendered_content TEXT NOT NULL,
  generated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_type TEXT NOT NULL,
  owner_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  target_path TEXT NOT NULL,
  managed INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS synchronization_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_target_id INTEGER NOT NULL REFERENCES project_targets(id),
  canonical_version_id INTEGER NOT NULL REFERENCES canonical_versions(id),
  expected_hash TEXT NOT NULL,
  applied_hash TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending_publish',
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS drift_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_target_id INTEGER NOT NULL REFERENCES project_targets(id),
  expected_hash TEXT NOT NULL,
  observed_hash TEXT NOT NULL,
  detected_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS publish_operations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope_type TEXT NOT NULL,
  scope_id TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT,
  result TEXT NOT NULL DEFAULT 'running',
  triggered_by TEXT NOT NULL DEFAULT 'manual'
);
