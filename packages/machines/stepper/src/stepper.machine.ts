import { createMachine } from "@code-ui/core";
import { getItemId } from "./stepper.dom";
import type {
  StepperGroupContext,
  StepperItem,
  StepperMachine,
  StepperSchema,
} from "./stepper.types";
import { defaultStepperProps } from "./stepper.props";
import { clampValue, resolveControlledStep } from "./stepper.utils";

export const stepperMachine: StepperMachine = createMachine<StepperSchema>({
  props: ({ props }) => ({
    ...defaultStepperProps,
    ...props,
  }),

  initialState: () => "idle",

  refs: ({ prop, context, computed, send }) => {
    const initial = resolveControlledStep(prop) ?? prop("defaultStep");
    return {
      initialStep: initial,
      groupContext: {
        step: () => context.get("step"),
        count: () => computed("totalCount"),
        linear: () => prop("linear"),
        orientation: () => prop("orientation"),
        color: () => prop("color"),
        size: () => prop("size"),
        variant: () => prop("variant"),
        disabled: () => prop("disabled"),
        setStep: (step) => send({ type: "STEP.SET", step }),
        next: () => send({ type: "STEP.NEXT" }),
        previous: () => send({ type: "STEP.PREV" }),
        reset: () => send({ type: "STEP.RESET" }),
      } satisfies StepperGroupContext,
    };
  },

  context: ({ prop, bindable, getComputed }) => {
    const initial = resolveControlledStep(prop) ?? prop("defaultStep");

    return {
      step: bindable<number>(() => ({
        value: resolveControlledStep(prop),
        defaultValue: initial,
        onChange: (nextStep, prevStep) => {
          const items = prop("items");
          const itemObj = Array.isArray(items) ? items[nextStep] : undefined;
          const resolvedVal =
            itemObj?.value !== undefined ? itemObj.value : nextStep;
          const previousStep =
            prevStep !== undefined ? Number(prevStep) : initial;

          prop("onChange")?.({
            step: nextStep,
            value: resolvedVal,
            previousStep,
          });
          prop("onUpdateModelValue")?.(nextStep);

          const totalCount = getComputed()("totalCount");
          if (totalCount > 0 && nextStep >= totalCount - 1) {
            prop("onComplete")?.({ step: nextStep });
          }
        },
      })),
      count: bindable<number>(() => ({
        value: prop("count"),
        defaultValue: 0,
      })),
      items: bindable<StepperItem[]>(() => ({
        value: prop("items"),
        defaultValue: [],
      })),
      focusedIndex: bindable<number | null>(() => ({ defaultValue: null })),
      scrollTargetIndex: bindable<number | null>(() => ({
        defaultValue: null,
      })),
    };
  },

  computed: {
    totalCount: ({ context, prop }) => {
      const items = context.get("items");
      if (Array.isArray(items) && items.length > 0) {
        return items.length;
      }
      const linked = prop("linkedCount");
      if (linked > 0) {
        return linked;
      }
      return Math.max(0, Number(context.get("count")));
    },

    percent: ({ context, computed }) => {
      const total = computed("totalCount");
      if (total <= 1) return 0;
      const current = clampValue(context.get("step"), 0, total - 1);
      return Math.round((current / (total - 1)) * 100);
    },

    hasNext: ({ context, computed }) => {
      const total = computed("totalCount");
      return total > 0 && context.get("step") < total - 1;
    },

    hasPrev: ({ context }) => context.get("step") > 0,

    isFirst: ({ context }) => context.get("step") <= 0,

    isLast: ({ context, computed }) => {
      const total = computed("totalCount");
      return total <= 0 || context.get("step") >= total - 1;
    },

    isCompleted: ({ context, computed }) => {
      const total = computed("totalCount");
      return total > 0 && context.get("step") >= total - 1;
    },

    isInteractive: ({ prop }) => !prop("disabled"),

    scrollTargetIndex: ({ context, computed }) => {
      const explicit = context.get("scrollTargetIndex");
      if (explicit !== null) {
        return explicit;
      }
      const step = context.get("step");
      const total = computed("totalCount");
      if (total <= 0) return step > 0 ? step + 1 : 0;
      return step > 0 ? Math.min(step + 1, total - 1) : 0;
    },

    scrollIntoViewId: ({ computed, scope }) => {
      if (computed("totalCount") <= 0) return "";
      return getItemId(scope, computed("scrollTargetIndex"));
    },
  },

  effects: ["trackControlledStep"],

  on: {
    "STEP.SET": {
      guard: "canNavigateStep",
      actions: ["setStep", "clearScrollTarget"],
    },
    "STEP.NEXT": {
      guard: "canNextStep",
      actions: ["nextStep", "clearScrollTarget"],
    },
    "STEP.PREV": {
      guard: "canPrevStep",
      actions: ["prevStep", "clearScrollTarget"],
    },
    "STEP.RESET": {
      actions: ["resetStep", "clearScrollTarget"],
    },
    "STEP.COMPLETE": {
      guard: "isInteractive",
      actions: ["completeStep", "clearScrollTarget"],
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

      canNavigateStep: ({ context, computed, prop, event }) => {
        if (
          !computed("isInteractive") ||
          event.type !== "STEP.SET" ||
          event.step === null ||
          event.step === undefined
        ) {
          return false;
        }
        const target = Number(event.step);
        if (Number.isNaN(target) || target < 0) return false;
        const total = computed("totalCount");
        if (total > 0 && target > total) return false;

        const items = context.get("items");
        if (target < total && Array.isArray(items) && items[target]?.disabled) {
          return false;
        }

        if (prop("linear") && target > context.get("step") + 1) {
          return false;
        }
        return true;
      },

      canNextStep: ({ context, computed }) => {
        if (!computed("isInteractive") || !computed("hasNext")) return false;
        const items = context.get("items");
        return !(Array.isArray(items) && items[context.get("step") + 1]?.disabled);
      },

      canPrevStep: ({ context, computed }) => {
        if (!computed("isInteractive") || !computed("hasPrev")) return false;
        const items = context.get("items");
        return !(Array.isArray(items) && items[context.get("step") - 1]?.disabled);
      },
    },

    actions: {
      setStep: ({ context, event }) => {
        if (event.type === "STEP.SET") {
          context.set("step", Number(event.step));
        }
      },

      nextStep: ({ context, computed }) => {
        const total = computed("totalCount");
        const next = context.get("step") + 1;
        context.set("step", total > 0 ? clampValue(next, 0, total - 1) : next);
      },

      prevStep: ({ context }) => {
        context.set("step", Math.max(0, context.get("step") - 1));
      },

      resetStep: ({ context, refs, prop }) => {
        context.set("step", refs.get("initialStep") ?? prop("defaultStep"));
      },

      completeStep: ({ context, computed }) => {
        context.set("step", computed("totalCount"));
      },

      clearScrollTarget: ({ context }) => {
        context.set("scrollTargetIndex", null);
      },

      scrollTo: ({ context, computed, event }) => {
        if (
          event.type === "STEP.SCROLL_TO" &&
          event.index !== null &&
          event.index !== undefined
        ) {
          const total = computed("totalCount");
          const raw = Number(event.index);
          if (!Number.isNaN(raw)) {
            context.set(
              "scrollTargetIndex",
              clampValue(raw, 0, total > 0 ? total - 1 : Math.max(0, raw)),
            );
          }
        }
      },

      setCount: ({ context, event }) => {
        if (event.type === "COUNT.SET") {
          context.set("count", Math.max(0, Number(event.count)));
        }
      },

      setItems: ({ context, event }) => {
        if (event.type === "ITEMS.SET" && Array.isArray(event.items)) {
          context.set("items", event.items);
        }
      },

      setFocusedIndex: ({ context, event }) => {
        if (event.type === "FOCUS" && event.index !== undefined) {
          context.set("focusedIndex", Number(event.index));
        }
      },

      clearFocusedIndex: ({ context }) => {
        context.set("focusedIndex", null);
      },
    },

    effects: {
      trackControlledStep: ({ prop, context, track }) => {
        let initial = true;
        track(
          [() => resolveControlledStep(prop)],
          () => {
            if (initial) {
              initial = false;
              return;
            }
            if (resolveControlledStep(prop) !== undefined) {
              context.set("scrollTargetIndex", null);
            }
          },
        );
      },
    },
  },
});
