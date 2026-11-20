---
title: Form
description: Form container wrapping MiniProgram's native `<form>` element to coordinate descendant field registration, synchronous/asynchronous validation rules, error reporting, dirty/touched tracking, and submit/reset lifecycles.
---

## Overview

`c-form` wraps MiniProgram's native `<form>` element to coordinate descendant form fields, validation rules, error reporting, dirty/touched state, and submit/reset lifecycles.

- **Parent Host (`FormHostContext`)**: Coordinates registration, validation, and value synchronization for descendant form field and control components.
- **Imperative API (`exportApi: true`)**: Exposes `validate`, `submit`, `reset`, `resetValidation`, `clearErrors`, `setErrors`, `getErrors`, `getValues`, `getFieldValue`, `setValues`, `setFieldValue`, `focusFirstError`, `scrollToFirstError`, `handleSubmit`, and `handleReset` via `selectComponent`.

## Usage

### Basic

Wrap descendant form fields and native `<button formType="submit">` / `<button formType="reset">` controls inside `<c-form>` with a `rules` map and `bind:submit` handler.

::code-group
```html [index.wxml]
<c-form
  id="login-form"
  rules="{{rules}}"
  bind:submit="onFormSubmit"
>
  <c-form-field name="email" label="Email" required="{{true}}">
    <c-input placeholder="you@example.com" />
  </c-form-field>
  <c-form-field name="password" label="Password" required="{{true}}">
    <c-input password="{{true}}" />
  </c-form-field>

  <view class="flex gap-2">
    <button formType="reset">Reset</button>
    <button formType="submit" type="primary">Sign In</button>
  </view>
</c-form>
```

```ts [index.ts]
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
    console.log("Submitted values:", e.detail.values);
  },
});
```
::

### Controlled & Default Values

Use `value` for a controlled or initial field values map, `defaultValue` to define fallback values for initialization and reset, and `name` to scope bindings when multiple `<c-form>` instances share a page.

::code-group
```html [index.wxml]
<c-form
  name="profile"
  value="{{formValues}}"
  defaultValue="{{defaultValues}}"
  bind:change="onFormChange"
  bind:reset="onFormReset"
>
  <c-form-field name="username" label="Username">
    <c-input />
  </c-form-field>
  <c-form-field name="nickname" label="Nickname">
    <c-input />
  </c-form-field>

  <button formType="reset">Reset to Defaults</button>
</c-form>
```

```ts [index.ts]
Page({
  data: {
    defaultValues: { username: "guest", nickname: "Guest" },
    formValues: { username: "alice", nickname: "Alice" },
  },

  onFormChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ formValues: e.detail });
  },

  onFormReset() {
    this.setData({ formValues: { ...this.data.defaultValues } });
  },
});
```
::

### Validation Rules

The `rules` prop accepts form-level validation rules keyed by field name (merged with field-level `rules`). Both serializable `FormRuleObject` descriptors (`required`, `minLength`, `maxLength`, `exactLength`, `pattern`, `patternFlags`, `email`, `numeric`, `min`, `max`, `sameAs`, `message`, `validator`) and `FormRuleFn` validator functions are supported.

::code-group
```html [index.wxml]
<c-form rules="{{rules}}" bind:submit="onSubmit">
  <c-form-field name="username" label="Username" required="{{true}}">
    <c-input />
  </c-form-field>
  <c-form-field name="age" label="Age">
    <c-input type="number" />
  </c-form-field>
  <c-form-field name="password" label="Password" required="{{true}}">
    <c-input password="{{true}}" />
  </c-form-field>
  <c-form-field name="confirmPassword" label="Confirm Password">
    <c-input password="{{true}}" />
  </c-form-field>

  <button formType="submit" type="primary">Register</button>
</c-form>
```

```ts [index.ts]
Page({
  data: {
    rules: {
      username: [
        { required: true, message: "Username is required" },
        { pattern: "^[a-z0-9_]+$", patternFlags: "i", message: "Alphanumeric or underscores only" },
      ],
      age: [
        { numeric: true, message: "Must be a number" },
        { min: 18, max: 120, message: "Age must be between 18 and 120" },
      ],
      password: [
        { required: true, minLength: 8, maxLength: 32, message: "8 to 32 characters" },
      ],
      confirmPassword: [
        { sameAs: "password", message: "Passwords must match" },
      ],
    },
  },

  onSubmit(e: WechatMiniprogram.CustomEvent) {
    console.log("Valid registration:", e.detail.values);
  },
});
```
::

### Validate Timing

Control when field validation runs with `validateOn` (default `["input", "change", "blur"]`) and `validateLazy` (defers `input`/`change` validation until a field has been touched/blurred or the form has been submitted).

```html
<c-form
  rules="{{rules}}"
  validateOn="{{['blur', 'submit']}}"
  validateLazy="{{true}}"
  bind:submit="onFormSubmit"
>
  <c-form-field name="email" label="Email">
    <c-input />
  </c-form-field>
  <button formType="submit" type="primary">Continue</button>
</c-form>
```

### Error Summary & Scroll / Focus

Enable `showErrors` to render a form-level error summary list below the form content when validation fails. Combine `focusOnError`, `scrollToError`, and `scrollOffset` to guide the user to the first invalid field.

```html
<c-form
  rules="{{rules}}"
  showErrors="{{true}}"
  focusOnError="{{true}}"
  scrollToError="{{true}}"
  scrollOffset="{{40}}"
  bind:error="onFormError"
>
  <c-form-field name="email" label="Email">
    <c-input />
  </c-form-field>
  <c-form-field name="password" label="Password">
    <c-input password="{{true}}" />
  </c-form-field>
  <button formType="submit" type="primary">Submit</button>
</c-form>
```

### Disabled

Set `disabled` to disable all descendant fields and apply the `disabled` root variant styles.

```html
<c-form disabled="{{true}}" value="{{ { email: 'alice@example.com' } }}">
  <c-form-field name="email" label="Email">
    <c-input />
  </c-form-field>
  <button formType="submit" type="primary">Save</button>
</c-form>
```

### Read-Only

Set `readOnly` to make all descendant fields readOnly without applying disabled styling.

```html
<c-form readOnly="{{true}}" value="{{ { email: 'alice@example.com' } }}">
  <c-form-field name="email" label="Email">
    <c-input />
  </c-form-field>
</c-form>
```

### Slots

`<c-form>` renders all descendant fields, labels, and action buttons through its single `default` slot inside the native `<form>` element.

```html
<c-form bind:submit="onFormSubmit">
  <c-form-field name="fullName" label="Full Name">
    <c-input />
  </c-form-field>
  <c-form-field name="company" label="Company">
    <c-input />
  </c-form-field>
  <button formType="submit" type="primary">Save</button>
</c-form>
```

### Async Submit & Loading Auto

When using `<c-button formType="submit" loadingAuto="{{true}}" />` inside `<c-form>`, pass your async request `Promise` to `e.detail.setPromise(...)` inside `bind:submit`. Both `<c-form>` (`submitting` state) and `<c-button>` (`loadingAuto`) will stay in their loading state until validation and the promise settle.

::note
**Why `e.detail.setPromise` is required:** WeChat MiniProgram's `triggerEvent` always returns `undefined` and discards any value returned by `bind:submit` handlers. Using `e.detail.setPromise(promise)` lets `<c-form>` and `<c-button loadingAuto>` track async submission without extra page state. If you trigger `formRef.current?.submit()` from an external button's `bind:tap`, forward the returned promise with `if (p) e.detail.setPromise(p)`.
::

::code-group
```html [index.wxml]
<c-form bind:submit="onFormSubmit">
  <c-form-field name="email" label="Email" required="{{true}}">
    <c-input placeholder="name@example.com" />
  </c-form-field>
  <c-button formType="submit" loadingAuto="{{true}}" label="Submit" />
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

### Events

Listen to `bind:submit`, `bind:error`, `bind:change`, `bind:validate`, and `bind:reset` to react to form lifecycle updates.

::code-group
```html [index.wxml]
<c-form
  rules="{{rules}}"
  bind:submit="onFormSubmit"
  bind:error="onFormError"
  bind:change="onFormChange"
  bind:validate="onFormValidate"
  bind:reset="onFormReset"
>
  <c-form-field name="email" label="Email">
    <c-input />
  </c-form-field>
  <view class="flex gap-2">
    <button formType="reset">Reset</button>
    <button formType="submit" type="primary">Submit</button>
  </view>
</c-form>
```

```ts [index.ts]
Page({
  data: {
    rules: {
      email: [{ required: true, email: true, message: "Valid email required" }],
    },
  },

  onFormSubmit(e: WechatMiniprogram.CustomEvent) {
    console.log("Submit:", e.detail.values, e.detail.valid);
  },

  onFormError(e: WechatMiniprogram.CustomEvent) {
    console.warn("Errors:", e.detail.errors, e.detail.errorBag);
  },

  onFormChange(e: WechatMiniprogram.CustomEvent) {
    console.log("Values changed:", e.detail);
  },

  onFormValidate(e: WechatMiniprogram.CustomEvent) {
    console.log("Validation result:", e.detail.valid, e.detail.errors);
  },

  onFormReset() {
    console.log("Form reset");
  },
});
```
::

### Imperative API

Retrieve the `<c-form>` instance with `this.selectComponent` to validate, submit, reset, read/update values, manage errors, or focus/scroll to the first error programmatically.

::code-group
```html [index.wxml]
<c-form id="account-form" rules="{{rules}}" showErrors="{{true}}">
  <c-form-field name="email" label="Email">
    <c-input />
  </c-form-field>
</c-form>

<view class="flex gap-2 mt-4">
  <button bindtap="validateManually">Validate</button>
  <button bindtap="prefillEmail">Prefill</button>
  <button bindtap="clearAll">Reset</button>
</view>
```

```ts [index.ts]
Page({
  data: {
    rules: {
      email: [{ required: true, email: true, message: "Valid email required" }],
    },
  },

  async validateManually() {
    const form = this.selectComponent("#account-form");
    const result = await form?.validate();
    if (!result?.valid) {
      form?.focusFirstError();
      form?.scrollToFirstError();
    }
  },

  prefillEmail() {
    const form = this.selectComponent("#account-form");
    form?.setFieldValue("email", "hello@example.com");
    form?.clearErrors("email");
  },

  clearAll() {
    const form = this.selectComponent("#account-form");
    form?.reset();
    form?.resetValidation();
  },
});
```
::

### Styling

Customize the `root`, `errors`, and `error` slots per instance with `ui`, or append classes to the `root` slot with `className` / `class`.

```html
<c-form
  showErrors="{{true}}"
  className="rounded-lg border p-4"
  ui="{{ { root: 'gap-6', errors: 'bg-danger/10 p-2 rounded', error: 'text-sm' } }}"
>
  <c-form-field name="email" label="Email">
    <c-input />
  </c-form-field>
  <button formType="submit" type="primary">Submit</button>
</c-form>
```

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

| Slot | Description |
| --- | --- |
| `default` | Renders descendant form fields, inputs, and action buttons inside the native `<form>` element. |

No named slots are defined.

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

Customize the `form` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    form: {
      slots: {
        root: "flex flex-col gap-4 w-full",
        errors: "flex flex-col gap-1 mt-1",
        error: "text-xs text-danger font-medium",
      },
      variants: {
        disabled: {
          true: {
            root: "opacity-60 pointer-events-none",
          },
          false: {
            root: "",
          },
        },
      },
      compoundVariants: [],
      defaultVariants: {
        disabled: false,
      },
    },
  },
})
```
