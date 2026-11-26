---
title: Tour
description: Guided product tour and spotlight walkthrough overlay for WeChat MiniProgram with tooltip, dialog, floating, and wait steps, automatic target border-radius detection, auto-scrolling, collision flipping, and step-scoped effects.
---

## Overview

`c-tour` is a guided walkthrough and onboarding overlay inspired by Zag.js Tour and built for WeChat MiniProgram (`weapp`, both WebView and Skyline).

### Features

- **Four step presentation modes**: anchored spotlight `"tooltip"`, centered `"dialog"`, viewport-docked `"floating"`, and interactive `"wait"` steps.
- **Smart spotlight cutout**: renders a seamless rounded cutout around target elements and automatically detects each target's computed `border-radius` (sharp `0px` for square nodes, concentric curves for rounded cards/buttons/pills), with optional manual override.
- **Interactive pass-through or lock**: keeps the spotlighted target tappable by default (`preventInteraction="{{false}}"`), or locks target interaction globally or per step (`preventInteraction: true`).
- **Auto-scroll & viewport collision flipping**: scrolls off-screen targets smoothly into view via `wx.pageScrollTo`, flips tooltip placement (`top` / `bottom` / `left` / `right`) when near viewport edges, and keeps the directional arrow aligned with the target center.
- **Step-scoped side effects (`step.effect`)**: run setup logic when entering a step (such as expanding hidden panels, loading remote data, or calling `show()` to re-measure) with automatic cleanup on step exit or tour close.
- **Ergonomic navigation & actions**: automatic `Back` / `Next` / `Finish` / optional `Skip` buttons out of the box, or per-step custom `actions` backed by `<c-button>`.
- **Zero idle overhead**: renders inside `<root-portal>` and only mounts overlay DOM while visible (`tour.visible`). Pair with [`useTour`](/composables/use-tour) for one-time `startOnce()` onboarding persistence and zero `selectComponent` boilerplate.

## Usage

### Basic

Define an ordered array of `steps` and launch the tour via [`useTour`](/composables/use-tour) (or directly via `this.selectComponent("#app-tour").start()`):

::code-group

```html [index.wxml]
<c-button label="Start Tour" bind:tap="startTour" />

<view id="tour-search" class="mt-4">
  <c-input placeholder="Search workspace..." leading-icon="i-lucide-search" />
</view>

<c-tour
  id="app-tour"
  steps="{{ steps }}"
  skip-label="Skip"
  bind:statusChange="onTourStatusChange"
/>
```

```ts [index.ts]
import {
  useTour,
  type TourStepDetails,
  type UseTourReturn,
} from "@code-id-labs/composables";

const STEPS: TourStepDetails[] = [
  {
    id: "welcome",
    type: "dialog",
    badge: "Welcome",
    title: "Welcome to Code UI",
    description: "Take a quick walkthrough of the key tools on this screen.",
  },
  {
    id: "search",
    type: "tooltip",
    target: "#tour-search",
    badge: "Step 2",
    title: "Quick Search",
    description: "Filter items immediately from the search bar.",
    placement: "bottom",
  },
  {
    id: "tips",
    type: "floating",
    badge: "Tip",
    title: "You're All Set",
    description: "Restart this guide anytime from the header menu.",
    placement: "bottom",
  },
];

Page({
  data: {
    steps: STEPS,
  },

  tour: null as UseTourReturn | null,

  onLoad() {
    this.tour = useTour({
      target: this,
      selector: "#app-tour",
      steps: STEPS,
    });
  },

  onUnload() {
    this.tour?.stop();
  },

  startTour() {
    this.tour?.start();
  },

  onTourStatusChange(e: WechatMiniprogram.CustomEvent) {
    console.log("Tour status:", e.detail.status);
  },
});
```

::

### Step Types

Set `type` on each step (defaults to `"tooltip"` when `target` is provided, otherwise `"dialog"`):

| Step Type | Behavior | Default Placement | Directional Arrow |
| :--- | :--- | :--- | :--- |
| `"tooltip"` | Spotlights `target` CSS selector on the page and anchors the card beside it with auto-scroll & collision flipping. | `"bottom"` | `true` |
| `"dialog"` | Centers the card in the viewport over a full-screen dimmed backdrop. | `"center"` | `false` |
| `"floating"` | Docks the card along a viewport edge (`top`, `bottom`, or `center`) respecting safe-area insets. | `"bottom"` | `false` |
| `"wait"` | Pauses on an interactive target or async task until user interaction or `step.effect` invokes `next()`. Hides the card automatically if `title`, `description`, `badge`, and `actions` are all omitted. | `"bottom"` | `false` |

```ts
const steps: TourStepDetails[] = [
  // 1. Centered dialog
  {
    id: "welcome",
    type: "dialog",
    badge: "New",
    title: "Welcome",
    description: "Centered modal card over a dimmed backdrop.",
  },
  // 2. Anchored tooltip with spotlight cutout & arrow
  {
    id: "search",
    type: "tooltip",
    target: "#tour-search",
    title: "Search Workspace",
    description: "Spotlights #tour-search and places the tooltip below it.",
    placement: "bottom",
  },
  // 3. Viewport-docked floating card
  {
    id: "shortcuts",
    type: "floating",
    title: "Quick Tip",
    description: "Docked cleanly above the bottom safe area without targeting a node.",
    placement: "bottom",
  },
  // 4. Wait step requiring target interaction
  {
    id: "confirm-tap",
    type: "wait",
    target: "#submit-order-btn",
    title: "Tap Submit Order",
    description: "Tap the highlighted button directly to complete this step.",
    preventInteraction: false,
  },
];
```

### Spotlight Cutout, Auto `border-radius` & Interaction Locking

When a `"tooltip"` or `"wait"` step specifies `target`:

- **Auto `border-radius` detection (`spotlightRadius: null`, default)**: `c-tour` queries each target's computed `borderTopLeftRadius` / `borderRadius` in the same `SelectorQuery.fields(...)` pass as its bounding box. Square elements (`0px`) get crisp `0px` cutout corners; rounded cards, buttons, and pills get a matching concentric curve (`targetRadius + spotlightOffset * 0.5`).
- **Manual radius override**: pass `spotlight-radius="{{0}}"` globally for uniform sharp corners, or set `spotlightRadius` per step.
- **Spotlight padding (`spotlightOffset`)**: controls the breathing space in `px` around the target (default `8`, overridable per step).
- **Per-step backdrop toggle (`backdrop: false`)**: renders only the colored spotlight outline without dimming the rest of the page.
- **Target interaction lock (`preventInteraction`)**: defaults to `false` so users can tap controls inside the spotlight. Set `prevent-interaction="{{true}}"` globally (or `preventInteraction: true` on a specific step) to block touches on the highlighted target while outside taps still respect `closeOnInteractOutside`.

```html [index.wxml]
<!-- Global spotlight padding, sharp square corners, and locked targets -->
<c-tour
  id="locked-tour"
  steps="{{ steps }}"
  spotlight-offset="{{ 10 }}"
  spotlight-radius="{{ 0 }}"
  prevent-interaction="{{ true }}"
  close-on-interact-outside="{{ false }}"
/>
```

### Placement, Arrow, Auto-Scroll & Target Scope

- **Placements**: supports `"top"`, `"top-start"`, `"top-end"`, `"bottom"`, `"bottom-start"`, `"bottom-end"`, `"left"`, `"right"`, and `"center"`.
- **Collision flipping (`avoidCollisions`, default `true`)**: automatically flips `bottom` ↔ `top` or `left` ↔ `right` (and falls back vertically on narrow screens) while clamping inside `collisionPadding` (default `16px`) and `maxWidth` (default `320px`).
- **Auto-scrolling (`autoScroll`, default `true`)**: if a target lies above or below the visible viewport band, `c-tour` calls `wx.pageScrollTo` smoothly and re-measures before placing the spotlight and card.
- **Directional arrow**: enabled automatically on `"tooltip"` steps (`arrow: true`) and disabled on `"dialog"` / `"floating"`; override per step with `arrow: false` or `arrow: true`.
- **Nested component targets (`targetScope`)**: by default, `step.target` is queried against the host page (`wx.createSelectorQuery()`). When highlighting elements inside a custom `Component`, pass `targetScope="{{ componentInstance }}"` so selector queries run inside that component's shadow tree.

```ts
const steps: TourStepDetails[] = [
  {
    id: "bottom-card",
    type: "tooltip",
    target: "#footer-summary",
    title: "Order Summary",
    description: "Scrolls into view automatically and flips above the card near the bottom edge.",
    placement: "bottom",
    arrow: true,
    backdrop: true,
  },
];
```

### Custom Step Actions & Default Navigation Labels

When `step.actions` is omitted, `c-tour` renders automatic footer buttons controlled by `prev-label` (`"Back"`), `next-label` (`"Next"`), `done-label` (`"Finish"`), and optional `skip-label` (`""` — hidden until set).

Pass `actions` on any step to define custom labels, built-in commands (`"next"`, `"prev"`, `"skip"`, `"dismiss"`), `<c-button>` visual props (`color`, `variant`, `size`, `icon`, `leadingIcon`, `trailingIcon`, `disabled`), or custom callback handlers:

```ts
const steps: TourStepDetails[] = [
  {
    id: "welcome",
    type: "dialog",
    badge: "Tour",
    title: "Explore New Features",
    description: "Jump straight to analytics or walk through each section.",
    actions: [
      { label: "Skip", action: "skip", variant: "ghost", color: "neutral" },
      {
        label: "Start Tour",
        action: "next",
        color: "primary",
        variant: "solid",
        trailingIcon: "i-lucide-arrow-right",
      },
    ],
  },
];
```

### Interactive Wait Steps & `step.effect()`

#### 1. Wait for User Interaction Inside the Spotlight (`type: "wait"`)

Keep `preventInteraction: false` so taps pass directly through the spotlight cutout to your page component, then call `tour.next()` from your real event handler:

::code-group

```html [index.wxml]
<c-button label="Start Interactive Guide" bind:tap="startGuide" />

<view id="auto-save-row" class="mt-4 p-4 rounded-2xl bg-default border border-default">
  <c-switch
    checked="{{ autoSave }}"
    label="Enable Auto-Save"
    bind:change="onToggleAutoSave"
  />
</view>

<c-tour
  id="interactive-tour"
  steps="{{ guideSteps }}"
  color="info"
  close-on-interact-outside="{{ false }}"
/>
```

```ts [index.ts]
import {
  useTour,
  type TourStepDetails,
  type UseTourReturn,
} from "@code-id-labs/composables";

const GUIDE_STEPS: TourStepDetails[] = [
  {
    id: "enable-auto-save",
    type: "wait",
    target: "#auto-save-row",
    badge: "Try It",
    title: "Turn On Auto-Save",
    description:
      "Tap the switch inside the spotlight to enable automatic draft saving and continue.",
    placement: "bottom",
    preventInteraction: false,
    actions: [
      { label: "Cancel", action: "dismiss", variant: "ghost", color: "neutral" },
    ],
  },
  {
    id: "all-done",
    type: "dialog",
    badge: "Done",
    title: "Auto-Save Enabled",
    description: "Your drafts will now sync automatically whenever you edit.",
    actions: [{ label: "Finish", action: "next" }],
  },
];

Page({
  data: {
    autoSave: false,
    guideSteps: GUIDE_STEPS,
  },

  guideTour: null as UseTourReturn | null,

  onLoad() {
    this.guideTour = useTour({
      target: this,
      selector: "#interactive-tour",
      steps: GUIDE_STEPS,
    });
  },

  onUnload() {
    this.guideTour?.stop();
  },

  startGuide() {
    this.guideTour?.start();
  },

  onToggleAutoSave(e: WechatMiniprogram.CustomEvent<{ checked: boolean }>) {
    const checked = Boolean(e.detail?.checked);
    this.setData({ autoSave: checked });

    if (
      checked &&
      this.guideTour?.open &&
      this.guideTour.stepId === "enable-auto-save"
    ) {
      this.guideTour.next();
    }
  },
});
```

::

#### 2. Step-Scoped Side Effects (`step.effect()`)

Each step can define an `effect({ next, prev, goTo, skip, dismiss, close, reposition, show, step, stepIndex, totalSteps })` callback that runs automatically when entering that step. Any cleanup function returned by `effect()` runs automatically when moving to another step, closing the tour, or unmounting.

Below is a real MiniProgram case where entering Step 2 expands a hidden panel, fetches live quota details with `wx.request`, calls `show()` once rendered to snap the spotlight onto the newly shown node, and aborts the `RequestTask` if the user skips or exits before it completes:

```ts [index.ts]
import type { TourStepDetails } from "@code-id-labs/components";

Page({
  data: {
    showQuotaPanel: false,
    quotaLabel: "Loading...",
  },

  onReady() {
    const tourComp = this.selectComponent("#settings-tour") as any;
    const machine = tourComp?.__codeUiInstance?.getMachine?.();
    if (!machine) return;

    const steps: TourStepDetails[] = [
      {
        id: "intro",
        type: "dialog",
        title: "Workspace Quota",
        description: "Next we'll open your quota panel and load live usage.",
      },
      {
        id: "quota-panel",
        type: "tooltip",
        target: "#quota-card",
        title: "Live Storage Usage",
        description: "This section opens and fetches real data automatically when active.",
        placement: "bottom",
        effect: ({ show }) => {
          // 1. Expand the hidden card and re-measure spotlight once painted
          this.setData({ showQuotaPanel: true }, () => {
            show();
          });

          // 2. Start a real WeChat network request
          const task = wx.request({
            url: "https://api.example.com/workspace/quota",
            success: (res) => {
              const used = (res.data as { label?: string })?.label ?? "2.4 GB / 10 GB";
              this.setData({ quotaLabel: used }, () => show());
            },
          });

          // 3. Automatic cleanup when leaving this step or closing the tour
          return () => {
            task.abort();
          };
        },
      },
      {
        id: "auto-advance-tip",
        type: "floating",
        title: "Auto-Advancing Tip",
        description: "This step finishes automatically after 3 seconds if untouched.",
        effect: ({ next }) => {
          const timer = setTimeout(() => next(), 3000);
          return () => clearTimeout(timer);
        },
      },
    ];

    // Push function-bearing steps directly to the JS-side machine so WeChat setData doesn't strip `effect`
    machine.updateProps({ steps });
  },

  startSettingsTour() {
    const tourComp = this.selectComponent("#settings-tour") as any;
    tourComp?.start();
  },
});
```

::callout{icon="i-lucide-info"}
**Why `machine.updateProps({ steps })` for `step.effect()`?**
In WeChat MiniProgram, passing `steps="{{ steps }}"` through WXML `setData` JSON-serializes the array and strips JS functions (`effect`, custom `action` callbacks, or `target: () => string`). Push `steps` directly via `machine.updateProps({ steps })` when using `step.effect()`, or react to step changes in plain page scripts via `useTour({ onStepChange })` / `bind:stepChange`.
::

### Controlled Open & Step

Bind `open` and `step-id` for full page-level state control:

::code-group

```html [index.wxml]
<c-button label="Open at Step 2" bind:tap="openAtSecondStep" />

<c-tour
  open="{{ tourOpen }}"
  step-id="{{ currentStepId }}"
  steps="{{ steps }}"
  bind:openChange="onOpenChange"
  bind:stepChange="onStepChange"
/>
```

```ts [index.ts]
Page({
  data: {
    tourOpen: false,
    currentStepId: "welcome" as string | null,
    steps: [
      { id: "welcome", type: "dialog", title: "Step 1", description: "Controlled open." },
      { id: "second", type: "floating", title: "Step 2", description: "Controlled stepId." },
    ],
  },

  openAtSecondStep() {
    this.setData({ tourOpen: true, currentStepId: "second" });
  },

  onOpenChange(e: WechatMiniprogram.CustomEvent<{ open: boolean }>) {
    this.setData({ tourOpen: e.detail.open });
  },

  onStepChange(e: WechatMiniprogram.CustomEvent<{ stepId: string | null }>) {
    this.setData({ currentStepId: e.detail.stepId });
  },
});
```

::

### Progress Indicators, Colors, Sizes & Close Trigger

- **Progress indicator**: defaults to animated indicator dots (`progress-variant="dots"`). Switch to `"text"` for `"1 / N"` counters, or hide with `show-progress="{{false}}"`.
- **Colors & Sizes**: tint the spotlight border, step badge, active progress dot, and primary action button with `color` (`"primary"`, `"secondary"`, `"success"`, `"info"`, `"warning"`, `"danger"`, `"neutral"`), and scale spacing/typography with `size` (`"xs"`, `"sm"`, `"md"`, `"lg"`).
- **Close button**: customize with `close-icon`, pass `<c-button>` overrides to `close`, or disable with `close="{{false}}"`.

```html [index.wxml]
<c-tour
  steps="{{ steps }}"
  color="info"
  size="sm"
  progress-variant="text"
  prev-label="Previous"
  next-label="Continue"
  done-label="Got it"
  skip-label="Skip"
  close-icon="x"
/>
```

### Slots

Customize any region of the tour card using named slots. Prop values (`step.title`, `step.description`) take precedence over `title` and `description` slots when present.

```html [index.wxml]
<c-tour id="custom-slots-tour" steps="{{ steps }}">
  <!-- Rendered inside the body area below the header -->
  <view class="p-2.5 rounded-lg bg-muted text-xs text-muted">
    Pro tip: You can drop images, checklists, or badges in the default slot.
  </view>

  <!-- Custom progress indicator -->
  <view slot="progress" class="text-2xs font-semibold text-primary">
    Onboarding
  </view>
</c-tour>
```

### Custom Styling (`ui`, `className` & Backdrop Color)

Override any slot via `ui` and customize the rounded spotlight scrim tint with the `--cui-tour-backdrop` CSS variable (default `rgba(0, 0, 0, 0.55)`):

```html [index.wxml]
<c-tour
  steps="{{ steps }}"
  className="custom-tour-root"
  ui="{{ { content: 'rounded-2xl shadow-xl', spotlight: 'border-4 border-primary' } }}"
/>
```

## State Machine

Click any active transition or event button below to simulate the `tour` state machine live (including toggling `closeOnInteractOutside` and `transition`):

::machine-visualizer{name="tour"}
::

## Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `steps` | `TourStepDetails[]` | `[]` | Ordered list of tour steps. |
| `open` | `boolean \| null` | `null` | Controlled open state (`null` = uncontrolled). |
| `defaultOpen` | `boolean` | `false` | Initial open state when uncontrolled. |
| `stepId` | `string \| null` | `null` | Controlled active step id (`null` = uncontrolled). |
| `defaultStepId` | `string \| null` | `null` | Initial step id when uncontrolled. |
| `targetScope` | `MiniAppComponent` | `undefined` | Optional custom component instance scope when spotlighting nodes inside a nested custom component. |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "danger" \| "neutral"` | `"primary"` | Semantic accent color for the spotlight border, badge, active progress dot, and primary button. |
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | `"md"` | Padding and typography scale of the tour card. |
| `portal` | `boolean` | `true` | Renders the overlay inside WeChat `<root-portal>`. |
| `close` | `boolean \| TourCloseProps \| null` | `true` | Controls the default close trigger button (`false`/`null` hides it; object forwards `<c-button>` props). |
| `closeIcon` | `string` | `""` | Custom icon name for the close button (defaults to `"close"`). |
| `closeOnInteractOutside` | `boolean` | `true` | Whether tapping outside the card/spotlight dismisses the tour. |
| `preventInteraction` | `boolean` | `false` | Blocks touch interaction on the spotlighted target element when `true`. |
| `spotlightOffset` | `number` | `8` | Padding around the highlighted target rectangle in `px`. |
| `spotlightRadius` | `number \| null` | `null` | Border radius of the spotlight cutout in `px`. When `null`, auto-detects the target element's computed `border-radius` (`0` for square elements, concentric curve for rounded elements). |
| `sideOffset` | `number` | `10` | Gap in `px` between the spotlight cutout and tooltip card. |
| `collisionPadding` | `number` | `16` | Minimum viewport edge padding in `px`. |
| `avoidCollisions` | `boolean` | `true` | Automatically flips and clamps tooltip placement to stay inside the viewport. |
| `maxWidth` | `number` | `320` | Maximum card width in `px`. |
| `autoScroll` | `boolean` | `true` | Automatically scrolls off-screen target elements into view via `wx.pageScrollTo`. |
| `showProgress` | `boolean` | `true` | Shows step progress indicator when there are multiple steps. |
| `progressVariant` | `"dots" \| "text"` | `"dots"` | Renders either animated indicator dots or `"1 / N"` text. |
| `getProgressText` | `(details: { stepIndex: number; totalSteps: number }) => string` | `undefined` | Custom formatter for `progressText` (defaults to `` `${stepIndex + 1} / ${totalSteps}` ``). |
| `prevLabel` | `string` | `"Back"` | Default label for the previous step button. |
| `nextLabel` | `string` | `"Next"` | Default label for the next step button. |
| `doneLabel` | `string` | `"Finish"` | Default label for the final step button. |
| `skipLabel` | `string` | `""` | Optional ghost Skip button label rendered when non-empty. |
| `transition` | `boolean` | `true` | Enables enter/exit transition animations. |
| `duration` | `number` | `200` | Close animation duration in `ms`. |
| `ui` | `TourUI` | `{}` | Per-slot class overrides. |
| `className` | `string` | `""` | Additional classes merged onto the `root` slot. |

## Step Configuration (`TourStepDetails`)

| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | *(required)* | Unique identifier for the step. |
| `type` | `"tooltip" \| "dialog" \| "floating" \| "wait"` | `"tooltip"` if `target` set, else `"dialog"` | Presentation mode for this step. |
| `target` | `string \| (() => string \| null \| undefined)` | `undefined` | CSS selector (e.g. `"#hero-cta"`) to spotlight and anchor the tooltip card. |
| `title` | `string` | `undefined` | Step heading text. |
| `description` | `string` | `undefined` | Step body description text. |
| `badge` | `string` | `undefined` | Short eyebrow pill rendered above the title. |
| `placement` | `"top" \| "top-start" \| "top-end" \| "bottom" \| "bottom-start" \| "bottom-end" \| "left" \| "right" \| "center"` | `"bottom"` (`"center"` for `dialog`) | Preferred card placement relative to the target or viewport. |
| `actions` | `TourStepAction[]` | `undefined` | Custom footer action buttons (overrides default Back / Next / Finish / Skip buttons). |
| `backdrop` | `boolean` | `true` | Whether to dim the background around the card/spotlight for this step. |
| `arrow` | `boolean` | `true` for `tooltip`, else `false` | Whether to render the directional arrow on the card edge. |
| `spotlightOffset` | `number` | global `spotlightOffset` | Per-step spotlight padding override in `px`. |
| `spotlightRadius` | `number \| null` | global `spotlightRadius` | Per-step cutout corner radius override (`null` = auto-detect). |
| `preventInteraction` | `boolean` | global `preventInteraction` | Per-step override to lock or allow taps on the spotlighted element. |
| `meta` | `Record<string, any>` | `undefined` | Arbitrary user metadata attached to the step. |
| `effect` | `(args: TourStepEffectArgs) => void \| (() => void)` | `undefined` | Step-scoped setup callback receiving `{ next, prev, goTo, skip, dismiss, close, reposition, show, step, stepIndex, totalSteps }` and returning an optional cleanup function. |

### `TourStepAction`

| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | *(required)* | Visible button label. |
| `action` | `"next" \| "prev" \| "skip" \| "dismiss" \| ((ctx: TourStepActionContext) => void)` | *(required)* | Built-in command or custom callback handler. |
| `color` | `string` | Primary for `"next"` / last action, `"neutral"` otherwise | `<c-button>` color override. |
| `variant` | `string` | `"solid"` for primary, `"ghost"` otherwise | `<c-button>` variant override. |
| `size` | `string` | `"xs"` (`"sm"` when tour `size="lg"`) | `<c-button>` size override. |
| `icon` / `leadingIcon` / `trailingIcon` | `string` | `""` | Optional icon names forwarded to `<c-button>`. |
| `disabled` | `boolean` | `false` | Disables the button and ignores taps. |

## Slots

| Name | Description |
| :--- | :--- |
| `default` | Optional body content rendered below the header inside the tour card. |
| `header` | Replaces the entire default header wrapper (`badge`, `title`, `description`). |
| `title` | Custom title content rendered when `step.title` is empty. |
| `description` | Custom description content rendered when `step.description` is empty. |
| `close` | Custom close trigger content replacing the default `<c-button>`. |
| `footer` | Replaces the entire footer (progress indicator and actions). |
| `progress` | Custom progress indicator replacing the default dots or text. |
| `actions` | Custom action buttons replacing the default/step action buttons. |

## Events

| Event | Detail Payload | Description |
| :--- | :--- | :--- |
| `bind:stepChange` | `{ stepId, stepIndex, totalSteps, step }` | Fired whenever the active step changes. |
| `bind:statusChange` | `{ status, stepId, stepIndex }` | Fired on lifecycle status transitions (`started`, `completed`, `skipped`, `dismissed`, `not-found`). |
| `bind:openChange` | `{ open: boolean }` | Fired when the tour opens or begins closing. |
| `bind:open` | `void` | Fired when the tour starts. |
| `bind:close` | `void` | Fired when the tour begins closing. |
| `bind:exitComplete` | `void` | Fired after the exit transition finishes and state settles to `closed`. |
| `bind:backdropTap` | `void` | Fired when the backdrop scrim is tapped. |
| `bind:closeTriggerTap` | `void` | Fired when the close button is tapped. |

::callout{icon="i-lucide-terminal"}
**Exposed API (`exportApi: true`)**: Access `open`, `visible`, `status`, `step`, `stepId`, `stepIndex`, `totalSteps`, `start(stepId?)`, `setOpen(open)`, `next()`, `prev()`, `goTo(stepIdOrIndex)`, `skip()`, `dismiss()`, `close()`, and `reposition()` directly on the component instance via `this.selectComponent("#my-tour")`, or drive them cleanly via [`useTour`](/composables/use-tour).
::

## Theme

Customize the `tour` theme globally in `cui.config.ts` or per instance via the `ui` prop:

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    zIndex: {
      tour: 10135,
    },
  },
  components: {
    tour: {
      slots: {
        root: "fixed inset-0 z-tour overflow-hidden pointer-events-none box-border",
        backdrop: "fixed pointer-events-auto",
        spotlight: "fixed box-border border-2 border-solid",
        positioner: "fixed z-20 pointer-events-none box-border",
        content:
          "pointer-events-auto relative flex flex-col w-full rounded-xl bg-default text-default border border-muted shadow-2xl box-border",
        arrow:
          "absolute w-2.5 h-2.5 bg-default border-muted pointer-events-none",
        header: "relative flex flex-col shrink-0 box-border w-full px-4 pt-4 pb-2",
        wrapper: "flex flex-col gap-1 min-w-0 w-full",
        badge:
          "inline-flex items-center self-start px-2 py-0.5 mb-0.5 rounded-full text-2xs font-semibold tracking-wide",
        title:
          "text-base font-semibold tracking-tight text-highlighted leading-snug",
        description: "text-xs text-muted leading-relaxed",
        closeTrigger:
          "absolute top-3 right-3 z-20 inline-flex items-center justify-center w-6 h-6 rounded-full bg-elevated text-muted shrink-0 cursor-pointer active:opacity-70 transition-opacity",
        closeButton: "p-0 w-full h-full rounded-full text-inherit",
        closeIcon: "w-3.5 h-3.5",
        body: "w-full box-border px-4 pb-3 text-sm text-default leading-relaxed",
        footer:
          "flex items-center justify-between gap-2.5 px-4 py-3 border-t border-muted shrink-0 box-border w-full",
        progressText: "text-xs font-medium text-muted tabular-nums shrink-0",
        progress: "flex items-center gap-1.5 shrink-0",
        progressDot: "w-1.5 h-1.5 rounded-full bg-accented transition-all duration-200",
        progressDotActive: "w-4 h-1.5 rounded-full transition-all duration-200",
        actions: "flex items-center justify-end gap-2 ml-auto shrink-0",
      },
    },
  },
});
```
