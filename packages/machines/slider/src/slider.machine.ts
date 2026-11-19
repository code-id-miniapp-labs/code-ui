import { createMachine } from "@code-id-labs/core";
import type { BindableContext, PropFn } from "@code-id-labs/core";
import {
  cleanupFormFieldSync,
  createFormFieldComputed,
  hasFormFieldErrors,
  setupFormFieldSync,
} from "@code-id-labs/form/context";
import { isEqual, isNotEmpty, isNotNull, queryRect } from "@code-id-labs/utils";
import type { MiniAppComponent, MiniAppRect } from "@code-id-labs/utils";
import * as dom from "./slider.dom";
import type {
  SliderMachine,
  SliderParams,
  SliderPoint,
  SliderSchema,
} from "./slider.types";
import { defaultSliderProps } from "./slider.props";
import {
  clampThumbValue,
  getClosestThumbIndex,
  getPercentFromPoint,
  getValueAsPercent,
  normalizeValues,
} from "./slider.utils";

function canQueryRect(
  comp: MiniAppComponent | undefined,
): comp is MiniAppComponent {
  return (
    Boolean(comp) &&
    (Boolean((globalThis as Record<string, unknown>).wx) ||
      typeof comp?.createSelectorQuery === "function")
  );
}

function getSliderConfig(prop: PropFn<SliderSchema>) {
  return {
    min: Number(prop("min")),
    max: Number(prop("max")),
    step: Number(prop("step")),
    orientation: prop("orientation"),
    inverted: prop("inverted"),
    minSteps: Number(prop("minStepsBetweenThumbs")),
  };
}

function resolveThumbIndexForPoint(
  currentVals: number[],
  prop: PropFn<SliderSchema>,
  rect: MiniAppRect | null,
  point: SliderPoint,
  explicitIndex?: number,
): number {
  if (
    explicitIndex !== undefined &&
    explicitIndex >= 0 &&
    explicitIndex < currentVals.length
  ) {
    return explicitIndex;
  }
  if (!rect) return 0;

  const { min, max, orientation, inverted } = getSliderConfig(prop);
  const percent = getPercentFromPoint(point, rect, orientation, inverted);
  return getClosestThumbIndex(
    currentVals,
    min + (percent / 100) * (max - min),
  );
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

    rect: bindable<MiniAppRect | null>(() => ({
      defaultValue: null,
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
    values: ({ context }) => context.get("value"),
    value: ({ context, prop, computed }) => {
      const vals = context.get("value");
      return computed("isRange") ? vals : (vals[0] ?? Number(prop("min")));
    },
    valueAsPercent: ({ context, prop }) => {
      const { min, max } = getSliderConfig(prop);
      return context.get("value").map((v) => getValueAsPercent(v, min, max));
    },
  },

  entry: ["setupFormField"],
  exit: ["cleanupFormField"],
  effects: ["measureControlRect"],

  on: {
    "RECT.RESOLVED": {
      actions: ["setRect"],
    },
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
        TAP: {
          guard: "isInteractive",
          actions: [
            "setPointerDown",
            "emitChange",
            "emitChangeEnd",
            "clearActiveThumb",
          ],
        },
      },
    },
    dragging: {
      tags: ["dragging"],
      exit: ["clearActiveThumb"],
      on: {
        POINTER_MOVE: {
          guard: "isInteractive",
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

    effects: {
      measureControlRect: ({ prop, scope, send, refs, context }) => {
        const comp = prop("component");
        if (!canQueryRect(comp) || context.get("rect") || refs.get("rect")) {
          return;
        }
        let cancelled = false;
        queryRect(`#${dom.getControlId(scope)}`, comp).then((queried) => {
          if (!cancelled && queried) {
            send({ type: "RECT.RESOLVED", rect: queried });
          }
        });
        return () => {
          cancelled = true;
        };
      },
    },

    actions: {
      setRect: ({ context, refs, event, prop, computed }) => {
        if (event.type !== "RECT.RESOLVED") return;
        refs.set("rect", event.rect);
        context.set("rect", event.rect);
        if (event.point && computed("isInteractive")) {
          const targetIndex = resolveThumbIndexForPoint(
            context.get("value"),
            prop,
            event.rect,
            event.point,
            event.index,
          );
          context.set("activeThumbIndex", targetIndex);
          updateThumbFromPoint(
            context,
            prop,
            event.rect,
            event.point,
            targetIndex,
          );
          notifyChange(
            { prop, refs, computed, context },
            Boolean(event.commit),
          );
          if (event.commit) {
            context.set("activeThumbIndex", -1);
          }
        }
      },

      setPointerDown: ({ context, prop, event, refs, scope, send }) => {
        if (event.type !== "POINTER_DOWN" && event.type !== "TAP") return;

        if (event.rect) {
          refs.set("rect", event.rect);
          context.set("rect", event.rect);
        }
        const rect = context.get("rect") ?? refs.get("rect");
        const comp = prop("component");
        const canQuery = canQueryRect(comp);
        const deferToFreshRect =
          canQuery && prop("orientation") === "vertical" && !event.rect;

        const targetIndex = resolveThumbIndexForPoint(
          context.get("value"),
          prop,
          rect,
          event.point,
          event.index,
        );

        context.set("activeThumbIndex", targetIndex);
        if (rect && !deferToFreshRect) {
          updateThumbFromPoint(context, prop, rect, event.point, targetIndex);
        }

        if (canQuery) {
          const isTap = event.type === "TAP";
          queryRect(`#${dom.getControlId(scope)}`, comp).then((queried) => {
            if (queried) {
              send({
                type: "RECT.RESOLVED",
                rect: queried,
                point: event.point,
                index: event.index,
                commit: isTap ? true : undefined,
              });
            }
          });
        }
      },

      updateValueFromPoint: ({ context, prop, event, refs }) => {
        if (event.type !== "POINTER_MOVE") return;
        const rect = context.get("rect") ?? refs.get("rect");
        const activeIndex = context.get("activeThumbIndex");
        if (rect && activeIndex >= 0) {
          updateThumbFromPoint(context, prop, rect, event.point, activeIndex);
        }
      },

      clearActiveThumb: ({ context }) => {
        context.set("activeThumbIndex", -1);
      },

      setValue: ({ context, prop, event }) => {
        if (event.type !== "SET_VALUE") return;
        const { min, max, step, minSteps } = getSliderConfig(prop);

        if (event.index !== undefined) {
          const currentVals = [...context.get("value")];
          currentVals[event.index] = clampThumbValue(
            currentVals,
            event.index,
            Number(event.value),
            min,
            max,
            step,
            minSteps,
          );
          context.set("value", currentVals);
        } else {
          context.set("value", normalizeValues(event.value, min, max, step));
        }
      },

      stepUp: ({ context, prop, event }) => {
        if (event.type !== "STEP_UP") return;
        stepThumb(context, prop, event.index ?? 0, 1, event.step);
      },

      stepDown: ({ context, prop, event }) => {
        if (event.type !== "STEP_DOWN") return;
        stepThumb(context, prop, event.index ?? 0, -1, event.step);
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
            getFormId: () => prop("form"),
            getName: () => prop("name"),
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
