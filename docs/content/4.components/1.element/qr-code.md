---
title: QrCode
description: Renders a QR code as an SVG data URL from a string or URL payload with configurable error correction, quiet zone border, encoding options, theme sizing/colors, and an optional centered overlay.
---

## Overview

`c-qr-code` is a standalone component that renders a QR code as an SVG data URL inside an `<image>` element from a string or URL payload, with configurable error correction, quiet zone border, encoding options, theme sizing/colors, and an optional centered overlay.

## Usage

### Basic

Pass a string or URL to `value` to render a QR code.

```html [index.wxml]
<c-qr-code value="https://example.com" />
```

### Controlled & Uncontrolled

Use `defaultValue` for an uncontrolled initial payload, or bind `value` to update the QR code reactively from page data.

::code-group

```html [index.wxml]
<!-- Uncontrolled -->
<c-qr-code defaultValue="https://example.com" />

<!-- Controlled -->
<c-qr-code value="{{qrValue}}" />
```

```ts [index.ts]
Page({
  data: {
    qrValue: "https://example.com/invite/123",
  },
});
```

::

### Color

Use the `color` prop to change the QR code color theme. Available variants are `neutral` (default), `primary`, `danger`, `success`, `warning`, and `info`.

```html [index.wxml]
<c-qr-code value="https://example.com" color="neutral" />
<c-qr-code value="https://example.com" color="primary" />
<c-qr-code value="https://example.com" color="success" />
<c-qr-code value="https://example.com" color="warning" />
<c-qr-code value="https://example.com" color="danger" />
<c-qr-code value="https://example.com" color="info" />
```

### Size

Use the `size` prop to control the dimensions of the QR code and its centered overlay. Available sizes are `xs`, `sm`, `md` (default), `lg`, and `xl`.

```html [index.wxml]
<c-qr-code value="https://example.com" size="xs" />
<c-qr-code value="https://example.com" size="sm" />
<c-qr-code value="https://example.com" size="md" />
<c-qr-code value="https://example.com" size="lg" />
<c-qr-code value="https://example.com" size="xl" />
```

### Error Correction & Border

Use `ecc` (`"L"`, `"M"`, `"Q"`, `"H"`) to set the error correction level, `border` to add a quiet zone (in modules), and `pixelSize` to adjust the SVG `viewBox` module scale.

```html [index.wxml]
<c-qr-code
  value="https://example.com"
  ecc="H"
  border="{{2}}"
  pixelSize="{{12}}"
/>
```

### Encoding Options

Pass an `encoding` object for advanced QR generation options such as `ecc`, `border`, `maskPattern`, `boostEcc`, `minVersion`, `maxVersion`, and `invert`.

::code-group

```html [index.wxml]
<c-qr-code value="https://example.com" encoding="{{encodingOptions}}" />
```

```ts [index.ts]
Page({
  data: {
    encodingOptions: {
      ecc: "H",
      border: 2,
      boostEcc: true,
      minVersion: 2,
      maxVersion: 10,
      invert: false,
    },
  },
});
```

::

### Overlay Image

Use `overlaySrc` to display a centered logo image inside the QR code. Pair it with `ecc="H"` so the QR code remains scannable.

```html [index.wxml]
<c-qr-code
  value="https://example.com"
  ecc="H"
  size="lg"
  overlaySrc="/assets/logo.png"
/>
```

### Overlay Slot

Use the `overlay` slot to render custom content in the center of the QR code, or set `showOverlay` to render the overlay container without an image or slot content.

```html [index.wxml]
<c-qr-code value="https://example.com" ecc="H" size="lg">
  <view slot="overlay" class="text-xs font-bold">LOGO</view>
</c-qr-code>

<c-qr-code value="https://example.com" ecc="H" showOverlay="{{true}}" />
```

### Imperative Methods

Retrieve the component instance with `this.selectComponent` to call `setValue`, `setEncoding`, or `getDataUrl`.

::code-group

```html [index.wxml]
<c-qr-code id="share-qr" defaultValue="https://example.com/invite/123" />
```

```ts [index.ts]
Page({
  updateQrCode() {
    const qr = this.selectComponent("#share-qr");
    qr?.setValue("https://example.com/invite/456");
    qr?.setEncoding({ ecc: "H", border: 2 });
    const dataUrl = qr?.getDataUrl("svg");
    console.log(dataUrl);
  },
});
```

::

### Custom Styling

Use `ui` to override theme slots (`root`, `frame`, `pattern`, `overlay`, `overlayImage`), `className` to add classes to the root element, and `rootStyle` to append inline styles.

::code-group

```html [index.wxml]
<c-qr-code
  value="https://example.com"
  overlaySrc="/assets/logo.png"
  ecc="H"
  ui="{{qrUi}}"
  className="mx-auto"
  rootStyle="padding: 16px;"
/>
```

```ts [index.ts]
Page({
  data: {
    qrUi: {
      root: "rounded-xl",
      overlay: "rounded-full",
    },
  },
});
```

::

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string \| null` | `null` | Controlled payload string or URL to encode into the QR code. |
| `defaultValue` | `string` | `""` | Initial payload string when used uncontrolled. |
| `ecc` | `"L" \| "M" \| "Q" \| "H"` | `"M"` | Error correction level shorthand (`L` ~7%, `M` ~15%, `Q` ~25%, `H` ~30% recovery). |
| `border` | `number` | `0` | Quiet zone border width around the QR code, in modules. |
| `encoding` | `QrCodeEncodingOptions` | `{}` | Advanced encoding configuration (`ecc`, `border`, `maskPattern`, `boostEcc`, `minVersion`, `maxVersion`, `invert`). |
| `pixelSize` | `number` | `10` | Pixel size multiplier per QR module used for SVG `viewBox` dimensions. |
| `color` | `"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info" \| string` | `"neutral"` | Color variant applied to the QR code root container. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| string` | `"md"` | Size variant controlling the root and overlay dimensions. |
| `overlaySrc` | `string` | `""` | Image URL rendered in the center overlay (`mode="aspectFit"`). |
| `showOverlay` | `boolean` | `false` | Forces the center overlay container to render even when `overlaySrc` and the `overlay` slot are not provided. |
| `ui` | `Record<string, string>` | `{}` | Per-slot class overrides merged with the resolved theme classes (`root`, `frame`, `pattern`, `overlay`, `overlayImage`). |
| `className` | `string` | `""` | Additional CSS class(es) applied to the `root` slot. |
| `rootStyle` | `string` | `""` | Inline style string appended to the root `<view>` element's `style` attribute. |

### Imperative Methods

Accessed via `this.selectComponent("#my-qr")`:

- `setValue(value: string): void` — Updates the encoded QR payload.
- `setEncoding(encoding: QrCodeEncodingOptions): void` — Updates the QR encoding options.
- `getDataUrl(type?: "svg"): string` — Returns the generated `data:image/svg+xml;utf8,...` data URL string.

## Slots

| Name | Description |
| :--- | :--- |
| **Default slot** | None (unnamed `<slot />` is not rendered). |
| `overlay` | Renders custom content inside the centered overlay container. When `overlaySrc` is set, the overlay image renders alongside the `overlay` slot. |

## Events

None. `<c-qr-code>` does not emit any `bind:*` custom events.

## Theme

Customize the `qr-code` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    qrCode: {
      slots: {
        root: "relative inline-flex items-center justify-center rounded-md bg-white border border-neutral-200 shadow-sm",
        frame: "w-full h-full block",
        pattern: "fill-current",
        overlay:
          "absolute inset-0 m-auto flex items-center justify-center rounded-lg bg-white p-1 shadow-sm",
        overlayImage: "w-full h-full rounded-sm",
      },
      variants: {
        color: {
          primary: {
            root: "text-primary",
          },
          secondary: {
            root: "text-secondary",
          },
          danger: {
            root: "text-danger",
          },
          success: {
            root: "text-success",
          },
          warning: {
            root: "text-warning",
          },
          info: {
            root: "text-info",
          },
          neutral: {
            root: "text-neutral-900",
          },
        },
        size: {
          xs: {
            root: "w-24 h-24 p-1.5",
            overlay: "w-6 h-6",
          },
          sm: {
            root: "w-32 h-32 p-2",
            overlay: "w-8 h-8",
          },
          md: {
            root: "w-40 h-40 p-2.5",
            overlay: "w-10 h-10",
          },
          lg: {
            root: "w-48 h-48 p-3",
            overlay: "w-12 h-12",
          },
          xl: {
            root: "w-56 h-56 p-3.5",
            overlay: "w-14 h-14",
          },
        },
      },
      defaultVariants: {
        color: "neutral",
        size: "md",
      },
    },
  },
})
```
