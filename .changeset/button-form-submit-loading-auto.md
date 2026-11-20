---
"@code-id-labs/components": patch
---

- **button / form**: Link `<c-button>` to ancestor `<c-form>` via form relations (and add `wx://form-field-button` for native `<form>` support) so `form-type="submit"` and `form-type="reset"` reliably trigger `<c-form>`'s `bind:submit` and `bind:reset`.
- **button / form**: Support `e.detail.setPromise(promise)` in `<c-form>`'s `bind:submit` and inherit the form submit promise in `<c-button form-type="submit" loading-auto="{{true}}" />` so the button stays in its loading state until validation and async submission settle.
