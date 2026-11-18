# PullDownRefresh (`c-pull-down-refresh`)

## Overview & Tier

`c-pull-down-refresh` is a scrollable container for WeChat MiniProgram (`<scroll-view>`) that supports pull-to-refresh gestures, configurable thresholds and status text, animated snap/collapse transitions, and optional custom header and loading indicator slots.

- **Architecture Tier**: **Tier 2 — Interactive / Stateful**
  - Driven by the `@code-ui/pull-down-refresh` finite state machine (`pullDownRefreshMachine`, `connectPullDownRefresh`) and WXS gesture handling (`pull-down-refresh-gesture.wxs`).
  - Runtime component (`packages/components/src/runtime/pull-down-refresh/index.ts`) binds `createMachineBehavior` (with `exportApi: true`) and `computedBehavior`, resolves theme slot classes, and exposes imperative `refresh()` and `close()` component methods.
- **Compound Relationships**: Standalone container component (no parent/child behavior relations). Internally renders `<c-icon>` as the default loading indicator when no `indicator` slot is provided.

---

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
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
| `className` | `string` | `""` | Additional CSS class(es) merged onto the `root` slot (used in place of `class` in `index.ts`). |

### Component Methods

- `refresh()`: Programmatically starts the refreshing state.
- `close()`: Programmatically finishes refreshing and shows the completion message before collapsing.

---

## Slots

| Slot | Behavior & Constraints |
| --- | --- |
| *(default)* | Main scrollable body content rendered inside `<view class="{{classes.content}}">` within the pull-down `track`. |
| `header` | Fixed header area rendered inside `<view class="{{classes.header}}">` inside `<scroll-view>` above the pull-down `track`. |
| `indicator` | Custom loading indicator rendered inside `<view class="{{classes.tips}}">` while refreshing (`status === 2`). |

**MiniProgram `<slot>` constraints**:
- WeChat MiniProgram `<slot>` does not support fallback child markup inside `<slot>`. `index.wxml` uses conditional rendering (`wx:if="{{pullDownRefresh.status === 2 && slots.indicator}}"`) with a `wx:elif` fallback to `<c-icon name="{{loadingIcon}}" className="{{classes.indicator}}" />` when no `indicator` slot is provided.

---

## Events

Machine callback props (`PullDownRefreshProps`) are emitted as MiniProgram `bind:*` component events with the following `detail` payloads:

| Event | Callback Prop | `detail` Payload | Description |
| --- | --- | --- | --- |
| `bind:refresh` | `onRefresh` | `{ close: () => void, setPromise: (task: Promise<unknown>) => void }` | Fired when a pull exceeds `threshold` and is released, or when `refresh()` is called. Call `detail.setPromise(promise)` to keep refreshing until settled, or `detail.close()` to finish manually. |
| `bind:change` | `onChange` | `{ value: boolean }` | Fired when the refreshing state changes. |
| `bind:timeout` | `onTimeout` | — | Fired when refreshing exceeds `refreshTimeout`. |
| `bind:scroll` | `onScroll` | `{ scrollTop: number, scrollLeft: number }` | Fired when the inner `<scroll-view>` scrolls. |
| `bind:scrolltoupper` | `onScrollToUpper` | — | Fired when the `<scroll-view>` reaches `upperThreshold`. |
| `bind:scrolltolower` | `onScrollToLower` | — | Fired when the `<scroll-view>` reaches `lowerThreshold`. |
| `bind:dragstart` | `onDragStart` | — | Fired when a pull gesture begins. |
| `bind:drag` | `onDrag` | `{ offset: number }` | Fired continuously while pulling. |
| `bind:dragend` | `onDragEnd` | `{ offset: number }` | Fired when a pull gesture ends. |

---

## Theme

Defined in `packages/core/src/theme/definitions/pull-down-refresh.ts`:

### Slots

| Slot | Default Classes |
| --- | --- |
| `root` | `"relative block w-full h-full overflow-hidden box-border"` |
| `header` | `"relative z-10 w-full shrink-0"` |
| `track` | `"relative flex w-full flex-col will-change-transform"` |
| `tips` | `"flex w-full items-center justify-center overflow-hidden text-xs text-muted"` |
| `indicator` | `"mr-1 size-4 shrink-0 animate-spin text-primary"` |
| `text` | `"text-xs text-muted"` |
| `content` | `"w-full"` |

### Variants

- `disabled`:
  - `true`: `{ root: "opacity-60" }`
  - `false`: `{}`
- `status`:
  - `idle`: `{}`
  - `pulling`: `{}`
  - `armed`: `{ text: "font-medium text-primary" }`
  - `refreshing`: `{ text: "text-primary" }`
  - `success`: `{ text: "" }`

### Default Variants

- `disabled`: `false`
- `status`: `"idle"`

---

## Examples

### Basic (Uncontrolled)

```xml
<c-pull-down-refresh
  className="h-screen"
  loadingTexts="{{['Pull down', 'Release to load', 'Loading...', 'Done']}}"
  bind:refresh="onRefresh"
>
  <view slot="header" class="px-4 py-2 bg-white border-b">
    Feed Header
  </view>

  <view wx:for="{{items}}" wx:key="id" class="p-4 border-b">
    {{item.title}}
  </view>
</c-pull-down-refresh>
```

```ts
Page({
  data: {
    items: [{ id: 1, title: "Item 1" }],
  },

  onRefresh(e: WechatMiniprogram.CustomEvent<{
    close: () => void;
    setPromise: (task: Promise<unknown>) => void;
  }>) {
    const task = fetchLatestItems().then((items) => {
      this.setData({ items });
    });
    e.detail.setPromise(task);
  },
});
```

### Controlled with Custom Indicator

```xml
<c-pull-down-refresh
  value="{{isRefreshing}}"
  threshold="{{60}}"
  ui="{{ { tips: 'bg-gray-50', text: 'text-sm' } }}"
  bind:change="onRefreshingChange"
  bind:refresh="onRefresh"
>
  <view slot="indicator" class="mr-2 text-xs">⏳</view>
  <view class="p-4">Scrollable content</view>
</c-pull-down-refresh>
```

```ts
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
