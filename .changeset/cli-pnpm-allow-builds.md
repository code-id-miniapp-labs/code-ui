---
"@code-id-labs/cli": patch
---

- **cli**: Generate `pnpm-workspace.yaml` with pre-approved `allowBuilds` (pnpm v11) and `onlyBuiltDependencies` / `ignoredBuiltDependencies` (pnpm v10) so `pnpm install` and `pnpm dev` no longer fail with `[ERR_PNPM_IGNORED_BUILDS]` for `esbuild` / `@swc/core`. `init` also writes it for existing pnpm projects.
- **cli**: Add `tailwindcss` to starter `devDependencies` and use `bind:tap` on the starter button.
