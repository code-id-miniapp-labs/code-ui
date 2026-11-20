---
title: Button
description: Code UI button component with Tailwind-styled theming, leading/trailing icons, loading indicator, disabled handling, and native WeChat button integration.
---

## Overview

`c-button` is a Code UI (`@code-ui`, a Tailwind-styled WeChat MiniProgram component library) button component with configurable theming (`variant`, `color`, `size`, `block`), leading and trailing icons, a loading indicator (including automatic async loading support), disabled state handling, and native WeChat `<button>` integration (`open-type`, `form-type`, hover attributes, and open-ability callbacks).

It is a standalone component and renders `c-icon` internally as the fallback for icons and the loading spinner when custom slots are not provided.

## Usage

### Basic

Use the `label` prop to set the button text.

```html [index.wxml]
<c-button label="Button" />
```

### Color

Use the `color` prop to change the color of the button.

```html [index.wxml]
<c-button label="Primary" color="primary" />
<c-button label="Neutral" color="neutral" />
<c-button label="Danger" color="danger" />
<c-button label="Success" color="success" />
<c-button label="Warning" color="warning" />
<c-button label="Info" color="info" />
```

### Variant

Use the `variant` prop to change the style of the button.

```html [index.wxml]
<c-button label="Solid" variant="solid" />
<c-button label="Outline" variant="outline" />
<c-button label="Ghost" variant="ghost" />
<c-button label="Soft" variant="soft" />
<c-button label="Secondary" variant="secondary" />
```

### Size

Use the `size` prop to change the size of the button.

```html [index.wxml]
<c-button label="Extra Small" size="xs" />
<c-button label="Small" size="sm" />
<c-button label="Medium" size="md" />
<c-button label="Large" size="lg" />
<c-button label="Extra Large" size="xl" />
```

### Block

Use the `block` prop to expand the button to the full width of its container.

```html [index.wxml]
<c-button label="Continue" block="{{true}}" />
```

### Disabled

Use the `disabled` prop to disable button interaction and apply disabled styling.

```html [index.wxml]
<c-button label="Disabled" disabled="{{true}}" />
```

### Loading

Use the `loading` prop to display a loading spinner and disable interaction while loading. Use `loadingIcon` to customize the `c-icon` spinner name.

::code-group

```html [index.wxml]
<c-button
  label="Submit"
  loading="{{isSubmitting}}"
  loadingIcon="loading"
  bind:tap="onSubmit"
/>
```

```ts [index.ts]
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
});
```

::

### Loading Auto

Use the `loadingAuto` prop to enter the loading state automatically when a `tap` handler provides a `Promise` via `e.detail.setPromise`. Use `autoResetDuration` (default `1500` ms) to control when it resets after completion.

::note
**Why `e.detail.setPromise` is required in WeChat MiniProgram:** Unlike web JS frameworks such as React or Vue (where event handlers are passed as JS function props whose returned `Promise` can be awaited directly), WeChat MiniProgram's `triggerEvent` always returns `undefined` and WXML cannot pass functions as component props. Calling `e.detail.setPromise(promise)` inside `bind:tap` (or `bind:submit` on `<c-form>`) is how the handler hands the `Promise` back to `c-button`. If you prefer not to use `setPromise`, bind `loading="{{ isSubmitting }}"` to your page state instead.
::

::code-group

```html [index.wxml]
<c-button
  label="Save Changes"
  loadingAuto="{{true}}"
  autoResetDuration="{{1500}}"
  bind:tap="onSave"
/>
```

```ts [index.ts]
Page({
  onSave(e: WechatMiniprogram.CustomEvent) {
    e.detail.setPromise(saveChanges());
  },
});
```

::

When `formType="submit"` is used inside `<c-form>`, `loadingAuto` automatically inherits the form's submit lifecycle (validation + any `Promise` passed to `e.detail.setPromise` inside `<c-form>`'s `bind:submit`) without needing `bind:tap` on the button:

::code-group

```html [index.wxml]
<c-form bind:submit="onFormSubmit">
  <c-form-field name="email" label="Email">
    <c-input placeholder="name@example.com" />
  </c-form-field>
  <c-button
    label="Submit"
    form-type="submit"
    loading-auto="{{true}}"
  />
</c-form>
```

```ts [index.ts]
Page({
  onFormSubmit(e: WechatMiniprogram.CustomEvent) {
    e.detail.setPromise(submitToServer(e.detail.values));
  },
});
```

::

If you trigger submission programmatically via `useComponentRef` (`formRef.current?.submit()`) from a separate button's `bind:tap`, forward the returned promise to `e.detail.setPromise`:

```ts [index.ts]
Page({
  onExternalSubmitTap(e: WechatMiniprogram.CustomEvent) {
    const p = this.formRef.current?.submit();
    if (p) e.detail.setPromise(p);
  },
});
```

### Icon

Use `icon`, `leadingIcon`, and `trailingIcon` to render icons with `c-icon`. By default `icon` is placed at the leading position; set `trailing` to place it at the trailing end, or set `leading` for explicit leading positioning.

```html [index.wxml]
<c-button label="Search" icon="search" />
<c-button label="Confirm" leading="{{true}}" leadingIcon="check" />
<c-button label="Next" icon="arrow-right" trailing="{{true}}" />
<c-button label="Share" trailingIcon="share" />
```

### Slots

Provide custom slot markup for `(default)`, `icon`, `leading`, `trailing`, and `loadingIcon`.

```html [index.wxml]
<!-- Custom default, icon, and trailing slots -->
<c-button>
  <text slot="icon">★</text>
  <text>Favorite</text>
  <text slot="trailing">→</text>
</c-button>

<!-- Custom leading and loadingIcon slots -->
<c-button label="Upload" loading="{{isUploading}}">
  <text slot="leading">↑</text>
  <text slot="loadingIcon">⏳</text>
</c-button>
```

### Native Button

Forward native WeChat `<button>` attributes such as `formType`, `openType`, hover options, and customer-service / share parameters directly on `c-button`.

```html [index.wxml]
<!-- Form submit with custom hover behavior -->
<c-button
  label="Submit Form"
  formType="submit"
  hoverClass="opacity-80"
  hoverStartTime="{{20}}"
  hoverStayTime="{{70}}"
  hoverStopPropagation="{{true}}"
/>

<!-- Customer service button -->
<c-button
  label="Support"
  openType="contact"
  lang="en"
  sessionFrom="order-help"
  sendMessageTitle="Order Support"
  sendMessagePath="/pages/orders/index"
  sendMessageImg="/assets/support.png"
  showMessageCard="{{true}}"
/>

<!-- Launch app button -->
<c-button
  label="Open App"
  openType="launchApp"
  appParameter="from=miniprogram"
/>
```

### Events

Listen to `bind:tap` (ignored while `disabled` or `loading`) as well as forwarded native WeChat open-ability callbacks.

::code-group

```html [index.wxml]
<c-button label="Tap Me" bind:tap="onTap" />

<c-button
  label="Get Phone Number"
  openType="getPhoneNumber"
  bind:getphonenumber="onGetPhoneNumber"
  bind:error="onButtonError"
/>

<c-button
  label="Choose Avatar"
  openType="chooseAvatar"
  bind:chooseavatar="onChooseAvatar"
/>

<c-button
  label="Open Settings"
  openType="openSetting"
  bind:opensetting="onOpenSetting"
/>

<c-button
  label="Agree Privacy"
  openType="agreePrivacyAuthorization"
  bind:agreeprivacyauthorization="onAgreePrivacy"
/>

<c-button
  label="Contact"
  openType="contact"
  bind:contact="onContact"
/>

<c-button
  label="Launch App"
  openType="launchApp"
  bind:launchapp="onLaunchApp"
/>
```

```ts [index.ts]
Page({
  onTap(e: WechatMiniprogram.CustomEvent) {
    console.log("Tapped at:", e.detail.x, e.detail.y);
  },

  onGetPhoneNumber(e: WechatMiniprogram.CustomEvent) {
    console.log("Phone code:", e.detail.code);
  },

  onChooseAvatar(e: WechatMiniprogram.CustomEvent) {
    console.log("Avatar URL:", e.detail.avatarUrl);
  },

  onOpenSetting(e: WechatMiniprogram.CustomEvent) {
    console.log("Auth settings:", e.detail.authSetting);
  },

  onAgreePrivacy(e: WechatMiniprogram.CustomEvent) {
    console.log("Privacy authorization:", e.detail);
  },

  onContact(e: WechatMiniprogram.CustomEvent) {
    console.log("Contact callback:", e.detail);
  },

  onLaunchApp(e: WechatMiniprogram.CustomEvent) {
    console.log("Launch app:", e.detail);
  },

  onButtonError(e: WechatMiniprogram.CustomEvent) {
    console.error("Button error:", e.detail);
  },
});
```

::

### Custom Styling

Use `ui` to override classes on individual theme slots (`root`, `label`, `icon`, `iconInner`, `spinner`, `spinnerIcon`) and `className` to append classes to the `root` slot.

```html [index.wxml]
<c-button
  label="Rounded Button"
  leadingIcon="sparkles"
  ui="{{ { root: 'rounded-full px-6', label: 'font-semibold', icon: 'text-amber-300' } }}"
  className="mt-4"
/>
```

## Props

### Component Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `String` | `""` | Text label rendered inside the label container. Takes precedence over the default slot. |
| `variant` | `String` | `"solid"` | Visual style variant: `"solid"`, `"outline"`, `"ghost"`, `"soft"`, or `"secondary"`. |
| `color` | `String` | `"primary"` | Theme color key (e.g. `"primary"`, `"neutral"`, `"danger"`, `"success"`, `"warning"`, `"info"`). |
| `size` | `String` | `"md"` | Button size: `"xs"`, `"sm"`, `"md"`, `"lg"`, or `"xl"`. |
| `block` | `Boolean` | `false` | Expands the button to full container width (`w-full flex`). |
| `disabled` | `Boolean` | `false` | Disables button interaction and applies disabled styling and accessibility attributes. |
| `loading` | `Boolean` | `false` | Displays the loading spinner and disables interaction while loading. |
| `loadingAuto` | `Boolean` | `false` | Automatically enters loading when a tap handler provides or returns a `Promise` (via `setPromise` / `promise`). |
| `autoResetDuration` | `Number` | `1500` | Duration in milliseconds before auto-resetting after an async tap completes. |
| `icon` | `String` | `""` | Icon name rendered via `c-icon` (leading by default, or trailing when `trailing` is `true`). |
| `leading` | `Boolean` | `false` | Enables leading icon/spinner positioning. |
| `leadingIcon` | `String` | `""` | Leading icon name rendered via `c-icon`. |
| `trailing` | `Boolean` | `false` | Positions the icon/spinner at the trailing end of the button. |
| `trailingIcon` | `String` | `""` | Trailing icon name rendered via `c-icon`. |
| `loadingIcon` | `String` | `"loading"` | Icon name rendered via `c-icon` in the spinner container when loading without a `loadingIcon` slot. |
| `ui` | `Object` | `{}` | Per-slot class overrides keyed by theme slot (`root`, `label`, `icon`, `iconInner`, `spinner`, `spinnerIcon`). |
| `class` (`className`) | `String` | `""` | Additional CSS class string merged onto the `root` slot (exposed in runtime properties as `className`). |

### Native WeChat `<button>` Attributes

The template also forwards native MiniProgram `<button>` attributes from `wxButtonBehavior` onto the inner `<button>`: `openType` (`open-type`), `formType` (`form-type`), `hoverClass` (`hover-class`), `hoverStartTime` (`hover-start-time`), `hoverStayTime` (`hover-stay-time`), `hoverStopPropagation` (`hover-stop-propagation`), `lang`, `sessionFrom` (`session-from`), `sendMessageTitle` (`send-message-title`), `sendMessagePath` (`send-message-path`), `sendMessageImg` (`send-message-img`), `showMessageCard` (`show-message-card`), and `appParameter` (`app-parameter`).

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Label content rendered inside the `label` container when `label` is empty. When `label` is non-empty, `label` takes precedence. |
| `icon` | Custom leading icon rendered inside the leading `icon` container (when not in leading loading). Takes precedence over `leading` and `c-icon`. |
| `leading` | Custom leading content rendered before the label when the `icon` slot is not provided. Falls back to `<c-icon>` when `leadingIcon` or `icon` is set. |
| `trailing` | Custom trailing content rendered after the label when not loading. Falls back to `<c-icon>` when `trailingIcon` (or trailing `icon`) is set. |
| `loadingIcon` | Custom spinner rendered inside the `spinner` container (leading or trailing depending on placement) while `loading` is `true`. Falls back to `<c-icon name="{{loadingIcon}}">`. |

## Events

| Event | Detail Payload | Description |
| --- | --- | --- |
| `bind:tap` | `ButtonTapDetail`: `{ x?: number; y?: number; promise?: Promise<any>; setPromise?: (promise: Promise<any>) => void; [key: string]: any }` | Dispatched when tapped (ignored when `disabled` or `loading`). Supports `setPromise` / `promise` when `loadingAuto` is enabled. |
| `bind:getphonenumber` | Native WeChat event `detail` | Forwarded from `<button bindgetphonenumber>`. |
| `bind:chooseavatar` | Native WeChat event `detail` | Forwarded from `<button bindchooseavatar>`. |
| `bind:contact` | Native WeChat event `detail` | Forwarded from `<button bindcontact>`. |
| `bind:error` | Native WeChat event `detail` | Forwarded from `<button binderror>`. |
| `bind:opensetting` | Native WeChat event `detail` | Forwarded from `<button bindopensetting>`. |
| `bind:launchapp` | Native WeChat event `detail` | Forwarded from `<button bindlaunchapp>`. |
| `bind:agreeprivacyauthorization` | Native WeChat event `detail` | Forwarded from `<button bindagreeprivacyauthorization>`. |

## Theme

Customize the `button` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    button: {
      slots: {
        root: "inline-flex font-sans rounded-md items-center justify-center font-medium select-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 transition-colors appearance-none",
        label: "truncate",
        icon: "shrink-0",
        iconInner: "w-full h-full block",
        spinner: "shrink-0",
        spinnerIcon: "w-full h-full animate-spin",
      },
      variants: {
        color: Object.assign(
          Object.fromEntries(colors.map((color) => [color, {}])),
          { neutral: {} },
        ),
        variant: {
          solid: {
            root: "",
          },
          outline: {
            root: "border bg-transparent",
          },
          ghost: {
            root: "bg-transparent",
          },
          soft: {
            root: "",
          },
          secondary: {
            root: "bg-elevated text-highlighted active:bg-accented",
          },
        },
        size: {
          xs: {
            root: "px-2 py-1 text-xs gap-1",
            icon: "w-3.5 h-3.5",
            spinner: "w-3.5 h-3.5",
          },
          sm: {
            root: "px-2.5 py-1.5 text-xs gap-1.5",
            icon: "w-4 h-4",
            spinner: "w-4 h-4",
          },
          md: {
            root: "px-2.5 py-1.5 text-sm gap-1.5",
            icon: "w-4 h-4",
            spinner: "w-4 h-4",
          },
          lg: {
            root: "px-3 py-2 text-sm gap-2",
            icon: "w-5 h-5",
            spinner: "w-5 h-5",
          },
          xl: {
            root: "px-3 py-2 text-base gap-2",
            icon: "w-5 h-5",
            spinner: "w-5 h-5",
          },
        },
        block: {
          true: {
            root: "w-full flex",
          },
        },
        disabled: {
          true: {
            root: "cursor-not-allowed opacity-60 pointer-events-none",
          },
        },
        loading: {
          true: {
            root: "",
          },
        },
      },
      compoundVariants: [
        ...colors.map((color) => ({
          color,
          variant: "solid" as const,
          class: {
            root: `bg-${color} text-white border active:bg-${color}/90`,
          },
        })),
        {
          color: "neutral" as const,
          variant: "solid" as const,
          class: {
            root: "bg-neutral text-white border active:bg-neutral/90",
          },
        },
        ...colors.map((color) => ({
          color,
          variant: "outline" as const,
          class: {
            root: `border border-${color} text-${color} active:bg-${color}/10`,
          },
        })),
        {
          color: "neutral" as const,
          variant: "outline" as const,
          class: {
            root: "border border-neutral text-neutral active:bg-neutral/10",
          },
        },
        ...colors.map((color) => ({
          color,
          variant: "ghost" as const,
          class: {
            root: `text-${color} active:bg-${color}/10`,
          },
        })),
        {
          color: "neutral" as const,
          variant: "ghost" as const,
          class: {
            root: "text-neutral active:bg-neutral/10",
          },
        },
        ...colors.map((color) => ({
          color,
          variant: "soft" as const,
          class: {
            root: `bg-${color}/10 text-${color} border-transparent active:bg-${color}/20`,
          },
        })),
        {
          color: "neutral" as const,
          variant: "soft" as const,
          class: {
            root: "bg-neutral/10 text-neutral border-transparent active:bg-neutral/20",
          },
        },
      ],
      defaultVariants: {
        variant: "solid",
        color: "primary",
        size: "md",
      },
    }
  }
})
```
