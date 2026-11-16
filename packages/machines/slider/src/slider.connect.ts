import type { MiniAppRect } from "@code-ui/utils";
import * as dom from "./slider.dom";
import type {
  SliderApi,
  SliderMarkerSnapshot,
  SliderPoint,
  SliderService,
  SliderThumbSnapshot,
} from "./slider.types";
import { getValueAsPercent } from "./slider.utils";

export function connectSlider(service: SliderService): SliderApi {
  const { context, computed, prop, refs, scope, state } = service;

  const min = Number(prop("min"));
  const max = Number(prop("max"));
  const step = Number(prop("step"));
  const orientation = prop("orientation");
  const inverted = prop("inverted");
  const isDisabled = computed("isDisabled");
  const isReadOnly = computed("isReadOnly");
  const isInvalid = computed("isInvalid");
  const isDragging = computed("isDragging");
  const activeThumbIndex = context.get("activeThumbIndex");
  const values = context.get("value");
  const percents = computed("valueAsPercent");
  const isRange = computed("isRange");

  let rangeStart = isRange ? Math.min(percents[0] ?? 0, percents[1] ?? 0) : 0;
  let rangeEnd = isRange
    ? Math.max(percents[0] ?? 0, percents[1] ?? 0)
    : (percents[0] ?? 0);

  if (inverted) {
    const prevStart = rangeStart;
    rangeStart = 100 - rangeEnd;
    rangeEnd = 100 - prevStart;
  }

  const isVertical = orientation === "vertical";
  const rangeStyle = isVertical
    ? `bottom: ${rangeStart}%; height: ${rangeEnd - rangeStart}%;`
    : `left: ${rangeStart}%; width: ${rangeEnd - rangeStart}%;`;

  const thumbs: SliderThumbSnapshot[] = values.map(
    (val: number, index: number) => {
      let percent = getValueAsPercent(val, min, max);
      if (inverted) percent = 100 - percent;
      const id = dom.getThumbId(scope, index);
      const style = isVertical
        ? `bottom: ${percent}%; transform: translate(-50%, 50%);`
        : `left: ${percent}%; transform: translate(-50%, -50%);`;

      return {
        index,
        value: val,
        percent,
        id,
        style,
      };
    },
  );

  const rawMarks = prop("marks");
  let markerList: Array<{ value: number; label?: string | undefined }> = [];
  if (Array.isArray(rawMarks)) {
    markerList = rawMarks;
  } else if (rawMarks === true) {
    if (step > 0 && (max - min) / step <= 10) {
      for (let v = min; v <= max; v += step) {
        markerList.push({ value: v, label: String(v) });
      }
    } else {
      markerList = [
        { value: min, label: String(min) },
        { value: max, label: String(max) },
      ];
    }
  }

  const markers: SliderMarkerSnapshot[] = markerList.map((mark) => {
    let percent = getValueAsPercent(mark.value, min, max);
    if (inverted) percent = 100 - percent;
    const active = isRange
      ? mark.value >= (values[0] ?? min) && mark.value <= (values[1] ?? max)
      : mark.value <= (values[0] ?? min);

    const style = isVertical
      ? `bottom: ${percent}%; transform: translateY(50%);`
      : `left: ${percent}%; transform: translateX(-50%);`;

    return {
      value: mark.value,
      label: mark.label,
      percent,
      style,
      active,
    };
  });

  const valueText = isRange
    ? `${values[0] ?? min} - ${values[1] ?? max}`
    : String(values[0] ?? min);

  const thumbIds = thumbs.map((t) => t.id).join(",");
  const thumbPercents = thumbs.map((t) => t.percent);
  const rect = context.get("rect") ?? refs.get("rect");
  const controlId = dom.getControlId(scope);

  return {
    state: state.get(),
    value: computed("value"),
    values,
    min,
    max,
    step,
    disabled: isDisabled,
    readOnly: isReadOnly,
    invalid: isInvalid,
    dragging: isDragging,
    isRange,
    activeThumbIndex,
    thumbs,
    thumbIds,
    thumbPercents,
    rect,
    markers,
    rangeStyle,
    valueText,

    rootProps: {
      id: dom.getRootId(scope),
    },

    controlProps: {
      id: controlId,
    },

    rangeProps: {
      id: dom.getRangeId(scope),
    },

    setValue(value: number | number[], index?: number) {
      service.send({ type: "SET_VALUE", value, index });
    },

    stepUp(index?: number, stepSize?: number) {
      service.send({ type: "STEP_UP", index, step: stepSize });
    },

    stepDown(index?: number, stepSize?: number) {
      service.send({ type: "STEP_DOWN", index, step: stepSize });
    },

    reset() {
      service.send({ type: "RESET_VALUE" });
    },

    handleTouchStart(
      point?: SliderPoint,
      initialRect?: MiniAppRect,
      index?: number,
    ) {
      if (point) {
        service.send({ type: "POINTER_DOWN", point, rect: initialRect, index });
      }
    },

    handleTouchMove(point?: SliderPoint) {
      if (point) service.send({ type: "POINTER_MOVE", point });
    },

    handleTouchEnd() {
      service.send({ type: "POINTER_UP" });
    },

    handleTap(point?: SliderPoint) {
      if (point) service.send({ type: "TAP", point });
    },
  };
}
