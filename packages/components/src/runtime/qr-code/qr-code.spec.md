# QR Code (`c-qr-code`)

## Overview & Tier

- **Purpose**: Renders a QR code as an SVG data URL inside an `<image>` element from a string or URL payload, with configurable error correction, quiet zone border, encoding options, theme sizing/colors, and an optional centered overlay.
- **Architecture Tier**: **Tier 2 — Interactive / Stateful** (backed by the `@code-id-labs/qr-code` state machine via `createMachineBehavior` in `packages/components/src/runtime/qr-code/index.ts`, alongside `computedBehavior` from `../_shared/base`).
- **Compound Relationships**: Standalone component (no parent/child compound components).

---

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
| `className` | `string` | `""` | Additional CSS class(es) applied to the `root` slot (exposed as `className` rather than `class` on the runtime component). |

### Imperative Methods

Accessed via `this.selectComponent("#my-qr")`:

- `setValue(value: string): void` — Updates the encoded QR payload.
- `setEncoding(encoding: QrCodeEncodingOptions): void` — Updates the QR encoding options.
- `getDataUrl(type?: "svg"): string` — Returns the generated `data:image/svg+xml;utf8,...` data URL string.

---

## Slots

| Name | Behavior |
| :--- | :--- |
| **Default slot** | None (unnamed `<slot />` is not rendered). |
| `overlay` | Renders custom content inside the centered overlay `<view>` (`data-part="overlay"`). |

### MiniProgram Slot Constraints & Conditional Rendering

- WeChat MiniProgram `<slot>` elements are static (no scoped slots) and silently discard nested fallback markup.
- To avoid `<slot>` fallback issues, the overlay container is conditionally rendered via `wx:if="{{showOverlay || overlaySrc || slots.overlay}}"`.
- When `overlaySrc` is set, `<image wx:if="{{overlaySrc}}" ... />` renders inside the overlay container alongside `<slot name="overlay" />`.
- The `slots.overlay` flag defaults to `false` in the component definition (`slots: { overlay: false }`) and tracks whether `slot="overlay"` content is supplied.

---

## Events

None. (`<c-qr-code>` does not emit any `bind:*` custom events.)

---

## Theme

Defined in `packages/core/src/theme/definitions/qr-code.ts`:

### `slots`

| Slot | Base Classes |
| :--- | :--- |
| `root` | `"relative inline-flex items-center justify-center rounded-md bg-white border border-neutral-200 shadow-sm"` |
| `frame` | `"w-full h-full block"` |
| `pattern` | `"fill-current"` |
| `overlay` | `"absolute inset-0 m-auto flex items-center justify-center rounded-lg bg-white p-1 shadow-sm"` |
| `overlayImage` | `"w-full h-full rounded-sm"` |

### `variants`

- **`color`**:
  - Each color in `DEFAULT_THEME_COLORS` maps to `{ root: "text-<color>" }`.
  - `neutral`: `{ root: "text-neutral-900" }`.
- **`size`**:
  - `xs`: `{ root: "w-24 h-24 p-1.5", overlay: "w-6 h-6" }`
  - `sm`: `{ root: "w-32 h-32 p-2", overlay: "w-8 h-8" }`
  - `md`: `{ root: "w-40 h-40 p-2.5", overlay: "w-10 h-10" }`
  - `lg`: `{ root: "w-48 h-48 p-3", overlay: "w-12 h-12" }`
  - `xl`: `{ root: "w-56 h-56 p-3.5", overlay: "w-14 h-14" }`

### `defaultVariants`

```ts
{
  color: "neutral",
  size: "md",
}
```

---

## Examples

### WXML

```xml
<!-- Basic QR code -->
<c-qr-code value="https://example.com" size="md" ecc="M" />

<!-- QR code with center logo image and custom slot overrides -->
<c-qr-code
  id="share-qr"
  value="{{qrValue}}"
  size="lg"
  color="primary"
  ecc="H"
  overlaySrc="/assets/logo.png"
  ui="{{qrUi}}"
  className="mx-auto"
/>

<!-- QR code with custom overlay slot content -->
<c-qr-code value="{{qrValue}}" ecc="H" showOverlay="{{true}}">
  <view slot="overlay" class="text-xs font-bold">LOGO</view>
</c-qr-code>
```

### TypeScript (Page / Component)

```ts
Page({
  data: {
    qrValue: "https://example.com/invite/123",
    qrUi: {
      root: "rounded-xl",
      overlay: "rounded-full",
    },
  },

  updateQrCode() {
    const qr = this.selectComponent("#share-qr");
    qr?.setValue("https://example.com/invite/456");
    qr?.setEncoding({ ecc: "H", border: 2 });
    const dataUrl = qr?.getDataUrl("svg");
    console.log(dataUrl);
  },
});
```
