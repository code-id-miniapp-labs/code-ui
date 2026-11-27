---
"@code-id-labs/components": minor
---

Fix frozen `<scroll-view>` scrollbar indicator on `<c-drawer>` and `<c-modal>` and expose scroll-view configuration props:

- Remove redundant `overflow-y-auto` from `drawer` and `modal` `body` theme slots so `<scroll-view>` is the sole scroll container without a stuck outer CSS scrollbar.
- Expose `scrollY` (default `true`), `enhanced` (`true`), `bounces` (`false`), and `showScrollbar` (`false`) on `<c-drawer>`, and `enhanced`, `bounces`, and `showScrollbar` on `<c-modal>`.
