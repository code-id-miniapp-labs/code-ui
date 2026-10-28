import { createDOM, isNotNull } from "@code-ui/utils";
import type { MiniAppComponent } from "@code-ui/utils";
import type { BindableContext, ComputedFn, PropFn, Scope } from "@code-ui/core";
import type { StepperSchema, StepperSize } from "./stepper.types";

export interface StepperComponentInstance extends MiniAppComponent {
  createSelectorQuery?: () => any;
  getRelationNodes?(relation: string): StepperComponentInstance[] | undefined;
  __codeUiStepperChildren?: StepperComponentInstance[] | undefined;
}

const STEP_WIDTH_BY_SIZE: Record<StepperSize, number> = {
  xs: 75,
  sm: 95,
  md: 115,
  lg: 135,
  xl: 155,
};

export function clampValue(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function resolveControlledStep(
  prop: PropFn<StepperSchema>,
): number | undefined {
  const rawStep = prop("step");
  if (isNotNull(rawStep)) {
    return Number(rawStep);
  }
  const rawValue = prop("value");
  if (isNotNull(rawValue)) {
    return Number(rawValue);
  }
  const rawModelValue = prop("modelValue");
  if (isNotNull(rawModelValue)) {
    return Number(rawModelValue);
  }
  return undefined;
}

function applyScrollOffset(
  context: BindableContext<StepperSchema>,
  nextScroll: number,
  actualScrollLeft?: number,
): void {
  const rounded = Math.max(0, Math.round(nextScroll));
  const current = context.get("scrollLeft") || 0;
  if (
    rounded === current &&
    actualScrollLeft !== undefined &&
    Math.abs(actualScrollLeft - rounded) > 2
  ) {
    context.set("scrollLeft", rounded > 0 ? rounded - 1 : 1);
    return;
  }
  context.set("scrollLeft", rounded);
}

export function performScrollUpdate(
  context: BindableContext<StepperSchema>,
  computed: ComputedFn<StepperSchema>,
  prop: PropFn<StepperSchema>,
  scope?: Scope | undefined,
  stepIndex?: number | undefined,
  explicitTargetIndex?: number | undefined,
): void;
export function performScrollUpdate(
  context: BindableContext<StepperSchema>,
  computed: ComputedFn<StepperSchema>,
  prop: PropFn<StepperSchema>,
  stepIndex?: number | undefined,
  explicitTargetIndex?: number | undefined,
): void;
export function performScrollUpdate(
  context: BindableContext<StepperSchema>,
  computed: ComputedFn<StepperSchema>,
  prop: PropFn<StepperSchema>,
  scopeOrStepIndex?: Scope | number | undefined,
  stepIndexOrExplicitTarget?: number | undefined,
  explicitTargetIndex?: number | undefined,
): void {
  let scope: Scope | undefined;
  let stepIndex: number | undefined;
  let targetIdx: number | undefined;

  if (typeof scopeOrStepIndex === "number") {
    scope = undefined;
    stepIndex = scopeOrStepIndex;
    targetIdx = stepIndexOrExplicitTarget;
  } else {
    scope = scopeOrStepIndex;
    stepIndex = stepIndexOrExplicitTarget;
    targetIdx = explicitTargetIndex;
  }

  const step = stepIndex !== undefined ? stepIndex : context.get("step");
  const total = computed("totalCount");
  const maxIdx = Math.max(0, total - 1);
  const targetIndex =
    targetIdx !== undefined
      ? clampValue(targetIdx, 0, total > 0 ? maxIdx : targetIdx)
      : step > 0
        ? Math.min(step + 1, total > 0 ? maxIdx : step + 1)
        : 0;

  context.set("scrollTargetIndex", targetIndex);

  const size = (context.get("size") || "md") as StepperSize;
  const stepWidth = STEP_WIDTH_BY_SIZE[size] ?? 115;
  const refIndex = targetIdx !== undefined ? targetIdx : step;
  const fallbackScrollLeft =
    refIndex <= 0 ? 0 : Math.max(0, refIndex * stepWidth - 40);

  const comp = (scope?.component ?? prop("component")) as
    | StepperComponentInstance
    | undefined;
  if (!comp || typeof comp.createSelectorQuery !== "function") {
    context.set("scrollLeft", fallbackScrollLeft);
    return;
  }

  const relationChildren =
    typeof comp.getRelationNodes === "function"
      ? comp.getRelationNodes("cuiStepperChild")
      : undefined;
  const children: StepperComponentInstance[] =
    Array.isArray(relationChildren) && relationChildren.length > 0
      ? relationChildren
      : Array.isArray(comp.__codeUiStepperChildren)
        ? comp.__codeUiStepperChildren
        : [];

  if (children.length === 0) {
    context.set("scrollLeft", fallbackScrollLeft);
    return;
  }

  const curChild = children[clampValue(step, 0, children.length - 1)];
  const targetChild = children[clampValue(targetIndex, 0, children.length - 1)];

  if (!targetChild || typeof targetChild.createSelectorQuery !== "function") {
    context.set("scrollLeft", fallbackScrollLeft);
    return;
  }

  const dom = scope?.dom ?? createDOM(comp);

  const listPromise = dom.fields(".cui-stepper-list", {
    rect: true,
    size: true,
    scrollOffset: true,
  });
  const targetPromise = createDOM(targetChild).rect(".cui-stepper-item");
  const curPromise =
    curChild &&
    curChild !== targetChild &&
    typeof curChild.createSelectorQuery === "function"
      ? createDOM(curChild).rect(".cui-stepper-item")
      : Promise.resolve(null);

  Promise.all([listPromise, targetPromise, curPromise])
    .then(([listRes, targetRect, curRect]) => {
      if (!listRes || !listRes.width || !targetRect) {
        context.set("scrollLeft", fallbackScrollLeft);
        return;
      }

      const actualScroll = Number(listRes.scrollLeft || 0);
      if (refIndex <= 0) {
        applyScrollOffset(context, 0, actualScroll);
        return;
      }

      const listLeft = Number(listRes.left || 0);
      const listWidth = Number(listRes.width || 0);

      const targetOffsetRight =
        actualScroll + (Number(targetRect.right || 0) - listLeft);
      const targetOffsetLeft =
        actualScroll + (Number(targetRect.left || 0) - listLeft);

      const curOffsetLeft = curRect
        ? actualScroll + (Number(curRect.left || 0) - listLeft)
        : targetOffsetLeft;
      const revealNext = Math.max(0, targetOffsetRight - listWidth + 16);
      const keepCurVisible = Math.max(0, curOffsetLeft - 16);
      const nextScroll = Math.min(revealNext, keepCurVisible);
      applyScrollOffset(context, nextScroll, actualScroll);
    })
    .catch(() => {
      context.set("scrollLeft", fallbackScrollLeft);
    });
}
