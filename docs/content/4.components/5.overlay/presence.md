---
title: Presence
description: Mount/unmount animation primitive (<c-presence>) and parent-level presence helpers (usePresence, createPresenceBehavior) for animating exit transitions and truly unmounting heavy overlays such as custom <c-drawer>, <c-modal>, and <c-action-sheet> components.
---

## Overview

`c-presence` manages enter/exit animation lifecycles (`unmounted` → `open` → `exiting` → `unmounted`) with `lazyMount`, `unmountOnExit`, `data-state="open|closed"`, automatic animation completion (`bindanimationend` / `bindtransitionend` / `duration`), and `bind:exitcomplete`.

For heavy overlays in WeChat MiniProgram (`<c-drawer>`, `<c-modal>`, `<c-action-sheet>`, or your own custom components wrapping them), pair `bind:exitcomplete` with the parent-level [`usePresence`](/composables/use-presence) composable or `createPresenceBehavior` so the parent template controls `wx:if="{{mounted}}"`.

::callout{icon="i-lucide-alert-triangle" color="warning"}
**Why parent-level `wx:if` matters in WeChat MiniProgram**: Light-DOM `<slot>` children inside a page remain mounted and attached in the component tree even when hidden behind a `wx:if` *inside* a child component. Placing `wx:if="{{drawer.mounted}}"` directly on the overlay (or custom component wrapping it) in the **parent WXML** is the only way to truly detach closed overlay subtrees after the exit animation finishes.
::

## Usage

### Declarative `<c-presence>`

Use `<c-presence>` directly when animating inline panels, banners, or conditional cards with Tailwind / CSS transitions.

::code-group

```html [index.wxml]
<c-button
  label="{{ showPanel ? 'Hide Panel' : 'Show Panel' }}"
  bind:tap="togglePanel"
/>

<c-presence
  present="{{ showPanel }}"
  lazy-mount="{{ true }}"
  unmount-on-exit="{{ true }}"
  duration="{{ 250 }}"
  className="block transition-all duration-250 ease-out"
  ui="{{ { root: showPanel ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95' } }}"
  bind:exitcomplete="onPanelExitComplete"
>
  <view class="p-4 rounded-xl bg-elevated border border-default">
    Animated content stays mounted during the 250ms exit animation, then unmounts cleanly.
  </view>
</c-presence>
```

```ts [index.ts]
Page({
  data: {
    showPanel: false,
  },

  togglePanel() {
    this.setData({ showPanel: !this.data.showPanel });
  },

  onPanelExitComplete() {
    console.log("Exit animation completed and panel unmounted");
  },
});
```

::

### Leveraging Presence with `<c-drawer>`, `<c-modal>`, and `<c-action-sheet>`

All built-in overlay components (`<c-drawer>`, `<c-modal>`, `<c-action-sheet>`, `<c-popover>`, `<c-toast>`) emit `bind:exitcomplete` once their exit animation transitions from `closing` → `closed`.

Use `usePresence` on the parent page to keep closed overlays completely unmounted (`mounted: false`) until opened, keep them mounted while animating out (`open: false, mounted: true`), and truly detach them once `bind:exitcomplete` fires (`mounted: false`):

::code-group

```html [index.wxml]
<view class="flex gap-2">
  <c-button label="Open Drawer" bind:tap="openDrawer" />
  <c-button label="Open Modal" variant="soft" bind:tap="openModal" />
  <c-button label="Open Action Sheet" variant="outline" bind:tap="openSheet" />
</view>

<!-- Truly unmounted when closed; smooth slide-out before wx:if removes the subtree -->
<c-drawer
  wx:if="{{ drawer.mounted }}"
  open="{{ drawer.open }}"
  bind:close="closeDrawer"
  bind:exitcomplete="onDrawerExitComplete"
>
  <view slot="header" class="text-base font-semibold">Filters</view>
  <view class="py-2">Heavy form fields here only mount while the drawer is active.</view>
</c-drawer>

<c-modal
  wx:if="{{ modal.mounted }}"
  open="{{ modal.open }}"
  title="Confirm Action"
  bind:close="closeModal"
  bind:exitcomplete="onModalExitComplete"
>
  <view>Modal subtree is detached cleanly after leave animation ends.</view>
</c-modal>

<c-action-sheet
  wx:if="{{ sheet.mounted }}"
  open="{{ sheet.open }}"
  title="Quick Actions"
  items="{{ sheetItems }}"
  bind:close="closeSheet"
  bind:exitcomplete="onSheetExitComplete"
/>
```

```ts [index.ts]
import { usePresence, type UsePresenceReturn } from "@code-id-labs/composables";

interface PageHandles {
  __drawer?: UsePresenceReturn;
  __modal?: UsePresenceReturn;
  __sheet?: UsePresenceReturn;
}

Page({
  data: {
    drawer: { open: false, present: false, mounted: false, state: "unmounted" },
    modal: { open: false, present: false, mounted: false, state: "unmounted" },
    sheet: { open: false, present: false, mounted: false, state: "unmounted" },
    sheetItems: [
      { key: "copy", label: "Copy Link" },
      { key: "share", label: "Share" },
    ],
  },

  onLoad() {
    const self = this as unknown as PageHandles;
    self.__drawer = usePresence({ target: this, key: "drawer" });
    self.__modal = usePresence({ target: this, key: "modal" });
    self.__sheet = usePresence({ target: this, key: "sheet" });
  },

  onUnload() {
    const self = this as unknown as PageHandles;
    self.__drawer?.stop();
    self.__modal?.stop();
    self.__sheet?.stop();
  },

  openDrawer() { (this as unknown as PageHandles).__drawer?.show(); },
  closeDrawer() { (this as unknown as PageHandles).__drawer?.hide(); },
  onDrawerExitComplete() { (this as unknown as PageHandles).__drawer?.onExitComplete(); },

  openModal() { (this as unknown as PageHandles).__modal?.show(); },
  closeModal() { (this as unknown as PageHandles).__modal?.hide(); },
  onModalExitComplete() { (this as unknown as PageHandles).__modal?.onExitComplete(); },

  openSheet() { (this as unknown as PageHandles).__sheet?.show(); },
  closeSheet() { (this as unknown as PageHandles).__sheet?.hide(); },
  onSheetExitComplete() { (this as unknown as PageHandles).__sheet?.onExitComplete(); },
});
```

::

### Leveraging Presence on Custom Components Wrapping `<c-drawer>` or `<c-modal>`

In real MiniProgram apps, complex overlays (such as a payment drawer, filter sheet, or confirmation modal) are commonly encapsulated inside their own custom components (for example `<filter-drawer>` extending `<c-drawer>` or `<confirm-modal>` extending `<c-modal>`).

Without Presence, keeping 5–10 closed custom drawers in page WXML mounts **all** of their inner forms, buttons, inputs, and listeners on initial page load. With Presence, follow this 2-step pattern:

#### Step 1: Forward `bind:close` and `bind:exitcomplete` from the custom wrapper component

::code-group

```json [components/filter-drawer/index.json]
{
  "component": true,
  "styleIsolation": "shared",
  "usingComponents": {}
}
```

```html [components/filter-drawer/index.wxml]
<c-drawer
  open="{{ open }}"
  placement="bottom"
  bind:close="handleClose"
  bind:exitcomplete="handleExitComplete"
>
  <view slot="header" class="text-base font-semibold">Filter Orders</view>

  <view class="flex flex-col gap-3 py-2">
    <c-input
      value="{{ keyword }}"
      placeholder="Search keyword..."
      adjust-position="{{ false }}"
      bind:change="onKeywordChange"
    />
    <c-switch checked="{{ onlyInStock }}" label="In stock only" bind:change="onStockChange" />
  </view>

  <view slot="footer" class="flex justify-end gap-2 w-full">
    <c-button size="sm" variant="outline" label="Cancel" bind:tap="handleClose" />
    <c-button size="sm" color="primary" label="Apply" bind:tap="handleApply" />
  </view>
</c-drawer>
```

```ts [components/filter-drawer/index.ts]
Component({
  properties: {
    open: { type: Boolean, value: false },
  },

  data: {
    keyword: "",
    onlyInStock: true,
  },

  methods: {
    onKeywordChange(e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
      this.setData({ keyword: e.detail?.value ?? "" });
    },

    onStockChange(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
      this.setData({ onlyInStock: Boolean(e.detail?.checked) });
    },

    handleClose() {
      this.triggerEvent("close");
    },

    // Forward exitcomplete so the parent knows when the exit animation has ended
    handleExitComplete() {
      this.triggerEvent("exitcomplete");
    },

    handleApply() {
      this.triggerEvent("apply", {
        keyword: this.data.keyword,
        onlyInStock: this.data.onlyInStock,
      });
      this.triggerEvent("close");
    },
  },
});
```

::

#### Step 2: Gate the custom component with `wx:if` in the parent Page (or parent Component)

::code-group

```html [pages/orders/index.wxml]
<c-button label="Filter Orders" bind:tap="openFilterDrawer" />

<!-- Zero DOM nodes or child components exist while filterDrawer.mounted is false -->
<filter-drawer
  wx:if="{{ filterDrawer.mounted }}"
  open="{{ filterDrawer.open }}"
  bind:close="closeFilterDrawer"
  bind:exitcomplete="onFilterDrawerExitComplete"
  bind:apply="onApplyFilters"
/>
```

```ts [pages/orders/index.ts]
import { usePresence, type UsePresenceReturn } from "@code-id-labs/composables";

Page({
  data: {
    filterDrawer: { open: false, present: false, mounted: false, state: "unmounted" },
  },

  filterDrawerCtrl: null as UsePresenceReturn | null,

  onLoad() {
    this.filterDrawerCtrl = usePresence({
      target: this,
      key: "filterDrawer",
    });
  },

  onUnload() {
    this.filterDrawerCtrl?.stop();
  },

  openFilterDrawer() {
    this.filterDrawerCtrl?.show();
  },

  closeFilterDrawer() {
    this.filterDrawerCtrl?.hide();
  },

  onFilterDrawerExitComplete() {
    this.filterDrawerCtrl?.onExitComplete();
  },

  onApplyFilters(e: WechatMiniprogram.CustomEvent<{ keyword: string; onlyInStock: boolean }>) {
    console.log("Applied:", e.detail);
  },
});
```

::

::callout{icon="i-lucide-sparkles" color="info"}
The exact same pattern applies to custom components extending `<c-modal>` or `<c-action-sheet>`: forward `bind:close` and `bind:exitcomplete` out of your custom component, then bind `wx:if="{{confirmModal.mounted}}"` and `open="{{confirmModal.open}}"` in the parent template. Because `usePresence` ignores stale `exitcomplete` events when reopened mid-exit, rapid **open → close → reopen** interactions remain smooth and never accidentally unmount an open overlay.
::

### Using `createPresenceBehavior` inside a Parent Custom Component

When the **parent** hosting a custom drawer or modal is itself a `Component(...)`, you can mix in `createPresenceBehavior` instead of manually creating and stopping `usePresence`:

::code-group

```html [components/order-toolbar/index.wxml]
<c-button label="Filters" bind:tap="openFilterDrawer" />

<filter-drawer
  wx:if="{{ filterDrawer.mounted }}"
  open="{{ filterDrawer.open }}"
  bind:close="closeFilterDrawer"
  bind:exitcomplete="handleFilterDrawerExitComplete"
/>
```

```ts [components/order-toolbar/index.ts]
import { createPresenceBehavior } from "@code-id-labs/components/behaviors/presence";

const filterDrawerPresence = createPresenceBehavior({
  key: "filterDrawer",
});

Component({
  behaviors: [filterDrawerPresence],
});
```

::

`createPresenceBehavior({ key: "filterDrawer" })` automatically registers `this.data.filterDrawer` (`{ open, present, mounted, state }`), exposes `openFilterDrawer`, `closeFilterDrawer`, `showFilterDrawer`, `hideFilterDrawer`, `toggleFilterDrawer`, `setFilterDrawerOpen`, and `handleFilterDrawerExitComplete`, cleans up timers in `detached()`, and **never** declares `pageLifetimes`.

To manage **multiple** overlays on a single page or component without repeating handlers, pass an array to `key` (for example `usePresence({ target: this, key: ["filter", "sort", "payment"] as const })` or `createPresenceBehavior({ key: ["filter", "sort", "payment"] })`) and pass `data-name="filter"` in WXML. See [`usePresence`](/composables/use-presence#managing-multiple-drawers-modals-on-one-page-key) for full examples.

## State Machine

Click any active transition inside the state graph below to simulate the `presence` state machine live:

::machine-visualizer{name="presence"}
::

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `present` | `boolean` | `false` | Whether the wrapped content is logically present/open. |
| `lazyMount` | `boolean` | `false` | Defers mounting (`mounted: false`) until `present` becomes `true` for the first time. |
| `unmountOnExit` | `boolean` | `false` | Unmounts the wrapper (`wx:if`) once the exit animation finishes and settles into `unmounted`. |
| `duration` | `number \| null` | `null` | Explicit exit animation duration in milliseconds. Set `0` for immediate unmount with zero timers; leave `null` to auto-query computed CSS animation/transition duration (falling back to `300ms`) while also listening for `bindanimationend` / `bindtransitionend`. |
| `ui` | `PresenceUI` (`Record<"root", string>`) | `{}` | Per-slot class overrides merged into the resolved `root` slot. |
| `className` | `string` | `""` | Additional class string applied to the `root` element. |

## Slots

| Slot | Behavior |
| :--- | :--- |
| *(default)* | Content rendered inside the animated root `<view>` whenever `presence.mounted` is `true`. |

## Events

| Event | Detail Payload | Description |
| :--- | :--- | :--- |
| `bind:exitcomplete` | `undefined` | Fired after the exit animation completes and the machine transitions from `exiting` to `unmounted`. Not fired if reopened mid-exit. |

::callout{icon="i-lucide-terminal"}
**Exposed API (`exportApi: true`)**: `<c-presence>` exposes `present`, `mounted`, `visible`, `exiting`, `state`, `dataState`, `setPresent(next)`, and `handleAnimationEnd()` via `this.selectComponent(...)` or [`useComponentRef`](/composables/use-component-ref).
::

## Theme

Customize the `presence` theme globally in `cui.config.ts` or per instance via `ui` / `className`.

```ts [cui.config.ts]
export default defineConfig({
  components: {
    presence: {
      slots: {
        root: "",
      },
      variants: {
        present: {
          true: {},
          false: {},
        },
      },
      defaultVariants: {
        present: false,
      },
    },
  },
});
```
