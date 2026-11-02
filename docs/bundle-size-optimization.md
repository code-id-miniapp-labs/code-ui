# Bundle Size & Runtime Payload Optimization Plan

Status: Proposed
Date: 2026-11-02
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

| Measurement | Raw | Gzip |
|---|---:|---:|
| Full `packages/components/dist` (all 31 dirs) | 454.1 KB | 146.8 KB |
| Demo `app.wxss` | 132.2 KB | 16.5 KB |
| Reference 14-feature reachable bundle | 237.8 KB | 77.1 KB |
| Vant Weapp 1.11.7 same features | 105.3 KB | 33.9 KB |
| TDesign 1.17.0 same features | 251.7 KB | 58.5 KB |

Reachable shared base for the reference set: **27.8 KB gzip**

| Shared chunk | Gzip |
|---|---:|
| `common.js` | 9.1 KB |
| `weapp-vendors/miniapp-behavior.js` (machine runtime) | 5.6 KB |
| Domain behaviors (`form`, `tabs`, `stepper`, `avatar-group`, `checkbox`, `radio`) | ~7.0 KB |
| `computed-behavior.js` | 2.8 KB |
| `alien-signals.js` | 1.7 KB |
| WXS + remaining | ~1.6 KB |

Attribute distribution across all WXML:

| Attribute type | Raw share | Estimated gzip impact |
|---|---:|---:|
| `data-*` | 28.1% of WXML | ~1.5–2 KB |
| `id` | 5.7% of WXML | ~0.5 KB |
| `aria-*` | 5.5% of WXML | ~0.5 KB |
| All WXML | 52.0 KB raw / 8.8 KB gzip | — |

Attribute cleanup realistically saves **2–4 KB gzip across all components**, or **1–2 KB for the reference set**. It does not close the ~43 KB gap to Vant. Its real value is smaller `setData` payloads and fewer WXML attributes to diff and render.

## Targets

| Metric | Current | Target | Stretch |
|---|---:|---:|---:|
| Reference 14-feature bundle | 77.1 KB gzip | <= 68 KB | <= 62 KB |
| Full component dist (excluding app CSS) | 146.8 KB gzip | <= 138 KB | <= 130 KB |
| Reachable shared base | 27.8 KB gzip | <= 22 KB | <= 20 KB |
| Average incremental JS per component | ~3.6 KB gzip | <= 3.0 KB | <= 2.5 KB |
| Demo `app.wxss` | 16.5 KB gzip | <= 13 KB | <= 11 KB |
| `setData` bytes per interaction | Baseline | -20% | -35% |
| `setData` calls per tap (slider/checkbox/stepper) | Baseline | <= 1 | <= 1 |

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

- [ ] Add `scripts/measure-size.mjs` or `scripts/measure-size.ts`.
  - Accept a comma-separated feature list.
  - Traverse `usingComponents`, JS imports/requires, and WXML includes.
  - Output raw bytes, gzip bytes, file count, and a per-file breakdown.
  - Default feature list = the reference set above.
  - Exit non-zero when a configured budget is exceeded.
- [ ] Add root script: `"size": "node scripts/measure-size.mjs"`.
- [ ] Add size budgets to CI:
  - Reference 14-feature bundle <= 68 KB gzip.
  - Full dist <= 138 KB gzip.
  - No PR may increase the reference bundle by more than 2% without approval.
- [ ] Add `setData` instrumentation.
  - Wrap `instance.setData` in the MiniApp test harness.
  - Record call count and serialized payload bytes for:
    - checkbox tap
    - slider drag step
    - stepper increment
    - tabs change
    - drawer open/close
  - Store results as JSON for before/after comparisons.
- [ ] Capture a baseline snapshot and commit it with the measurement script.
- [ ] Verify the script reproduces the numbers in this document within 2%.

Acceptance criteria:

- `pnpm size` works on a clean checkout.
- CI fails when budgets are exceeded.
- Baseline JSON exists and is referenced by the CI job.

## Phase 1 — WeChat ARIA, Attribute, and ID Cleanup

Goal: correct WeChat accessibility semantics and reduce `setData` payload and WXML attribute churn without changing visual or interaction behavior.

### 1.1 Align roles with WeChat

WeChat documents `aria-role`; it does not document `role`.

- [ ] Replace every runtime WXML `role="..."` with `aria-role="..."`.
- [ ] Replace dynamic `role="{{...}}"` bindings with `aria-role="{{...}}"`.
- [ ] Keep the machine/connect key named `role` in the current 0.x line to avoid a public snapshot change, and bind it as `aria-role="{{...role}}"` in WXML. Rename the key to `aria-role` only in a major release.
- [ ] Do not emit both `role` and `aria-role` on the same node.
- [ ] Audit all role-emitting components listed in the accessibility section. For native `<button>`, `<input>`, and `<textarea>`, verify whether the native role already announces correctly before adding or duplicating `aria-role`.
- [ ] Remove `role="presentation"` wrappers that contain interactive children. Use `aria-hidden="true"` only on truly decorative leaf nodes such as icons and indicators.
- [ ] Verify current role values against WeChat's Widget Roles guidance. Replace or drop structural roles that do not announce correctly.
- [ ] Add a test that fails if a WXML attribute named `role` (not `aria-role`) appears, and asserts that required `aria-role` values are present.
- [ ] Validate representative components with iOS VoiceOver and Android TalkBack in screen-reader mode.

### 1.2 Normalize ARIA attributes and values

- [ ] Keep only documented `aria-*` attributes; remove unsupported names instead of relying on them being ignored.
- [ ] Treat `tabindex` as unsupported until WeChat documents it. Do not add keyboard-navigation behavior that depends on it without a device-verified fallback.
- [ ] Prefer native WXML value types: booleans for boolean ARIA tokens, numbers for `aria-valuemin`/`aria-valuemax`/`aria-valuenow`, and strings for enums such as `aria-orientation` and `aria-live`.
- [ ] Keep `aria-checked="mixed"` for indeterminate checkboxes instead of coercing it to a boolean.
- [ ] Replace `String(boolean)` construction with values that produce the intended accessibility-tree token. Verify that `"false"` is not announced as true.
- [ ] Keep `aria-hidden="true"` on decorative icons, indicators, and visual-only wrappers.
- [ ] Prefer `aria-label` or `aria-labelledby` for icon-only controls and visible labels.
- [ ] Add an allowlist test for supported ARIA attributes and a Skyline fallback check.

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

- [ ] Stop spreading `...parts.<part>.attrs` into `connect` return values.
- [ ] Add `data-scope` and `data-part` literals directly in the corresponding WXML node.
- [ ] Keep `parts` metadata for tooling and selectors if needed, but do not serialize it into component data.
- [ ] Move constant `aria-hidden="true"` attributes into WXML literals.
- [ ] Verify the classes and theme resolution do not depend on `parts.*.attrs`.

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

- [ ] Replace the per-component `dom.ts` getter duplication with a shared factory:

```ts
export const createIds = (scope: Scope, prefix: string) => ({
  root: scope.ids?.root ?? `${prefix}-${scope.id ?? "d"}-r`,
  // ...
});
```

- [ ] Use short prefixes per component (`cb`, `rd`, `sw`, `sl`, etc.).
- [ ] Use short base36 scope IDs where possible.
- [ ] Emit IDs only on parts that need them:
  - root when relations require it
  - input/trigger when focus or label association requires it
  - label/description when `aria-labelledby`/`aria-describedby` requires it
- [ ] Skip IDs on decorative parts such as icon, separator, indicator, and overlay wrappers unless explicitly needed.
- [ ] Keep `scope.ids` overrides working.
- [ ] Add tests for ID uniqueness and stability.

### 1.7 Centralize ARIA helpers

- [ ] Add shared helpers that emit WeChat names, for example:

```ts
export function ariaState(state: string) {
  return {
    "aria-disabled": state === "disabled",
    // ...
  };
}
```

- [ ] Keep ARIA values in the snapshot only where the WXML actually binds them.
- [ ] Add snapshot tests asserting that required `aria-role` values and supported `aria-*` attributes still exist.
- [ ] Add an allowlist test that rejects `role` and any `aria-*` name outside WeChat's documented list.
- [ ] Add a lint rule or test that fails when a component with interactive semantics loses its ARIA attributes.

### 1.8 Update WXML

For every runtime component:

- [ ] Add static `aria-role` where the component has a durable role.
- [ ] Translate dynamic role bindings to `aria-role="{{...}}"`; do not leave a `role="{{...}}"` fallback.
- [ ] Add static `data-scope` and `data-part`.
- [ ] Remove dynamic bindings for static values.
- [ ] Keep dynamic `data-state`, `data-disabled`, `data-focused`.
- [ ] Remove IDs from decorative parts.
- [ ] Verify class bindings still resolve after removing attribute spreads.
- [ ] If Skyline is supported, keep `aria-role`, `aria-label`, `aria-hidden`, and `aria-disabled` on the primary node and document that other ARIA attributes are WebView-only.
- [ ] Re-run component tests and snapshot tests.

Estimated result:

- 2–4 KB gzip saved across all components from attribute/ID cleanup; ARIA alignment itself is size-neutral.
- 10–30% smaller `setData` payload for affected components.
- Fewer attributes per WXML node.

## Phase 2 — Shared Runtime Splitting

Goal: stop paying for DOM measurement, event bridge, and other helpers in components that never use them.

Current `common.js` is 28.9 KB raw / 9.1 KB gzip and contains multiple concerns.

### 2.1 Analyze the chunk

- [ ] Run `pnpm --filter @code-ui/components analyze`.
- [ ] Identify which modules are reachable from each component.
- [ ] Split `common.js` by concern:
  - `core`: signals bridge, computed behavior, normalization, diff
  - `theme`: `tv`, `cn`, `escape` — likely needed by all components
  - `dom`: `createSelectorQuery`, rect, scroll, viewport measurement
  - `events`: event bridge and normalization
  - `utils`: small pure helpers

### 2.2 Configure code splitting

Update `packages/components/weapp-vite.config.ts`:

- [ ] Add `codeSplitting.groups` entries for the new shared chunks.
- [ ] Keep `alien-signals` and domain behaviors in their existing groups.
- [ ] Verify components that do not use `dom` no longer require the DOM chunk.
- [ ] Verify WeChat loads all required shared chunks correctly in the generated `usingComponents` graph.
- [ ] Check for duplicate copies of helpers across chunks.

### 2.3 Audit machine runtime

`weapp-vendors/miniapp-behavior.js` is the machine behavior runtime, imported by all 23 interactive components. It is not optional.

- [ ] Rename it to something explicit such as `machine-runtime.js` if it improves clarity.
- [ ] Remove development-only logs and branches from production output.
- [ ] Verify the prop getter and lifecycle code are shared once, not duplicated per component.
- [ ] Do not attempt to remove this chunk while FSM is a constraint.

### 2.4 Audit domain behaviors

- [ ] Measure each `behaviors/*` chunk independently.
- [ ] Remove unused exports and cross-imports.
- [ ] Verify that a component only pulls its own domain behavior.
- [ ] Keep the existing dedicated subpath imports mandated by `AGENTS.md`.

Estimated result:

- 3–5 KB gzip saved for apps that do not use measurement-heavy components.
- Smaller shared base for simple pages.

## Phase 3 — Per-Component JS Reduction

Goal: reduce the code generated for each interactive component without removing FSM or `tv`.

### 3.1 Make `progress` presentational

`progress` is currently 10.5 KB raw / 5.0 KB gzip in the reference bundle. It has no meaningful mutually exclusive modes.

- [ ] Confirm it does not need FSM states or transitions.
- [ ] Move its value derivation into `computed` / `connect`, or a presentational helper.
- [ ] Remove the machine dependency if it is not required.
- [ ] Preserve the public API and class output.
- [ ] Add snapshot tests before and after.

Expected saving: 2–3 KB gzip in the reference bundle.

### 3.2 Consolidate connect and attribute builders

- [ ] Create shared helpers for:
  - ID generation
  - ARIA object construction
  - common data-state derivation
  - slot resolution wrappers
- [ ] Replace duplicated blocks across `packages/machines/*/src/*.connect.ts`.
- [ ] Avoid per-component copies of the same helper logic.

### 3.3 Compact theme configuration

Keep `tv`, but reduce the amount of theme data shipped per component.

- [ ] Measure the compiled size of each `virtual:cui/theme/<name>` module.
- [ ] Extract repeated class strings into shared constants where it reduces minified output.
- [ ] Consider a compact tuple/array representation for theme variants if it measurably reduces gzip.
- [ ] Do not move all themes into one shared chunk unless measurement proves it is smaller for typical apps.

### 3.4 Production minification

- [ ] Verify `process.env.NODE_ENV` branches are replaced and dead-code-eliminated in the WeChat build.
- [ ] Remove debug logging and development-only guards from production output.
- [ ] Evaluate the commented `terserOptions` in `packages/components/weapp-vite.config.ts`:
  - `toplevel: true`
  - `passes: 3`
  - `drop_console: true`
  - module-level mangling
- [ ] Measure build time, output size, and runtime behavior before enabling.
- [ ] Do not enable property mangling globally. If used, restrict it to internal machine fields and add regression tests.

Estimated result: 4–8 KB gzip for the reference bundle.

## Phase 4 — CSS Reduction

The demo `app.wxss` is 132.2 KB raw / 16.5 KB gzip. It is generated by Tailwind and includes utilities used by all demo pages and components.

- [ ] Measure the CSS used by the reference 14-feature set only.
- [ ] Ensure Tailwind content scanning does not include demo pages in consumer builds.
- [ ] Purge unused keyframes.
- [ ] Verify `keyframes.wxss` is imported once.
- [ ] Add a CSS budget: <=13 KB gzip for the reference app.
- [ ] Consider shipping a prebuilt minimal utility CSS for consumers who do not use Tailwind directly.
- [ ] Do not replace Tailwind classes with per-component WXSS; it would increase total CSS and break `tv` overrides.

## Phase 5 — CI, Documentation, and Versioning

- [ ] Add `pnpm size` to CI.
- [ ] Fail on budget regressions over 2%.
- [ ] Publish a size report as a CI artifact or PR comment.
- [ ] Document `dataAttributes: "minimal" | "full"`.
- [ ] Document ID and WeChat ARIA behavior: `aria-role`, the supported `aria-*` allowlist, and the Skyline four-attribute limitation.
- [ ] Document that the connect key remains `role` in 0.x but WXML must emit `aria-role`.
- [ ] Add a migration note for the planned default change to `minimal` in the next major version.
- [ ] Add a performance section to the README with the reference numbers and methodology.
- [ ] Add a note in `AGENTS.md` that new components must:
  - use static `data-scope`/`data-part` in WXML
  - use `aria-role`, never `role`, in WXML
  - keep ARIA enabled and within WeChat's supported attribute list
  - avoid static attribute spreads into snapshots
  - stay within the per-component size budget

## Suggested PR Sequence

| PR | Scope | Expected gzip improvement |
|---|---|---:|
| 1 | Size measurement script + baseline + CI budget | 0 KB (enables everything else) |
| 2 | WeChat ARIA alignment (`role` -> `aria-role`) + screen-reader tests | 0 KB |
| 3 | Static attrs to WXML + short ID factory | 1–2 KB |
| 4 | Attribute modes + ARIA helpers + tests | 1–2 KB |
| 5 | Split `common.js` by concern | 3–5 KB |
| 6 | `progress` presentational + connect consolidation | 3–5 KB |
| 7 | Theme config compaction + production minification | 4–8 KB |
| 8 | CSS budget and Tailwind scan cleanup | 3–5 KB |
| 9 | Docs, migration notes, AGENTS update | 0 KB |

## Definition of Done

- [ ] Reference 14-feature bundle <= 68 KB gzip.
- [ ] Full dist <= 138 KB gzip excluding app CSS.
- [ ] `setData` bytes per interaction reduced by at least 20%.
- [ ] No standalone `role` attributes remain in runtime WXML; roles are emitted as `aria-role`.
- [ ] No unsupported `aria-*` attributes or `tabindex` dependencies remain.
- [ ] No ARIA regressions; accessibility snapshot tests pass.
- [ ] Representative VoiceOver and TalkBack smoke tests pass in screen-reader mode.
- [ ] No public API break in the current 0.x line.
- [ ] `pnpm test` passes.
- [ ] `pnpm typecheck` passes.
- [ ] `npx oxlint packages/<pkg>/src` passes for touched packages.
- [ ] `pnpm build` succeeds.
- [ ] Size report is attached to the PR.
- [ ] Documentation and migration notes are updated.

## Risks and Rollback

| Risk | Mitigation |
|---|---|
| Removing `data-*` breaks user CSS | Ship `minimal` as opt-in first; keep `full` as default until a major release |
| WeChat ignores W3C `role` | Emit `aria-role` at the WXML boundary; add a test that forbids standalone `role` attributes |
| Skyline drops most ARIA attributes | Limit Skyline guarantees to `aria-role`/`aria-label`/`aria-hidden`/`aria-disabled`; document and test on Skyline Nightly |
| Stringified booleans announce incorrectly | Bind native booleans or explicit tokens; verify VoiceOver and TalkBack announcements |
| Structural roles are ineffective on mobile | Prefer widget roles; use `aria-label`/`aria-hidden` fallbacks; test representative roles |
| Custom component boundaries hide ARIA | Put ARIA on rendered inner nodes and verify the accessibility tree on a real device |
| Short IDs collide | Namespaced prefix + scope + unit tests |
| Removing decorative IDs breaks focus/relations | Audit every `aria-labelledby`, relation, and focus query before removal |
| Splitting `common.js` duplicates code | Measure per-chunk output and verify no duplicate modules; revert the split if total size increases |
| Terser/property mangling breaks runtime | Restrict mangling to internal fields; run full machine and component tests |
| Tailwind purge removes required classes | Compare rendered class strings against generated CSS in tests |
| Per-file gzip overstates savings | Keep the same measurement method for all before/after comparisons; validate final numbers against an actual WeChat package upload |

## Notes

- WeChat uses `aria-role`, not `role`: [aria-component](https://developers.weixin.qq.com/miniprogram/dev/component/aria-component.html). The supported `aria-*` list is narrower than W3C ARIA, and `tabindex` is not documented.
- Skyline currently supports only `aria-role`, `aria-label`, `aria-hidden`, and `aria-disabled`: [Skyline component support](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/component.html).
- All current `aria-*` names are in WeChat's documented list; the main compatibility issue is `role`. The connect key may stay `role` internally as long as WXML emits `aria-role`.
- The repository currently has 32 source runtime entries, but only 31 are built. `banner/` is empty and `app/` is infrastructure, so there are 30 shipped UI components.
- `weapp-vendors/miniapp-behavior.js` is the machine runtime used by every interactive component. It is required and should be optimized, not removed.
- Attribute cleanup improves runtime more than bundle size. Do not use it as the primary justification for bundle size work.
- Vant parity requires dropping FSM, signals, or runtime `tv`. That is explicitly out of scope.
