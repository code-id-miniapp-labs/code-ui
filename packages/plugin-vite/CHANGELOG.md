# @code-ui/plugin-vite

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
