import {
  defaultNormalizer,
  type NormalizeProps,
  type PropTypes,
} from "@code-ui/core";
import type {
  ProgressApi,
  ProgressOrientation,
  ProgressService,
  ProgressSize,
  ProgressType,
} from "./progress.types";
import { parts } from "./progress.anatomy";
import * as dom from "./progress.dom";

export function connectProgress<T extends PropTypes = PropTypes>(
  service: ProgressService,
  normalize: NormalizeProps<T> = defaultNormalizer as NormalizeProps<T>,
): ProgressApi {
  const { state, send, context, computed, prop, scope } = service;

  const value = context.get("value");
  const min = context.get("min") ?? 0;
  const max = context.get("max") ?? 100;
  const orientation =
    (context.get("orientation") as ProgressOrientation | undefined) ??
    "horizontal";
  const type =
    (context.get("type") as ProgressType | undefined) ?? "linear";

  const isIndeterminate = computed("isIndeterminate");
  const percent = computed("percent");
  const isComplete = computed("isComplete");
  const progressState = computed("progressState");
  const valueAsString = computed("valueAsString");

  const circleRadius = computed("circleRadius");
  const circumference = computed("circleCircumference");
  const circleDashOffset = computed("circleDashOffset");
  const strokeWidth = prop("strokeWidth") ?? 8;

  const size = (prop("size") as ProgressSize | undefined) ?? "md";
  const color = (prop("color") as string | undefined) ?? "primary";
  const striped = Boolean(prop("striped"));
  const animated = Boolean(prop("animated"));
  const inverted = Boolean(prop("inverted"));

  const rangeStyle = isIndeterminate
    ? ""
    : orientation === "horizontal"
      ? `width: ${percent}%;`
      : `height: ${percent}%;`;

  return {
    state: state.get(),
    value,
    min,
    max,
    percent,
    isIndeterminate,
    isComplete,
    valueAsString,
    orientation,
    type,
    size,
    color,
    striped,
    animated,
    inverted,

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

    rootProps: normalize.element({
      id: dom.getRootId(scope),
      ...parts.root.attrs,
      "data-state": progressState,
      "data-orientation": orientation,
      "data-type": type,
      "data-size": size,
      "data-color": color,
      role: "progressbar",
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-valuenow": isIndeterminate ? undefined : (value ?? 0),
      "aria-valuetext": valueAsString,
    }),

    labelProps: normalize.element({
      id: dom.getLabelId(scope),
      ...parts.label.attrs,
      "data-state": progressState,
      "data-orientation": orientation,
      "data-type": type,
    }),

    trackProps: normalize.element({
      id: dom.getTrackId(scope),
      ...parts.track.attrs,
      "data-state": progressState,
      "data-orientation": orientation,
      "data-type": type,
    }),

    rangeProps: normalize.element({
      id: dom.getRangeId(scope),
      ...parts.range.attrs,
      "data-state": progressState,
      "data-orientation": orientation,
      "data-type": type,
      "data-striped": String(striped),
      "data-animated": String(animated),
      style: rangeStyle,
    }),

    valueTextProps: normalize.element({
      id: dom.getValueTextId(scope),
      ...parts.valueText.attrs,
      "data-state": progressState,
      "data-orientation": orientation,
      "data-type": type,
    }),

    viewProps: normalize.element({
      id: dom.getViewId(scope),
      ...parts.view.attrs,
      "data-state": progressState,
      "data-type": type,
    }),

    circleProps: normalize.element({
      id: dom.getCircleId(scope),
      ...parts.circle.attrs,
      viewBox: "0 0 100 100",
      "data-state": progressState,
      "data-type": type,
    }),

    circleTrackProps: normalize.element({
      id: dom.getCircleTrackId(scope),
      ...parts.circleTrack.attrs,
      cx: 50,
      cy: 50,
      r: circleRadius,
      strokeWidth,
      fill: "transparent",
      "data-state": progressState,
      "data-type": type,
    }),

    circleRangeProps: normalize.element({
      id: dom.getCircleRangeId(scope),
      ...parts.circleRange.attrs,
      cx: 50,
      cy: 50,
      r: circleRadius,
      strokeWidth,
      fill: "transparent",
      strokeDasharray: `${circumference} ${circumference}`,
      strokeDashoffset: isIndeterminate ? undefined : circleDashOffset,
      transform: "rotate(-90 50 50)",
      "data-state": progressState,
      "data-type": type,
      style: isIndeterminate ? "" : "transition: stroke-dashoffset 300ms ease;",
    }),
  };
}

