# Feature Specification: AI Rules Manager Foundation

**Feature Branch**: `001-ai-rules-manager`

**Created**: 2026-07-17

**Status**: Draft

**Input**: User description: "Construir la base de AI Rules Manager como app web local en Docker para gobernar reglas estándar y particulares sobre proyectos, aplicaciones dev y agentes de IA, con dashboard, versionado canónico, adaptadores, SQLite, Fastify, Vue e identidad visual At-Once."

## User Scenarios & Testing

### User Story 1 - Browse Rules Dashboard (Priority: P1)

An operator opens the AI Rules Manager dashboard and sees an overview of all governance rules. They can filter by rule type (standard vs. particular), see which targets (projects, apps, agents) each rule applies to, and quickly assess whether rules are active, draft, or deprecated.

**Why this priority**: The dashboard is the entry point and primary navigation layer. Without it, users cannot discover, inspect, or act on rules.

**Independent Test**: Can be fully tested by deploying the app, navigating to the dashboard URL, and confirming the rules list renders with type filters and status indicators. Delivers immediate visibility into the governed rule base.

**Acceptance Scenarios**:

1. **Given** the user opens the dashboard, **When** the page loads, **Then** a list of all registered rules is displayed with title, type (standard/particular), status, and target count.
2. **Given** the dashboard is displayed, **When** the user selects a filter by type (standard), **Then** only standard rules are shown.
3. **Given** the dashboard is displayed, **When** the user selects a status filter (active), **Then** only active rules are shown.
4. **Given** no rules exist yet, **When** the dashboard loads, **Then** an empty state message with a call-to-action to create the first rule is shown.

---

### User Story 2 - Create and Manage Rules (Priority: P1)

An operator creates a new governance rule, specifying whether it is a standard rule (applies to all targets broadly) or a particular rule (applies to specific projects, apps, or agents). They define the rule content, assign targets, and publish it. Once published, the rule becomes active and visible in the dashboard.

**Why this priority**: The core value proposition of the system is creating and applying rules. Without this capability, there is nothing to govern.

**Independent Test**: Can be fully tested by creating a rule through a form, saving it, and confirming it appears in the dashboard with the correct type, status, and target assignments. Delivers the primary workflow end-to-end.

**Acceptance Scenarios**:

1. **Given** the user is on the rule creation page, **When** they fill in title, content, select type (standard), and submit, **Then** the rule is saved as "draft" status and appears in the dashboard.
2. **Given** a rule exists in draft status, **When** the user edits it and sets status to "active", **Then** the rule becomes published and visible with active badge on the dashboard.
3. **Given** the user is creating a particular rule, **When** they select one or more targets (projects, apps, agents) for the rule, **Then** the rule is associated with those specific targets only.
4. **Given** the user submits a rule with an empty title, **When** validation runs, **Then** an error message is displayed and the rule is not saved.

---

### User Story 3 - Inspect Rule Version History (Priority: P2)

An operator opens a rule's detail view and sees the complete version history. Each version shows who made the change, when, and what changed. The operator can compare any two versions side-by-side or restore a previous version.

**Why this priority**: Canonical versioning is a named requirement and critical for auditability. Without it, changes to rules are untraceable and rollbacks are impossible. P2 because the core CRUD must come first.

**Independent Test**: Can be tested by creating a rule, editing it multiple times, then viewing the version history page, comparing two versions, and restoring a previous version. Delivers full audit trail capability.

**Acceptance Scenarios**:

1. **Given** a rule has been edited three times, **When** the operator opens the version history, **Then** three versions are listed with timestamps and summary of changes.
2. **Given** the version history is displayed, **When** the user selects two versions, **Then** a side-by-side diff of the rule content is shown.
3. **Given** the version history, **When** the user clicks "restore" on a previous version, **Then** that version becomes the current version and a new version entry is created logging the restoration.

---

### User Story 4 - Assign Rules via Adapters (Priority: P2)

An operator configures an adapter that connects the AI Rules Manager to an external target (project repository, development application, or AI agent). Once connected, rules assigned to that target are automatically applied or enforced through the adapter. The operator can see which adapters are online and their last sync status.

**Why this priority**: Adapters enable the system to actually enforce rules beyond the dashboard. Without adapters, rules exist only inside the app. P2 because static rule management (US1, US2) must be functional before enforcement.

**Independent Test**: Can be tested by creating a generic adapter endpoint, assigning rules to it, triggering a sync, and confirming the adapter received the expected rule data.

**Acceptance Scenarios**:

1. **Given** the operator wants to connect a new target, **When** they configure an adapter with a name and target type, **Then** the adapter appears in the dashboard with "disconnected" status.
2. **Given** an adapter is configured, **When** the operator triggers a sync, **Then** the assigned rules are delivered to the target and the adapter status changes to "online".
3. **Given** an adapter fails to sync, **When** the operator views the adapter detail, **Then** the last error message and timestamp are displayed.

---

### User Story 5 - System Administration (Priority: P3)

A system administrator manages user access, views audit logs of all rule changes, and monitors system health. They can see which users made which changes and when.

**Why this priority**: Administration is essential for production readiness but the core governance features (rules, dashboard, adapters) must exist first. P3 as MVP can operate without granular admin features.

**Independent Test**: Can be tested by creating multiple user sessions, making rule changes, and verifying the audit log captures each change with user attribution.

**Acceptance Scenarios**:

1. **Given** the admin opens the audit log, **When** they view the log, **Then** each entry shows timestamp, user, action, and rule affected.
2. **Given** the admin is on the system health page, **When** they check the status, **Then** database connectivity and adapter connection status are shown.

### Edge Cases

- What happens when a rule is deleted that is assigned to active adapters? The rule should be soft-deleted and adapters should be notified.
- How does the system handle concurrent edits to the same rule? Last-writer-wins with version history capturing both versions as separate entries.
- What happens when a target is no longer reachable through its adapter? The adapter status changes to "error" and a dashboard notification is shown.
- How does the system behave when the database is unavailable? A maintenance page with a clear error message and retry mechanism should be shown.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST display a dashboard showing all rules with type (standard/particular), status, and target count.
- **FR-002**: The system MUST allow users to create rules with a title, description, content body, type selector (standard/particular), and target assignment.
- **FR-003**: The system MUST support rule lifecycle statuses: draft, active, deprecated, and archived.
- **FR-004**: The system MUST preserve a complete version history for every rule change, including timestamp and a summary of what changed.
- **FR-005**: The system MUST allow users to view a side-by-side comparison of any two versions of a rule.
- **FR-006**: The system MUST allow users to restore any previous version of a rule, creating a new version entry for the restoration event.
- **FR-007**: The system MUST support configurable adapters that connect to external targets (projects, dev applications, AI agents).
- **FR-008**: The system MUST deliver assigned rules to each adapter on demand or on a configurable schedule.
- **FR-009**: The system MUST display adapter status (online, disconnected, error) and last sync time on the dashboard.
- **FR-010**: The system MUST support filtering rules by type (standard, particular), status, and target.
- **FR-011**: The system MUST support an audit log that records all rule and adapter state changes with user attribution and timestamp.
- **FR-012**: The system MUST show a meaningful empty state when no rules exist.
- **FR-013**: The system MUST validate rule titles as required (non-empty) before saving.
- **FR-014**: The system MUST soft-delete rules so that version history and adapter notifications are preserved.
- **FR-015**: The system MUST gracefully handle database unavailability by displaying a maintenance page.

### Key Entities

- **Rule**: Governance directive with type (standard or particular), status lifecycle, content body, and version chain. Standard rules apply broadly; particular rules target specific entities.
- **RuleVersion**: Immutable snapshot of a rule's content at a point in time, linked to a parent rule, with timestamp and change summary.
- **Target**: An external entity (project, development application, or AI agent) that rules can be assigned to. Identified by name and type.
- **Adapter**: A configurable connector that bridges a target to the AI Rules Manager. Responsible for delivering assigned rules and reporting connectivity status.
- **AuditEntry**: Immutable record of a state change (rule created, rule edited, adapter synced, etc.) with user, timestamp, and action detail.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The dashboard loads and displays all rules in under 2 seconds on a local environment with up to 500 rules.
- **SC-002**: A user can create a new rule and see it on the dashboard in under 3 minutes for first-time users.
- **SC-003**: Version history preserves every edit — 100% of rule changes are traceable with timestamp and change summary.
- **SC-004**: Adapters can be configured and connected to targets without modifying core application code.
- **SC-005**: The system starts and is fully operational with a single Docker command (docker compose up) on a clean machine.
- **SC-006**: Users successfully complete the primary workflow (view dashboard -> create rule -> assign to target -> publish) with no errors 95% of the time.

## Assumptions

- The application runs locally via Docker; external users do not need direct internet access to use it.
- The visual identity follows the At-Once design language (color palette, typography, component style) as defined in the project's design system.
- Standard rules apply globally to all targets; particular rules apply only to explicitly assigned targets.
- Rules are governance policies (text-based directives, checklists, or constraints) — not executable code or scripts.
- Target entities (projects, apps, agents) are registered manually through adapters; auto-discovery is out of scope for v1.
- The system is single-tenant for v1; multi-tenancy is out of scope.
- Authentication is handled via a simple local access mechanism (e.g., environment variable token or single-user mode) for initial deployment; full auth is out of scope for v1.
- The constitution document is expected to be ratified in a separate workflow; governance principles from it will inform rule content but are not implemented as code in this feature.
