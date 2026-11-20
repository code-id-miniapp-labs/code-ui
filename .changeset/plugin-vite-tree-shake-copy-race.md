---
"@code-id-labs/plugin-vite": patch
---

- **plugin-vite**: Wait for `dist/miniprogram_npm/<library>` writes to settle in `closeBundle` (`order: "post"`) before running `handleTreeShake`, preventing `ENOENT: chmod` race conditions with `weapp-vite`'s concurrent `copyBuild` during `pnpm build`.
