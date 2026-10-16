# Code UI — Agent & Developer Reference

`@code-ui` is a headless + Nuxt UI v4-inspired component library for WeChat MiniProgram (`weapp`).

## Monorepo Architecture

```
packages/
├── anatomy/             # @code-ui/anatomy — Slot/part anatomy builder (`createAnatomy`)
├── core/                # @code-ui/core — FSM engine (`createMachine`), TV (`tv`, `cn`), & Theme definitions
│   └── src/theme/definitions/   # Nuxt UI v4-style theme configs (`button.ts`, `card.ts`, `chip.ts`, `pin-input.ts`, etc.)
├── utils/               # @code-ui/utils — Shared helpers (`mergeProps`, `clampValue`, etc.)
├── frameworks/miniapp/  # @code-ui/miniapp — MiniApp `useService()` hook & reactive `setData` bridge
├── machines/            # @code-ui/<name> — Zag.js-inspired finite state machines (ONLY for stateful/interactive components)
│   ├── button/
│   ├── drawer/
│   └── pin-input/
├── components/          # @code-ui/components — WeChat MiniProgram runtime components (`.ts`, `.wxml`, `.json`)
│   └── src/runtime/<name>/
└── plugin-vite/         # @code-ui/plugin-vite — Vite plugin for `virtual:cui/theme/*`, CSS variables, and WXML auto-import
```

## Golden Rules for AI Agents

1. **Do NOT scan the entire repository** when creating or modifying a component. Read only:
   - This `AGENTS.md` file
   - `.agents/skills/create-component/SKILL.md` (when adding or updating a component)
   - One reference component of the same category:
     - **Presentational / Container** (no FSM needed): `packages/components/src/runtime/card/` or `chip/`
     - **Interactive / Stateful** (uses FSM in `packages/machines/<name>`): `packages/components/src/runtime/button/`, `drawer/`, or `pin-input/`
2. **When to create a Machine (`packages/machines/<name>`)**:
   - **YES**: Components with multi-state lifecycle, focus management, keyboard/touch coordination, or controlled/uncontrolled value state (`button`, `drawer`, `pin-input`, `dialog`, `tabs`, `select`, `checkbox`, `switch`, `slider`, etc.).
   - **NO**: Pure layout/display components (`card`, `chip`, `badge`, `avatar`, `separator`, `skeleton`, `kbd`, `alert`). These only need:
     1. A theme definition in `packages/core/src/theme/definitions/<name>.ts`
     2. A MiniApp runtime component in `packages/components/src/runtime/<name>/`
3. **Styling & Theming Convention (Nuxt UI v4)**:
   - All themes live in `packages/core/src/theme/definitions/<name>.ts` using `defineTheme({ slots, variants, compoundVariants, defaultVariants })`.
   - Runtime components import their pre-compiled theme via `import themeConfig from "virtual:cui/theme/<name>";`, instantiate `const <name>Theme = tv(themeConfig);` (from `../utils/variants`), and resolve slots via `resolveSlots(themeFns, ui, this.data.class)` inside `computedBehavior`.
   - Always support the `ui` prop (`type: Object, value: {}`) and `class` prop (`type: String, value: ""`) so users can override any slot's classes per instance.
4. **TypeScript & Linter Constraints**:
   - `tsconfig.base.json` sets `"exactOptionalPropertyTypes": true`.
   - `.oxlintrc.json` forbids non-null assertions (`!`) (`typescript(no-non-null-assertion)`) and inline `import()` type annotations (`typescript(consistent-type-imports)`).

## Quick Commands

- Build all packages: `pnpm build`
- Run unit tests: `pnpm test`
- Typecheck: `pnpm typecheck`
- Lint: `npx oxlint packages/<pkg>/src`
