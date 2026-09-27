# AGENTS Guidelines

<!-- agents-generated: v1 -->
<!-- source: template:default; manifest-version: 1; generator-version: 1 -->

## Mini-program Runtime Host APIs

- 小程序 AppService 不是浏览器或 Node.js。新增 `queueMicrotask`、Web API、DOM/Node 全局或现代内建前，必须先在目标平台的真实 IDE、目标基础库和 renderer 中探测存在性与最小调用语义；浏览器、Node、类型声明和 headless simulator 结果都不能替代真实 IDE 证据。
- 微信运行时不得假定存在 `queueMicrotask`。即使某个 DevTools 版本探测为可用，也必须使用显式兼容层，或确认项目已经启用对应的 weapp-vite runtime global 注入。
- 项目 ESLint 配置应接入 `@weapp-vite/eslint` 的 `miniProgramRuntimeRecommended` 或 `createMiniProgramRuntimeConfig()`，只检查会进入小程序运行时的 `src` 代码；config、构建脚本、测试、Web-only、WXS 和生成产物不纳入该规则。

## Local Docs First

- After dependencies are installed, prefer reading local package docs under `node_modules/weapp-vite/dist/docs/` first.
- Start with `node_modules/weapp-vite/dist/docs/index.md`, then read `README.md` and `mcp.md` as needed.
- Prefer local package docs over stale model memory or old web pages when command behavior is unclear.

## CLI Entry

- This project supports both `weapp-vite` and `wv` CLI commands.
- Treat `weapp-vite dev` and `wv dev` as equivalent forms.
- Prefer project scripts such as `pnpm dev`, `pnpm build`, `pnpm open`, and `pnpm g` before ad-hoc shell commands.
- Use `weapp-vite prepare` or `wv prepare` when managed support files under `.weapp-vite/` need to be refreshed.
- Prefer `weapp-vite screenshot` or `wv screenshot` for mini-program screenshot acceptance.
- Prefer `weapp-vite compare` or `wv compare` for mini-program screenshot diff, baseline comparison, and visual regression checks.
- Prefer `weapp-vite ide logs --open` or `wv ide logs --open` for DevTools terminal log bridging.
- Do not default to generic browser screenshot tools when the target is the mini-program runtime in WeChat DevTools.

## AI Intent Routing

- When the request mentions screenshot, 截图, 页面快照, runtime screenshot, or capture the current mini-program page, default to `weapp-vite screenshot` / `wv screenshot`.
- When the request mentions screenshot compare, 截图对比, diff, baseline, visual regression, 像素对比, or acceptance comparison, default to `weapp-vite compare` / `wv compare`.
- Treat these commands as the primary screenshot contract for AI workflows in this project.
- Only fall back to generic browser screenshot tools when the target is explicitly the web runtime instead of WeChat DevTools.

## Weapp-vite Workflow

- Keep `vite.config.ts` as the source of truth for `weapp` config, output behavior, and IDE/MCP automation.
- Confirm `weapp.srcRoot`, routes, subpackages, and auto-import strategy before broad refactors.
- Prefer minimal scoped verification: targeted `pnpm build`, targeted tests, then broader checks only when required.
- If editing package source in a monorepo dependency, rebuild the touched package before validating downstream apps to avoid stale `dist`.
- Keep CLI ownership explicit: native `weapp-vite` commands first, IDE passthrough second.
- For Rust/native acceleration, treat JS ↔ Rust boundary crossings as a primary performance cost. Prefer batch analysis that sends source once, parses once, and returns structured results; only put fine-grained native APIs on hot paths when profiling proves a net win.
- Keep native AST fast paths optional and explicitly enabled. They must fall back to Babel/Oxc/Vue compiler behavior on load, parse, or runtime failure, and new native coverage needs correctness tests plus real profiling.

## WeChat DevTools

- Before using screenshot, preview, upload, automator, or `--open`, ensure WeChat DevTools is logged in and the service port is enabled.
- `wv open`, `wv dev -o`, and `wv build -o` use the official DevTools CLI first, then connect automator; if the IDE is open but automator is unavailable, run `wv ide doctor --json` before retrying.
- Use `--ide-open-strategy automator` only for explicit compatibility debugging; do not treat it as the default startup path.
- Prefer writing screenshots to workspace paths such as `.tmp/acceptance.png`.

## AI Skills

- Recommend installing shared skills with `npx skills add sonofmagic/skills`.
- In Codex/Claude environments, prefer these skills first when available:
  - `$weapp-vite-best-practices` for config, build, subpackage, route, DevTools CLI orchestration, and screenshot/compare command work.
  - `$weapp-vite-vue-sfc-best-practices` for `.vue` SFC macros, JSON blocks, and template compatibility.
  - `$release-and-changeset-best-practices` for issue delivery, pnpm change intents, repoctl release decisions, and PR workflow.
  - `$docs-and-website-sync` when documentation or AI guidance must be refreshed together with code changes.
  - Use `$weapp-vite-best-practices` for stateful HMR, pluginRoot/dist-plugin, Web runtime compatibility, and native AST profiling; use `$wevu-best-practices` for `wevu/router` navigation semantics.
  - Use `$weapp-devtools-e2e-best-practices` for serialized DevTools runtime suites, shared automator sessions, and known host compatibility skips.
  - `$native-to-weapp-vite-wevu-migration` when migrating native mini-program projects to `weapp-vite + native`, or further toward Vue SFC / wevu.

## Native Mini-program Authoring

- Keep native page/component structure consistent with the template unless there is a clear migration goal.
- Prefer `weapp-vite generate` or `wv generate` for new app/page/component scaffolds.
- If migrating this project, first decide whether the target is `weapp-vite + native` or a further Vue SFC / `wevu` migration, then keep each migration wave explicit.

## Local Overlay

- If `AGENTS.local.md` exists in this project or directory, read it after this file and apply its project-specific additions.
- Keep generated `AGENTS.md` files managed by the repository tooling; put user-owned custom rules in `AGENTS.local.md`.
