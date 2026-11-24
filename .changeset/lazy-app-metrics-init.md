---
"@code-id-labs/miniapp": patch
"@code-id-labs/components": patch
---

Defer `wx.getMenuButtonBoundingClientRect()` / `wx.getWindowInfo()` calls in `appMetricsSignal` until runtime attachment:

- `@code-id-labs/miniapp`: Initialize `appMetricsSignal` lazily with `EMPTY_METRICS` instead of calling `calculateMetrics()` at module evaluation time, and populate metrics when `<c-app>` attaches (`createAppHostBehavior.lifetimes.attached`). Prevents `getMenuButtonBoundingClientRect:fail Cannot destructure property 'mockConfig' of 'n' as it is undefined` during early MiniProgram cold boot.
- `@code-id-labs/components`: Rebuild bundled `behaviors/app.js` with the lazy metrics initialization fix.
