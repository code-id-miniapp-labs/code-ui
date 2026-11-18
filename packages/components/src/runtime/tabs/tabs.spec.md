# `c-tabs` (`tabs`)

## Overview & Tier

- **Purpose**: Tabbed navigation container that coordinates a tab list and tab panels, supporting horizontal scrollable and vertical layouts, `pill` and `link` visual variants, and both data-driven (`items` prop) and declarative compound (`<c-tabs-item>` children) usage.
- **Architecture Tier**: **Tier 3 Domain** — backed by the `@code-ui/tabs` finite state machine (`tabsMachine`, `connectTabs`) via `createMachineBehavior` and linked to child items via the `withTabs()` domain relation plugin (`@code-ui/miniapp/behaviors/tabs`).
- **Compound Components**:
  - Parent container: `c-tabs` (`packages/components/src/runtime/tabs/`)
  - Child item: `c-tabs-item` (rendered automatically in `mode="trigger"` and `mode="panel"` when using `items`, or placed directly in the default slot in compound mode)

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| number \| null` | `null` | Controlled active tab value. |
| `defaultValue` | `string \| number \| null` | `null` | Initial active tab value when uncontrolled. |
| `items` | `Array<TabsItem \| string>` | `[]` | Data-driven tab definitions (strings or objects with `value`, `label`, `icon`, `trailingIcon`, `content`, `disabled`, `ui`, `id`, `slot`). |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Layout direction of the tab list and panels. Horizontal mode wraps the tab list in a scrollable `<scroll-view>`. |
| `variant` | `"pill" \| "link"` | `"pill"` | Visual style of the tab list container. |
| `color` | `"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info"` | `"primary"` | Accent color forwarded to `<c-tabs-item>` triggers and panels. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Size preset for the tab list and forwarded to child items. |
| `fitted` | `boolean` | `false` | Whether tab triggers stretch evenly to fill the full width of the tab list. |
| `disabled` | `boolean` | `false` | Disables interaction across the entire tabs component. |
| `loopFocus` | `boolean` | `true` | Whether sequential navigation (`selectNext` / `selectPrev`) wraps from the last tab to the first and vice versa. |
| `activationMode` | `"automatic" \| "manual"` | `"automatic"` | Controls whether focusing a tab immediately selects it (`"automatic"`) or requires explicit selection (`"manual"`). |
| `ui` | `TabsUI` (`Record<string, string>`) | `{}` | Per-slot class overrides merged via `resolveSlots`, and used as the fallback `ui` for items in `items` mode. |
| `class` (`className`) | `string` | `""` | Additional class string applied to the `root` slot (defined as `className` in component `properties`). |

> **Imperative Methods**: Component instances also expose `select(value)`, `setValue(value)`, `selectNext()`, `selectPrev()`, `selectFirst()`, and `selectLast()`.

## Slots

| Slot Name | Mode | Description |
| --- | --- | --- |
| `default` (`<slot />`) | Compound (`items` empty) | Renders declarative `<c-tabs-item>` child components inside `.cui-tabs-content`. Mutually exclusive with `items` mode (`wx:if="{{hasItems}}"` renders `items`; `<slot wx:else />` renders compound children). |
| `list-trailing` | Both | Appended at the end of the tab list (`cui-tabs-list`) in both horizontal and vertical orientations. |
| `leading-<value>` | Data-driven (`items`) | Forwarded into the `leading` slot of `<c-tabs-item mode="trigger">` for the item matching `<value>`. |
| `trailing-<value>` | Data-driven (`items`) | Forwarded into the `trailing` slot of `<c-tabs-item mode="trigger">` for the item matching `<value>`. |
| `<value>` | Data-driven (`items`) | Panel content slot inside `<c-tabs-item mode="panel">` for the item matching `<value>`. |

**MiniProgram `<slot>` Constraints**:
- WeChat MiniProgram `<slot>` is static (no scoped slots; `slots: { default: false, listTrailing: false }`).
- WeChat `<slot>` discards nested fallback content, so panel content in `items` mode uses conditional rendering: `<text wx:if="{{item.content}}">{{item.content}}</text><slot wx:else name="{{item.value}}" />`.

## Events

- **Direct `triggerEvent` in runtime**: None (the runtime handles child `<c-tabs-item>` `bind:select` events internally via `handleItemSelect` and forwards them to the machine).
- **Machine `onChange` callback** (`TabsProps` in `tabs.types.ts`): Receives `TabsValueChangeDetails` when the active tab changes:
  - `value`: `string | number` — Newly selected tab value.
  - `index`: `number` — Zero-based index of the newly selected tab.
  - `previousValue?`: `string | number` — Previously active tab value.

## Theme

Defined in `packages/core/src/theme/definitions/tabs.ts`:

- **Slots**:
  - `root`: Base container (`w-full flex gap-3`)
  - `scroll`: Horizontal `<scroll-view>` wrapper (`cui-tabs-scroll w-full shrink-0`)
  - `itemWrapper`: Wrapper around each horizontal trigger (`flex flex-row`)
  - `list`: Tab list container (`relative flex group flex-nowrap whitespace-nowrap box-border`)
  - `content`: Tab panels container (`focus:outline-none flex-1 min-w-0`)
- **Variants**:
  - `variant`: `"pill"` | `"link"`
  - `orientation`: `"horizontal"` | `"vertical"`
  - `size`: `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"` (adjusts `pill` list padding, gap, and border radius via `compoundVariants`)
  - `disabled`: `true` | `false`
  - `fitted`: `true` | `false`
  - **Compound variant**: `variant: "link"` + `orientation: "vertical"` applies right border and vertical gap styling to `list`.
- **Default Variants**:
  - `variant`: `"pill"`
  - `orientation`: `"horizontal"`
  - `size`: `"md"`
  - `disabled`: `false`
  - `fitted`: `false`

## Examples

### Data-Driven Mode (`items` prop + named slots)

```html
<c-tabs
  items="{{tabItems}}"
  defaultValue="account"
  variant="pill"
  size="md"
  fitted="{{true}}"
>
  <view slot="account">Account settings content</view>
  <view slot="password">Password settings content</view>
  <view slot="list-trailing">Extra action</view>
</c-tabs>
```

```ts
Page({
  data: {
    tabItems: [
      { value: "account", label: "Account" },
      { value: "password", label: "Password" },
    ],
  },
});
```

### Declarative Compound Mode (`<c-tabs-item>` children)

```html
<c-tabs defaultValue="overview" variant="link" orientation="horizontal">
  <c-tabs-item value="overview" label="Overview">
    <view>Overview panel content</view>
  </c-tabs-item>
  <c-tabs-item value="analytics" label="Analytics" disabled="{{true}}">
    <view>Analytics panel content</view>
  </c-tabs-item>
</c-tabs>
```
