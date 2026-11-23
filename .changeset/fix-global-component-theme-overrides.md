---
"@code-id-labs/components": patch
---

Fix global component theme overrides (`components.<name>` and `ui.<name>` in `cui.config.ts`) not taking effect in pre-built runtime components by tagging serialized theme configs with their component name and merging `globalThis.__CODE_UI_GLOBAL_CONFIG__` overrides inside `tv()`.
