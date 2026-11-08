import type { NormalizeProps, PropTypes } from "@code-ui/core";
import type {
  ProgressApi,
  ProgressOrientation,
  ProgressService,
  ProgressType,
} from "./progress.types";
import * as dom from "./progress.dom";

export function connectProgress<T extends PropTypes = PropTypes>(
  service: ProgressService,
  normalize?: NormalizeProps<T>,
): ProgressApi {
  const { state, send, context, computed, scope } = service;

  const value = context.get("value");
  const min = context.get("min") ?? 0;
  const max = context.get("max") ?? 100;
  const orientation =
    (context.get("orientation") as ProgressOrientation | undefined) ??
    "horizontal";
  const type = (context.get("type") as ProgressType | undefined) ?? "linear";

  const isIndeterminate = computed("isIndeterminate");
  const percent = computed("percent");
  const isComplete = computed("isComplete");
  const progressState = computed("progressState");
  const valueAsString = computed("valueAsString");
  const circleStyle = computed("circleStyle");

  const rangeStyle = isIndeterminate
    ? ""
    : `${orientation === "horizontal" ? "width" : "height"}: ${percent}%;`;

  const el = normalize ? normalize.element : (v: Record<string, any>) => v;

  return {
    state: state.get(),
    progressState,
    value,
    min,
    max,
    percent,
    isIndeterminate,
    isComplete,
    valueAsString,
    orientation,
    type,
    circleStyle,

    setValue(nextValue: number | null) {
      send({ type: "SET_VALUE", value: nextValue });
    },
    setToMin() {
      send({ type: "SET_VALUE", value: min });
    },
    setToMax() {
      send({ type: "SET_VALUE", value: max });
    },
    reset() {
      send({ type: "RESET" });
    },

    rootProps: el({
      id: dom.getRootId(scope),
      "data-state": progressState,
      "data-orientation": orientation,
      "aria-role": "progressbar",
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-valuenow": isIndeterminate ? undefined : (value ?? 0),
      "aria-valuetext": valueAsString,
    }),

    labelProps: el({
      id: dom.getLabelId(scope),
    }),

    trackProps: el({
      id: dom.getTrackId(scope),
    }),

    rangeProps: el({
      id: dom.getRangeId(scope),
      style: rangeStyle,
    }),

    valueTextProps: el({
      id: dom.getValueTextId(scope),
    }),

    viewProps: el({
      id: dom.getViewId(scope),
    }),

    circleProps: el({
      id: dom.getCircleId(scope),
      style: circleStyle,
    }),
  };
}
