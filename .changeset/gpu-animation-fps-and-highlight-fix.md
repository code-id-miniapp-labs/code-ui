---
"@code-id-labs/components": patch
---

Improve animation FPS across overlays/controls and fix `<c-highlight>` inline text layout:

- **Drawer keyboard FPS**: Remove redundant `style="{{drawer.contentProps.style}}"` from `content` in `drawer/index.wxml` so `setData` no longer clobbers WXS `instance.setStyle()`, add `will-change-transform` to `drawer` content, and deduplicate `onKeyboardHeightChange` events in `drawer-gesture.wxs`.
- **Modal & overlay GPU transitions**: Replace `transition-all` with GPU-composited `transition-[transform,opacity] will-change-transform` on `modal`, `popover`, `toast`, and `tour` (`positioner`/`content`), remove full-screen `backdrop-blur-sm` on `action-sheet` backdrop, and add `will-change-transform` to `app` `scaleWrapper`, `action-sheet` `content`, and `select` picker sheet.
- **Control transitions**: Remove `transition-all duration-75` from `slider` `range` for smooth 60fps dragging, narrow `checkbox`/`radio` card transitions to `transition-colors`, and narrow `progress` transitions away from `transition-all`.
- **Highlight & `staticComputedBehavior`**: Fix `highlight` `slots.text` (`"block"` → `"inline"`) and restore previous `instance.data` references before native `setData` in `staticComputedBehavior` so WeChat's diff always syncs computed updates.
