import type { ProgressApi, ProgressService } from "./progress.types";
import * as dom from "./progress.dom";

export function connectProgress(service: ProgressService): ProgressApi {
  const { state, send, context, computed, scope } = service;

  const value = context.get("value");
  const min = context.get("min");
  const max = context.get("max");

  const isIndeterminate = computed("isIndeterminate");
  const percent = computed("percent");
  const isComplete = computed("isComplete");
  const progressState = computed("progressState");
  const valueAsString = computed("valueAsString");

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

    rootProps: {
      id: dom.getRootId(scope),
      "data-state": progressState,
      "aria-role": "progressbar",
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-valuenow": isIndeterminate || value === null ? undefined : value,
      "aria-valuetext": valueAsString,
    },

    labelProps: {
      id: dom.getLabelId(scope),
    },

    trackProps: {
      id: dom.getTrackId(scope),
    },

    rangeProps: {
      id: dom.getRangeId(scope),
    },

    circleProps: {
      id: dom.getCircleId(scope),
    },
  };
}
