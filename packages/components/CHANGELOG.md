# @code-ui/components

## 1.2.4

### Patch Changes

- 0687b7d: Fix global component theme overrides (`components.<name>` and `ui.<name>` in `cui.config.ts`) not taking effect in pre-built runtime components by tagging serialized theme configs with their component name and merging `globalThis.__CODE_UI_GLOBAL_CONFIG__` overrides inside `tv()`.

## 1.2.3

### Patch Changes

- 44f1b82: Fix missing Tailwind and Code UI CSS variables (`--spacing`, `--text-*`, `--radius-*`, `--ui-*`) inside `custom-tab-bar` and `<root-portal>` by expanding root variable selectors to include `root-portal`, `custom-tab-bar`, `.light`, and `.dark`, and adding `tw-root` to overlay portal wrappers.

## 1.2.2

## 1.2.1

### Patch Changes

- b52efa4: Emit standalone `dist/computed.d.ts` type declarations for the `@code-id-labs/components/computed` subpath export.

## 1.2.0

### Minor Changes

- 8101c79: Expose `createPageOptions`, `createComponentOptions`, and `computedBehavior` via the new `@code-id-labs/components/computed` subpath export.

## 1.1.0

### Minor Changes

- d3e8730: Add `leadingIcon`, `trailingIcon`, `icon`, `leading`, and `trailing` props along with `leading` and `trailing` named slots to `c-form-field` using `useComponentIcons`, including `leadingIcon`/`trailingIcon` theme slots and compile-time slot manifest support.

## 1.0.8

### Patch Changes

- 2c914f8: Refactor `banner`, `file-upload`, and `form` state machines to use declarative `target` transitions (`OPEN`, guarded `SET_UPLOADING`, and form lifecycle events) and guard `file-upload` `setValue`/`hydrateLocalImages` against non-array file lists.

## 1.0.7

### Patch Changes

- 7983505: Fix `c-button` native disabled styling override when using `formType` with `loadingAuto` by removing the native `disabled` attribute and guarding `form-type` and `open-type` while disabled or loading.

## 1.0.6

### Patch Changes

- d7681fd: Remove redundant `rootStyle` prop from `c-qr-code` in favor of `ui` and `className`.

## 1.0.5

## 1.0.4

### Patch Changes

- 2fc4b1b: - **button / form**: Link `<c-button>` to ancestor `<c-form>` via form relations (and add `wx://form-field-button` for native `<form>` support) so `form-type="submit"` and `form-type="reset"` reliably trigger `<c-form>`'s `bind:submit` and `bind:reset`.
  - **button / form**: Support `e.detail.setPromise(promise)` in `<c-form>`'s `bind:submit` and inherit the form submit promise in `<c-button form-type="submit" loading-auto="{{true}}" />` so the button stays in its loading state until validation and async submission settle.

## 1.0.3

## 1.0.2

## 1.0.1

### Patch Changes

- f2eb88a: - **file-upload**: Add built-in fullscreen `<root-portal>` swipeable preview overlay (`previewMode="overlay"`) with base64 data-URI hydration for local temporary images and theme-based safe-area slots.
  - **form & form-field**: Fix `focusOnError` and `scrollToError` on simulator and real devices by resolving unique `form-field` IDs, atomic `#rootId` selector measurement, and refocus pulsing on form controls.
  - **drawer**: Position drawer above virtual keyboard across all placements (`bottom`, `top`, `left`, `right`) via `root` padding and `keyboardOpen` theme variants, and optimize `<c-app>` background scaling.
  - **action-sheet**: Reserve symmetric header clearance (`closable` variant `px-14 min-h-14` and `break-words`) so long titles and descriptions never collide with `closeTrigger`.
  - **overlays & plugin-vite**: Render `modal`, `drawer`, `action-sheet`, and `popover` inside `<root-portal>` with semantic `--z-*` layering variables and automatic `<c-app>` wrapper injection.

## 2.0.0

### Major Changes

- Initial v1.0.0 public release with prebuilt MiniProgram UI components, Vite plugin (with built-in Lucide icons), CLI scaffolding, and composables (useToast, useComponentRef, useColorMode).

## 1.0.0

### Major Changes

- Initial v1.0.0 public release with prebuilt MiniProgram UI components, Vite plugin (with built-in Lucide icons), CLI scaffolding, and composables (useToast, useComponentRef, useColorMode).
