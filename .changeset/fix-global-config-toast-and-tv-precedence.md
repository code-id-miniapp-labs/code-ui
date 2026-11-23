---
"@code-id-labs/components": patch
"@code-id-labs/composables": patch
"@code-id-labs/plugin-vite": patch
---

Fix global `cui.config.ts` component overrides across `toast` and all components:
- Apply global `slots`/`ui`, `variants`, and `compoundVariants` overrides in `tv()` after built-in variants/compoundVariants (and before per-instance `ui`/`className`), with clean reset on config/HMR updates.
- Merge global `components.toast` (`defaultVariants`/`defaultProps`) in `ToastManager.add()` for `useToast()`, and replace hardcoded `z-[100]` / inline `z-index` on `toast` with `z-toast`.
- Assign a fresh object reference in `virtual:cui/config` and extract classes from both `ui.<component>` and `components.<component>` in `compileComponentTheme`.
