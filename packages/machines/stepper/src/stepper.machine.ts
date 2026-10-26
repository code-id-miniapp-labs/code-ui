import { createMachine } from "@code-ui/core";
import { createEventBus, isNotNull } from "@code-ui/utils";
import type {
  StepperBusEvents,
  StepperColor,
  StepperItem,
  StepperMachine,
  StepperOrientation,
  StepperSchema,
  StepperSize,
  StepperVariant,
} from "./stepper.types";
import { defaultStepperProps } from "./stepper.props";

const STEP_WIDTH_BY_SIZE: Record<string, number> = {
  xs: 75,
  sm: 95,
  md: 115,
  lg: 135,
  xl: 155,
};

function clampValue(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

function resolveControlledStep(prop: (key: any) => any): number | undefined {
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
  context: any,
  nextScroll: number,
  actualScrollLeft?: number,
) {
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

function performScrollUpdate(
  context: any,
  computed: (key: any) => any,
  prop: (key: any) => any,
  stepIndex?: number,
  explicitTargetIndex?: number,
) {
  const step = stepIndex !== undefined ? stepIndex : context.get("step");
  const total = computed("totalCount");
  const maxIdx = Math.max(0, total - 1);
  const targetIndex =
    explicitTargetIndex !== undefined
      ? clampValue(explicitTargetIndex, 0, total > 0 ? maxIdx : explicitTargetIndex)
      : step > 0
        ? Math.min(step + 1, total > 0 ? maxIdx : step + 1)
        : 0;

  context.set("scrollTargetIndex", targetIndex);

  const size = (context.get("size") || "md") as string;
  const stepWidth = STEP_WIDTH_BY_SIZE[size] ?? 115;
  const refIndex = explicitTargetIndex !== undefined ? explicitTargetIndex : step;
  const fallbackScrollLeft =
    refIndex <= 0 ? 0 : Math.max(0, refIndex * stepWidth - 40);

  const comp = prop("component") as any;
  if (!comp || typeof comp.createSelectorQuery !== "function") {
    context.set("scrollLeft", fallbackScrollLeft);
    return;
  }

  const relationChildren =
    typeof comp.getRelationNodes === "function"
      ? comp.getRelationNodes("cuiStepperChild")
      : undefined;
  const children: any[] =
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

  comp
    .createSelectorQuery()
    .select(".cui-stepper-list")
    .fields(
      { rect: true, size: true, scrollOffset: true },
      (listRes: any) => {
        if (!listRes || !listRes.width) {
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

        targetChild
          .createSelectorQuery()
          .select(".cui-stepper-item")
          .boundingClientRect((targetRect: any) => {
            if (!targetRect) {
              context.set("scrollLeft", fallbackScrollLeft);
              return;
            }

            const targetOffsetRight =
              actualScroll + (Number(targetRect.right || 0) - listLeft);
            const targetOffsetLeft =
              actualScroll + (Number(targetRect.left || 0) - listLeft);

            if (
              curChild &&
              curChild !== targetChild &&
              typeof curChild.createSelectorQuery === "function"
            ) {
              curChild
                .createSelectorQuery()
                .select(".cui-stepper-item")
                .boundingClientRect((curRect: any) => {
                  const curOffsetLeft = curRect
                    ? actualScroll + (Number(curRect.left || 0) - listLeft)
                    : targetOffsetLeft;
                  const revealNext = Math.max(
                    0,
                    targetOffsetRight - listWidth + 16,
                  );
                  const keepCurVisible = Math.max(0, curOffsetLeft - 16);
                  const nextScroll = Math.min(revealNext, keepCurVisible);
                  applyScrollOffset(context, nextScroll, actualScroll);
                })
                .exec();
            } else {
              const revealNext = Math.max(
                0,
                targetOffsetRight - listWidth + 16,
              );
              const keepCurVisible = Math.max(0, targetOffsetLeft - 16);
              const nextScroll = Math.min(revealNext, keepCurVisible);
              applyScrollOffset(context, nextScroll, actualScroll);
            }
          })
          .exec();
      },
    )
    .exec();
}

export const stepperMachine: StepperMachine = createMachine<StepperSchema>({
  props: ({ props }) => ({
    ...defaultStepperProps,
    ...props,
  }),

  initialState: () => "idle",

  refs: ({ prop }) => {
    const controlled = resolveControlledStep(prop);
    const initial = controlled ?? Number(prop("defaultStep") ?? 0);
    return {
      initialStep: initial,
      prevStepProp: prop("step"),
      prevValueProp: prop("value"),
      prevModelValueProp: prop("modelValue"),
      prevTotalCount: 0,
      prevSize: (prop("size") ?? "md") as StepperSize,
      syncingFromProps: false,
      bus: createEventBus<StepperBusEvents>(),
      busDisposers: [],
    };
  },

  context: ({ prop, bindable, getRefs }) => {
    const b = <T>(key: any, defaultValue: T) =>
      bindable<T>(() => ({ value: prop(key), defaultValue }));

    const controlled = resolveControlledStep(prop);
    const initial = controlled ?? Number(prop("defaultStep") ?? 0);
    const initialItems = prop("items") ?? [];
    const initialTotal =
      Array.isArray(initialItems) && initialItems.length > 0
        ? initialItems.length
        : Number(prop("linkedCount") ?? prop("count") ?? 0);
    const initialTargetIdx =
      initial > 0 && initialTotal > 0
        ? Math.min(initial + 1, initialTotal - 1)
        : initial > 0
          ? initial + 1
          : 0;

    return {
      step: bindable<number>(() => {
        return {
          defaultValue: initial,
          onChange: (nextStep, prevStep) => {
            if (getRefs().get("syncingFromProps")) {
              return;
            }
            const items = prop("items") ?? [];
            const itemObj = Array.isArray(items) ? items[nextStep] : undefined;
            const resolvedVal =
              itemObj?.value !== undefined ? itemObj.value : nextStep;
            const previousStep =
              prevStep !== undefined ? Number(prevStep) : initial;

            const details = {
              step: nextStep,
              value: resolvedVal,
              previousStep,
            };

            prop("onStepChange")?.({ ...details });
            prop("onChange")?.({ ...details });

            const comp = prop("component");
            comp?.triggerEvent?.("change", { ...details });
            comp?.triggerEvent?.("update:modelValue", nextStep);

            const itemsLen = Array.isArray(items) ? items.length : 0;
            const linkedLen = Number(prop("linkedCount") ?? 0);
            const rawCount = Number(prop("count") ?? 0);
            const totalCount =
              itemsLen > 0 ? itemsLen : linkedLen > 0 ? linkedLen : rawCount;

            if (totalCount > 0 && nextStep >= totalCount - 1) {
              prop("onComplete")?.({ step: nextStep });
              comp?.triggerEvent?.("complete", { step: nextStep });
            }

            const bus = getRefs().get("bus");
            if (bus) {
              bus.emit("stepper:change", {
                step: nextStep,
                count: totalCount,
                linear: Boolean(prop("linear")),
                orientation: (prop("orientation") ?? "horizontal") as StepperOrientation,
                color: (prop("color") ?? "primary") as StepperColor,
                size: (prop("size") ?? "md") as StepperSize,
                variant: (prop("variant") ?? "subtle") as StepperVariant,
                disabled: Boolean(prop("disabled")),
              });
            }
          },
        };
      }),

      count: b<number>("count", 0),
      linkedCount: b<number>("linkedCount", 0),
      linear: b<boolean>("linear", false),
      orientation: b<StepperOrientation>("orientation", "horizontal"),
      color: b<StepperColor>("color", "primary"),
      size: b<StepperSize>("size", "md"),
      variant: b<StepperVariant>("variant", "subtle"),
      disabled: b<boolean>("disabled", false),
      hasContent: b<boolean>("hasContent", false),
      items: b<StepperItem[]>("items", []),
      focusedIndex: bindable<number | null>(() => ({ defaultValue: null })),
      id: b<string>("id", ""),
      scrollLeft: bindable<number>(() => ({ defaultValue: 0 })),
      scrollTargetIndex: bindable<number>(() => ({
        defaultValue: initialTargetIdx,
      })),
      ui: b("ui", {}),
    };
  },

  computed: {
    totalCount: ({ context }) => {
      const items = context.get("items");
      if (Array.isArray(items) && items.length > 0) {
        return items.length;
      }
      const linked = context.get("linkedCount");
      if (linked > 0) {
        return linked;
      }
      return Math.max(0, Number(context.get("count") ?? 0));
    },

    percent: ({ context, computed }) => {
      const total = computed("totalCount");
      if (total <= 1) return 0;
      const current = clampValue(context.get("step"), 0, total - 1);
      return Math.round((current / (total - 1)) * 100);
    },

    hasNext: ({ context, computed }) => {
      const total = computed("totalCount");
      if (total <= 0) return false;
      return context.get("step") < total - 1;
    },

    hasPrev: ({ context }) => {
      return context.get("step") > 0;
    },

    isFirst: ({ context }) => {
      return context.get("step") <= 0;
    },

    isLast: ({ context, computed }) => {
      const total = computed("totalCount");
      if (total <= 0) return true;
      return context.get("step") >= total - 1;
    },

    isCompleted: ({ context, computed }) => {
      const total = computed("totalCount");
      if (total <= 0) return false;
      return context.get("step") >= total - 1;
    },

    isInteractive: ({ context }) => {
      return !context.get("disabled");
    },

    scrollTargetIndex: ({ context, computed }) => {
      const explicit = context.get("scrollTargetIndex");
      if (explicit !== undefined && explicit !== null) {
        return explicit;
      }
      const step = context.get("step");
      const total = computed("totalCount");
      if (total <= 0) return 0;
      return step > 0 ? Math.min(step + 1, total - 1) : 0;
    },

    scrollIntoViewId: ({ context, computed }) => {
      const total = computed("totalCount");
      if (total <= 0) return "";
      const targetIndex = computed("scrollTargetIndex");
      const sid = context.get("id") || "root";
      return `cui-step-${sid}-${targetIndex}`;
    },
  },

  watch: ({ prop, context, refs, computed }) => {
    const rawStep = prop("step");
    const rawValue = prop("value");
    const rawModelValue = prop("modelValue");

    let nextControlled: number | undefined;
    if (rawStep !== refs.get("prevStepProp")) {
      refs.set("prevStepProp", rawStep);
      if (isNotNull(rawStep)) nextControlled = Number(rawStep);
    }
    if (rawValue !== refs.get("prevValueProp")) {
      refs.set("prevValueProp", rawValue);
      if (isNotNull(rawValue)) nextControlled = Number(rawValue);
    }
    if (rawModelValue !== refs.get("prevModelValueProp")) {
      refs.set("prevModelValueProp", rawModelValue);
      if (isNotNull(rawModelValue)) nextControlled = Number(rawModelValue);
    }

    if (nextControlled !== undefined && nextControlled !== context.get("step")) {
      refs.set("syncingFromProps", true);
      try {
        context.set("step", nextControlled);
      } finally {
        refs.set("syncingFromProps", false);
      }
      performScrollUpdate(context, computed, prop, nextControlled);
    }

    const total = computed("totalCount");
    if (total !== refs.get("prevTotalCount")) {
      refs.set("prevTotalCount", total);
      if (total > 0) {
        performScrollUpdate(context, computed, prop, context.get("step"));
      }
    }

    const currentSize = (context.get("size") || "md") as StepperSize;
    if (currentSize !== refs.get("prevSize")) {
      refs.set("prevSize", currentSize);
      if (total > 0) {
        performScrollUpdate(context, computed, prop, context.get("step"));
      }
    }

    const controlledDisabled = prop("disabled");
    if (controlledDisabled !== undefined) {
      context.set("disabled", Boolean(controlledDisabled));
    }

    const controlledLinear = prop("linear");
    if (controlledLinear !== undefined && Boolean(controlledLinear) !== context.get("linear")) {
      context.set("linear", Boolean(controlledLinear));
    }

    const controlledColor = prop("color");
    if (controlledColor !== undefined && controlledColor !== context.get("color")) {
      context.set("color", controlledColor as StepperColor);
    }

    const controlledVariant = prop("variant");
    if (controlledVariant !== undefined && controlledVariant !== context.get("variant")) {
      context.set("variant", controlledVariant as StepperVariant);
    }

    const controlledOrientation = prop("orientation");
    if (controlledOrientation !== undefined && controlledOrientation !== context.get("orientation")) {
      context.set("orientation", controlledOrientation as StepperOrientation);
    }

    const controlledItems = prop("items");
    if (controlledItems !== undefined) {
      context.set("items", controlledItems);
    }

    const controlledId = prop("id");
    if (controlledId !== undefined && controlledId !== context.get("id")) {
      context.set("id", String(controlledId));
    }

    const bus = refs.get("bus");
    if (bus) {
      bus.emit("stepper:change", {
        step: context.get("step"),
        count: total,
        linear: Boolean(context.get("linear")),
        orientation: context.get("orientation") || "horizontal",
        color: context.get("color") || "primary",
        size: currentSize,
        variant: context.get("variant") || "subtle",
        disabled: Boolean(context.get("disabled")),
      });
    }
  },

  entry: ["setupStepperBus"],
  exit: ["cleanupStepperBus"],

  on: {
    "STEP.SET": {
      guard: "canNavigateStep",
      actions: ["setStep", "updateScroll"],
    },
    "STEP.NEXT": {
      guard: "canNextStep",
      actions: ["nextStep", "updateScroll"],
    },
    "STEP.PREV": {
      guard: "canPrevStep",
      actions: ["prevStep", "updateScroll"],
    },
    "STEP.RESET": {
      actions: ["resetStep", "updateScroll"],
    },
    "STEP.SCROLL_TO": {
      actions: ["scrollTo"],
    },
    "COUNT.SET": {
      actions: ["setCount"],
    },
    "ITEMS.SET": {
      actions: ["setItems"],
    },
  },

  states: {
    idle: {
      tags: ["idle"],
      on: {
        FOCUS: {
          target: "focused",
          actions: ["setFocusedIndex"],
        },
      },
    },
    focused: {
      tags: ["focused"],
      on: {
        FOCUS: {
          actions: ["setFocusedIndex"],
        },
        BLUR: {
          target: "idle",
          actions: ["clearFocusedIndex"],
        },
      },
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => computed("isInteractive"),

      canNavigateStep: ({ context, computed, event }) => {
        if (!computed("isInteractive")) return false;
        if (!("step" in event)) return false;
        const target = Number(event.step);
        if (Number.isNaN(target) || target < 0) return false;
        const total = computed("totalCount");
        if (total > 0 && target > total) return false;

        const items = context.get("items");
        if (target < total && Array.isArray(items) && items[target]?.disabled) {
          return false;
        }

        if (context.get("linear")) {
          const current = context.get("step");
          if (target > current + 1) {
            return false;
          }
        }
        return true;
      },

      canNextStep: ({ context, computed }) => {
        if (!computed("isInteractive")) return false;
        if (!computed("hasNext")) return false;
        const nextIdx = context.get("step") + 1;
        const items = context.get("items");
        if (Array.isArray(items) && items[nextIdx]?.disabled) {
          return false;
        }
        return true;
      },

      canPrevStep: ({ context, computed }) => {
        if (!computed("isInteractive")) return false;
        if (!computed("hasPrev")) return false;
        const prevIdx = context.get("step") - 1;
        const items = context.get("items");
        if (Array.isArray(items) && items[prevIdx]?.disabled) {
          return false;
        }
        return true;
      },
    },

    actions: {
      setStep: ({ context, event }) => {
        if ("step" in event) {
          context.set("step", Number(event.step));
        }
      },

      nextStep: ({ context, computed }) => {
        const total = computed("totalCount");
        const next = context.get("step") + 1;
        const clamped = total > 0 ? clampValue(next, 0, total - 1) : next;
        context.set("step", clamped);
      },

      prevStep: ({ context }) => {
        const prev = Math.max(0, context.get("step") - 1);
        context.set("step", prev);
      },

      resetStep: ({ context, refs, prop }) => {
        const initial =
          refs.get("initialStep") ?? Number(prop("defaultStep") ?? 0);
        context.set("step", initial);
      },

      updateScroll: ({ context, computed, prop }) => {
        performScrollUpdate(context, computed, prop);
      },

      scrollTo: ({ context, computed, prop, event }) => {
        if ("index" in event && event.index !== undefined) {
          performScrollUpdate(
            context,
            computed,
            prop,
            context.get("step"),
            Number(event.index),
          );
        }
      },

      setCount: ({ context, event }) => {
        if ("count" in event) {
          context.set("count", Math.max(0, Number(event.count)));
        }
      },

      setItems: ({ context, event }) => {
        if ("items" in event && Array.isArray(event.items)) {
          context.set("items", event.items);
        }
      },

      setFocusedIndex: ({ context, event }) => {
        if ("index" in event && event.index !== undefined) {
          context.set("focusedIndex", Number(event.index));
        }
      },

      clearFocusedIndex: ({ context }) => {
        context.set("focusedIndex", null);
      },

      setupStepperBus: ({ refs, send }) => {
        const bus = refs.get("bus");
        if (bus) {
          const unsub = bus.on("item:tap", ({ index, value }) => {
            send({ type: "STEP.SET", step: index, value });
          });
          const disposers = refs.get("busDisposers") || [];
          disposers.push(unsub);
          refs.set("busDisposers", disposers);
        }
      },

      cleanupStepperBus: ({ refs }) => {
        const disposers = refs.get("busDisposers") || [];
        for (const unsub of disposers) unsub?.();
        refs.set("busDisposers", []);
      },
    },
  },
});

