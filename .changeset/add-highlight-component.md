---
"@code-id-labs/core": patch
"@code-id-labs/components": patch
"@code-id-labs/plugin-vite": patch
---

Add `<c-highlight>` component for spotlighting single or multiple matching substrings inline:

- `@code-id-labs/core`: Add `highlightTheme` (`root`, `text`, `mark` slots) with `soft`, `solid`, `subtle`, `outline`, and `text` variants, semantic color palette + `neutral`, optional `size` (`xs`–`xl`), and `rounded` toggle.
- `@code-id-labs/components`: Add Tier 1 presentational `<c-highlight>` component with co-located tree-shakeable `highlightWords()` utility supporting single/multi-term `query`, `ignoreCase`, `matchAll`, `exactMatch`, `markStyle`, `userSelect`, `ui`, and `className`, rendered with nested `<text>` for native multi-line inline wrapping.
- `@code-id-labs/plugin-vite`: Rebuild to include `highlight` in `componentThemes` for build-time theme compilation and global overrides.
