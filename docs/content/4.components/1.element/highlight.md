---
title: Highlight
description: Spotlight single or multiple substrings inline within text using semantic colors, variants, and search matching options.
---

## Overview

`c-highlight` highlights specific words or substrings inside a text block (such as search results, inline callouts, or emphasized terms) while preserving native MiniProgram multi-line inline text wrapping.

- **Tag**: `c-highlight`

## Usage

### Basic

Pass the full string via `text` and the substring to emphasize via `query`.

::code-group
```html [index.wxml]
<c-highlight
  text="With the Highlight component, you can spotlight and emphasize words."
  query="spotlight"
/>
```

```json [index.json]
{
  "usingComponents": {
    "c-highlight": "@code-id-labs/components/highlight/index"
  }
}
```
::

### Multiple Queries

Pass an array of strings to `query` to highlight multiple terms at once. Overlapping queries are matched longest-first automatically.

::code-group
```html [index.wxml]
<c-highlight
  text="With the Highlight component, you can spotlight and emphasize words."
  query="{{ queries }}"
  color="warning"
  variant="subtle"
/>
```

```ts [index.ts]
Page({
  data: {
    queries: ["spotlight", "emphasize"],
  },
});
```
::

### Variant

Use the `variant` prop to switch between `"soft"` (default), `"solid"`, `"subtle"`, `"outline"`, and `"text"`.

```html [index.wxml]
<c-highlight text="Soft variant highlight." query="Soft" variant="soft" />
<c-highlight text="Solid variant highlight." query="Solid" variant="solid" />
<c-highlight text="Subtle variant highlight." query="Subtle" variant="subtle" />
<c-highlight text="Outline variant highlight." query="Outline" variant="outline" />
<c-highlight text="Text variant highlight." query="Text" variant="text" />
```

### Color

Use the `color` prop with any configured semantic color (`"primary"`, `"secondary"`, `"success"`, `"warning"`, `"danger"`, `"info"`) or `"neutral"`.

```html [index.wxml]
<c-highlight text="Primary highlight" query="Primary" color="primary" />
<c-highlight text="Success highlight" query="Success" color="success" />
<c-highlight text="Warning highlight" query="Warning" color="warning" />
<c-highlight text="Danger highlight" query="Danger" color="danger" />
<c-highlight text="Neutral highlight" query="Neutral" color="neutral" />
```

### Matching Options

Control matching behavior with `ignoreCase` (default `true`), `matchAll` (default `true`), and `exactMatch` (default `false`).

```html [index.wxml]
<!-- Match whole words only ("light" will not match inside "Highlight") -->
<c-highlight
  text="Highlight the light in sunlight."
  query="light"
  exact-match="{{ true }}"
/>

<!-- Highlight only the first match, case-sensitively -->
<c-highlight
  text="Code code CODE"
  query="code"
  ignore-case="{{ false }}"
  match-all="{{ false }}"
/>
```

### Custom Styling

Use `ui` to override the `root`, `text`, or `mark` slots, or pass inline CSS via `markStyle`.

```html [index.wxml]
<c-highlight
  text="Build fast MiniProgram apps with Code UI."
  query="Code UI"
  ui="{{ { mark: 'rounded-full px-2 font-bold' } }}"
/>
```

### With `c-input-menu` (Search Highlight)

Compose `c-highlight` inside the default slot of `c-input-menu-item` to highlight matching search terms while keeping `c-input-menu` decoupled and tree-shakeable. Keep `label` and `description` on `c-input-menu-item` so built-in filtering and selection display continue to work automatically.

::code-group
```html [index.wxml]
<c-input-menu
  value="{{ value }}"
  search-term="{{ searchTerm }}"
  placeholder="Search bank or method..."
  clearable="{{ true }}"
  leading-icon="i-lucide-search"
  bind:change="onChange"
  bind:searchTermChange="onSearchTermChange"
>
  <c-input-menu-item
    wx:for="{{ items }}"
    wx:key="value"
    value="{{ item.value }}"
    label="{{ item.label }}"
    description="{{ item.description }}"
  >
    <view class="flex flex-col min-w-0">
      <c-highlight
        text="{{ item.label }}"
        query="{{ searchTerm }}"
        color="primary"
        variant="soft"
        size="sm"
        class-name="text-highlighted font-medium"
      />
      <c-highlight
        text="{{ item.description }}"
        query="{{ searchTerm }}"
        color="warning"
        variant="text"
        size="xs"
        class-name="text-muted"
      />
    </view>
  </c-input-menu-item>
</c-input-menu>
```

```ts [index.ts]
Page({
  data: {
    value: "",
    searchTerm: "",
    items: [
      {
        value: "bni-dd",
        label: "BNI Direct Debit",
        description: "Instant debit verification via OTP",
      },
      {
        value: "bca-va",
        label: "BCA Virtual Account",
        description: "Automatic virtual account transfer",
      },
    ],
  },

  onChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ value: e.detail.value });
  },

  onSearchTermChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ searchTerm: e.detail?.value ?? "" });
  },
});
```
::

## API

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | `""` | Source text to evaluate and render. |
| `query` | `string \| string[]` | `""` | Target substring or list of substrings to highlight. |
| `ignoreCase` | `boolean` | `true` | Perform case-insensitive matching. |
| `matchAll` | `boolean` | `true` | Highlight all occurrences (`true`) or only the first match (`false`). |
| `exactMatch` | `boolean` | `false` | Match whole words only. |
| `color` | `string` | `"primary"` | Semantic color applied to highlighted marks (`primary`, `secondary`, `danger`, `success`, `warning`, `info`, `neutral`, or custom theme colors). |
| `variant` | `"soft" \| "solid" \| "subtle" \| "outline" \| "text"` | `"soft"` | Visual style of highlighted marks. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Root font size (inherits parent typography when empty). |
| `rounded` | `boolean` | `true` | Applies rounded corners (`rounded-sm`) to highlighted marks (`rounded-none` when `false`). |
| `markStyle` | `string` | `""` | Optional inline CSS style applied to highlighted `mark` chunks. |
| `userSelect` | `boolean` | `false` | Enables native WeChat `<text user-select>` text selection. |
| `ui` | `{ root?: string; text?: string; mark?: string }` | `{}` | Per-slot Tailwind class overrides. |
| `className` | `string` | `""` | Additional root class override. |

## Theme

Configure global defaults in `cui.config.ts` under `components.highlight`:

```ts [cui.config.ts]
export default defineConfig({
  components: {
    highlight: {
      slots: {
        root: "inline font-sans text-default leading-relaxed",
        text: "",
        mark: "inline font-medium px-1 py-0.5 transition-colors",
      },
      defaultVariants: {
        color: "primary",
        variant: "soft",
        rounded: true,
      },
    },
  },
});
```
