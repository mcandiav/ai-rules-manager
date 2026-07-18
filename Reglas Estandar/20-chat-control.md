---
description: Chat and runtime control rules for pause and resume commands
alwaysApply: false
---

# Chat Control

- Chat control commands must be defined by the project.
- Commands must match exactly.
- Do not interpret arbitrary user text as a command unless the project explicitly allows it.
- Pause and resume should affect only the intended conversation.
- Keep the suspension behavior explicit and predictable.
- If a control command is unclear, ask for a capture or confirmation instead of guessing.