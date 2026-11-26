# Tour (`<c-tour>`) Specification

## Category & Runtime Tier

- **Category**: Interactive / Stateful Overlay
- **Tier**: Tier 2 (FSM in `packages/machines/tour` -> `@code-id-labs/tour`, MiniApp runtime imports from `../_shared/base` and `../_shared/machine`)
- **Reference**: Zag.js Tour (`https://zagjs.com/components/react/tour`) adapted for WeChat MiniProgram (`weapp`, WebView + Skyline) and Code UI Nuxt UI v4 tokens.

## Anatomy & Theme Slots

- `root`, `backdrop`, `spotlight`, `positioner`, `content`, `arrow`, `header`, `wrapper`, `badge`, `title`, `description`, `closeTrigger`, `closeButton`, `closeIcon`, `body`, `footer`, `progressText`, `progress`, `progressDot`, `progressDotActive`, `actions`.

## Step Types

- `tooltip`: Anchored to a page CSS selector (`step.target`) with a 4-panel backdrop scrim cutout + colored spotlight ring + directional arrow + viewport collision flipping.
- `dialog`: Centered modal-style tour step with full-screen dimmed backdrop.
- `floating`: Viewport edge-docked card (`top`, `bottom`, `center`) with dimmed backdrop.
- `wait`: Interactive step waiting on user action or `step.effect` (`ctx.next()`), with optional target spotlight and optional instructional card.

## Props

- Machine behavioral props (`defaultTourProps`): `steps`, `stepId`, `defaultStepId`, `open`, `defaultOpen`, `closeOnInteractOutside`, `preventInteraction`, `spotlightOffset`, `spotlightRadius`, `sideOffset`, `collisionPadding`, `avoidCollisions`, `maxWidth`, `autoScroll`, `duration`, `transition`.
- Visual/UI props: `color`, `size`, `portal`, `close`, `closeIcon`, `showProgress`, `progressVariant`, `prevLabel`, `nextLabel`, `doneLabel`, `skipLabel`, `ui`, `className`.

## Events & Exported API

- Events: `bind:stepChange`, `bind:statusChange`, `bind:openChange`, `bind:open`, `bind:close`, `bind:exitComplete`, `bind:backdropTap`, `bind:closeTriggerTap`.
- Exported API (`exportApi: true`): `open`, `visible`, `step`, `stepId`, `stepIndex`, `totalSteps`, `status`, `start`, `setOpen`, `next`, `prev`, `goTo`, `skip`, `dismiss`, `close`, `reposition`.
