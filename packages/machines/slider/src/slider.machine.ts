import { createMachine } from "@code-ui/core";
import {
  setupFormFieldSync,
  cleanupFormFieldSync,
} from "@code-ui/form/context";
import { isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  SliderContext,
  SliderMachine,
  SliderParams,
  SliderProps,
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

function notifyChange(
  { prop, refs, computed, context }: Pick<SliderParams, "prop" | "refs" | "computed" | "context">,
  isEnd = false,
): void {
  const currentVal = computed("value");
  const currentValues = context.get("value");
  const details = { value: currentVal, values: currentValues };

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
    const min = Number(prop("min") ?? 0);
    const max = Number(prop("max") ?? 100);
    const step = Number(prop("step") ?? 1);
    const rawVal = prop("value") ?? prop("defaultValue") ?? 0;
    const initialValues = normalizeValues(rawVal, min, max, step);
    const isRange =
      Array.isArray(prop("value")) ||
      (prop("value") === undefined && Array.isArray(prop("defaultValue")));

    return {
      initialValue: initialValues,
      isRange,
      rect: null,
      activeThumbIndex: -1,
      currentFormBus: prop("formBus"),
      formField: undefined,
    };
  },

  context: ({ prop, bindable }) => {
    const propBindable = <
      K extends keyof SliderContext & keyof SliderProps,
    >(
      key: K,
      defaultValue: SliderContext[K],
    ) =>
      bindable<SliderContext[K]>(() => ({
        value: prop(key) as SliderContext[K] | undefined,
        defaultValue,
      }));

    const stateBindable = <K extends keyof SliderContext>(
      _key: K,
      defaultValue: SliderContext[K],
    ) =>
      bindable<SliderContext[K]>(() => ({
        defaultValue,
      }));

    return {
      disabled: propBindable("disabled", false),
      readOnly: propBindable("readOnly", false),
      formDisabled: stateBindable("formDisabled", false),
      formReadOnly: stateBindable("formReadOnly", false),
      fieldDisabled: propBindable("fieldDisabled", false),
      fieldSize: propBindable("fieldSize", ""),

      invalid: bindable<boolean>(() => {
        const rawInvalid = prop("invalid");
        return {
          value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
          defaultValue: false,
        };
      }),

      required: propBindable("required", false),
      min: propBindable("min", 0),
      max: propBindable("max", 100),
      step: propBindable("step", 1),
      orientation: propBindable("orientation", "horizontal"),
      inverted: propBindable("inverted", false),
      minStepsBetweenThumbs: propBindable("minStepsBetweenThumbs", 0),
      color: propBindable("color", "primary"),
      size: propBindable("size", "md"),
      name: propBindable("name", ""),
      form: propBindable("form", ""),
      label: propBindable("label", ""),
      marks: propBindable("marks", false),
      activeThumbIndex: stateBindable("activeThumbIndex", -1),
      ui: propBindable("ui", {}),

      value: bindable<number[]>(() => {
        const propVal = prop("value");
        const defaultVal = prop("defaultValue");
        const min = Number(prop("min") ?? 0);
        const max = Number(prop("max") ?? 100);
        const step = Number(prop("step") ?? 1);
        return {
          value: isNotNull(propVal)
            ? normalizeValues(propVal, min, max, step)
            : undefined,
          defaultValue: normalizeValues(
            isNotNull(defaultVal) ? defaultVal : 0,
            min,
            max,
            step,
          ),
        };
      }),
    };
  },

  computed: {
    isDisabled: ({ context }) =>
      Boolean(
        context.get("disabled") ||
          context.get("formDisabled") ||
          context.get("fieldDisabled"),
      ),
    isReadOnly: ({ context }) =>
      Boolean(context.get("readOnly") || context.get("formReadOnly")),
    isInteractive: ({ computed }) =>
      !computed("isDisabled") && !computed("isReadOnly"),
    isDragging: ({ state }) => state.matches("dragging"),
    effectiveSize: ({ context }) => {
      const rawSize = context.get("size");
      const fieldSize = context.get("fieldSize");
      return rawSize && rawSize !== "md"
        ? rawSize
        : ((fieldSize || rawSize || "md") as SliderSize);
    },
    values: ({ context }) => context.get("value"),
    value: ({ context, refs, prop }) => {
      const vals = context.get("value");
      const isRange =
        Array.isArray(prop("value")) ||
        (prop("value") === undefined &&
          (Array.isArray(prop("defaultValue")) || refs.get("isRange")));
      return isRange ? vals : (vals[0] ?? context.get("min"));
    },
    valueAsPercent: ({ context }) => {
      const vals = context.get("value");
      const min = context.get("min");
      const max = context.get("max");
      return vals.map((v) => getValueAsPercent(v, min, max));
    },
  },

  watch: ({ prop, refs }) => {
    const nextFormBus = prop("formBus");
    if (nextFormBus !== refs.get("currentFormBus")) {
      refs.set("currentFormBus", nextFormBus);
      refs.get("formField")?.rebind(nextFormBus ?? null);
    }
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
      on: {
        POINTER_MOVE: {
          actions: ["updateValueFromPoint", "emitChange"],
        },
        POINTER_UP: {
          target: "idle",
          actions: ["clearActiveThumb", "emitChangeEnd"],
        },
      },
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => computed("isInteractive"),
    },

    actions: {
      setPointerDown: ({ context, event, refs }) => {
        if (event.type !== "POINTER_DOWN") return;
        if (event.rect) {
          refs.set("rect", event.rect);
        }
        const rect = refs.get("rect");
        const currentVals = [...context.get("value")];
        const min = context.get("min");
        const max = context.get("max");
        const step = context.get("step");
        const orientation = context.get("orientation");
        const inverted = context.get("inverted");
        const minSteps = context.get("minStepsBetweenThumbs");

        let targetIndex = event.index ?? -1;
        if (targetIndex < 0 && rect) {
          const percent = getPercentFromPoint(
            event.point,
            rect,
            orientation,
            inverted,
          );
          const rawTargetValue = min + (percent / 100) * (max - min);
          targetIndex = getClosestThumbIndex(currentVals, rawTargetValue);
        } else if (targetIndex < 0) {
          targetIndex = 0;
        }

        refs.set("activeThumbIndex", targetIndex);
        context.set("activeThumbIndex", targetIndex);

        if (rect) {
          const percent = getPercentFromPoint(
            event.point,
            rect,
            orientation,
            inverted,
          );
          const rawVal = min + (percent / 100) * (max - min);
          const clampedVal = clampThumbValue(
            currentVals,
            targetIndex,
            rawVal,
            min,
            max,
            step,
            minSteps,
          );
          currentVals[targetIndex] = clampedVal;
          context.set("value", currentVals);
        }
      },

      updateValueFromPoint: ({ context, event, refs }) => {
        if (event.type !== "POINTER_MOVE") return;
        const rect = refs.get("rect");
        if (!rect) return;
        const activeIndex = refs.get("activeThumbIndex");
        if (activeIndex < 0) return;

        const currentVals = [...context.get("value")];
        const min = context.get("min");
        const max = context.get("max");
        const step = context.get("step");
        const orientation = context.get("orientation");
        const inverted = context.get("inverted");
        const minSteps = context.get("minStepsBetweenThumbs");

        const percent = getPercentFromPoint(
          event.point,
          rect,
          orientation,
          inverted,
        );
        const rawVal = min + (percent / 100) * (max - min);
        const clampedVal = clampThumbValue(
          currentVals,
          activeIndex,
          rawVal,
          min,
          max,
          step,
          minSteps,
        );

        if (currentVals[activeIndex] !== clampedVal) {
          currentVals[activeIndex] = clampedVal;
          context.set("value", currentVals);
        }
      },

      clearActiveThumb: ({ context, refs }) => {
        refs.set("activeThumbIndex", -1);
        context.set("activeThumbIndex", -1);
      },

      setValue: ({ context, event }) => {
        if (event.type !== "SET_VALUE") return;
        const min = context.get("min");
        const max = context.get("max");
        const step = context.get("step");
        const minSteps = context.get("minStepsBetweenThumbs");

        if (event.index !== undefined) {
          const currentVals = [...context.get("value")];
          const rawNum = Number(event.value);
          const clamped = clampThumbValue(
            currentVals,
            event.index,
            rawNum,
            min,
            max,
            step,
            minSteps,
          );
          currentVals[event.index] = clamped;
          context.set("value", currentVals);
        } else {
          const normalized = normalizeValues(event.value, min, max, step);
          context.set("value", normalized);
        }
      },

      stepUp: ({ context, event }) => {
        if (event.type !== "STEP_UP") return;
        const index = event.index ?? 0;
        const stepSize = event.step ?? context.get("step");
        const min = context.get("min");
        const max = context.get("max");
        const step = context.get("step");
        const minSteps = context.get("minStepsBetweenThumbs");

        const currentVals = [...context.get("value")];
        const cur = currentVals[index] ?? min;
        const next = cur + stepSize;
        currentVals[index] = clampThumbValue(
          currentVals,
          index,
          next,
          min,
          max,
          step,
          minSteps,
        );
        context.set("value", currentVals);
      },

      stepDown: ({ context, event }) => {
        if (event.type !== "STEP_DOWN") return;
        const index = event.index ?? 0;
        const stepSize = event.step ?? context.get("step");
        const min = context.get("min");
        const max = context.get("max");
        const step = context.get("step");
        const minSteps = context.get("minStepsBetweenThumbs");

        const currentVals = [...context.get("value")];
        const cur = currentVals[index] ?? min;
        const next = cur - stepSize;
        currentVals[index] = clampThumbValue(
          currentVals,
          index,
          next,
          min,
          max,
          step,
          minSteps,
        );
        context.set("value", currentVals);
      },

      resetValue: ({ context, refs }) => {
        const initial = refs.get("initialValue");
        context.set("invalid", false);
        context.set("value", [...initial]);
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
            bus: prop("formBus") ?? undefined,
            id: scope.id ?? "slider",
            getFormId: () => context.get("form") || prop("form") || "",
            getName: () => context.get("name") || prop("name") || "",
            getValue: () => computed("value"),
            setValue: (rawVal: unknown) => {
              const min = context.get("min");
              const max = context.get("max");
              const step = context.get("step");
              const nextVals = normalizeValues(rawVal, min, max, step);
              context.set("value", nextVals);
            },
            resetValue: () => {
              const initial = refs.get("initialValue");
              context.set("invalid", false);
              context.set("value", [...initial]);
            },
            focus: () => {},
            getValidateOn: () => prop("validateOn"),
            isDisabled: () => computed("isDisabled"),
            onValidationChange: (isValid) => {
              context.set("invalid", !isValid);
            },
            onStateChange: (s) => {
              if (s.fieldDisabled !== undefined) {
                context.set("fieldDisabled", Boolean(s.fieldDisabled));
              }
              if (s.fieldSize !== undefined) {
                context.set("fieldSize", s.fieldSize);
              }
              if (s.formDisabled !== undefined) {
                context.set("formDisabled", Boolean(s.formDisabled));
              }
              if (s.formReadOnly !== undefined) {
                context.set("formReadOnly", Boolean(s.formReadOnly));
              }
            },
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

