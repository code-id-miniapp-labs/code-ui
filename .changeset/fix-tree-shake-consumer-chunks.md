---
"@code-id-labs/plugin-vite": patch
---

Preserve `@code-id-labs/components` subpath chunks (such as `computed.js` and `behaviors/app.js`) that are directly `require()`d by consumer app JS files during tree-shaking.
