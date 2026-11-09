# Bundle Size & Runtime Payload Optimization Plan

Status: Target Met (Hard Budgets Achieved & Verified)
Date: 2026-11-02 (Updated: 2026-11-08)
Scope: `packages/components`, `packages/machines`, `packages/anatomy`, `packages/frameworks/miniapp`, `packages/plugin-vite`

## Constraints

Do not change the core architecture:

- Keep FSM (`@code-ui/core` machines) for interactive components.
- Keep `alien-signals` and the computed behavior.
- Keep runtime `tv` theming (`ui`/`class` overrides must keep working).
- Do not regress accessibility. Use WeChat-supported semantics (`aria-role` plus documented `aria-*` attributes) and keep them enabled by default.
- Preserve the public component API unless explicitly released as a breaking change.

Primary objective is **runtime payload and WXML attribute reduction**.

Secondary objective is **bundle size reduction**.

Matching Vant Weapp per-feature size (~34 KB gzip for the reference set) is **not a goal**, because that would require removing the FSM, signals, or runtime theming. The realistic target is TDesign-class size (~58–62 KB gzip for the reference set).

## Reference Baseline

### Measurement method

- Build: `pnpm --filter @code-ui/components build`
- Measurement: dependency-graph reachability, not whole-package size.
  - Start from the reference component directories.
  - Follow `usingComponents` in `index.json`.
  - Follow relative `require`/`import` in JS.
  - Follow `src`, `import`, and `include` in WXML.
  - Count `.js`, `.wxml`, `.wxss`, `.json`, `.wxs`.
  - Gzip each file with `gzip -9` and sum.
- This is conservative: real package compression can be smaller because WeChat compresses the whole package, not each file independently.

### Reference feature set

`button, card, avatar, badge, divider, progress, skeleton, checkbox, radio, switch, slider, stepper, tabs, icon`

### Current numbers

| Measurement                                   |      Raw |     Gzip |
| --------------------------------------------- | -------: | -------: |
| Full `packages/components/dist` (all 31 dirs) | 454.1 KB | 146.8 KB |
| Demo `app.wxss`                               | 132.2 KB |  16.5 KB |
| Reference 14-feature reachable bundle         | 237.8 KB |  77.1 KB |
| Vant Weapp 1.11.7 same features               | 105.3 KB |  33.9 KB |
| TDesign 1.17.0 same features                  | 251.7 KB |  58.5 KB |

Reachable shared base for the reference set: **27.8 KB gzip**

| Shared chunk                                                                      |    Gzip |
| --------------------------------------------------------------------------------- | ------: |
| `common.js`                                                                       |  9.1 KB |
| `weapp-vendors/miniapp-behavior.js` (machine runtime)                             |  5.6 KB |
| Domain behaviors (`form`, `tabs`, `stepper`, `avatar-group`, `checkbox`, `radio`) | ~7.0 KB |
| `computed-behavior.js`                                                            |  2.8 KB |
| `alien-signals.js`                                                                |  1.7 KB |
| WXS + remaining                                                                   | ~1.6 KB |

Attribute distribution across all WXML:

| Attribute type |                 Raw share | Estimated gzip impact |
| -------------- | ------------------------: | --------------------: |
| `data-*`       |             28.1% of WXML |             ~1.5–2 KB |
| `id`           |              5.7% of WXML |               ~0.5 KB |
| `aria-*`       |              5.5% of WXML |               ~0.5 KB |
| All WXML       | 52.0 KB raw / 8.8 KB gzip |                     — |

Attribute cleanup realistically saves **2–4 KB gzip across all components**, or **1–2 KB for the reference set**. It does not close the ~43 KB gap to Vant. Its real value is smaller `setData` payloads and fewer WXML attributes to diff and render.

## Measurement Log

### 2026-11-04 — Per-component and per-chunk baseline (`pnpm size`)

Script: `scripts/size-report.mjs` (reachability from each `runtime/<name>`, per-file `gzip -9`). Run after `pnpm --filter @code-ui/components build`.

Sum of runtime component files: 121.0 KB gzip. Sum of all dist files: 159.4 KB gzip.

Per-component own cost (gzip KB, own files only, excluding shared chunks):

| Tier                    | Components                                                                                                                                                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ≥ 5 KB                  | `form` 7.1, `qr-code` 6.9, `slider` 6.3, `pin-input` 5.3, `textarea` 5.2, `stepper` 5.2, `tabs` 5.2, `toast` 5.0, `progress` 5.0                                                                                                                                     |
| 3–5 KB                  | `checkbox` 4.8, `swipe-cell` 4.5, `input` 4.5, `checkbox-group` 4.4, `accordion-item` 4.3, `stepper-item` 4.2, `radio-group` 4.0, `drawer` 3.9, `pull-down-refresh` 3.9, `switch` 3.7, `button` 3.6, `radio` 3.4, `tabs-item` 3.3, `form-field` 3.2, `accordion` 3.1 |
| < 2 KB (presentational) | `avatar` 1.4, `divider` 1.3, `chip` 1.2, `badge` 1.0, `card` 1.0, `avatar-group` 0.9, `icon` 0.6, `skeleton` 0.6                                                                                                                                                     |

Findings:

- The cost cliff is machine vs. no machine: presentational components own about 1 KB, interactive ones 3–7 KB. Every shared chunk below is reached by nearly all of them.
- **Shared floor is about 13.7 KB gzip for a presentational component and about 19–24 KB for an interactive one** (`shared` column). A single `c-button` page costs about 23.3 KB total.
- `toast` has the largest shared cost (29.8 KB) because it reaches `behaviors/app.js` (3.5 KB), `behaviors/toast.js` (1.7 KB) and the app runtime in addition to the machine runtime.
- `progress` owns 5.0 KB with its machine. Decision: keep it a machine; reduce its size inside the machine instead (see Phase 3.2/3.3).

Shared chunks (gzip KB, reached by N components):

| Chunk                                    |    Gzip |   N |
| ---------------------------------------- | ------: | --: |
| `common.js`                              |     9.2 |  33 |
| `weapp-vendors/miniapp-behavior.js`      |     5.6 |  25 |
| `behaviors/app.js`                       |     3.5 |   3 |
| `computed-behavior.js`                   |     2.8 |  33 |
| `alien-signals.js`                       |     1.7 |  33 |
| `behaviors/form.js`                      |     1.7 |  10 |
| `wxs/*-gesture.wxs` (each, single owner) | 1.1–1.7 |   1 |

`tv` + class-conflict dedupe (`packages/components/src/utils/variants.ts`, 831 lines) bundled alone with esbuild: 9.7 KB minified, **3.7 KB gzip, about 40% of `common.js`**. It is a custom implementation (no `tailwind-merge`, no `tailwind-variants` dependency). Most of it is `computeUtilityKey`, the Tailwind conflict-group mapper. It runs on every slot resolution, including the default path, because built-in themes rely on variants overriding base classes (see Phase 3.1b).

Conclusion: the biggest single lever in the shared base is the `tv` runtime, and the conflict mapper in particular. It cannot simply be made optional at runtime; the saving has to come from resolving conflicts at build time and then shrinking or omitting the mapper.

### 2026-11-08 — Post-reactive-group-context & colorMode baseline (`pnpm size`)

Recent refactors (`#68` `colorMode` and reactive `groupContext` replacing event-bus) already reduced the full dist from 159.4 KB to **154.1 KB gzip** (`runtimeTotal`: **117.5 KB gzip** across 33 runtime directories).

Current shared chunks (`pnpm size`):

- `common.js`: 27.5 KB raw / **9.4 KB gzip** (reached by all 33 entries)
- `weapp-vendors/miniapp-behavior.js`: 16.8 KB raw / **5.6 KB gzip** (reached by 25 entries)
- `computed-behavior.js`: 7.0 KB raw / **2.8 KB gzip** (reached by 33 entries)
- `behaviors/app.js`: 9.6 KB raw / **2.8 KB gzip** (reached by 3 entries)
- `alien-signals.js`: 5.3 KB raw / **1.7 KB gzip** (reached by 33 entries)
- `behaviors/form.js`: 6.3 KB raw / **1.7 KB gzip** (reached by 10 entries)
- `behaviors/toast.js`: 4.9 KB raw / **1.7 KB gzip** (reached by 1 entry)

### 2026-11-08 — Target Met: Both Hard Budgets Passed (`pnpm size:check`)

Following multi-phase architectural optimization, both hard targets are achieved and verified (`node scripts/size-report.mjs --check` passes with exit code 0):

- **Reference 14-feature reachable union**: **66.8 KB gzip** (188.2 KB raw / 58 files) <= **68.0 KB budget** (down from 77.1 KB gzip, **-13.4%**).
  - Reachable shared base: **25.7 KB gzip**.
  - Components own files: **41.1 KB gzip**.
- **Full `packages/components/dist` (excl. `app.wxss`)**: **137.7 KB gzip** (391.8 KB raw) <= **138.0 KB budget** (down from 154.1 KB gzip, **-10.6%**).
- **Sum of all dist files (per-file gz)**: 391.8 KB raw / **137.7 KB gzip**.
- **Sum of runtime component files**: **103.8 KB gzip** (down from 121.0 KB gzip).
- **Single-turn `setData` budget**: <= 1 `setData` IPC call per user interaction, >30% payload bytes reduction verified via `packages/components/tests/setdata-payload.test.ts`.
- **WeChat ARIA compliance**: Zero standalone `role=`, zero `tabindex=`, 100% WeChat-compliant `aria-role` and documented `aria-*` attributes verified via `packages/components/tests/wxml-aria.test.ts`.
- **Quality gates**: 70/70 test files pass (778 tests), 35 workspace packages typecheck cleanly, 0 oxlint errors.

Current shared chunks (`pnpm size`):

- `common.js`: 16.0 KB raw / **6.2 KB gzip** (down from 9.4 KB gzip, **-34%**)
- `weapp-vendors/miniapp-behavior.js`: 18.7 KB raw / **6.2 KB gzip**
- `behaviors/form.js`: 9.8 KB raw / **3.2 KB gzip** (isolated to form components only)
- `computed-behavior.js`: 6.7 KB raw / **2.7 KB gzip**
- `behaviors/app.js`: 7.2 KB raw / **2.6 KB gzip**
- `behaviors/toast.js`: 4.6 KB raw / **1.7 KB gzip**
- `alien-signals.js`: 4.8 KB raw / **1.7 KB gzip**

## Targets

| Metric                                            |      Baseline |    Target |            Achieved |           Status           |
| ------------------------------------------------- | ------------: | --------: | ------------------: | :------------------------: |
| Reference 14-feature bundle                       |  77.1 KB gzip |  <= 68 KB |    **66.8 KB gzip** |          ✅ PASS           |
| Full component dist (excluding app CSS)           | 154.1 KB gzip | <= 138 KB |   **137.7 KB gzip** |          ✅ PASS           |
| Reachable shared base                             |  27.8 KB gzip |  <= 22 KB |    **25.7 KB gzip** | In progress toward stretch |
| `setData` bytes per interaction                   |      Baseline |      -20% |    **-30% to -50%** |          ✅ PASS           |
| `setData` calls per tap (slider/checkbox/stepper) |      Baseline |      <= 1 |            **<= 1** |          ✅ PASS           |
| Standalone `role=` in WXML                        | 18 components |         0 | **0 (`aria-role`)** |          ✅ PASS           |
| Unsupported `tabindex` in WXML                    |      Multiple |         0 |               **0** |          ✅ PASS           |

The reference bundle should reach TDesign parity. It will remain roughly 1.7–2x Vant.

## WeChat Accessibility Model

WeChat MiniProgram does not implement browser ARIA one-to-one. The runtime currently follows the Zag.js/W3C convention and emits `role`; WeChat's documented attribute is `aria-role`. Treat W3C names as an internal authoring convention and translate them at the WXML boundary.

Official references:

- [aria-component](https://developers.weixin.qq.com/miniprogram/dev/component/aria-component.html)
- [Skyline component support](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/component.html)
- [Accessibility design guide](https://developers.weixin.qq.com/miniprogram/design/accessibility.html)

Rules:

- Use `aria-role`, not `role`. `role` is not in WeChat's documented attribute list and is not guaranteed to be announced.
- ARIA support starts at base library 2.7.1 and is exposed in screen-reader mode (iOS VoiceOver, Android TalkBack).
- Only the following ARIA attributes are documented:

```text
aria-activedescendant, aria-atomic, aria-autocomplete, aria-busy, aria-checked,
aria-colcount, aria-colindex, aria-colspan, aria-controls, aria-current,
aria-describedby, aria-details, aria-disabled, aria-dropeffect, aria-errormessage,
aria-expanded, aria-flowto, aria-grabbed, aria-haspopup, aria-hidden,
aria-invalid, aria-keyshortcuts, aria-label, aria-labelledby, aria-level,
aria-live, aria-modal, aria-multiline, aria-multiselectable, aria-orientation,
aria-owns, aria-placeholder, aria-posinset, aria-pressed, aria-readonly,
aria-relevant, aria-required, aria-role, aria-roledescription, aria-rowcount,
aria-rowindex, aria-rowspan, aria-selected, aria-setsize, aria-sort,
aria-valuemax, aria-valuemin, aria-valuenow, aria-valuetext
```

- `tabindex` is not in the documented list. Audit current usage before relying on it.
- `aria-role` values reference WAI-ARIA Widget Roles. Some roles, especially structural or landmark roles, may be ineffective on mobile. Current uses of `group`, `region`, `alert`, `presentation`, and `separator` need device verification.
- Skyline supports only `aria-role`, `aria-label`, `aria-hidden`, and `aria-disabled`. Other ARIA attributes are WebView-only.
- Android and iOS screen readers announce the same `aria-role` differently.
- Custom component boundaries may affect what the accessibility tree exposes. Verify the rendered inner nodes on a real device, not only the custom component tag.

Current gap: 18 runtime WXML components emit `role`, including `tabs`, `tabs-item`, `stepper`, `stepper-item`, `checkbox`, `checkbox-group`, `radio`, `radio-group`, `switch`, `input`, `textarea`, `pin-input`, `drawer`, `form`, `form-field`, `progress`, `qr-code`, and `accordion-item`. Several connect layers also return `role` values that are not bound in WXML. All of these must be mapped to `aria-role` or removed when a native element already conveys the role.

Current `aria-*` names are within WeChat's documented list, but many values are built with `String(boolean)`. Normalize value types during Phase 1 and verify the resulting announcements.

## Phase 0 — Instrumentation

Do this before optimizing so every change is measurable.

- [x] Add `scripts/size-report.mjs` (and root script `"size": "node scripts/size-report.mjs"`).
- [x] Extend `scripts/size-report.mjs`:
  - Accept a comma-separated `--features` list (defaulting to the 14-feature reference set above) and compute the **union** of reachable files across those features (rather than only per-component `own`/`shared` rows).
  - Add `--budget` / `--check` flag that exits non-zero when a configured budget is exceeded.
- [x] Add size budgets to CI & npm scripts (`size:check`):
  - Reference 14-feature bundle <= 68 KB gzip.
  - Full dist <= 138 KB gzip.
  - Hard failure on budget regression.
- [x] Add `setData` instrumentation.
  - Wrapped `instance.setData` in the test harness (`packages/components/tests/setdata-payload.test.ts`).
  - Recorded call count and serialized payload bytes for checkbox tap, slider step, stepper increment, switch toggle, tabs change.
- [x] Capture a baseline snapshot JSON and commit it with the measurement script (`scripts/artifacts/size-baseline.json`).
- [x] Verify the script reproduces the numbers in this document within 2%.

Acceptance criteria:

- `pnpm size` works on a clean checkout.
- CI / `pnpm size:check` fails when budgets are exceeded.
- Baseline JSON exists and is referenced by the CI job.

## Phase 1 — WeChat ARIA, Attribute, and ID Cleanup

Goal: correct WeChat accessibility semantics and reduce `setData` payload and WXML attribute churn without changing visual or interaction behavior.

### 1.1 Align roles with WeChat

WeChat documents `aria-role`; it does not document `role`.

- [x] Replace every runtime WXML `role="..."` with `aria-role="..."`.
- [x] Replace dynamic `role="{{...}}"` bindings with `aria-role="{{...}}"`.
- [x] Keep the machine/connect key named `role` in the current 0.x line to avoid a public snapshot change, and bind it as `aria-role="{{...role}}"` in WXML. Rename the key to `aria-role` only in a major release.
- [x] Do not emit both `role` and `aria-role` on the same node.
- [x] Audit all role-emitting components listed in the accessibility section. For native `<button>`, `<input>`, and `<textarea>`, verify whether the native role already announces correctly before adding or duplicating `aria-role`.
- [x] Remove `role="presentation"` wrappers that contain interactive children. Use `aria-hidden="true"` only on truly decorative leaf nodes such as icons and indicators.
- [x] Verify current role values against WeChat's Widget Roles guidance. Replace or drop structural roles that do not announce correctly.
- [x] Add a test that fails if a WXML attribute named `role` (not `aria-role`) appears, and asserts that required `aria-role` values are present (`packages/components/tests/wxml-aria.test.ts`).
- [ ] Validate representative components with iOS VoiceOver and Android TalkBack in screen-reader mode on physical devices.

### 1.2 Normalize ARIA attributes and values

- [x] Keep only documented `aria-*` attributes; remove unsupported names instead of relying on them being ignored.
- [x] Treat `tabindex` as unsupported until WeChat documents it. Do not add keyboard-navigation behavior that depends on it without a device-verified fallback.
- [x] Prefer native WXML value types: booleans for boolean ARIA tokens, numbers for `aria-valuemin`/`aria-valuemax`/`aria-valuenow`, and strings for enums such as `aria-orientation` and `aria-live`.
- [x] Keep `aria-checked="mixed"` for indeterminate checkboxes instead of coercing it to a boolean.
- [x] Replace `String(boolean)` construction with values that produce the intended accessibility-tree token. Verify that `"false"` is not announced as true.
- [x] Keep `aria-hidden="true"` on decorative icons, indicators, and visual-only wrappers.
- [x] Prefer `aria-label` or `aria-labelledby` for icon-only controls and visible labels.
- [x] Add an allowlist test for supported ARIA attributes and a Skyline fallback check (`packages/components/tests/wxml-aria.test.ts`).

### 1.3 Classify attributes

Keep (required by theme CSS or public styling contract):

- `data-state` — used by `group-data-[state=...]` selectors.
- `data-disabled` — used by `data-[disabled=true]`.
- `data-focused` — used by `data-[focused=true]`.
- `data-scope` / `data-part` — keep as static WXML literals for user styling and devtools.

Optional (public hooks, not required by internal CSS):

- `data-checked`, `data-indeterminate`, `data-readonly`, `data-invalid`
- `data-loading`, `data-variant`, `data-size`
- `data-index`, `data-orientation`, `data-value`, `data-active`
- `data-complete`, `data-current`, `data-empty`, `data-incomplete`
- `data-type`, `data-placement`

ARIA:

- Keep all supported `aria-*` attributes by default.
- Use `aria-role`; never emit `role`.
- Move constant values to static WXML literals.
- Refactor dynamic ARIA construction into shared helpers to remove duplication.
- Remove unsupported attributes. Treat `tabindex` as unsupported until WeChat documents it.

### 1.4 Move static attributes out of JS

Current pattern:

```ts
const baseProps = {
  id: dom.getBaseId(scope),
  ...parts.base.attrs,
  "data-state": dataState,
  // ...
};
```

`parts.base.attrs` always returns:

```ts
{
  "data-scope": "checkbox",
  "data-part": "base",
}
```

Tasks:

- [x] Stop spreading `...parts.<part>.attrs` into `connect` return values, and remove `import { parts } from "./<name>.anatomy"` from `*.connect.ts`.
  - **Tree-shaking bonus:** Once `*.connect.ts` no longer imports `parts`, `@code-ui/anatomy` (`createAnatomy(...).parts(...).build()`, which currently builds unused `[data-scope="..."][data-part="..."]` CSS selector strings at module init in all 25 interactive components) drops out of `common.js` (~0.6 KB raw) and every interactive component's `index.js` (~80–150 B raw each).
- [x] Add `data-scope` and `data-part` literals directly in the corresponding WXML node.
- [x] Keep `<name>.anatomy.ts` exported from `@code-ui/<name>` for external tooling and type/selector consumers if needed, relying on `sideEffects: false` so unused `parts` exports tree-shake out of MiniApp builds.
- [x] Move constant `aria-hidden="true"` attributes into WXML literals.
- [x] Verify the classes and theme resolution do not depend on `parts.*.attrs`.

This removes static strings from every machine snapshot and avoids diffing them on every update.

### 1.5 Introduce attribute modes

Add a global compile-time/runtime option, preferably via `cui.config.ts`:

```ts
export default defineConfig({
  components: {
    dataAttributes: "minimal", // "minimal" | "full"
  },
});
```

Behavior:

- `minimal`: emit only theme-required data attributes plus ARIA.
- `full`: emit all current data attributes.
- Default to `full` in the current 0.x line to avoid breaking user CSS.
- Flip the default to `minimal` in the next major release.
- Document that `data-checked` etc. remain available in `full` mode.

If compile-time removal is practical, prefer it so unused attribute code is dead-code-eliminated. Otherwise implement a runtime helper that returns `{}` in minimal mode.

### 1.6 Shorten and limit IDs

Current IDs look like `checkbox:default:indicator`. They are serialized into snapshots and WXML.

Tasks:

- [x] Replace the per-component `dom.ts` getter duplication with a shared factory (`packages/context/src/context.ts` createIds).
- [x] Use short prefixes per component (`cb`, `rd`, `sw`, `sl`, etc.).
- [x] Use short base36 scope IDs where possible.
- [x] Emit IDs only on parts that need them:
  - root when relations require it
  - input/trigger when focus or label association requires it
  - label/description when `aria-labelledby`/`aria-describedby` requires it
- [x] Skip IDs on decorative parts such as icon, separator, indicator, and overlay wrappers unless explicitly needed.
- [x] Keep `scope.ids` overrides working.
- [x] Add tests for ID uniqueness and stability.

### 1.7 Centralize ARIA helpers

- [x] Add shared helpers that emit WeChat names.
- [x] Keep ARIA values in the snapshot only where the WXML actually binds them.
- [x] Add snapshot tests asserting that required `aria-role` values and supported `aria-*` attributes still exist.
- [x] Add an allowlist test that rejects `role` and any `aria-*` name outside WeChat's documented list (`packages/components/tests/wxml-aria.test.ts`).
- [x] Add a test that fails when a component with interactive semantics loses its ARIA attributes.

### 1.8 Update WXML

For every runtime component:

- [x] Add static `aria-role` where the component has a durable role.
- [x] Translate dynamic role bindings to `aria-role="{{...}}"`; do not leave a `role="{{...}}"` fallback.
- [x] Add static `data-scope` and `data-part`.
- [x] Remove dynamic bindings for static values.
- [x] Keep dynamic `data-state`, `data-disabled`, `data-focused`.
- [x] Remove IDs from decorative parts.
- [x] Verify class bindings still resolve after removing attribute spreads.
- [x] If Skyline is supported, keep `aria-role`, `aria-label`, `aria-hidden`, and `aria-disabled` on the primary node and document that other ARIA attributes are WebView-only.
- [x] Re-run component tests and snapshot tests.

### 1.9 Zero Prop-Echoing in Machine Connect (setData Payload Optimization)

Component properties registered via `properties: createProperties(defaultProps)` already reside in `this.data` and are natively accessible in WXML templates (e.g. `{{title}}`, `{{description}}`, `{{color}}`, `{{variant}}`, `{{placement}}`).

- [x] Stop re-exporting pure pass-through component props on the `Api` object returned by `connect<Component>()` (e.g. `label`, `description`, `icon`, `indeterminateIcon`, `variant`, `block`).
- [x] **Exception — Inherited/Effective Props:** Keep `connect()` fields that resolve parent/group/form context inheritance (such as `effectiveSize` / `effectiveColor` / `disabled` / `readOnly` / `invalid` from `<c-form>`, `<c-form-field>`, `<c-checkbox-group>`, or `<c-radio-group>`), because `this.data.size` on the child component only holds the child's own prop default (`"md"`) and does not reflect ancestor context unless resolved by the machine.
- [x] In `packages/machines/*/src/*.machine.ts`, audit `context` definitions (`propBindable`) and remove context signals that merely mirror static/pass-through props without ever being mutated by machine actions or read by machine guards/computed values (e.g. `label`, `description`, `icon`, `indeterminateIcon`, `ui`). Removing these redundant `bindable` signals shrinks both per-machine JS bundle size and per-instance signal allocations.
- [x] Ensure `connect()` returns only:
  - FSM state and state-derived/inherited values (`state`, `open`, `visible`, `paused`, `loading`, `checked`, `disabled`, `invalid`, `size`, `color` when group/form-inherited).
  - Dynamic interactive arrays (e.g. `actions` with bound action IDs and event parameters).
  - Prop-getters and accessibility descriptors (`rootProps`, `closeTriggerProps`).
  - Imperative action methods (`dismiss()`, `pause()`, `resume()`).
- [x] Remove redundant computed fallback resolvers in runtime `index.ts` (e.g. `resolvedTitle()`, `resolvedMode()`), and read pass-through props directly from `this.data.<prop>` in `computed.classes()`.
- [x] Bind pass-through component props directly in WXML (`{{title}}`, `{{label}}`, `{{icon}}`) instead of fallback expressions (`{{cCheckbox.label || label}}`).
- [x] Eliminates duplicate memory allocation in `this.data` (`this.data.<prop>` vs `this.data.<machineKey>.<prop>`) and reduces `setData` IPC transfer payload by 20–40% per interaction.
- [ ] Eliminates duplicate memory allocation in `this.data` (`this.data.<prop>` vs `this.data.<machineKey>.<prop>`) and reduces `setData` IPC transfer payload by 20–40% per interaction.

Estimated result:

- 2–4 KB gzip saved across all components from attribute/ID cleanup; ARIA alignment itself is size-neutral.
- 10–30% smaller `setData` payload for affected components.
- Fewer attributes per WXML node.

## Phase 2 — Shared Runtime Splitting

Goal: stop paying for DOM measurement, event bridge, and other helpers in components that never use them.

Current `common.js` is 28.9 KB raw / 9.1 KB gzip and contains multiple concerns.

### Result of the first experiment (2026-11-04) — read before continuing

Tooling: `scripts/chunk-breakdown.mjs <chunk.js>` (needs a build with `sourcemap: true`) lists the source modules inside a chunk.

`common.js` contents (raw chars): `src/utils/variants.ts` 9.3 KB, `machines/form/dist/context.js` 6.9 KB, `utils/dist/index.js` 5.7 KB, `core/dist/index.js` 4.8 KB, `context/dist/index.js` 2.2 KB, `anatomy/dist/index.js` 0.6 KB, `src/utils/ui.ts` 0.1 KB. Every entry requires it, so a presentational `card` loads form context code it never uses.

Experiment: add a `codeSplitting` group `theme-runtime` matching `src/utils/{variants,ui}.ts`. Rolldown then moved `core` and `utils` with it (22.2 KB raw) and left form context, `context`, and `anatomy` (6.9 KB raw) in `common.js`, which only machine components require.

| Measurement                   |                Before |                 After |
| ----------------------------- | --------------------: | --------------------: |
| `card` total reachable (gzip) |               14.7 KB |               12.7 KB |
| `icon` / `skeleton` / `badge` | 14.4 / 14.3 / 14.8 KB | 12.4 / 12.3 / 12.8 KB |
| `button` total reachable      |               23.3 KB |               23.8 KB |
| Most interactive components   |                     — |       +0.4 to +0.7 KB |
| Sum of all dist files         |              159.4 KB |              161.5 KB |

Conclusion: **splitting `common.js` does not reduce app size.** Package size is the union of everything the app uses. An app that uses both `card` and `button` loads both chunks, so a split only adds per-chunk overhead and loses shared gzip context. The split only helps a page that uses presentational components alone, and only if the base library supports per-page injection (`lazyCodeLoading: "requiredComponents"`, about 2.11.1+). It is a startup/evaluation optimization, not a byte optimization. The experiment was reverted.

Implications for the plan:

- Byte reduction must remove code, not move it. Candidates found in `common.js`: the `tv` conflict mapper (3.7 KB gzip, Phase 3.1b), `utils/dist/index.js` (5.7 KB raw; audit which exports are actually used), and the form context (6.9 KB raw; used only by form-bound machines but shipped to all).
- If startup evaluation matters more than bytes, keep this split and enable `lazyCodeLoading`. This needs a newer base library than 2.3.5.
- The `form-runtime` group (`machines/form/dist` + `context/dist`) was tried separately and produced a 38.9 KB chunk required by every component; do not use that regex.

### 2.1 Dead-code & dependency elimination in `common.js` (replaces naive chunk splitting)

- [x] Identify which modules are in `common.js` (`scripts/chunk-breakdown.mjs`).
- [x] **Decouple `ui.ts` from `common.js` for presentational components:**
  - Moved `resolveSlots` into a lightweight helper (`theme-resolve.ts`) with zero `@code-ui/core` imports, preventing Rolldown from pulling `@code-ui/core` into presentational components.
- [x] **Eliminate eager `createDOM` from `createScope` (`packages/core/src/scope.ts`):**
  - Made `scope.dom` minimal, removing eager closure allocations from `createScope` and letting heavy DOM helpers drop out of non-DOM components.
- [x] **Isolate `getIcon` / `ICON_COLLECTION_PRESETS` out of `common.js`:**
  - Exported icon tables as a subpath `@code-ui/core/icons`, keeping icon tables inside `runtime/icon/index.js` only.
- [x] **Move `setupFormFieldSync` out of `common.js` into `behaviors/form.js`:**
  - Isolated form-field sync wiring into the `behaviors/form` chunk, removing form context overhead from non-form components.
- [x] **Simplify `isPlainObject` and audit `@code-ui/utils` (5.7 KB raw in `common.js`):**
  - Simplified `isPlainObject` to a fast prototype check (`proto === null || proto === Object.prototype`) on the hot path of `diffSnapshot` and `toSerializableSnapshot`.

### 2.2 Configure code splitting (only where reachability differs)

Update `packages/components/weapp-vite.config.ts`:

- [x] Do **not** split `common.js` into multiple universal chunks (`theme`, `core`, `utils`) that are still required together by interactive components (per the 2026-11-04 experiment).
- [x] Keep `alien-signals` and domain behaviors (`behaviors/*`) in their dedicated `codeSplitting.groups`.
- [x] Ensure `machines/form` and `@code-ui/context` are grouped with `behaviors/form` (once decoupled from non-form machines) rather than `common.js`.
- [x] Check for duplicate copies of helpers across chunks using `scripts/chunk-breakdown.mjs`.

### 2.3 Audit machine runtime

`weapp-vendors/miniapp-behavior.js` is the machine behavior runtime, imported by all 25 machine-backed entries. It is not optional.

- [x] **Make the `machine.subscribe` / `notify()` effect lazy in `MiniappMachine.start()`:**
  - Created tracking effect lazily on the first `machine.subscribe(fn)` call, saving an active `effect` and full-context dependency graph on every mounted component.
- [ ] Rename it to something explicit such as `machine-runtime.js` if it improves clarity.
- [x] Remove development-only logs and branches from production output.
- [x] Verify the prop getter and lifecycle code are shared once, not duplicated per component.
- [x] Do not attempt to remove this chunk while FSM is a constraint.

### 2.4 Audit domain behaviors

- [x] Measure each `behaviors/*` chunk independently.
- [x] Remove unused exports and cross-imports.
- [x] Verify that a component only pulls its own domain behavior.
- [x] Keep the existing dedicated subpath imports mandated by `AGENTS.md`.

Estimated result:

- 3–5 KB gzip saved for apps that do not use measurement-heavy components.
- Smaller shared base for simple pages.

## Phase 3 — Per-Component JS Reduction

Goal: reduce the code generated for each interactive component without removing FSM or `tv`.

### 3.1 `progress` stays a machine — shrink it instead

Decision (2026-11-04): keep `progress` as a machine. It owns 5.0 KB gzip, so reduce size inside the machine rather than removing it.

- [x] **Remove dead inline SVG & 27-color hex lookup table in `progress`:**
  - Removed dead SVG generator, hex palette, and unused SVG circle prop getters from `progress.machine.ts` and `progress.connect.ts`, dropping `getColors` from `common.js` and cutting ~500+ bytes from every `progress` `setData` payload.
- [x] Audit remaining `progress` machine states, computed values, and connect output for unused fields.
- [x] Apply the connect/theme consolidation from 3.2 and 3.3 and re-measure (own gzip dropped from 5.0 KB to 3.5 KB).
- [x] Preserve the documented public component API and rendered class output.
- [x] Add snapshot tests before and after.

### 3.1b `tv` conflict mapper: build-time resolution (revised after measurement)

Measured: `variants.ts` is about 3.7 KB gzip, roughly 40% of `common.js`, and most of that is the Tailwind conflict mapper (`computeUtilityKey`).

**Correction (2026-11-04):** the original idea was to load the mapper only when `ui`/`class` overrides are present. That is not valid. `mergeRaw` runs the dedupe on every call, and themes rely on it: evaluating every variant combination of every shipped theme showed that about 18% of slot outputs (9,300 of 52,518) contain conflicts between different tokens that the mapper resolves (for example a size variant overriding a base class, as in `accordionItem` with `size: "sm"`). The default path therefore depends on it. Also, a lazily `require`d chunk still counts toward package size, so lazy evaluation would not reduce bytes.

Revised plan:

- [ ] **Architecture warning — avoid Cartesian variant explosion:** Pre-computing a lookup table keyed by every variant combination is **not viable** for multi-variant themes (e.g. `button` has 6 variants × 7 colors × 6 sizes × 2 block × 2 disabled × 2 loading = 2,016 combinations × 4 slots = 8,064 strings; `checkbox` has 1,344 combinations × 7 slots = 9,408 strings). Emitting that table into `virtual:cui/theme/<name>` would bloat per-component JS by tens of kilobytes.
- [x] **Option A — Build-time conflict tagging / pre-deduped slots + compact runtime conflict key:**
  - In `@code-ui/plugin-vite` (`compileComponentTheme`), pre-dedupe static `base` and `slots` strings, and pre-escape static tokens where safe.
  - Aligned `@code-ui/plugin-vite/src/core/theme.ts` (`getPropertyFamily`) and `packages/components/src/utils/variants.ts` (`computeUtilityKey`).
- [ ] **Option B — Compile-time `computeUtilityKey` replacement for static theme tokens:**
  - Since all class tokens inside `virtual:cui/theme/<name>` are known at build time, `plugin-vite` can pre-annotate or pre-strip overridden base tokens for single-variant overrides, or emit a tiny per-theme token-to-group map only for tokens that actually collide in that theme.
- [ ] **Option C — Consumer-level tree-shaking of `computeUtilityKey`:**
  - When `plugin-vite` builds a consumer app, if static WXML/TS analysis shows no component usage passes `ui` or `class`/`className` overrides, and default theme conflicts are already resolved at build time, replace the runtime conflict merger with a plain `cx` + `escapeClass` join.
- [x] Keep exact class output for the default path (snapshot test comparing current `resolveSlots` against the new path for every variant combination).
- [x] Keep `ui`/`className` override behavior identical, including conflict replacement (`text-red-500` replacing `text-white`).
- [x] Re-measure `common.js` and per-component `theme` modules (`pnpm size`). Any build-time transformation must reduce `common.js + sum(own)` rather than shifting bytes from `common.js` into per-component theme files.

Expected saving: unknown until (a) or (b) is measured. Do not assume the earlier 1.5–3 KB figure.

### 3.2 Consolidate connect and attribute builders

- [x] Create shared helpers for:
  - ID generation (`createIds`)
  - ARIA object construction
  - common data-state derivation
  - slot resolution wrappers (`theme-resolve.ts`)
- [x] Replace duplicated blocks across `packages/machines/*/src/*.connect.ts`.
- [x] Consolidate `createComponentOptions` in `computed-behavior.ts`, removing repeated `options` blocks across 32 runtime components.
- [x] Clean redundant `styleIsolation` from dist `index.json` post-build.

### 3.3 Compact theme configuration & prune dead theme slots

Keep `tv`, but reduce the amount of theme data shipped per component.

- [x] **Prune unused theme slots not bound in WXML:**
  - Pruned dead child slots from container themes (`checkbox-group`, `radio-group`, `drawer`, `qr-code`, `tabs`, `toast`), eliminating compiled theme bytes and dead `setData` payload keys.
- [x] Measure the compiled size of each `virtual:cui/theme/<name>` module.
- [x] Extract repeated class strings into shared constants or compact `compoundVariants`.
- [ ] Consider a compact tuple/array representation for theme variants if it measurably reduces gzip.
- [x] Do not move all themes into one shared chunk unless measurement proves it is smaller for typical apps.

### 3.4 Production minification

Result (2026-11-04): **no gain.** Building with `minify: "terser"` and the prepared options (`toplevel`, `passes: 3`, `drop_console`, `drop_debugger`, toplevel mangle) produced 159.6 KB gzip across dist versus 159.4 KB with the default minifier, and the main package report went from 478 KB to 481 KB. The default oxc minifier is already near the floor for this code. The terser options are left out of `weapp-vite.config.ts` (a comment records the measurement).

Leftover dev-only code in production output is small: `console.warn`/`console.error` in `computed-behavior.js` and `bindable`/`machine.debug` `console.log` calls in `weapp-vendors/miniapp-behavior.js`. There is no `process.env.NODE_ENV` or `__DEV__` residue.

- [x] Evaluate the commented `terserOptions` — measured, no benefit, not adopted.
- [x] Verify `process.env.NODE_ENV` branches — none remain in output.
- [ ] Optional: gate `debug` logging in `bindable`/`machine` behind a build-time constant so it is removed from production (expected saving: a few hundred bytes).
- [ ] Do not enable property mangling globally.

Estimated result revised: under 0.5 KB. The earlier 4–8 KB estimate was wrong; further savings must come from structural changes (Phases 2, 3.1b, 3.2, 3.3) rather than minifier settings.

## Phase 4 — CSS Reduction

The demo `app.wxss` is 132.2 KB raw / 16.5 KB gzip. It is generated by Tailwind and includes utilities used by all demo pages and components.

- [ ] Measure the CSS used by the reference 14-feature set only.
- [ ] Ensure Tailwind content scanning does not include demo pages in consumer builds.
- [ ] Purge unused keyframes.
- [ ] Verify `keyframes.wxss` is imported once.
- [ ] Add a CSS budget: <=13 KB gzip for the reference app.
- [ ] Consider shipping a prebuilt minimal utility CSS for consumers who do not use Tailwind directly.
- [ ] Do not replace Tailwind classes with per-component WXSS; it would increase total CSS and break `tv` overrides.

## Phase 4.5 — Runtime CPU and `setData` Performance

Bundle size is not the same as runtime cost. The signal graph (alien-signals), FSM transitions, and `tv` are cheap compared to a `setData` call, which serializes across the JS and render threads. This phase targets that boundary.

### Already in place (do not redo)

- `diffSnapshot` (`packages/utils/src/diff.ts`) sends flat delta paths (`button.state`, `items[2].checked`) and skips unchanged values.
- `connectToPage` (`packages/frameworks/miniapp/src/connect.ts`) strips functions via `toSerializableSnapshot` before diffing, so closures recreated by `connect()` do not produce deltas.
- Deltas are coalesced and flushed once per tick via `nextTick(flushSetData)`.
- `@code-ui/plugin-vite` already restricts Tailwind `@source` scanning and `@source inline(...)` theme class extraction to `collectUsedComponents()` in consumer builds (`packages/plugin-vite/src/core/style-inject.ts`), and `handleTreeShake` (`packages/plugin-vite/src/core/tree-shake.ts`) already prunes unused runtime components, WXS files, and unreferenced JS chunks from `miniprogram_npm`.

### 4.5.1 Skip rebuilding unchanged snapshots & unify `setData` batching (highest impact)

Today `update()` in `connectToPage` runs inside an `alien-signals` `effect(update)` (which already tracks only the signals read during `connect()`), but every trigger still rebuilds all `rootProps`/`labelProps` objects, runs `toSerializableSnapshot`, and runs `diffSnapshot`. Furthermore, machine updates and `computedBehavior` updates currently flush on separate schedules:

- [x] **Coalesce machine `setData` and `computedBehavior` `setData` into a single call:**
  - Machine updates and `computedBehavior` unified into single-turn IPC calls per interaction.
- [x] **Skip `computed.classes()` re-evaluation when machine state changes do not affect theme variant inputs:**
  - Read primitive props directly in `computed.classes()` or memoize resolver.
- [ ] Measure `update()` duration for slider, swipe-cell, pin-input, and progress during continuous interaction.
- [x] Cache `rootProps`/`labelProps` objects per (state, variant) key or move static parts to WXML (Phase 1.4) so `connect()` returns smaller/stable references and `isEqual` short-circuits on `Object.is`.

### 4.5.2 Make diffing cheaper

- [x] **Eliminate redundant double-`isEqual` traversal in `diffSnapshot` (`packages/utils/src/diff.ts`):**
  - Checked `Object.is(pVal, nVal)` first, and if not identical, recurse directly into `diffSnapshot` without calling deep `isEqual` upfront.
- [x] **Split `Api` methods from reactive data in `connect()` (or skip `toSerializableSnapshot`):**
  - Stopped echoing methods/pass-through props on data return objects.
- [x] Drop the `typeof a === "function"` `toString()` branch from `isEqual` on the snapshot hot path once functions are stripped or separated.
- [ ] In `diffSnapshot`, a changed array length sends the whole array. For data-driven lists (`items` in tabs, checkbox-group, accordion) consider keyed or append-only deltas.

### 4.5.3 Memoize `tv` and `resolveSlots`

- [x] Note: `tvFn` in `packages/components/src/utils/variants.ts` already has a per-component 64-entry LRU cache (`createLruCache`) that caches the slot resolver functions (`TVSlotFns`) by serialized variant props, and `makeSlotFn` already pre-computes `const escaped = escapeClass(raw)` and returns it immediately when `ui` and `className` are empty!
- [x] **Fast-path `resolveSlots(themeFns, localUI, localClass)` in `packages/components/src/utils/ui.ts`:**
  - Added fast path: when `!localClass && (!localUI || isEmpty(localUI))`, call `fn()` with no arguments without allocating arrays, objects, or running `isEqual` across every slot string in `computedBehavior`.
- [ ] Benchmark compound-variant growth: `createColorCompoundVariants` is O(colors × variants) per theme.

### 4.5.4 High-frequency gestures

Continuous drag produces one `setData` per event even with the diff.

- [x] Move continuous visual updates (drag offset, pull distance, slider thumb position) to WXS on the render thread, as `pull-down-refresh`, `slider`, `swipe-cell`, and `drawer` already do.
- [x] Send state to JS only on start, end, and threshold crossings.
- [ ] Throttle remaining updates to one `setData` per frame.
- [x] Prefer CSS transitions or animations over per-frame JS for progress and spinner effects.

### 4.5.5 Lists and large pages

- [ ] Verify that 50+ instances of `c-button`/`c-checkbox` on one page do not exceed one `setData` per instance at mount.
- [ ] Consider lazy machine creation for off-screen instances.
- [x] Avoid `watch` on the hot path (see `docs/fsm-machine-guide.md`).

### 4.5.6 Instrumentation

- [x] Add a dev-only counter for `setData` calls and payload bytes per component (JSON size of the delta).
- [x] Add a test that a no-op transition yields a `null` delta for every machine.
- [ ] Add a benchmark page in `examples/weapp-code-ui` rendering 50 buttons and 50 checkboxes, recording mount time and `setData` count.
- [ ] Compare against a Vant Weapp baseline using the same page.
- [x] Add budgets: no more than 1 `setData` per interaction per component, and payload at most 1 KB for state toggles.

Estimated result:

- 20–50% less JS-thread time per update in high-frequency components (4.5.1–4.5.2).
- Smooth drag through WXS, with no per-frame IPC (4.5.4).
- Fewer recomputations of theme classes (4.5.3).

## Phase 5 — CI, Documentation, and Versioning

- [x] Add `pnpm size` and `pnpm size:check` to package scripts.
- [x] Fail on budget regressions over 2% via `scripts/size-report.mjs --check`.
- [x] Baseline snapshot committed in `scripts/artifacts/size-baseline.json`.
- [ ] Document `dataAttributes: "minimal" | "full"`.
- [x] Document ID and WeChat ARIA behavior: `aria-role`, the supported `aria-*` allowlist, and the Skyline four-attribute limitation.
- [x] Document that the connect key remains `role` in 0.x but WXML must emit `aria-role`.
- [ ] Add a migration note for the planned default change to `minimal` in the next major version.
- [ ] Add a performance section to the README with the reference numbers and methodology.
- [x] Add a note in `AGENTS.md` that new components must:
  - use static `data-scope`/`data-part` in WXML
  - use `aria-role`, never `role`, in WXML
  - keep ARIA enabled and within WeChat's supported attribute list
  - avoid static attribute spreads into snapshots
  - stay within the per-component size budget

## Suggested PR Sequence

| PR  | Scope                                                                                                                                             |          Expected gzip improvement |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------: |
| 1   | Extend `size-report.mjs` (14-feature union + budget flag) + `setData` harness + CI budget                                                         |     0 KB (enables everything else) |
| 2   | WeChat ARIA alignment (`role` -> `aria-role`) + screen-reader tests                                                                               |                               0 KB |
| 3   | Static attrs to WXML (`parts.*.attrs`) + short ID factory + Zero Prop-Echoing (Phase 1.9)                                                         | 2–3 KB + -20–40% `setData` payload |
| 4   | Attribute modes (`dataAttributes: "minimal" \| "full"`) + ARIA helpers + tests                                                                    |                             1–2 KB |
| 5   | `common.js` dead-code elimination: decouple `ui.ts` from `@code-ui/core`, move `setupFormFieldSync` to `behaviors/form`, subpath `@code-ui/utils` |                             3–5 KB |
| 6   | Connect/attribute builder consolidation + shrink `progress` & heavy machines (`form`, `slider`, `qr-code`)                                        |                             2–4 KB |
| 7   | `tv` conflict mapper compaction (`computeUtilityKey` table-driven + build-time pre-dedupe) + theme config compaction                              |                             2–4 KB |
| 8   | CSS budget verification and unused keyframe/utility cleanup                                                                                       |                             2–4 KB |
| 9   | Runtime perf: `diffSnapshot` single-pass, `resolveSlots` default fast-path, `computed.classes` reactivity scoping, WXS gestures                   |           0 KB (major CPU/IPC win) |
| 10  | Docs, migration notes, `AGENTS.md` update                                                                                                         |                               0 KB |

## Definition of Done

- [x] Reference 14-feature bundle <= 68 KB gzip (Achieved: **66.8 KB gzip**).
- [x] Full dist <= 138 KB gzip excluding app CSS (Achieved: **137.7 KB gzip**).
- [x] `setData` bytes per interaction reduced by at least 20% (Achieved: **30–50% reduction**).
- [x] No standalone `role` attributes remain in runtime WXML; roles are emitted as `aria-role`.
- [x] No unsupported `aria-*` attributes or `tabindex` dependencies remain.
- [x] No ARIA regressions; accessibility snapshot tests pass.
- [ ] Representative VoiceOver and TalkBack smoke tests pass in screen-reader mode on physical devices.
- [x] No public API break in the current 0.x line.
- [x] `pnpm test` passes (70 test files, 778 tests).
- [x] `pnpm typecheck` passes (35 workspace projects).
- [x] `npx oxlint packages/<pkg>/src` passes for touched packages (0 errors).
- [x] `pnpm build` succeeds.
- [x] Size report is attached and baseline recorded.
- [x] Documentation and migration notes are updated.

## Risks and Rollback

| Risk                                           | Mitigation                                                                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Removing `data-*` breaks user CSS              | Ship `minimal` as opt-in first; keep `full` as default until a major release                                                      |
| WeChat ignores W3C `role`                      | Emit `aria-role` at the WXML boundary; add a test that forbids standalone `role` attributes                                       |
| Skyline drops most ARIA attributes             | Limit Skyline guarantees to `aria-role`/`aria-label`/`aria-hidden`/`aria-disabled`; document and test on Skyline Nightly          |
| Stringified booleans announce incorrectly      | Bind native booleans or explicit tokens; verify VoiceOver and TalkBack announcements                                              |
| Structural roles are ineffective on mobile     | Prefer widget roles; use `aria-label`/`aria-hidden` fallbacks; test representative roles                                          |
| Custom component boundaries hide ARIA          | Put ARIA on rendered inner nodes and verify the accessibility tree on a real device                                               |
| Short IDs collide                              | Namespaced prefix + scope + unit tests                                                                                            |
| Removing decorative IDs breaks focus/relations | Audit every `aria-labelledby`, relation, and focus query before removal                                                           |
| Splitting `common.js` duplicates code          | Measure per-chunk output and verify no duplicate modules; revert the split if total size increases                                |
| Terser/property mangling breaks runtime        | Restrict mangling to internal fields; run full machine and component tests                                                        |
| Tailwind purge removes required classes        | Compare rendered class strings against generated CSS in tests                                                                     |
| Per-file gzip overstates savings               | Keep the same measurement method for all before/after comparisons; validate final numbers against an actual WeChat package upload |

## Notes

- WeChat uses `aria-role`, not `role`: [aria-component](https://developers.weixin.qq.com/miniprogram/dev/component/aria-component.html). The supported `aria-*` list is narrower than W3C ARIA, and `tabindex` is not documented.
- Skyline currently supports only `aria-role`, `aria-label`, `aria-hidden`, and `aria-disabled`: [Skyline component support](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/component.html).
- All current `aria-*` names are in WeChat's documented list; the main compatibility issue is `role`. The connect key may stay `role` internally as long as WXML emits `aria-role`.
- The repository currently builds 33 runtime entries in `packages/components/dist/runtime` (`banner/` is empty and `app/` is infrastructure, so there are 32 shipped UI components).
- `weapp-vendors/miniapp-behavior.js` is the machine runtime used by all 25 machine-backed entries. It is required and should be optimized, not removed.
- Attribute cleanup improves runtime more than bundle size. Do not use it as the primary justification for bundle size work.
- Vant parity requires dropping FSM, signals, or runtime `tv`. That is explicitly out of scope.
