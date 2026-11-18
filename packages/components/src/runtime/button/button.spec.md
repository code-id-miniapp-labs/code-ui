# Button (`c-button`)

## Overview & Tier

- **Purpose**: Interactive button component with Nuxt UI v4-inspired theming (`variant`, `color`, `size`, `block`), leading/trailing icons, loading indicator (including automatic async loading support), disabled handling, and native WeChat `<button>` integration (`open-type`, `form-type`, hover props, and open-ability callbacks).
- **Architecture Tier**: **Tier 2 — Interactive / Stateful**
  - Uses `@code-ui/button` (`buttonMachine` + `connectButton`) via `createMachineBehavior` and imports runtime helpers from `../_shared/base` and `../_shared/machine`.
- **Compound / Related Components**: Standalone component (not part of a compound parent/child relation). Internally renders `c-icon` as the fallback for icons and the loading spinner when custom slots are not provided.

---

## Props

### Component & Machine Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `String` | `""` | Text label rendered inside the label container. Takes precedence over the default slot. |
| `variant` | `String` | `"solid"` | Visual style variant: `"solid"`, `"outline"`, `"ghost"`, `"soft"`, or `"secondary"`. |
| `color` | `String` | `"primary"` | Theme color key (e.g. `"primary"`, `"neutral"`, `"danger"`, `"success"`, `"warning"`, `"info"`). |
| `size` | `String` | `"md"` | Button size: `"xs"`, `"sm"`, `"md"`, `"lg"`, or `"xl"`. |
| `block` | `Boolean` | `false` | Expands the button to full container width (`w-full flex`). |
| `disabled` | `Boolean` | `false` | Disables button interaction and applies disabled styling/ARIA attributes. |
| `loading` | `Boolean` | `false` | Displays the loading spinner and disables interaction while loading. |
| `loadingAuto` | `Boolean` | `false` | Automatically enters loading when a tap handler provides/returns a `Promise` (via `setPromise` / `promise`). |
| `autoResetDuration` | `Number` | `1500` | Duration in milliseconds before auto-resetting after an async tap completes. |
| `icon` | `String` | `""` | Icon name rendered via `c-icon` (leading by default, or trailing when `trailing` is `true`). |
| `leading` | `Boolean` | `false` | Enables leading icon/spinner positioning. |
| `leadingIcon` | `String` | `""` | Leading icon name rendered via `c-icon`. |
| `trailing` | `Boolean` | `false` | Positions the icon/spinner at the trailing end of the button. |
| `trailingIcon` | `String` | `""` | Trailing icon name rendered via `c-icon`. |
| `loadingIcon` | `String` | `"loading"` | Icon name rendered via `c-icon` in the spinner container when loading without a `loadingIcon` slot. |
| `slots` | `Object` | `{ default: false, icon: false, leading: false, trailing: false, loadingIcon: false }` | Explicit slot presence flags required by MiniProgram conditional rendering (e.g. `{ default: true }`). |
| `ui` | `Object` | `{}` | Per-slot class overrides keyed by theme slot (`root`, `label`, `icon`, `iconInner`, `spinner`, `spinnerIcon`). |
| `class` (`className`) | `String` | `""` | Additional CSS class string merged onto the `root` slot (exposed in runtime properties as `className`). |

### Native WeChat `<button>` Attributes

The template also forwards native MiniProgram `<button>` attributes from `wxButtonBehavior` onto the inner `<button>`: `openType` (`open-type`), `formType` (`form-type`), `hoverClass` (`hover-class`), `hoverStartTime` (`hover-start-time`), `hoverStayTime` (`hover-stay-time`), `hoverStopPropagation` (`hover-stop-propagation`), `lang`, `sessionFrom` (`session-from`), `sendMessageTitle` (`send-message-title`), `sendMessagePath` (`send-message-path`), `sendMessageImg` (`send-message-img`), `showMessageCard` (`show-message-card`), and `appParameter` (`app-parameter`).

---

## Slots

WeChat MiniProgram `<slot>` elements are static and do not support fallback content nested inside `<slot>...</slot>`. `c-button` uses explicit `slots` flags and conditional `wx:if` / `wx:elif` / `wx:else` branches:

| Slot | Behavior & Conditional Fallback |
| --- | --- |
| `(default)` | Rendered inside the `label` container only when `label` is empty and `slots.default` is `true`. When `label` is non-empty, `<text>{{label}}</text>` is rendered instead. |
| `icon` | Custom leading icon rendered inside the leading `icon` container when `slots.icon` is `true` (and not in leading loading). Takes precedence over `slots.leading` and `c-icon`. |
| `leading` | Custom leading content rendered when `slots.leading` is `true` and `slots.icon` is `false`. Falls back to `<c-icon>` when `leadingIcon` or `icon` is set. |
| `trailing` | Custom trailing content rendered when not loading and trailing slot is active. Falls back to `<c-icon>` when `trailingIcon` (or trailing `icon`) is set. |
| `loadingIcon` | Custom spinner rendered inside the `spinner` container (leading or trailing depending on placement) when loading and `slots.loadingIcon` is `true`. Otherwise falls back to `<c-icon name="{{loadingIcon}}">`. |

---

## Events

| Event | Detail Payload | Description |
| --- | --- | --- |
| `tap` (`catchtap` on inner `<button>`) | `ButtonTapDetail`: `{ x?: number; y?: number; promise?: Promise<any>; setPromise?: (promise: Promise<any>) => void; [key: string]: any }` | Dispatched through the button machine's `handleTap(detail)` when tapped (ignored when disabled or loading). Supports `setPromise` / `promise` when `loadingAuto` is enabled. |
| `bind:getphonenumber` | Native WeChat event `detail` | Forwarded from `<button bindgetphonenumber>`. |
| `bind:chooseavatar` | Native WeChat event `detail` | Forwarded from `<button bindchooseavatar>`. |
| `bind:contact` | Native WeChat event `detail` | Forwarded from `<button bindcontact>`. |
| `bind:error` | Native WeChat event `detail` | Forwarded from `<button binderror>`. |
| `bind:opensetting` | Native WeChat event `detail` | Forwarded from `<button bindopensetting>`. |
| `bind:launchapp` | Native WeChat event `detail` | Forwarded from `<button bindlaunchapp>`. |
| `bind:agreeprivacyauthorization` | Native WeChat event `detail` | Forwarded from `<button bindagreeprivacyauthorization>`. |

---

## Theme

Defined in `packages/core/src/theme/definitions/button.ts`:

- **Slots**:
  - `root`: Base button layout, alignment, focus, disabled, and transition classes.
  - `label`: Label wrapper (`truncate`).
  - `icon`: Leading/trailing icon wrapper (`shrink-0`, sized per `size` variant).
  - `iconInner`: Inner `c-icon` class (`w-full h-full block`).
  - `spinner`: Loading spinner wrapper (`shrink-0`, sized per `size` variant).
  - `spinnerIcon`: Inner `c-icon` spinner class (`w-full h-full animate-spin`).
- **Variants**:
  - `color`: Configured theme colors (`DEFAULT_THEME_COLORS` / `options.colors`) plus `"neutral"` (e.g. `"primary"`, `"neutral"`, `"danger"`, `"success"`, `"warning"`, `"info"`).
  - `variant`: `"solid"`, `"outline"`, `"ghost"`, `"soft"`, `"secondary"`.
  - `size`: `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`.
  - `block`: `true`.
  - `disabled`: `true`.
  - `loading`: `true`.
  - **Compound Variants**: Color + variant combinations for `"solid"`, `"outline"`, `"ghost"`, and `"soft"` across all configured colors and `"neutral"`.
- **Default Variants**:
  - `variant`: `"solid"`
  - `color`: `"primary"`
  - `size`: `"md"`

---

## Examples

### WXML

```xml
<!-- Standard button with label and icon -->
<c-button
  label="Submit"
  color="primary"
  variant="solid"
  size="md"
  leadingIcon="check"
  loading="{{isSubmitting}}"
  bind:tap="onSubmit"
/>

<!-- Outline block button using default & trailing slots -->
<c-button
  variant="outline"
  color="neutral"
  block="{{true}}"
  slots="{{ { default: true, trailing: true } }}"
  ui="{{ { root: 'rounded-full' } }}"
  className="mt-4"
  bind:tap="onNext"
>
  <text>Continue</text>
  <text slot="trailing">→</text>
</c-button>
```

### TypeScript (Page / Parent Component)

```ts
Page({
  data: {
    isSubmitting: false,
  },

  async onSubmit() {
    this.setData({ isSubmitting: true });
    try {
      await submitForm();
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  onNext() {
    wx.navigateTo({ url: "/pages/next/index" });
  },
});
```
