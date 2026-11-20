---
"@code-id-labs/cli": patch
---

- **cli**: Generate `pnpm-workspace.yaml` (with `allowBuilds` for pnpm v11 and `onlyBuiltDependencies` / `ignoredBuiltDependencies` for pnpm v10) only when using `pnpm` so `pnpm install` and `pnpm dev` work out of the box without `[ERR_PNPM_IGNORED_BUILDS]` (skipped for `npm` and `yarn`).
- **cli**: Add `tailwindcss` to starter `devDependencies` and use `bind:tap` on the starter button.
