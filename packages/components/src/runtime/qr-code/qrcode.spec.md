# QR Code Component Specification

## 1. Overview

- **Purpose:** Generates and displays standard two-dimensional barcodes (QR Codes) for URLs, text, authentication, and payments, with optional center overlay logo/icon support.
- **Category:** Interactive / Stateful Machine (Zag.js-inspired FSM + Connect pattern).
- **Core Engine:** Uses `uqr` (`unjs/uqr`) for zero-DOM, lightweight matrix and SVG path calculations.
- **Reference:** Zag.js `@zag-js/qr-code` & Nuxt UI / Tailwind UI patterns.

---

## 2. Anatomy

Defined in `packages/machines/qr-code/src/qr-code.anatomy.ts` via `createAnatomy`:

- **root:** The outer container wrapper.
- **frame:** The SVG or image rendering container.
- **pattern:** The QR code dark modules (rendered as an SVG `<path>` element or raster image).
- **overlay:** The centered overlay slot/container for brand logos, avatars, or icons.

---

## 3. State Machine Specification

_Implemented in `packages/machines/qr-code/`_

### Context (`QrCodeContext`)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Generated ID | Unique component ID. |
| `value` | `string` | `""` | The string/URL payload to encode into the QR code. |
| `encoding` | `{ ecc?: "L" \| "M" \| "Q" \| "H"; border?: number }` | `{ ecc: "M", border: 0 }` | Error correction level and quiet zone border module count. |
| `pixelSize` | `number` | `10` | The size multiplier per module (used for SVG `viewBox` calculations). |

### Machine States & Transitions

The QR Code machine operates with a lightweight state lifecycle:
- **`idle`**: Ready and rendered with the current `value`.
- **Events**:
  - `VALUE.SET`: Updates the encoded value.
  - `ENCODING.SET`: Updates ECC level or quiet zone border width.

### Connect API (`connectQrCode`)

Exposes Zag-style prop getters and computed values:
- `value`: Current encoded string.
- `encoded`: The computed QR matrix result from `uqr`.
- `path`: The computed SVG `d` path attribute string for the dark modules.
- `size`: The total matrix size (`(matrixSize + 2 * border) * pixelSize`).
- `getRootProps()`: Accessibility attributes (`role="img"`, `aria-label`).
- `getFrameProps()`: Dimensions and SVG `viewBox` attributes.
- `getPatternProps()`: SVG `path` props (`d`, `fill="currentColor"`).
- `getOverlayProps()`: Centered overlay placement attributes.
- `getDataUrl(type?: "svg")`: Generates a `data:image/svg+xml,...` string for export or `<image>` rendering.

---

## 4. Visual Specification (Theme)

_Implemented in `packages/core/src/theme/definitions/qr-code.ts`_

### Slots

- **root:** Outer container with optional card/border styling and background.
- **frame:** Aspect-square SVG wrapper.
- **pattern:** QR code pixel path color (`fill-current` / `fill-neutral-900`).
- **overlay:** Centered overlay container for logos or icons.

### Variants

| Variant | Options | Description |
| :--- | :--- | :--- |
| `size` | `xs`, `sm`, `md`, `lg`, `xl` | Dimensions of the QR code root and overlay. |
| `color` | Semantic colors (`neutral`, `primary`, etc.) | QR code pattern fill color. |

#### Size Matrix

| Size | Root Dimensions | Overlay Dimensions |
| :--- | :--- | :--- |
| `xs` | `w-24 h-24 p-1.5` | `w-6 h-6` |
| `sm` | `w-32 h-32 p-2` | `w-8 h-8` |
| `md` | `w-40 h-40 p-2.5` | `w-10 h-10` |
| `lg` | `w-48 h-48 p-3` | `w-12 h-12` |
| `xl` | `w-56 h-56 p-3.5` | `w-14 h-14` |

---

## 5. MiniProgram Runtime API

_Implemented in `packages/components/src/runtime/qr-code/`_

### Properties (Props)

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ui` | `Object` | `{}` | Slot style overrides (Nuxt UI v4 pattern). |
| `class` | `String` | `""` | Custom class on root element. |
| `value` | `String` | `""` | The payload text/URL to encode. |
| `ecc` | `String` | `"M"` | Error correction level (`"L"`, `"M"`, `"Q"`, `"H"`). |
| `border` | `Number` | `0` | Quiet zone margin around the code. |
| `size` | `String` | `"md"` | Size variant (`xs`, `sm`, `md`, `lg`, `xl`). |
| `color` | `String` | `"neutral"` | Color variant for the pattern. |
| `overlaySrc` | `String` | `""` | Optional center logo/image source URL. |

### Slots

- **`overlay`**: Custom slot to place any custom badge, avatar, or icon in the center instead of `overlaySrc`.

### Template Structure (`index.wxml`)

```xml
<view class="{{classes.root}}" style="{{rootStyle}}">
  <!-- Rendered via SVG Data URL -->
  <image class="{{classes.frame}}" src="{{qrCode.dataUrl}}" mode="aspectFit" />

  <!-- Overlay Slot / Logo -->
  <view wx:if="{{qrCode.showOverlay || qrCode.overlaySrc || overlaySrc || showOverlay}}" class="{{classes.overlay}}">
    <image wx:if="{{qrCode.overlaySrc || overlaySrc}}" src="{{qrCode.overlaySrc || overlaySrc}}" class="w-full h-full rounded" mode="aspectFit" />
    <slot name="overlay" />
  </view>
</view>
```
