---
"@code-id-labs/core": patch
"@code-id-labs/components": minor
---

Add a globally configurable `placeholder` theme slot to `<c-input>` and remove the redundant `placeholderClass` prop:

- `@code-id-labs/core`: Add `placeholder: "text-dimmed"` slot to `inputTheme`.
- `@code-id-labs/components`: Bind `placeholder-class="{{classes.placeholder}}"` on `<c-input>` and remove `placeholderClass` so placeholder styling is configured consistently via `cui.config.ts` (`components.input.slots.placeholder`) or per-instance `ui.placeholder` with Tailwind class deduplication.
