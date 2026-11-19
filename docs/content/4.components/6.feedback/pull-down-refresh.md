---
title: PullDownRefresh
description: A scrollable container for WeChat MiniProgram that supports pull-to-refresh gestures, configurable thresholds and status text, animated snap/collapse transitions, and optional custom header and loading indicator slots.
---

## Overview

`c-pull-down-refresh` is a scrollable container for WeChat MiniProgram (`<scroll-view>`) that supports pull-to-refresh gestures, configurable thresholds and status text, animated snap/collapse transitions, and optional custom `header` and `indicator` slots.

- **Default Indicator**: Internally renders `<c-icon>` when no custom `indicator` slot is provided.
- **Imperative Control**: Exposes `refresh()` and `close()` component methods alongside controlled (`value`) and uncontrolled (`defaultValue`) modes.

## Usage

### Basic

Use `bind:refresh` to run an async task and pass it to `e.detail.setPromise(...)` so the indicator stays active until the promise settles.

::code-group

```html [index.wxml]
<c-pull-down-refresh className="h-screen" bind:refresh="onRefresh">
  <view wx:for="{{items}}" wx:key="id" class="p-4 border-b">
    {{item.title}}
  </view>
</c-pull-down-refresh>
```

```ts [index.ts]
Page({
  data: {
    items: [{ id: 1, title: "Item 1" }],
  },

  onRefresh(
    e: WechatMiniprogram.CustomEvent<{
      close: () => void;
      setPromise: (task: Promise<unknown>) => void;
    }>,
  ) {
    const task = fetchLatestItems().then((items) => {
      this.setData({ items });
    });
    e.detail.setPromise(task);
  },
});
```

::

### Controlled

Use the `value` prop with `bind:change` to control the refreshing state from page data.

::code-group

```html [index.wxml]
<c-pull-down-refresh
  className="h-screen"
  value="{{isRefreshing}}"
  bind:change="onRefreshingChange"
  bind:refresh="onRefresh"
>
  <view class="p-4">Scrollable content</view>
</c-pull-down-refresh>
```

```ts [index.ts]
Page({
  data: {
    isRefreshing: false,
  },

  onRefreshingChange(e: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    this.setData({ isRefreshing: e.detail.value });
  },

  async onRefresh() {
    await syncData();
    this.setData({ isRefreshing: false });
  },
});
```

::

### Default Value

Use the `defaultValue` prop to start in the refreshing state on initial render when using uncontrolled mode.

::code-group

```html [index.wxml]
<c-pull-down-refresh
  className="h-screen"
  defaultValue="{{true}}"
  bind:refresh="onRefresh"
>
  <view class="p-4">Loading initial feed...</view>
</c-pull-down-refresh>
```

```ts [index.ts]
Page({
  onRefresh(
    e: WechatMiniprogram.CustomEvent<{
      close: () => void;
      setPromise: (task: Promise<unknown>) => void;
    }>,
  ) {
    e.detail.setPromise(fetchInitialFeed());
  },
});
```

::

### Disabled

Set `disabled` to prevent pull-to-refresh gestures while preserving scrolling.

```html
<c-pull-down-refresh className="h-screen" disabled="{{true}}">
  <view class="p-4">Pull-to-refresh is disabled</view>
</c-pull-down-refresh>
```

### Loading Texts

Use `loadingTexts` to customize the four status messages for pulling, armed (release), refreshing, and success states.

```html
<c-pull-down-refresh
  className="h-screen"
  loadingTexts="{{['Pull down', 'Release to load', 'Loading...', 'Done']}}"
  bind:refresh="onRefresh"
>
  <view class="p-4">Scrollable content</view>
</c-pull-down-refresh>
```

### Loading Icon

Use `loadingIcon` to change the icon name passed to the default `<c-icon>` indicator while refreshing.

```html
<c-pull-down-refresh
  className="h-screen"
  loadingIcon="refresh"
  bind:refresh="onRefresh"
>
  <view class="p-4">Scrollable content</view>
</c-pull-down-refresh>
```

### Threshold & Pull Distance

Use `threshold` to set the pull distance in `px` required to trigger a refresh, and `maxPullDistance` to cap the maximum drag travel.

```html
<c-pull-down-refresh
  className="h-screen"
  threshold="{{60}}"
  maxPullDistance="{{100}}"
  bind:refresh="onRefresh"
>
  <view class="p-4">Pull further to trigger refresh</view>
</c-pull-down-refresh>
```

### Timing & Timeout

Use `refreshTimeout`, `successDuration`, and `duration` to configure the timeout window, completion message display time, and snap/collapse animation duration in `ms`. Listen to `bind:timeout` when a refresh exceeds `refreshTimeout`.

::code-group

```html [index.wxml]
<c-pull-down-refresh
  className="h-screen"
  refreshTimeout="{{5000}}"
  successDuration="{{800}}"
  duration="{{250}}"
  bind:refresh="onRefresh"
  bind:timeout="onTimeout"
>
  <view class="p-4">Scrollable content</view>
</c-pull-down-refresh>
```

```ts [index.ts]
Page({
  onRefresh(
    e: WechatMiniprogram.CustomEvent<{
      close: () => void;
      setPromise: (task: Promise<unknown>) => void;
    }>,
  ) {
    e.detail.setPromise(fetchSlowData());
  },

  onTimeout() {
    wx.showToast({ title: "Refresh timed out", icon: "none" });
  },
});
```

::

### Scroll View

Forward `<scroll-view>` options with `showScrollbar`, `enableBackToTop`, `scrollIntoView`, `scrollWithAnimation`, `upperThreshold`, and `lowerThreshold`, and listen to `bind:scroll`, `bind:scrolltoupper`, and `bind:scrolltolower`.

::code-group

```html [index.wxml]
<c-pull-down-refresh
  className="h-screen"
  showScrollbar="{{false}}"
  enableBackToTop="{{true}}"
  scrollIntoView="{{targetId}}"
  scrollWithAnimation="{{true}}"
  upperThreshold="{{40}}"
  lowerThreshold="{{80}}"
  bind:scroll="onScroll"
  bind:scrolltoupper="onScrollToUpper"
  bind:scrolltolower="onScrollToLower"
>
  <view id="section-top" class="p-4">Top Section</view>
  <view id="section-bottom" class="p-4">Bottom Section</view>
</c-pull-down-refresh>
```

```ts [index.ts]
Page({
  data: {
    targetId: "",
  },

  scrollToBottom() {
    this.setData({ targetId: "section-bottom" });
  },

  onScroll(e: WechatMiniprogram.CustomEvent<{ scrollTop: number; scrollLeft: number }>) {
    console.log("scrollTop:", e.detail.scrollTop);
  },

  onScrollToUpper() {
    console.log("Reached upper threshold");
  },

  onScrollToLower() {
    console.log("Reached lower threshold");
  },
});
```

::

### Imperative Control

Call `refresh()` and `close()` on the component instance, or call `e.detail.close()` inside `bind:refresh` to finish manually.

::code-group

```html [index.wxml]
<c-pull-down-refresh
  id="feed-refresh"
  className="h-screen"
  bind:refresh="onRefresh"
>
  <view class="p-4">Scrollable content</view>
</c-pull-down-refresh>
```

```ts [index.ts]
Page({
  triggerRefresh() {
    const refresher = this.selectComponent("#feed-refresh");
    refresher?.refresh();
  },

  onRefresh(
    e: WechatMiniprogram.CustomEvent<{
      close: () => void;
      setPromise: (task: Promise<unknown>) => void;
    }>,
  ) {
    setTimeout(() => {
      e.detail.close();
    }, 1000);
  },
});
```

::

### Slots

Use the `header` slot for fixed content above the pull-down track, the `indicator` slot to replace the default `<c-icon>` spinner while refreshing, and the default slot for the scrollable body.

```html
<c-pull-down-refresh className="h-screen" bind:refresh="onRefresh">
  <view slot="header" class="px-4 py-2 bg-white border-b">
    Feed Header
  </view>

  <view slot="indicator" class="mr-2 text-xs">⏳</view>

  <view class="p-4">Main scrollable content</view>
</c-pull-down-refresh>
```

### Events

Listen to pull gesture events (`bind:dragstart`, `bind:drag`, `bind:dragend`) alongside `bind:refresh`, `bind:change`, and `bind:timeout`.

::code-group

```html [index.wxml]
<c-pull-down-refresh
  className="h-screen"
  bind:dragstart="onDragStart"
  bind:drag="onDrag"
  bind:dragend="onDragEnd"
  bind:change="onChange"
  bind:refresh="onRefresh"
>
  <view class="p-4">Pull to inspect drag events</view>
</c-pull-down-refresh>
```

```ts [index.ts]
Page({
  onDragStart() {
    console.log("Pull started");
  },

  onDrag(e: WechatMiniprogram.CustomEvent<{ offset: number }>) {
    console.log("Pull offset:", e.detail.offset);
  },

  onDragEnd(e: WechatMiniprogram.CustomEvent<{ offset: number }>) {
    console.log("Pull ended at:", e.detail.offset);
  },

  onChange(e: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    console.log("Refreshing:", e.detail.value);
  },

  onRefresh(
    e: WechatMiniprogram.CustomEvent<{
      close: () => void;
      setPromise: (task: Promise<unknown>) => void;
    }>,
  ) {
    e.detail.setPromise(syncData());
  },
});
```

::

### Custom Styling

Use `className` to add classes to the `root` slot and `ui` to override individual slots (`root`, `header`, `track`, `tips`, `indicator`, `text`, `content`).

```html
<c-pull-down-refresh
  className="h-screen bg-white"
  ui="{{ { tips: 'bg-gray-50', text: 'text-sm text-primary', content: 'px-4' } }}"
  bind:refresh="onRefresh"
>
  <view class="py-4">Styled scrollable content</view>
</c-pull-down-refresh>
```

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `disabled` | `boolean` | `false` | Disables pull-to-refresh gestures. |
| `value` | `boolean \| null` | `null` | Controlled refreshing state (`true` while refreshing). |
| `defaultValue` | `boolean` | `false` | Initial refreshing state when uncontrolled. |
| `threshold` | `number` | `50` | Pull distance in `px` required to trigger a refresh. |
| `maxPullDistance` | `number` | `80` | Maximum pull distance in `px`. |
| `refreshTimeout` | `number` | `3000` | Duration in `ms` before an active refresh times out. |
| `successDuration` | `number` | `500` | Duration in `ms` to display the completion text before collapsing. |
| `loadingTexts` | `string[]` | `[]` | Status labels for pulling, armed, refreshing, and success states. When empty, falls back to `["Pull to refresh", "Release to refresh", "Refreshing...", "Refresh complete"]`. |
| `duration` | `number` | `300` | Snap and collapse transition duration in `ms`. |
| `showScrollbar` | `boolean` | `true` | Forwarded to `<scroll-view show-scrollbar>`. |
| `enableBackToTop` | `boolean` | `true` | Forwarded to `<scroll-view enable-back-to-top>`. |
| `scrollIntoView` | `string` | `""` | Forwarded to `<scroll-view scroll-into-view>` to scroll to a descendant element ID. |
| `upperThreshold` | `number` | `50` | Distance in `px` from the top before triggering scroll-to-upper (`<scroll-view upper-threshold>`). |
| `lowerThreshold` | `number` | `50` | Distance in `px` from the bottom before triggering scroll-to-lower (`<scroll-view lower-threshold>`). |
| `scrollWithAnimation` | `boolean` | `false` | Enables smooth scrolling when `scrollIntoView` updates (`<scroll-view scroll-with-animation>`). |
| `loadingIcon` | `string` | `"loading"` | Icon name passed to the default `<c-icon>` indicator when refreshing without an `indicator` slot. |
| `ui` | `Record<string, string>` | `{}` | Per-slot CSS class overrides (`root`, `header`, `track`, `tips`, `indicator`, `text`, `content`). |
| `className` | `string` | `""` | Additional CSS class(es) merged onto the `root` slot. |

### Component Methods

- `refresh()`: Programmatically starts the refreshing state.
- `close()`: Programmatically finishes refreshing and shows the completion message before collapsing.

## Slots

| Slot | Description |
| :--- | :--- |
| *(default)* | Main scrollable body content rendered inside the pull-down `track`. |
| `header` | Fixed header area rendered inside `<scroll-view>` above the pull-down `track`. |
| `indicator` | Custom loading indicator rendered while refreshing. Defaults to `<c-icon>` using `loadingIcon` when omitted. |

## Events

Emitted as MiniProgram `bind:*` component events with the following `detail` payloads:

| Event | Callback Prop | `detail` Payload | Description |
| :--- | :--- | :--- | :--- |
| `bind:refresh` | `onRefresh` | `{ close: () => void, setPromise: (task: Promise<unknown>) => void }` | Fired when a pull exceeds `threshold` and is released, or when `refresh()` is called. Call `detail.setPromise(promise)` to keep refreshing until settled, or `detail.close()` to finish manually. |
| `bind:change` | `onChange` | `{ value: boolean }` | Fired when the refreshing state changes. |
| `bind:timeout` | `onTimeout` | `—` | Fired when refreshing exceeds `refreshTimeout`. |
| `bind:scroll` | `onScroll` | `{ scrollTop: number, scrollLeft: number }` | Fired when the inner `<scroll-view>` scrolls. |
| `bind:scrolltoupper` | `onScrollToUpper` | `—` | Fired when the `<scroll-view>` reaches `upperThreshold`. |
| `bind:scrolltolower` | `onScrollToLower` | `—` | Fired when the `<scroll-view>` reaches `lowerThreshold`. |
| `bind:dragstart` | `onDragStart` | `—` | Fired when a pull gesture begins. |
| `bind:drag` | `onDrag` | `{ offset: number }` | Fired continuously while pulling. |
| `bind:dragend` | `onDragEnd` | `{ offset: number }` | Fired when a pull gesture ends. |

## Theme

Customize the `pull-down-refresh` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    pullDownRefresh: {
      slots: {
        root: "relative block w-full h-full overflow-hidden box-border",
        header: "relative z-10 w-full shrink-0",
        track: "relative flex w-full flex-col will-change-transform",
        tips: "flex w-full items-center justify-center overflow-hidden text-xs text-muted",
        indicator: "mr-1 size-4 shrink-0 animate-spin text-primary",
        text: "text-xs text-muted",
        content: "w-full",
      },
      variants: {
        disabled: {
          true: {},
          false: {},
        },
        status: {
          idle: {},
          pulling: {},
          armed: {
            text: "font-medium text-primary",
          },
          refreshing: {
            text: "text-primary",
          },
          success: {
            text: "",
          },
        },
      },
      compoundVariants: [],
      defaultVariants: {
        disabled: false,
        status: "idle",
      },
    }
  }
})
```
