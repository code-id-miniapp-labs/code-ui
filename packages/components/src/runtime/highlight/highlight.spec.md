# Highlight (`c-highlight`)

## Overview & Tier

- **Component Tag**: `<c-highlight>`
- **Architecture Tier**: **Tier 1 — Presentational** (no FSM machine; imports strictly from `../_shared/base`).
- **Purpose**: Highlights specific words or substrings within a text string (such as search results, emphasized keywords, or inline callouts) using semantic Code UI colors, variants, and slot overrides while preserving native MiniProgram inline multi-line text wrapping.

---

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | `""` | Source text to evaluate and render. |
| `query` | `string \| string[]` | `""` | Target substring or list of substrings to highlight within `text`. |
| `ignoreCase` | `boolean` | `true` | Perform case-insensitive matching. |
| `matchAll` | `boolean` | `true` | Highlight all occurrences (`true`) or only the first match (`false`). |
| `exactMatch` | `boolean` | `false` | Match whole words only (word boundaries around word-character edges). |
| `color` | `"primary" \| "secondary" \| "danger" \| "success" \| "warning" \| "info" \| "neutral" \| (string & {})` | `"primary"` | Semantic color palette applied to highlighted marks. |
| `variant` | `"soft" \| "solid" \| "subtle" \| "outline" \| "text"` | `"soft"` | Visual style applied to highlighted marks. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Text size applied to the `root` slot (empty inherits parent font size). |
| `rounded` | `boolean` | `true` | Applies rounded corners (`rounded-sm`) to highlighted marks (`rounded-none` when `false`). |
| `markStyle` | `string` | `""` | Optional inline CSS style applied to highlighted `mark` chunks. |
| `userSelect` | `boolean` | `false` | Enables native WeChat `<text user-select>` text selection. |
| `ui` | `Partial<Record<"root" \| "text" \| "mark", string>>` | `{}` | Per-slot class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Additional class applied to the `root` slot. |

---

## Slots

`c-highlight` renders inline `<text>` chunks directly from `text` and `query` to preserve native WeChat multi-line inline wrapping and exposes no `<slot>` elements.

---

## Events

None (presentational component).

---

## Theme

Defined in `packages/core/src/theme/definitions/highlight.ts` (`virtual:cui/theme/highlight`).

### Slots

- `root` — Outer inline `<text>` container (`inline font-sans text-default leading-relaxed`).
- `text` — Unmatched plain text chunk (`""`).
- `mark` — Highlighted matching text chunk (`inline font-medium px-1 py-0.5 transition-colors`).

### Variants

- `color`: `primary` | `secondary` | `danger` | `success` | `warning` | `info` | `neutral` (plus custom configured theme colors)
- `variant`: `soft` | `solid` | `subtle` | `outline` | `text`
- `size`: `xs` | `sm` | `md` | `lg` | `xl`
- `rounded`: `true` | `false`

### Default Variants

- `color`: `"primary"`
- `variant`: `"soft"`
- `rounded`: `true`

---

## Examples

### Basic Highlight (WXML)

```xml
<c-highlight
  text="With the Highlight component, you can spotlight and emphasize words."
  query="spotlight"
/>
```

### Multiple Queries & Custom Styling (WXML + TS)

```xml
<c-highlight
  text="With the Highlight component, you can spotlight and emphasize words."
  query="{{ queries }}"
  color="warning"
  variant="subtle"
  ui="{{ { mark: 'font-semibold px-1.5 rounded-full' } }}"
/>
```

```ts
Page({
  data: {
    queries: ["spotlight", "emphasize"],
  },
});
```
