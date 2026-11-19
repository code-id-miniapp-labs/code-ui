# @code-ui/cli

## 1.0.2

### Patch Changes

- ac0073d: - **cli**: Generate `pnpm-workspace.yaml` with pre-approved `allowBuilds` (pnpm v11) and `onlyBuiltDependencies` / `ignoredBuiltDependencies` (pnpm v10) so `pnpm install` and `pnpm dev` no longer fail with `[ERR_PNPM_IGNORED_BUILDS]` for `esbuild` / `@swc/core`. `init` also writes it for existing pnpm projects.
  - **cli**: Add `tailwindcss` to starter `devDependencies` and use `bind:tap` on the starter button.

## 1.0.1

## 2.0.0

### Major Changes

- Initial v1.0.0 public release with prebuilt MiniProgram UI components, Vite plugin (with built-in Lucide icons), CLI scaffolding, and composables (useToast, useComponentRef, useColorMode).

## 1.0.0

### Major Changes

- Initial v1.0.0 public release with prebuilt MiniProgram UI components, Vite plugin (with built-in Lucide icons), CLI scaffolding, and composables (useToast, useComponentRef, useColorMode).
