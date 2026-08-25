# Pure Native WeChat MiniProgram Example (`@code-ui`)

This example demonstrates using `@code-ui/components` directly in a **Pure Native WeChat MiniProgram** without any framework (no Taro, no React, no Vue).

---

## Zero-Script Setup

All synchronization and component configuration is handled automatically by `@code-ui/cli` and `code-ui.json`. No custom copy scripts needed!

### 1. Configure Components in `code-ui.json`:
```json
{
  "components": [
    "drawer",
    "button"
  ]
}
```

### 2. Sync to `miniprogram_npm`:
```bash
# Sync selected components from code-ui.json
pnpm sync
# (or: npx code-ui sync)
```

---

## Project Structure

```
examples/native-app/
├── project.config.json           # WeChat MiniProgram IDE configuration
├── code-ui.json                  # Declarative component selection
├── app.json                      # Global page routing and window configuration
├── app.ts                        # App lifecycle (TypeScript)
├── app.wxss                      # Global styling
├── miniprogram_npm/@code-ui/     # Synced native components from @code-ui/components
└── pages/
    └── index/
        ├── index.json            # usingComponents referencing @code-ui/components
        ├── index.wxml            # Native template using <cui-button> and <cui-drawer>
        ├── index.ts              # Native Page() data and event handlers (TypeScript)
        └── index.wxss            # Page styling
```

---

## How to Run in WeChat Developer Tools (微信开发者工具)

1. **Build the packages**:
   ```bash
   pnpm build
   ```

2. **Open in WeChat Developer Tools**:
   - Open **WeChat Developer Tools** (微信开发者工具).
   - Select **Import Project** (导入项目).
   - Choose the directory: `examples/native-app`.
   - AppID: `touristappid` (or your test AppID).
   - Click **Open**.
