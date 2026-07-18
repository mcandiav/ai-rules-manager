---
description: Version source and release traceability rules
alwaysApply: true
---

# Versioning Rules

- `VERSION` is the single source of truth for product version.
- Update `VERSION` only through the release flow defined by the project.
- Do not hardcode version strings in code.
- Do not use `APP_VERSION` in `.env` unless the project explicitly requires it.
- If the project uses deploy branches, bump the version on each release so the deployed UI can be traced and cache-busted correctly.
- Keep release metadata and code changes aligned.