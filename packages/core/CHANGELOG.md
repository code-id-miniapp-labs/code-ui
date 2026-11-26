# @code-id-labs/core

## 0.1.0

### Minor Changes

- 5210f42: Add `<c-tour>` guided product tour component and `useTour` composable:

  - `@code-id-labs/core`: Add `tourTheme` with Nuxt UI v4 semantic colors, `xs`–`lg` sizes, `border-2 border-solid` spotlight outline, directional arrow variants, and `zIndex.tour` config typing.
  - `@code-id-labs/compiler`: Register `tour` slots (`default`, `header`, `title`, `description`, `close`, `footer`, `progress`, `actions`) in `COMPONENT_SLOTS_MANIFEST`.
  - `@code-id-labs/components`: Add Tier 2 `<c-tour>` component backed by `@code-id-labs/tour` FSM supporting `tooltip`, `dialog`, `floating`, and `wait` steps, rounded spotlight cutout with automatic target `border-radius` detection (`spotlightRadius: null`), `wx.pageScrollTo` auto-scrolling, viewport collision flipping, interactive pass-through / `preventInteraction` locking, step-scoped `effect()` with cleanup, `<root-portal>` rendering, and exported machine API.
  - `@code-id-labs/composables`: Add `useTour()` composable with live `<c-tour>` binding via `selector` (safe queued `start()`/`startOnce()` in `onLoad`), controlled data syncing, lifecycle callbacks, and `storageKey`-backed one-time onboarding persistence.
  - `@code-id-labs/plugin-vite`: Add `z-tour` (`10135`) default z-index token, `tour: ["button", "icon"]` dependency tracking, and build-time `tour` theme syncing.

### Patch Changes

- 710e4f9: Add `<c-highlight>` component for spotlighting single or multiple matching substrings inline:

  - `@code-id-labs/core`: Add `highlightTheme` (`root`, `text`, `mark` slots) with `soft`, `solid`, `subtle`, `outline`, and `text` variants, semantic color palette + `neutral`, optional `size` (`xs`–`xl`), and `rounded` toggle.
  - `@code-id-labs/components`: Add Tier 1 presentational `<c-highlight>` component with co-located tree-shakeable `highlightWords()` utility supporting single/multi-term `query`, `ignoreCase`, `matchAll`, `exactMatch`, `markStyle`, `userSelect`, `ui`, and `className`, rendered with nested `<text>` for native multi-line inline wrapping.
  - `@code-id-labs/plugin-vite`: Rebuild to include `highlight` in `componentThemes` for build-time theme compilation and global overrides.

## 0.0.3

### Patch Changes

- 23a0e14: Add a globally configurable `placeholder` theme slot to `<c-input>` and remove the redundant `placeholderClass` prop:

  - `@code-id-labs/core`: Add `placeholder: "text-dimmed"` slot to `inputTheme`.
  - `@code-id-labs/components`: Bind `placeholder-class="{{classes.placeholder}}"` on `<c-input>` and remove `placeholderClass` so placeholder styling is configured consistently via `cui.config.ts` (`components.input.slots.placeholder`) or per-instance `ui.placeholder` with Tailwind class deduplication.

## 0.0.2

### Patch Changes

- 97e4768: Fix virtual keyboard positioning in `<c-drawer>` using WXS and add `adjustPosition` to `<c-pin-input>`:

  - `@code-id-labs/drawer`: Move bottom drawer keyboard lift from JS `padding-bottom` to view-thread WXS `change:keyboardHeight` using GPU-composited `transform: translate3d(0, -<height>px, 0)` that composes cleanly with swipe-to-dismiss drag gestures.
  - `@code-id-labs/core`: Remove layout-thrashing `transition-[padding-bottom]` from `drawer` theme `root` slot.
  - `@code-id-labs/components`: Bind `keyboardHeight` / `change:keyboardHeight` on `<c-drawer>` content and add `adjustPosition` (`adjust-position`) property to `<c-pin-input>` so inputs inside `<c-drawer>` can disable native viewport shifting (`adjust-position="{{ false }}"`) and avoid double-offsetting.
