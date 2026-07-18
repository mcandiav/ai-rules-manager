# Feature Specification: AI Rules Manager - Governance Core

**Feature Branch**: `002-ai-rules-manager-governance`

**Created**: 2026-07-17

**Status**: Draft

**Input**: User description: "Construir AI Rules Manager como una app web local en Docker para gobernar reglas estándar y reglas particulares. La fuente canónica es la carpeta Reglas Estandar y cada cambio crea una nueva versión canónica del snapshot completo. La app debe gobernar tres superficies: proyectos gobernados, aplicaciones dev instaladas y apps o agentes de IA con artefactos gobernables soportados. Las reglas particulares son reglas por superficie gobernada, administradas en la app, que pueden extender, reemplazar o deshabilitar reglas estándar para esa superficie específica y no viven en la carpeta canónica. La sincronización es estrictamente unidireccional desde la fuente canónica hacia las superficies gobernadas. La resolución de conflictos es manual en V1. Debe administrar artefactos concretos como AGENTS.md del proyecto, C:\Users\<usuario>\.codex\AGENTS.md, CLAUDE.md, .cursor\rules y otros artefactos soportados por adaptador. Cada artefacto debe tener ruta configurable desde la UI porque las ubicaciones pueden cambiar por actualización. La app debe mostrar dashboard de sincronía, deriva, conflictos, versiones y estado por superficie y por IA."

## User Scenarios & Testing

### User Story 1 - View Governance Dashboard (Priority: P1)

An operator opens the AI Rules Manager dashboard and sees an overview of all governed surfaces: projects, dev applications, and AI agents. For each surface they see sync status (synced/drifting/conflict), the current canonical version applied, the last sync timestamp, and any outstanding conflicts. The dashboard also shows the canonical "Reglas Estandar" folder status — the total number of standard rules and the current snapshot version.

**Why this priority**: The dashboard is the primary entry point. Without it, operators have no visibility into governance state and cannot detect drift or conflicts.

**Independent Test**: Can be fully tested by deploying the app, registering at least one surface of each type, and confirming the dashboard renders with correct sync status, version, and per-surface state. Delivers immediate governance visibility.

**Acceptance Scenarios**:

1. **Given** at least one surface of each type is registered, **When** the dashboard loads, **Then** it displays a summary tile for each surface with name, type (project/dev app/AI agent), sync status, canonical version, and last sync timestamp.
2. **Given** the dashboard is displayed, **When** a surface has unapplied changes in the canonical folder, **Then** its status shows "drifting" with the number of pending changes.
3. **Given** the dashboard is displayed, **When** a sync conflict exists, **Then** the surface status shows "conflict" with a count and a link to the conflict resolution view.
4. **Given** no surfaces are registered, **When** the dashboard loads, **Then** an empty state is shown with a call-to-action to register the first surface.
5. **Given** the canonical folder has version history, **When** the dashboard loads, **Then** the canonical section shows the current snapshot version, total standard rule count, and a link to version history.

---

### User Story 2 - Manage Standard Rules via Canonical Folder (Priority: P1)

An operator edits the standard rules in the "Reglas Estandar" folder. When changes are detected (via polling), the system creates a new canonical snapshot preserving the complete ruleset at that point in time. The operator can browse all snapshots, view differences between any two, and see which surfaces are on which version.

**Why this priority**: The canonical folder is the single source of truth. Versioning every change is the foundation of traceability and governance.

**Independent Test**: Can be tested by adding a new rule file to the canonical folder, waiting for the polling cycle, and confirming a new snapshot appears in the version history with the complete rule set captured. Delivers canonical versioning end-to-end.

**Acceptance Scenarios**:

1. **Given** the canonical folder contains three rule files, **When** the operator adds a fourth file, **Then** the system detects the change within the configured polling interval and creates a new snapshot version capturing all four files.
2. **Given** multiple snapshots exist, **When** the operator opens the version history, **Then** each snapshot lists the timestamp and the number of rule files included.
3. **Given** two snapshots are selected for comparison, **When** the operator requests a diff, **Then** a side-by-side or unified diff of the complete folder contents is displayed.
4. **Given** the canonical folder has not changed, **When** a polling cycle runs, **Then** no new snapshot is created.

---

### User Story 3 - Register and Configure a Governed Surface (Priority: P1)

An operator registers a new governed project by providing its name, type (project), and configuring artifact paths: e.g., the project's `AGENTS.md`, `CLAUDE.md`, and `.cursor/rules/` directory. The operator can later edit any artifact path from the UI if the project structure changes (e.g., after a framework update). Once registered, the surface appears on the dashboard and is eligible for rule synchronization.

**Why this priority**: Surfaces are the targets of governance. Without registering them, no rules can be applied, synced, or monitored.

**Independent Test**: Can be tested by registering a project surface with custom artifact paths, confirming it appears on the dashboard, then editing an artifact path and verifying the update is persisted. Delivers surface management end-to-end.

**Acceptance Scenarios**:

1. **Given** the operator is on the surface registration form, **When** they enter name, select type "project", configure artifact paths, and submit, **Then** the surface appears on the dashboard with "pending" sync status.
2. **Given** a surface is already registered, **When** the operator edits an artifact path (e.g., changes `.cursor/rules` to `config/rules`), **Then** the change is saved and the surface sync status resets to "pending".
3. **Given** the operator submits the form with an empty surface name, **When** validation runs, **Then** an error message is displayed and the surface is not saved.
4. **Given** the operator submits the form with no artifact paths configured, **When** validation runs, **Then** the surface is saved with a warning that no artifacts are configured.

---

### User Story 4 - Create and Assign Particular Rules (Priority: P2)

An operator creates a particular rule that applies only to a specific governed surface. They choose whether the rule extends (adds content to), replaces (overrides entirely), or disables (suppresses) a specific standard rule for that surface. The operator can see at a glance which particular rules are active per surface and how they affect the standard rules. Particular rules are stored in the app's database, not in the canonical folder.

**Why this priority**: Particular rules provide the flexibility to adapt governance per surface without modifying the canonical source. P2 because canonical rules and surface registration must work first.

**Independent Test**: Can be tested by creating a particular rule that replaces a standard rule for one surface, leaving other surfaces unaffected, then confirming only that surface sees the replacement. Delivers per-surface rule customization.

**Acceptance Scenarios**:

1. **Given** a surface has a standard rule applied, **When** the operator creates a particular rule of type "replace" targeting that specific rule and surface, **Then** the surface's effective rule set shows the replacement instead of the standard rule.
2. **Given** a surface has a standard rule, **When** the operator creates a particular rule of type "disable" for that standard rule, **Then** the standard rule is not applied to that surface.
3. **Given** a surface has a standard rule, **When** the operator creates a particular rule of type "extend" with additional content, **Then** the surface's effective rule set includes both the standard content and the extension.
4. **Given** a particular rule exists for a surface, **When** the operator views the surface detail, **Then** the rule shows its type (extend/replace/disable) and the standard rule it affects.

---

### User Story 5 - Execute Sync from Canonical to Surfaces (Priority: P2)

An operator triggers a sync for one or all governed surfaces. The system reads the current canonical snapshot and the active rule set for each surface (standard + particular rules, with particular rules applied), detects whether the target artifacts need updating, and writes the effective rules to the configured artifact paths. If the target artifacts have been modified externally since the last sync, the system flags a conflict and does not overwrite. The operator resolves any conflicts manually and retries.

**Why this priority**: Sync is the mechanism that makes governance real — without it, rules exist only in the app. P2 because surface registration and rule management must be functional before sync can operate meaningfully.

**Independent Test**: Can be tested by configuring a surface with a test directory, editing a standard rule, triggering sync, and confirming the target artifact reflects the change. Then modifying the target artifact externally and confirming a conflict is flagged. Delivers the complete sync cycle.

**Acceptance Scenarios**:

1. **Given** a surface is registered and rules exist, **When** the operator clicks "sync" for that surface, **Then** the effective rules (standard + particular overrides) are written to the configured artifact paths on the target.
2. **Given** a sync is in progress, **When** the operator views the dashboard, **Then** the surface status shows "syncing" and the operator cannot trigger another sync until it completes.
3. **Given** the target artifact was modified externally after the last sync, **When** the operator triggers sync, **Then** the system flags a conflict, does not overwrite the file, and sets the surface status to "conflict".
4. **Given** a conflict exists, **When** the operator opens the conflict resolution view, **Then** they see the canonical version and the external version side-by-side, and can choose which to keep.

---

### User Story 6 - View Surface Detail and Sync History (Priority: P3)

An operator opens the detail view for a specific governed surface. They see: the current sync state, the list of all artifacts with their paths and status, the effective rule set (showing how particular rules modify standard rules), the sync history log, and the current version of each artifact compared to the canonical version. From this view they can trigger a sync, edit particular rules, or edit artifact paths.

**Why this priority**: Detail views enable deep diagnosis and fine-grained control. P3 because the dashboard overview and core sync workflows must be functional first.

**Independent Test**: Can be tested by navigating from the dashboard into a surface detail, confirming all sections render correctly (state, artifacts, effective rules, history), and performing a sync action from within the detail view.

**Acceptance Scenarios**:

1. **Given** a surface detail view is open, **When** the page loads, **Then** it shows sync state, artifact paths with status icons, effective rules list, and sync history table.
2. **Given** a sync history exists, **When** the operator views it, **Then** each entry shows timestamp, result (success/conflict/error), and the version used.
3. **Given** the surface has particular rules, **When** viewing effective rules, **Then** each rule shows whether it is standard, extended, replaced, or disabled, with clear visual indicators.

### Edge Cases

- What happens when an artifact path configured for a surface does not exist on the filesystem? The sync operation fails for that artifact with a clear error message; other artifacts sync normally.
- How does the system handle a surface that has been deleted externally (e.g., project folder removed)? The surface remains registered but shows "unreachable" status; the operator can remove it manually.
- What happens if the canonical "Reglas Estandar" folder is deleted or renamed? The system shows a critical error on the dashboard and does not create new snapshots until the folder is restored.
- How does the system handle two simultaneous changes to the same standard rule file? The polling cycle creates a single snapshot capturing the final state; both changes are reflected in that snapshot.
- What happens when a particular rule references a standard rule that no longer exists in the latest snapshot? The particular rule is flagged as "orphaned" and shown in the dashboard with a warning.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST use the "Reglas Estandar" folder as the single canonical source for all standard governance rules.
- **FR-002**: Every change detected in the canonical folder MUST create a new complete snapshot version capturing the full rule set.
- **FR-003**: The system MUST support three surface types: governed projects, installed dev applications, and AI agents with governable artifacts.
- **FR-004**: Each surface MUST allow configuring artifact paths from the UI (e.g., CLAUDE.md, AGENTS.md, .cursor/rules/).
- **FR-005**: Artifact paths MUST be editable after initial registration to accommodate structural changes.
- **FR-006**: The system MUST support three types of particular rules: extend (add content), replace (override entirely), and disable (suppress) specific standard rules for a specific surface.
- **FR-007**: Particular rules MUST be stored in the application database, NOT in the canonical "Reglas Estandar" folder.
- **FR-008**: The system MUST compute an "effective rule set" per surface by applying particular rules on top of the current canonical snapshot.
- **FR-009**: Sync MUST be strictly unidirectional: from the canonical source (standard rules + particular rules) toward governed surfaces.
- **FR-010**: The system MUST support adapter-based artifact management, starting with artifacts: CLAUDE.md, AGENTS.md, and .cursor/rules/ directory.
- **FR-011**: The adapter system MUST be extensible so new artifact types can be added without modifying core application code.
- **FR-012**: The system MUST detect changes in the canonical folder via configurable polling (default interval: 60 seconds).
- **FR-013**: The dashboard MUST display sync status, drift indication, conflict count, canonical version, and state per surface and per AI agent.
- **FR-014**: The system MUST detect external modifications to target artifacts and flag conflicts instead of overwriting.
- **FR-015**: Conflict resolution MUST be manual in V1 — the operator reviews the canonical vs. external version and chooses which to keep.
- **FR-016**: The system MUST surface orphaned particular rules (those referencing standard rules no longer in the latest snapshot) with a clear warning.
- **FR-017**: The system MUST show meaningful empty states: no surfaces registered, no rules in canonical folder, no sync history.
- **FR-018**: The system MUST validate required fields (surface name, at least one artifact path) before saving a surface.
- **FR-019**: The system MUST prevent triggering a sync for a surface that is already syncing.
- **FR-020**: The system MUST present the canonical version history as a browsable list with timestamps and the ability to diff any two versions.

### Key Entities

- **StandardRule**: A governance directive stored in the canonical "Reglas Estandar" folder. Applies globally to all governed surfaces unless modified by a particular rule.
- **CanonicalSnapshot**: An immutable, complete copy of the "Reglas Estandar" folder at a point in time. Created on every detected change. Includes version number, timestamp, and the full file tree.
- **Surface**: A governed entity — one of three types: project, dev application, or AI agent. Has configurable artifact paths that define where governance files are written.
- **ParticularRule**: A per-surface rule that extends, replaces, or disables a specific standard rule for that surface only. Stored in the application database, not in the canonical folder.
- **ArtifactConfig**: A mapping between a logical artifact name (e.g., "CLAUDE.md") and its configurable filesystem path for a given surface.
- **SyncOperation**: A record of a sync run, including timestamp, surface, canonical version used, per-artifact result (success/conflict/error), and error details if any.
- **SyncConflict**: Recorded when a target artifact has been modified externally since the last sync and the system cannot safely overwrite. Stores the canonical version and the external version for manual resolution.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The dashboard loads and displays all governed surfaces with correct status in under 2 seconds on a local environment with up to 50 surfaces.
- **SC-002**: A new canonical snapshot is created within 2x the configured polling interval after a change to the canonical folder (e.g., within 120 seconds at 60-second polling).
- **SC-003**: A surface can be registered with custom artifact paths and the changes are reflected on the dashboard immediately.
- **SC-004**: A particular rule (extend/replace/disable) takes effect on its target surface after the next sync and does not affect any other surface.
- **SC-005**: Sync conflicts are detected and reported when target artifacts have been externally modified — 100% of external modifications are detected before overwrite.
- **SC-006**: The system starts and is fully operational with a single Docker command (docker compose up) on a clean machine.
- **SC-007**: An operator can complete the primary governance workflow (register surface -> configure artifacts -> edit canonical rules -> create particular rule -> sync -> verify artifacts) with no errors on the first attempt after reading a quick-start guide.
- **SC-008**: Version history preserves every canonical snapshot — 100% of changes to the "Reglas Estandar" folder are captured as snapshots with timestamp and diff capability.

## Assumptions

- The "Reglas Estandar" folder path is configured via an environment variable or a settings file; it may be inside or outside the application directory.
- The application runs locally via Docker on a single machine; it does not serve multiple users concurrently in V1.
- The visual identity follows the At-Once design language (color palette, typography, component style) as defined in the project's design system.
- Governed surfaces are registered manually through the UI; auto-discovery of surfaces is out of scope for V1.
- Artifact paths are local filesystem paths (the app runs in Docker with volume mounts); remote targets are out of scope for V1.
- The system is single-tenant for V1; multi-tenancy and user authentication are out of scope.
- Standard rules are text-based governance files (markdown, yaml, or similar); they are not executable code.
- External modifications to target artifacts are detected by comparing file checksums or modification timestamps against the last sync record.
- The polling mechanism operates within a single Docker container; it does not need to scale across multiple instances in V1.
- An operator is a technical user (developer or DevOps) comfortable with Docker, filesystem paths, and basic governance concepts; no end-user training materials are required for V1.
