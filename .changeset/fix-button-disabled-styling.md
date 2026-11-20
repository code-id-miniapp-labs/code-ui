---
"@code-id-labs/components": patch
---

Fix `c-button` native disabled styling override when using `formType` with `loadingAuto` by removing the native `disabled` attribute and guarding `form-type` and `open-type` while disabled or loading.
