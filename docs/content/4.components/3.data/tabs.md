---
title: Tabs
description: Tabbed navigation container that coordinates a tab list and tab panels, supporting horizontal scrollable and vertical layouts, pill and link visual variants, and both data-driven and declarative compound usage.
---

## Overview

`c-tabs` is a tabbed navigation container that coordinates a tab list and tab panels. It supports horizontal scrollable and vertical layouts, `pill` and `link` visual variants, and both data-driven (`items` prop) and declarative compound (`<c-tabs-item>` children) usage.

- **Parent**: `c-tabs`
- **Child**: `c-tabs-item` (rendered automatically in `mode="trigger"` and `mode="panel"` when using `items`, or placed directly inside the default slot in compound mode)
- **Imperative Methods**: `select(value)`, `setValue(value)`, `selectNext()`, `selectPrev()`, `selectFirst()`, `selectLast()`

## Usage

### Basic

Use the `items` prop with strings or `TabsItem` objects (`value`, `label`, `content`) and set `defaultValue` for uncontrolled selection.

::code-group

```html [index.wxml]
<c-tabs items="{{items}}" defaultValue="account" />
```

```ts [index.ts]
Page({
  data: {
    items: [
      { value: "account", label: "Account", content: "Make changes to your account here." },
      { value: "password", label: "Password", content: "Change your password here." },
    ],
  },
});
```

::

### Compound Mode

Omit `items` and pass `<c-tabs-item>` children inside the default slot to compose triggers and panels declaratively.

```html
<c-tabs defaultValue="overview">
  <c-tabs-item value="overview" label="Overview">
    <view>Overview panel content</view>
  </c-tabs-item>
  <c-tabs-item value="analytics" label="Analytics">
    <view>Analytics panel content</view>
  </c-tabs-item>
</c-tabs>
```

### Color

Use the `color` prop (`"primary"`, `"neutral"`, `"danger"`, `"success"`, `"warning"`, or `"info"`) to set the accent color forwarded to tab triggers and panels.

::code-group

```html [index.wxml]
<c-tabs items="{{items}}" defaultValue="account" color="neutral" />
<c-tabs items="{{items}}" defaultValue="account" color="success" />
```

```ts [index.ts]
Page({
  data: {
    items: ["account", "password"],
  },
});
```

::

### Variant

Use the `variant` prop to switch between `"pill"` (default) and `"link"` styles.

::code-group

```html [index.wxml]
<c-tabs items="{{items}}" defaultValue="account" variant="pill" />
<c-tabs items="{{items}}" defaultValue="account" variant="link" />
```

```ts [index.ts]
Page({
  data: {
    items: ["account", "password"],
  },
});
```

::

### Size

Use the `size` prop (`"xs"`, `"sm"`, `"md"`, `"lg"`, or `"xl"`) to adjust the tab list and child trigger sizing.

::code-group

```html [index.wxml]
<c-tabs items="{{items}}" defaultValue="account" size="xs" />
<c-tabs items="{{items}}" defaultValue="account" size="md" />
<c-tabs items="{{items}}" defaultValue="account" size="xl" />
```

```ts [index.ts]
Page({
  data: {
    items: ["account", "password"],
  },
});
```

::

### Orientation

Use the `orientation` prop to display tabs horizontally (default, wrapped in a scrollable `<scroll-view>`) or vertically beside the panel content.

::code-group

```html [index.wxml]
<c-tabs
  items="{{items}}"
  defaultValue="account"
  orientation="vertical"
  variant="link"
/>
```

```ts [index.ts]
Page({
  data: {
    items: [
      { value: "account", label: "Account", content: "Account settings" },
      { value: "password", label: "Password", content: "Password settings" },
    ],
  },
});
```

::

### Fitted

Set `fitted="{{true}}"` to stretch tab triggers evenly across the full width of the tab list.

::code-group

```html [index.wxml]
<c-tabs items="{{items}}" defaultValue="account" fitted="{{true}}" />
```

```ts [index.ts]
Page({
  data: {
    items: [
      { value: "account", label: "Account", content: "Account settings" },
      { value: "password", label: "Password", content: "Password settings" },
    ],
  },
});
```

::

### Icons

Pass `icon` and `trailingIcon` in `items` definitions (or on `<c-tabs-item>`) to render leading and trailing icons in tab triggers.

::code-group

```html [index.wxml]
<c-tabs items="{{items}}" defaultValue="account" />
```

```ts [index.ts]
Page({
  data: {
    items: [
      { value: "account", label: "Account", icon: "user", content: "Account details" },
      { value: "security", label: "Security", icon: "lock", trailingIcon: "chevron-right", content: "Security details" },
    ],
  },
});
```

::

### Disabled

Set `disabled="{{true}}"` on `c-tabs` to disable the entire component, or set `disabled: true` on individual items.

::code-group

```html [index.wxml]
<!-- Disable the entire tabs group -->
<c-tabs items="{{items}}" defaultValue="account" disabled="{{true}}" />

<!-- Disable a single item -->
<c-tabs items="{{partialItems}}" defaultValue="account" />
```

```ts [index.ts]
Page({
  data: {
    items: ["account", "password"],
    partialItems: [
      { value: "account", label: "Account", content: "Account settings" },
      { value: "billing", label: "Billing", disabled: true, content: "Billing settings" },
    ],
  },
});
```

::

### Controlled

Use the `value` prop to control the active tab externally from page state. Note that `c-tabs` handles child selection internally and does not emit custom runtime `triggerEvent` events.

::code-group

```html [index.wxml]
<c-tabs value="{{activeTab}}" items="{{items}}" />
<c-button label="Switch to Password" bind:tap="switchToPassword" />
```

```ts [index.ts]
Page({
  data: {
    activeTab: "account",
    items: [
      { value: "account", label: "Account", content: "Account settings" },
      { value: "password", label: "Password", content: "Password settings" },
    ],
  },

  switchToPassword() {
    this.setData({ activeTab: "password" });
  },
});
```

::

### Imperative Methods & Navigation

Access the component instance with `selectComponent` to call `select(value)`, `setValue(value)`, `selectNext()`, `selectPrev()`, `selectFirst()`, or `selectLast()`. Configure sequential wrapping with `loopFocus` (default `true`) and focus behavior with `activationMode` (`"automatic"` or `"manual"`).

::code-group

```html [index.wxml]
<c-tabs
  id="tabs"
  items="{{items}}"
  defaultValue="account"
  loopFocus="{{false}}"
  activationMode="manual"
/>
<c-button label="Next Tab" bind:tap="onNext" />
```

```ts [index.ts]
Page({
  data: {
    items: [
      { value: "account", label: "Account", content: "Account settings" },
      { value: "password", label: "Password", content: "Password settings" },
      { value: "billing", label: "Billing", content: "Billing settings" },
    ],
  },

  onNext() {
    const tabs = this.selectComponent("#tabs");
    tabs?.selectNext();
  },
});
```

::

### Slots

In `items` mode, use `<value>` slots for custom panel content, `leading-<value>` / `trailing-<value>` slots for trigger embellishments, and `list-trailing` to append content at the end of the tab list.

::code-group

```html [index.wxml]
<c-tabs items="{{items}}" defaultValue="account">
  <view slot="leading-account">*</view>
  <view slot="trailing-password">New</view>
  <view slot="account">Custom account panel content</view>
  <view slot="password">Custom password panel content</view>
  <view slot="list-trailing">Extra action</view>
</c-tabs>
```

```ts [index.ts]
Page({
  data: {
    items: [
      { value: "account", label: "Account" },
      { value: "password", label: "Password" },
    ],
  },
});
```

::

### Custom Styling

Use `ui` to override theme slots (`root`, `scroll`, `itemWrapper`, `list`, `content`) and `className` to append classes to the `root` slot.

::code-group

```html [index.wxml]
<c-tabs
  items="{{items}}"
  defaultValue="account"
  ui="{{ { list: 'bg-muted p-2', content: 'pt-4' } }}"
  className="my-4"
/>
```

```ts [index.ts]
Page({
  data: {
    items: [
      { value: "account", label: "Account", content: "Account settings" },
      { value: "password", label: "Password", content: "Password settings" },
    ],
  },
});
```

::

## State Machine

Click any active transition or event button below to simulate the `tabs` state machine live:

::machine-visualizer{name="tabs"}
::

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

## Slots

| Name | Mode | Description |
| --- | --- | --- |
| `default` | Compound (`items` empty) | Renders declarative `<c-tabs-item>` child components inside the panels container. Mutually exclusive with `items`. |
| `list-trailing` | Both | Appended at the end of the tab list in both horizontal and vertical orientations. |
| `leading-<value>` | Data-driven (`items`) | Forwarded into the `leading` slot of `<c-tabs-item mode="trigger">` for the item matching `<value>`. |
| `trailing-<value>` | Data-driven (`items`) | Forwarded into the `trailing` slot of `<c-tabs-item mode="trigger">` for the item matching `<value>`. |
| `<value>` | Data-driven (`items`) | Panel content slot inside `<c-tabs-item mode="panel">` for the item matching `<value>`. |

## Events

Listen to active tab changes using WeChat MiniProgram event bindings (`e.detail` contains the event payload):

| Event | Payload | Description |
| --- | --- | --- |
| `bind:change` | `{ value: string \| number; index: number; previousValue?: string \| number }` (`TabsValueChangeDetails`) | Fired when the active tab changes. |

## Item (`c-tabs-item`)

`c-tabs-item` represents an individual tab in a tabs group, acting either as a tab trigger button (`mode="trigger"`) or as a tab content panel (`mode="auto"` / panel mode). It coordinates selection state, index, and inherited styling props (`orientation`, `variant`, `color`, `size`, `fitted`) with its parent `c-tabs`, and exposes an imperative `select()` method.

### Usage

::code-group

```html [index.wxml]
<c-tabs defaultValue="account">
  <c-tabs-item value="account" label="Account" icon="user">
    <view>Account settings content</view>
  </c-tabs-item>
  <c-tabs-item value="security" lazy="{{false}}" ui="{{ { content: 'p-4' } }}">
    <view slot="label">Security</view>
    <view>Security settings content</view>
  </c-tabs-item>
</c-tabs>
```

```ts [index.ts]
Page({
  data: {
    activeTab: "account",
  },
});
```

::

### Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| number` | `""` | Unique tab value identifier. |
| `disabled` | `boolean` | `false` | Whether the tab item is disabled and non-interactive. |
| `selected` | `boolean \| null` | `null` | Direct selected state override (typically managed by parent `c-tabs`). |
| `triggerId` | `string` | `""` | Explicit DOM `id` for the trigger element. |
| `index` | `number \| null` | `null` | Optional index override among sibling tabs. |
| `mode` | `string` | `"auto"` | Rendering mode: `"trigger"` renders the tab trigger button; any other value renders the tab content panel. |
| `label` | `string` | `""` | Trigger label text. When non-empty, renders `<text>` and takes precedence over the `label` slot. |
| `icon` | `string` | `""` | Leading icon name rendered via `c-icon` in trigger mode. |
| `trailingIcon` | `string` | `""` | Trailing icon name rendered via `c-icon` in trigger mode. |
| `lazy` | `boolean` | `true` | When `true`, panel default slot content is mounted only while the tab is selected. |
| `orientation` | `string` | `""` | Orientation override (`"horizontal"` \| `"vertical"`). Inherits from parent `c-tabs` or falls back to `"horizontal"`. |
| `variant` | `string` | `""` | Visual variant override (`"pill"` \| `"link"`). Inherits from parent `c-tabs` or falls back to `"pill"`. |
| `color` | `string` | `""` | Color theme override (`"neutral"` or configured theme colors such as `"primary"`). Inherits from parent `c-tabs` or falls back to `"primary"`. |
| `size` | `string` | `""` | Size override (`"xs"` \| `"sm"` \| `"md"` \| `"lg"` \| `"xl"`). Inherits from parent `c-tabs` or falls back to `"md"`. |
| `fitted` | `boolean \| null` | `null` | Whether the trigger stretches to fill available space. Inherits boolean value from parent `c-tabs` or falls back to `false`. |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides keyed by theme slot name. |
| `className` | `string` | `""` | Custom CSS class string applied to the `root` slot. |

### Slots

| Name | Mode | Description |
| --- | --- | --- |
| `default` | Panel (`mode !== "trigger"`) | Renders panel content inside the item content container. Mounted only when `isSelected` is `true` or `lazy` is `false`. |
| `leading` | Trigger (`mode === "trigger"`) | Rendered before the leading icon and label. |
| `label` | Trigger (`mode === "trigger"`) | Custom trigger label rendered when the `label` prop is empty. |
| `trailing` | Trigger (`mode === "trigger"`) | Rendered after the label and before the trailing icon. |

### Events

`c-tabs-item` does not emit custom `bind:*` events directly; tapping the trigger calls `select()` and updates the linked parent `c-tabs`.

## Theme

Customize the `tabs` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    tabs: {
      slots: {
        root: "w-full flex gap-3",
        scroll: "cui-tabs-scroll w-full shrink-0",
        itemWrapper: "flex flex-row",
        list: "relative flex group flex-nowrap whitespace-nowrap box-border",
        content: "focus:outline-none flex-1 min-w-0",
      },
      variants: {
        variant: {
          pill: {
            list: "bg-elevated rounded-xl p-1 gap-1",
          },
          link: {
            list: "border-b border-default gap-5 p-0",
          },
        },
        orientation: {
          horizontal: {
            root: "flex-col",
            list: "inline-flex flex-row items-center align-top min-w-full shrink-0",
            content: "w-full",
          },
          vertical: {
            root: "flex-row items-start gap-4",
            list: "flex flex-col items-stretch shrink-0",
          },
        },
        size: {
          xs: {},
          sm: {},
          md: {},
          lg: {},
          xl: {},
        },
        disabled: {
          true: {
            root: "opacity-50 pointer-events-none",
          },
          false: {},
        },
        fitted: {
          true: {
            list: "flex w-full min-w-full",
            itemWrapper: "flex-1 min-w-0",
          },
          false: {
            itemWrapper: "shrink-0",
          },
        },
      },
      compoundVariants: [
        {
          variant: "pill",
          size: "xs",
          class: {
            list: "p-1 gap-1 rounded-lg",
          },
        },
        {
          variant: "pill",
          size: "sm",
          class: {
            list: "p-1 gap-1 rounded-lg",
          },
        },
        {
          variant: "pill",
          size: "md",
          class: {
            list: "p-1 gap-1 rounded-xl",
          },
        },
        {
          variant: "pill",
          size: "lg",
          class: {
            list: "p-1.5 gap-1.5 rounded-xl",
          },
        },
        {
          variant: "pill",
          size: "xl",
          class: {
            list: "p-1.5 gap-1.5 rounded-xl",
          },
        },
        {
          variant: "link",
          orientation: "vertical",
          class: {
            list: "border-b-0 border-r border-default gap-1 p-0",
          },
        },
      ],
      defaultVariants: {
        variant: "pill",
        orientation: "horizontal",
        size: "md",
        disabled: false,
        fitted: false,
      },
    }
  }
})
```
