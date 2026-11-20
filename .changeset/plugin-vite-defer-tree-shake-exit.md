---
"@code-id-labs/plugin-vite": patch
---

Defer production tree-shaking to clean process exit under `weapp-vite` and remove unguarded `generateBundle` purging in watch mode so concurrent `weapp-vite` npm builds (`collectCopiedPackageRequests`) never hit `ENOENT`.
