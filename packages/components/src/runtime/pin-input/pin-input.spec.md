# `<c-pin-input>` Component Specification

## Overview & Tier

- **Component**: `<c-pin-input>` (`packages/components/src/runtime/pin-input`)
- **Purpose**: Multi-cell PIN and one-time-code (OTP) input component supporting configurable length, character type filtering, masking, cell separators, focus management, and form field integration.
- **Architecture Tier**: **Tier 2 — Interactive / Stateful** (backed by `@code-id-labs/pin-input` machine & connect layer, with `@code-id-labs/miniapp/behaviors/form` `withFormField()` integration for `<c-form>` / `<c-form-field>`).
- **Compound Structure**: Standalone component (not compound). Individual cells and separators are rendered internally via `wx:for` over `pinInput.inputs`. Exposes its `pinInput` API on the component instance (`exportApi: true`).

---

## Props

> Runtime properties are composed from `defaultPinInputProps` (`@code-id-labs/pin-input`) and the component's own `properties` definition in `index.ts`. Form-related props from `withFormField()` and `PinInputProps` are also supported.

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string[] \| string \| null` | `null` | Controlled PIN value as an array of single-character strings or a combined string. |
| `defaultValue` | `string[] \| string \| null` | `undefined` | Initial uncontrolled PIN value (from `PinInputProps`). |
| `length` | `number` | `4` | Number of PIN input cells. |
| `type` | `"numeric" \| "alphanumeric" \| "alphabetic"` | `"numeric"` | Accepted character type. `"numeric"` configures native `<input type="number">`. |
| `label` | `string` | `""` | Optional text label rendered above the cells. Takes precedence over the `label` slot when non-empty. |
| `placeholder` | `string` | `""` | Placeholder character displayed in empty cells. |
| `mask` | `boolean` | `false` | Masks entered characters using native `password` mode when a cell has a value. |
| `disabled` | `boolean` | `false` | Disables interaction across all cells. |
| `readOnly` | `boolean` | `false` | Prevents editing across all cells while preserving non-disabled styling. |
| `invalid` | `boolean \| null` | `null` | Explicit invalid state. When `null`, inherits validation state from form integration. |
| `otp` | `boolean` | `true` | Enables one-time-code (OTP) auto-fill handling. |
| `autoFocus` | `boolean` | `false` | Automatically focuses the first cell on mount. |
| `blurOnComplete` | `boolean` | `false` | Blurs the active cell once all cells are filled. |
| `selectOnFocus` | `boolean` | `false` | Selects existing cell text on focus. |
| `separator` | `boolean \| number \| number[]` | `false` | Renders separators between cells: `true` inserts at `Math.floor(length / 2)`, a `number` inserts after every Nth cell, and `number[]` inserts after specified 1-based cell counts (e.g. `[3]`). |
| `separatorChar` | `string` | `"-"` | Character rendered inside separator elements. |
| `variant` | `"outline" \| "soft" \| "subtle" \| "ghost" \| "none"` | `"outline"` | Visual style variant for input cells. |
| `color` | `"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info"` | `"primary"` | Accent color applied to focus and highlight rings/borders. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Cell and separator size. Falls back to form `fieldSize` or `"md"` when empty. |
| `highlight` | `boolean` | `false` | Keeps the active `color` border/ring highlighted even when not focused. |
| `name` | `string` | `""` | Field name for form registration and hidden input metadata. |
| `form` | `string` | `undefined` | Target `<c-form>` id/name when multiple forms exist on the same page. |
| `rules` | `FormRule[]` | `undefined` | Field-level validation rules for form integration. |
| `validateOn` | `FormValidateOn` | `undefined` | Field-level override for form validation triggers. |
| `fieldDisabled` | `boolean` | `undefined` | Disabled state inherited from a wrapping form field. |
| `ui` | `Partial<Record<"root" \| "label" \| "control" \| "input" \| "nativeInput" \| "separator", string>>` | `{}` | Per-slot Tailwind/utility class overrides merged with the resolved theme classes. |
| `className` | `string` | `""` | Additional root class override passed to `resolveSlots` (runtime property name for root `class` customization). |

---

## Slots

| Name | Behavior |
| :--- | :--- |
| `label` | Named slot for custom label markup rendered above the cell group (`<slot wx:elif="{{slots.label}}" name="label" />`). |
| *(default)* | Not supported. Cells and separators are rendered internally via `wx:for="{{pinInput.inputs}}"`. |

**MiniProgram `<slot>` Constraints**:
- WeChat MiniProgram `<slot>` does not support inline fallback content. Default label rendering uses conditional markup: `<text wx:if="{{label}}">{{label}}</text>` followed by `<slot wx:elif="{{slots.label}}" name="label" />`.
- When the `label` prop is non-empty, it takes precedence and the `label` slot is not rendered.
- `slots: { label: false }` enables active slot detection so `<slot name="label" />` is only mounted when the consumer provides `slot="label"` and `label` is empty.

---

## Events

The runtime template forwards native `<view>`/`<input>` interactions (`bindtap`, `bindinput`, `bindfocus`, `bindblur`) directly to the `pinInput` API without calling `this.triggerEvent` manually in `index.ts`. Callback contracts defined on `PinInputProps` (bridged by the machine behavior) use the following payloads:

| Event / Callback | Detail Payload | Description |
| :--- | :--- | :--- |
| `change` (`onChange`) | `{ value: string[], valueAsString: string }` | Fired when the PIN value changes. |
| `complete` (`onComplete`) | `{ value: string[], valueAsString: string }` | Fired when all cells have been filled. |
| `invalid` (`onInvalid`) | `{ value: string, index: number }` | Fired when an invalid character is entered for the configured `type`. |
| `focus` (`onFocus`) | `{ value: string[], valueAsString: string, index: number }` | Fired when a cell receives focus. |
| `blur` (`onBlur`) | `{ value: string[], valueAsString: string }` | Fired when focus leaves the PIN input. |

---

## Theme

Defined in `packages/core/src/theme/definitions/pin-input.ts`:

### Slots
- `root`: `"inline-flex flex-col gap-1.5"`
- `label`: `"text-sm font-medium text-highlighted"`
- `control`: `"relative inline-flex items-center gap-1.5"`
- `input`: `"flex items-center justify-center overflow-hidden min-h-0 box-border p-0 m-0 rounded-md border text-center font-semibold transition-colors focus:outline-none"`
- `nativeInput`: `"w-full min-h-0 bg-transparent border-0 p-0 m-0 text-center font-semibold text-inherit leading-normal focus:outline-none"`
- `separator`: `"text-dimmed font-medium select-none px-0.5"`

### Variants
- **`color`**: Theme colors from `DEFAULT_THEME_COLORS` (`primary`, `danger`, `success`, `warning`, `info`, etc.) plus `neutral` (styles `input` focus ring/border).
- **`variant`**: `"outline"` | `"soft"` | `"subtle"` | `"ghost"` | `"none"` (styles `input` background, text, and border).
- **`size`**: `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"` (scales `input` width/height/text and `separator` text).
- **`highlight`**: `true` | `false` (paired with `color` via compound variants to apply persistent border and ring styling on `input`).
- **`disabled`**: `true` | `false` (`true` applies `opacity-60 cursor-not-allowed` on `root` and `cursor-not-allowed bg-elevated text-dimmed` on `input`).
- **`invalid`**: `true` | `false` (`true` applies error color border and ring styling on `input` via compound variant).

### Default Variants
- `variant`: `"outline"`
- `color`: `"primary"`
- `size`: `"md"`
- `highlight`: `false`
- `disabled`: `false`
- `invalid`: `false`

---

## Examples

### Basic 6-digit OTP with Separator (WXML)

```xml
<c-pin-input
  label="Verification Code"
  length="{{6}}"
  separator="{{3}}"
  otp="{{true}}"
  value="{{code}}"
  bind:change="onCodeChange"
  bind:complete="onCodeComplete"
/>
```

### Masked PIN with Custom Label Slot & `ui` Overrides (WXML)

```xml
<c-pin-input
  length="{{4}}"
  mask="{{true}}"
  variant="subtle"
  size="lg"
  className="my-4"
  ui="{{ { input: 'rounded-xl', separator: 'text-primary' } }}"
>
  <view slot="label" class="text-sm font-semibold">Enter Security PIN</view>
</c-pin-input>
```

### Page Controller (TypeScript)

```ts
Page({
  data: {
    code: "",
  },

  onCodeChange(e: WechatMiniprogram.CustomEvent<{ value: string[]; valueAsString: string }>) {
    this.setData({ code: e.detail.valueAsString });
  },

  onCodeComplete(e: WechatMiniprogram.CustomEvent<{ value: string[]; valueAsString: string }>) {
    console.log("Completed PIN:", e.detail.valueAsString);
  },
});
```
