import { createMachine } from "@code-ui/core";
import type { BindableContext, PropFn } from "@code-ui/core";
import {
  cleanupFormFieldSync,
  createFormFieldComputed,
  hasFormFieldErrors,
  setupFormFieldSync,
} from "@code-ui/form/context";
import { isEqual, isNotEmpty, isNotNull } from "@code-ui/utils";
import type { MiniAppRect } from "@code-ui/utils";
import type {
  SliderMachine,
  SliderOrientation,
  SliderParams,
  SliderPoint,
  SliderSchema,
  SliderSize,
} from "./slider.types";
import { defaultSliderProps } from "./slider.props";
import {
  clampThumbValue,
  getClosestThumbIndex,
  getPercentFromPoint,
  getValueAsPercent,
  normalizeValues,
} from "./slider.utils";

function getSliderConfig(prop: PropFn<SliderSchema>) {
  return {
    min: Number(prop("min") ?? 0),
    max: Number(prop("max") ?? 100),
    step: Number(prop("step") ?? 1),
    orientation: (prop("orientation") ?? "horizontal") as SliderOrientation,
    inverted: Boolean(prop("inverted")),
    minSteps: Number(prop("minStepsBetweenThumbs") ?? 0),
  };
}

function updateThumbFromPoint(
  context: BindableContext<SliderSchema>,
  prop: PropFn<SliderSchema>,
  rect: MiniAppRect,
  point: SliderPoint,
  index: number,
): void {
  const { min, max, step, orientation, inverted, minSteps } =
    getSliderConfig(prop);
  const currentVals = [...context.get("value")];
  const percent = getPercentFromPoint(point, rect, orientation, inverted);
  const rawVal = min + (percent / 100) * (max - min);
  const clampedVal = clampThumbValue(
    currentVals,
    index,
    rawVal,
    min,
    max,
    step,
    minSteps,
  );
  if (currentVals[index] !== clampedVal) {
    currentVals[index] = clampedVal;
    context.set("value", currentVals);
  }
}

function stepThumb(
  context: BindableContext<SliderSchema>,
  prop: PropFn<SliderSchema>,
  index: number,
  direction: 1 | -1,
  stepOverride?: number,
): void {
  const { min, max, step, minSteps } = getSliderConfig(prop);
  const currentVals = [...context.get("value")];
  const cur = currentVals[index] ?? min;
  currentVals[index] = clampThumbValue(
    currentVals,
    index,
    cur + direction * (stepOverride ?? step),
    min,
    max,
    step,
    minSteps,
  );
  context.set("value", currentVals);
}

function notifyChange(
  {
    prop,
    refs,
    computed,
    context,
  }: Pick<SliderParams, "prop" | "refs" | "computed" | "context">,
  isEnd = false,
): void {
  const currentVal = computed("value");
  const details = { value: currentVal, values: context.get("value") };

  if (isEnd) {
    prop("onChangeEnd")?.(details);
    refs.get("formField")?.emitChange(currentVal);
  } else {
    prop("onChange")?.(details);
    refs.get("formField")?.emitInput(currentVal);
  }
}

export const sliderMachine: SliderMachine = createMachine<SliderSchema>({
  props: ({ props }) => ({
    ...defaultSliderProps,
    ...props,
  }),

  initialState: () => "idle",

  refs: ({ prop }) => {
    const { min, max, step } = getSliderConfig(prop);
    const propVal = prop("value");
    const defaultVal = prop("defaultValue");
    const rawVal =
      isNotNull(propVal) && propVal !== ""
        ? propVal
        : isNotNull(defaultVal) && defaultVal !== ""
          ? defaultVal
          : 0;

    return {
      initialValue: normalizeValues(rawVal, min, max, step),
      rect: null,
      formField: undefined,
    };
  },

  context: ({ prop, bindable }) => ({
    invalid: bindable<boolean>(() => {
      const rawInvalid = prop("invalid");
      return {
        value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
        defaultValue: false,
      };
    }),

    activeThumbIndex: bindable<number>(() => ({
      defaultValue: -1,
    })),

    value: bindable<number[]>(() => {
      const propVal = prop("value");
      const defaultVal = prop("defaultValue");
      const { min, max, step } = getSliderConfig(prop);
      const hasPropVal = isNotNull(propVal) && propVal !== "";
      const hasDefaultVal = isNotNull(defaultVal) && defaultVal !== "";

      return {
        value: hasPropVal
          ? normalizeValues(propVal, min, max, step)
          : undefined,
        defaultValue: normalizeValues(
          hasDefaultVal ? defaultVal : 0,
          min,
          max,
          step,
        ),
        isEqual,
      };
    }),
  }),

  computed: {
    ...createFormFieldComputed("slider"),
    isInvalid: ({ prop, refs, context, scope }) =>
      Boolean(
        context.get("invalid") ||
          hasFormFieldErrors(prop, refs, scope, "slider"),
      ),
    isDisabled: ({ prop, computed }) =>
      Boolean(
        prop("disabled") ||
          computed("formDisabled") ||
          computed("fieldDisabled"),
      ),
    isReadOnly: ({ prop, computed }) =>
      Boolean(prop("readOnly") || computed("formReadOnly")),
    isInteractive: ({ computed }) =>
      !computed("isDisabled") && !computed("isReadOnly"),
    isDragging: ({ state }) => state.matches("dragging"),
    isRange: ({ context }) => context.get("value").length > 1,
    effectiveSize: ({ prop, computed }) => {
      const rawSize = prop("size");
      const fieldSize = computed("fieldSize");
      return rawSize && rawSize !== "md"
        ? rawSize
        : ((fieldSize || rawSize || "md") as SliderSize);
    },
    values: ({ context }) => context.get("value"),
    value: ({ context, prop, computed }) => {
      const vals = context.get("value");
      return computed("isRange") ? vals : (vals[0] ?? Number(prop("min") ?? 0));
    },
    valueAsPercent: ({ context, prop }) => {
      const { min, max } = getSliderConfig(prop);
      return context.get("value").map((v) => getValueAsPercent(v, min, max));
    },
  },

  entry: ["setupFormField"],
  exit: ["cleanupFormField"],

  on: {
    SET_VALUE: {
      guard: "isInteractive",
      actions: ["setValue", "emitChange", "emitChangeEnd"],
    },
    STEP_UP: {
      guard: "isInteractive",
      actions: ["stepUp", "emitChange", "emitChangeEnd"],
    },
    STEP_DOWN: {
      guard: "isInteractive",
      actions: ["stepDown", "emitChange", "emitChangeEnd"],
    },
    RESET_VALUE: {
      actions: ["resetValue", "emitChange", "emitChangeEnd"],
    },
  },

  states: {
    idle: {
      tags: ["idle"],
      on: {
        POINTER_DOWN: {
          guard: "isInteractive",
          target: "dragging",
          actions: ["setPointerDown", "emitChange"],
        },
      },
    },
    dragging: {
      tags: ["dragging"],
      exit: ["clearActiveThumb"],
      on: {
        POINTER_MOVE: {
          actions: ["updateValueFromPoint", "emitChange"],
        },
        POINTER_UP: {
          target: "idle",
          actions: ["emitChangeEnd"],
        },
      },
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => computed("isInteractive"),
    },

    actions: {
      setPointerDown: ({ context, prop, event, refs }) => {
        const e = event as any;
        if (e.rect) refs.set("rect", e.rect);
        const rect = refs.get("rect");
        const currentVals = context.get("value");
        const { min, max, orientation, inverted } = getSliderConfig(prop);

        let targetIndex = e.index ?? -1;
        if (targetIndex < 0 && rect) {
          const percent = getPercentFromPoint(
            e.point,
            rect,
            orientation,
            inverted,
          );
          targetIndex = getClosestThumbIndex(
            currentVals,
            min + (percent / 100) * (max - min),
          );
        } else if (targetIndex < 0) {
          targetIndex = 0;
        }

        context.set("activeThumbIndex", targetIndex);
        if (rect) {
          updateThumbFromPoint(context, prop, rect, e.point, targetIndex);
        }
      },

      updateValueFromPoint: ({ context, prop, event, refs }) => {
        const rect = refs.get("rect");
        const activeIndex = context.get("activeThumbIndex");
        if (rect && activeIndex >= 0) {
          updateThumbFromPoint(
            context,
            prop,
            rect,
            (event as any).point,
            activeIndex,
          );
        }
      },

      clearActiveThumb: ({ context }) => {
        context.set("activeThumbIndex", -1);
      },

      setValue: ({ context, prop, event }) => {
        const e = event as any;
        const { min, max, step, minSteps } = getSliderConfig(prop);

        if (e.index !== undefined) {
          const currentVals = [...context.get("value")];
          currentVals[e.index] = clampThumbValue(
            currentVals,
            e.index,
            Number(e.value),
            min,
            max,
            step,
            minSteps,
          );
          context.set("value", currentVals);
        } else {
          context.set("value", normalizeValues(e.value, min, max, step));
        }
      },

      stepUp: ({ context, prop, event }) => {
        const e = event as any;
        stepThumb(context, prop, e.index ?? 0, 1, e.step);
      },

      stepDown: ({ context, prop, event }) => {
        const e = event as any;
        stepThumb(context, prop, e.index ?? 0, -1, e.step);
      },

      resetValue: ({ context, refs }) => {
        context.set("invalid", false);
        context.set("value", [...refs.get("initialValue")]);
      },

      emitChange: ({ prop, refs, computed, context }) => {
        notifyChange({ prop, refs, computed, context }, false);
      },

      emitChangeEnd: ({ prop, refs, computed, context }) => {
        notifyChange({ prop, refs, computed, context }, true);
      },

      setupFormField: ({ context, prop, refs, scope, computed }) => {
        setupFormFieldSync(
          {
            component: prop("component"),
            getHost: () => prop("formContext"),
            id: scope.id ?? "slider",
            getFormId: () => prop("form") ?? "",
            getName: () => prop("name") ?? "",
            getValue: () => computed("value"),
            setValue: (rawVal: unknown) => {
              const { min, max, step } = getSliderConfig(prop);
              context.set("value", normalizeValues(rawVal, min, max, step));
            },
            resetValue: () => {
              context.set("invalid", false);
              context.set("value", [...refs.get("initialValue")]);
            },
            focus: () => {},
            getRules: () => prop("rules") ?? [],
            getValidateOn: () => prop("validateOn"),
            isDisabled: () => computed("isDisabled"),
          },
          refs,
        );
      },

      cleanupFormField: ({ refs }) => {
        cleanupFormFieldSync(refs);
      },
    },
  },
});
