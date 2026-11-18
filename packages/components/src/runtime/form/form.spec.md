# Form (`c-form`)

## Overview & Tier

- **Purpose**: Form container wrapping MiniProgram's native `<form>` element to coordinate descendant field registration, synchronous/asynchronous validation rules, error reporting, dirty/touched tracking, and submit/reset lifecycles.
- **Architecture Tier**: **Tier 3 Domain**
  - Uses the state machine in `packages/machines/form` (`formMachine`, `connectForm`) via `../_shared/machine`.
  - Connects to descendant form controls through the `withFormParent()` domain relation behavior from `@code-id-labs/miniapp/behaviors/form`.
- **Related Components**: Acts as the parent host (`FormHostContext`) for descendant form field/control components that register with `c-form`. Also exposes imperative form methods (`validate`, `submit`, `reset`, `resetValidation`, `clearErrors`, `setErrors`, `getErrors`, `getValues`, `getFieldValue`, `setValues`, `setFieldValue`, `focusFirstError`, `scrollToFirstError`, `handleSubmit`, `handleReset`) via `selectComponent` (`exportApi: true`).

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | `""` | Optional form name/identifier used to scope field bindings when multiple `<c-form>` instances share a page. |
| `value` | `Record<string, any> \| null` | `null` | Initial or controlled map of form field values. |
| `defaultValue` | `Record<string, any>` | `{}` | Default map of form field values used for initialization and reset. |
| `rules` | `Record<string, FormRule[]>` | `{}` | Form-level validation rules keyed by field name (merged with field-level `rules`). Supports validator functions (`FormRuleFn`) and serializable `FormRuleObject` descriptors (`required`, `minLength`, `maxLength`, `exactLength`, `pattern`, `patternFlags`, `email`, `numeric`, `min`, `max`, `sameAs`, `message`, `validator`). |
| `validateOn` | `FormValidateOn` (`FormValidateMode \| FormValidateTrigger[]`) | `["input", "change", "blur"]` | Event triggers that run field validation (`'input' \| 'change' \| 'blur' \| 'focus' \| 'submit' \| 'lazy' \| 'eager' \| '${trigger} lazy'`, or an array of triggers). |
| `validateLazy` | `boolean` | `false` | When `true`, `input` and `change` triggers only validate a field after it has been blurred/touched or after the first submit attempt. |
| `focusOnError` | `boolean` | `true` | Automatically focuses the first invalid field when submission fails validation. |
| `scrollToError` | `boolean` | `false` | Scrolls the page viewport to the first invalid field when submission fails validation. |
| `scrollOffset` | `number` | `24` | Top offset (in `px`) applied when scrolling to the first invalid field. |
| `disabled` | `boolean` | `false` | Disables all fields inside the form and applies the `disabled` root variant styles. |
| `readOnly` | `boolean` | `false` | Sets all fields inside the form to read-only. |
| `showErrors` | `boolean` | `false` | Renders a form-level error summary list below the default slot whenever the form has active validation errors. |
| `ui` | `FormUI` (`{ root?: string; errors?: string; error?: string }`) | `{}` | Per-slot class overrides merged with the resolved theme classes. |
| `className` / `class` | `string` | `""` | Additional CSS class name(s) appended to the `root` slot (declared as `className` in component `properties`). |

## Slots

| Slot | Behavior |
| --- | --- |
| `default` (`<slot />`) | Renders descendant form fields, inputs, and action buttons inside the native `<form>` element. Configured as a single default slot (`slots: { default: false }`). |

- **Named Slots**: None.
- **MiniProgram `<slot>` Constraints**: WeChat MiniProgram `<slot>` is static (scoped slots do not exist, and fallback content nested inside `<slot>` is not supported). Form-level error messages are therefore rendered conditionally by the component itself via `wx:if="{{showErrors && form.hasErrors}}"` rather than through a slot.

## Events

Native `<form>` `bindsubmit` and `bindreset` events are intercepted internally (`handleSubmit` / `handleReset`) and forwarded to the form controller, which triggers the corresponding lifecycle callbacks:

| Event | `detail` Payload | Description |
| --- | --- | --- |
| `bind:submit` | `{ values: Record<string, any>, valid: boolean, errors: FormFieldError[], errorBag: FormErrorBag }` | Fired when validation succeeds on submit (`FormSubmitDetails`). |
| `bind:error` | `{ errors: FormFieldError[], errorBag: FormErrorBag, values: Record<string, any> }` | Fired when validation fails on submit (`FormErrorDetails`). |
| `bind:change` | `Record<string, any>` | Fired whenever any registered field value changes with the current form values map. |
| `bind:reset` | `—` | Fired when the form is reset. |
| `bind:validate` | `{ valid: boolean, errors: FormFieldError[], errorBag: FormErrorBag, values: Record<string, any> }` | Fired after validation completes (`FormValidationResult`). |

## Theme

Defined in `packages/core/src/theme/definitions/form.ts`:

- **Slots**:
  - `root`: `"flex flex-col gap-4 w-full"`
  - `errors`: `"flex flex-col gap-1 mt-1"`
  - `error`: `` `text-xs text-${errorColor} font-medium` `` (`errorColor` defaults to `"danger"`)
- **Variants**:
  - `disabled`:
    - `true`: `{ root: "opacity-60 pointer-events-none" }`
    - `false`: `{ root: "" }`
- **Compound Variants**: `[]`
- **Default Variants**:
  - `disabled`: `false`

## Examples

### WXML

```xml
<c-form
  id="login-form"
  rules="{{rules}}"
  showErrors="{{true}}"
  ui="{{ { root: 'p-4' } }}"
  bind:submit="onFormSubmit"
  bind:error="onFormError"
>
  <c-input name="email" label="Email" placeholder="you@example.com" />
  <c-input name="password" label="Password" password="{{true}}" />

  <view class="flex gap-2">
    <button form-type="reset">Reset</button>
    <button form-type="submit" type="primary">Sign In</button>
  </view>
</c-form>
```

### TypeScript (Page / Parent Component)

```ts
Page({
  data: {
    rules: {
      email: [
        { required: true, message: "Email is required" },
        { email: true, message: "Enter a valid email address" },
      ],
      password: [
        { required: true, message: "Password is required" },
        { minLength: 8, message: "Minimum 8 characters" },
      ],
    },
  },

  onFormSubmit(e: WechatMiniprogram.CustomEvent) {
    const { values } = e.detail;
    console.log("Submitted values:", values);
  },

  onFormError(e: WechatMiniprogram.CustomEvent) {
    console.warn("Validation errors:", e.detail.errors);
  },

  async validateManually() {
    const form = this.selectComponent("#login-form");
    const result = await form?.validate();
    if (!result?.valid) {
      form?.focusFirstError();
    }
  },
});
```
