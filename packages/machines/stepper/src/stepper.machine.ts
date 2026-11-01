import { createMachine } from "@code-ui/core";
import type { BindableContext, BindableRefs, ComputedFn } from "@code-ui/core";
import { createEventBus } from "@code-ui/utils";
import type {
  StepperBusEvents,
  StepperColor,
  StepperContext,
  StepperMachine,
  StepperOrientation,
  StepperProps,
  StepperSchema,
  StepperSize,
  StepperVariant,
} from "./stepper.types";
import { defaultStepperProps } from "./stepper.props";
import {
  clampValue,
  performScrollUpdate,
  resolveControlledStep,
} from "./stepper.utils";

function emitStepperChange(
  context: BindableContext<StepperSchema>,
  computed: ComputedFn<StepperSchema>,
  refs: BindableRefs<StepperSchema>,
  stepOverride?: number,
) {
  const bus = refs.get("bus");
  if (!bus) return;
  bus.emit("stepper:change", {
    step: stepOverride ?? context.get("step"),
    count: computed("totalCount"),
    linear: Boolean(context.get("linear")),
    orientation: (context.get("orientation") ||
      "horizontal") as StepperOrientation,
    color: (context.get("color") || "primary") as StepperColor,
    size: (context.get("size") || "md") as StepperSize,
    variant: (context.get("variant") || "subtle") as StepperVariant,
    disabled: Boolean(context.get("disabled")),
  });
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
      bus: createEventBus<StepperBusEvents>(),
      busDisposers: [],
    };
  },

  context: ({ prop, bindable, getRefs, getContext, getComputed }) => {
    const propBindable = <K extends keyof StepperContext & keyof StepperProps>(
      key: K,
      defaultValue: StepperContext[K],
    ) =>
      bindable<StepperContext[K]>(() => ({
        value: prop(key) as StepperContext[K] | undefined,
        defaultValue,
      }));
    const stateBindable = <K extends keyof StepperContext>(
      _key: K,
      defaultValue: StepperContext[K],
    ) => bindable<StepperContext[K]>(() => ({ defaultValue }));

    const controlled = resolveControlledStep(prop);
    const initial = controlled ?? Number(prop("defaultStep") ?? 0);

    return {
      step: bindable<number>(() => ({
        value: resolveControlledStep(prop),
        defaultValue: initial,
        onChange: (nextStep, prevStep) => {
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

          prop("onChange")?.({ ...details });
          prop("onUpdateModelValue")?.(nextStep);

          const totalCount = getComputed()("totalCount");
          if (totalCount > 0 && nextStep >= totalCount - 1) {
            prop("onComplete")?.({ step: nextStep });
          }

          emitStepperChange(getContext(), getComputed(), getRefs(), nextStep);
        },
      })),

      count: propBindable("count", 0),
      linkedCount: propBindable("linkedCount", 0),
      linear: propBindable("linear", false),
      orientation: propBindable("orientation", "horizontal"),
      color: propBindable("color", "primary"),
      size: propBindable("size", "md"),
      variant: propBindable("variant", "subtle"),
      disabled: propBindable("disabled", false),
      hasContent: propBindable("hasContent", false),
      items: propBindable("items", []),
      focusedIndex: stateBindable("focusedIndex", null),
      id: propBindable("id", ""),
      scrollLeft: stateBindable("scrollLeft", 0),
      scrollTargetIndex: stateBindable("scrollTargetIndex", null),
      ui: propBindable("ui", {}),
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
      if (total <= 0) return step > 0 ? step + 1 : 0;
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

  effects: ["trackControlledStep"],
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

      updateScroll: ({ context, computed, prop, scope }) => {
        performScrollUpdate(context, computed, prop, scope);
      },

      scrollTo: ({ context, computed, prop, scope, event }) => {
        if ("index" in event && event.index !== undefined) {
          performScrollUpdate(
            context,
            computed,
            prop,
            scope,
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

      setupStepperBus: ({ context, computed, refs, send }) => {
        const bus = refs.get("bus");
        if (bus) {
          const unsub = bus.on("item:tap", ({ index, value }) => {
            send({ type: "STEP.SET", step: index, value });
          });
          const disposers = refs.get("busDisposers") || [];
          disposers.push(unsub);
          refs.set("busDisposers", disposers);
          emitStepperChange(context, computed, refs);
        }
      },

      cleanupStepperBus: ({ refs }) => {
        const disposers = refs.get("busDisposers") || [];
        for (const unsub of disposers) unsub?.();
        refs.set("busDisposers", []);
      },
    },

    effects: {
      trackControlledStep: ({ prop, context, computed, refs, scope, track }) => {
        let initial = true;
        track(
          [() => resolveControlledStep(prop)],
          () => {
            if (initial) {
              initial = false;
              return;
            }
            const nextControlled = resolveControlledStep(prop);
            if (nextControlled !== undefined) {
              performScrollUpdate(
                context,
                computed,
                prop,
                scope,
                nextControlled,
              );
              emitStepperChange(context, computed, refs, nextControlled);
            }
          },
        );
      },
    },
  },
});
