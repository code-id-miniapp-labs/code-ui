---
"@code-id-labs/components": patch
---

Refactor `banner`, `file-upload`, and `form` state machines to use declarative `target` transitions (`OPEN`, guarded `SET_UPLOADING`, and form lifecycle events) and guard `file-upload` `setValue`/`hydrateLocalImages` against non-array file lists.
