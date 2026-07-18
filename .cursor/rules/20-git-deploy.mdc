---
description: Commits and push only on deploy branches, with clean deployment history
alwaysApply: true
---

# Git, Versioning, and Deploy

- Cada detalle de deploy debe registrarse como APP_VERSION@GIT_HASH — descripción breve y concreta de lo que este deploy incorpora, corrige o modifica, usando el hash del commit exacto desplegado.
- `main` does not deploy anything.
- Never commit, push, or merge to `main` unless explicitly requested.
- Front changes go to `http`.
- API changes go to `api`.
- Commit and push go together on the deploy branch.
- Work directly on the branch that deploys.
- Use one-line commit subjects only.
- Keep deployment history clean.
- Do not use interactive git flags.
- Do not use `--no-verify` unless explicitly requested.
- Do not push secrets or credentials.
