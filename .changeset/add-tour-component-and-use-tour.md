---
"@code-id-labs/core": minor
"@code-id-labs/compiler": minor
"@code-id-labs/components": minor
"@code-id-labs/composables": minor
"@code-id-labs/plugin-vite": minor
---

Add `<c-tour>` guided product tour component and `useTour` composable:

- `@code-id-labs/core`: Add `tourTheme` with Nuxt UI v4 semantic colors, `xs`–`lg` sizes, `border-2 border-solid` spotlight outline, directional arrow variants, and `zIndex.tour` config typing.
- `@code-id-labs/compiler`: Register `tour` slots (`default`, `header`, `title`, `description`, `close`, `footer`, `progress`, `actions`) in `COMPONENT_SLOTS_MANIFEST`.
- `@code-id-labs/components`: Add Tier 2 `<c-tour>` component backed by `@code-id-labs/tour` FSM supporting `tooltip`, `dialog`, `floating`, and `wait` steps, rounded spotlight cutout with automatic target `border-radius` detection (`spotlightRadius: null`), `wx.pageScrollTo` auto-scrolling, viewport collision flipping, interactive pass-through / `preventInteraction` locking, step-scoped `effect()` with cleanup, `<root-portal>` rendering, and exported machine API.
- `@code-id-labs/composables`: Add `useTour()` composable with live `<c-tour>` binding via `selector` (safe queued `start()`/`startOnce()` in `onLoad`), controlled data syncing, lifecycle callbacks, and `storageKey`-backed one-time onboarding persistence.
- `@code-id-labs/plugin-vite`: Add `z-tour` (`10135`) default z-index token, `tour: ["button", "icon"]` dependency tracking, and build-time `tour` theme syncing.
