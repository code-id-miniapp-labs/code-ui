import type {
  MiniAppCustomEvent,
  MiniAppTouchEvent,
} from "@code-ui/utils";
import { queryRect } from "@code-ui/utils";
import * as dom from "./slider.dom";
import type {
  SliderApi,
  SliderMarkerSnapshot,
  SliderService,
  SliderThumbSnapshot,
} from "./slider.types";
import { getValueAsPercent } from "./slider.utils";

export function connectSlider(service: SliderService): SliderApi {
  const { context, computed, refs, scope, state } = service;

  const min = context.get("min");
  const max = context.get("max");
  const step = context.get("step");
  const orientation = context.get("orientation");
  const inverted = context.get("inverted");
  const isDisabled = computed("isDisabled");
  const isReadOnly = computed("isReadOnly");
  const isInvalid = Boolean(context.get("invalid"));
  const isDragging = computed("isDragging");
  const activeThumbIndex = context.get("activeThumbIndex");
  const values = context.get("value");
  const percents = computed("valueAsPercent");
  const isRange = values.length > 1;

  let rangeStart = 0;
  let rangeEnd = 0;

  if (isRange) {
    rangeStart = Math.min(percents[0] ?? 0, percents[1] ?? 0);
    rangeEnd = Math.max(percents[0] ?? 0, percents[1] ?? 0);
  } else {
    rangeStart = 0;
    rangeEnd = percents[0] ?? 0;
  }

  if (inverted) {
    const prevStart = rangeStart;
    rangeStart = 100 - rangeEnd;
    rangeEnd = 100 - prevStart;
  }

  const rangeStyle =
    orientation === "vertical"
      ? `bottom: ${rangeStart}%; height: ${rangeEnd - rangeStart}%;`
      : `left: ${rangeStart}%; width: ${rangeEnd - rangeStart}%;`;

  const thumbs: SliderThumbSnapshot[] = values.map(
    (val: number, index: number) => {
    let percent = getValueAsPercent(val, min, max);
    if (inverted) percent = 100 - percent;
    const id = dom.getThumbId(scope, index);
    const style =
      orientation === "vertical"
        ? `bottom: ${percent}%; transform: translate(-50%, 50%);`
        : `left: ${percent}%; transform: translate(-50%, -50%);`;

    return {
      index,
      value: val,
      percent,
      id,
      style,
      thumbProps: {
        id,
        "data-scope": "slider",
        "data-part": "thumb",
        "data-index": index,
        "data-disabled": String(isDisabled),
        "data-dragging": String(activeThumbIndex === index),
        role: "slider",
        "aria-valuemin": min,
        "aria-valuemax": max,
        "aria-valuenow": val,
        "aria-orientation": orientation,
        "aria-disabled": String(isDisabled),
      },
    };
  });

  const rawMarks = context.get("marks");
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

    const style =
      orientation === "vertical"
        ? `bottom: ${percent}%; transform: translateY(50%);`
        : `left: ${percent}%; transform: translateX(-50%);`;

    return {
      value: mark.value,
      label: mark.label,
      percent,
      style,
      active,
      markerProps: {
        id: dom.getMarkerId(scope, mark.value),
        "data-scope": "slider",
        "data-part": "marker",
        "data-value": mark.value,
        "data-active": String(active),
      },
    };
  });

  const valueText = isRange
    ? `${values[0] ?? min} - ${values[1] ?? max}`
    : String(values[0] ?? min);

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
    orientation,
    activeThumbIndex,
    thumbs,
    markers,
    rangeStyle,
    valueText,

    rootProps: {
      id: dom.getRootId(scope),
      "data-scope": "slider",
      "data-part": "root",
      "data-disabled": String(isDisabled),
      "data-readonly": String(isReadOnly),
      "data-invalid": String(isInvalid),
      "data-dragging": String(isDragging),
      "data-orientation": orientation,
      "aria-disabled": String(isDisabled),
      "aria-invalid": String(isInvalid),
    },

    controlProps: {
      id: dom.getControlId(scope),
      "data-scope": "slider",
      "data-part": "control",
      "data-orientation": orientation,
      "data-disabled": String(isDisabled),
    },

    trackProps: {
      id: dom.getTrackId(scope),
      "data-scope": "slider",
      "data-part": "track",
      "data-orientation": orientation,
      "data-disabled": String(isDisabled),
    },

    rangeProps: {
      id: dom.getRangeId(scope),
      "data-scope": "slider",
      "data-part": "range",
      "data-orientation": orientation,
    },

    labelProps: {
      id: dom.getLabelId(scope),
      "data-scope": "slider",
      "data-part": "label",
    },

    valueTextProps: {
      id: dom.getValueTextId(scope),
      "data-scope": "slider",
      "data-part": "value-text",
    },

    markerGroupProps: {
      id: dom.getMarkerGroupId(scope),
      "data-scope": "slider",
      "data-part": "marker-group",
    },

    getThumbProps(index = 0) {
      return (
        thumbs[index]?.thumbProps ?? {
          id: dom.getThumbId(scope, index),
          "data-scope": "slider",
          "data-part": "thumb",
          "data-index": index,
        }
      );
    },

    getMarkerProps(val: number) {
      return (
        markers.find((m) => m.value === val)?.markerProps ?? {
          id: dom.getMarkerId(scope, val),
          "data-scope": "slider",
          "data-part": "marker",
          "data-value": val,
        }
      );
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

    async handleTouchStart(e: MiniAppTouchEvent) {
      if (computed("isDisabled") || computed("isReadOnly")) return;
      const touch = e.touches[0];
      if (!touch) return;
      const comp = service.prop("component");
      const controlId = dom.getControlId(scope);
      const selector = `#${controlId}`;
      let rect = refs.get("rect");
      if (comp) {
        const queried = await queryRect(selector, comp);
        if (queried) {
          rect = queried;
          refs.set("rect", rect);
        }
      }
      service.send({
        type: "POINTER_DOWN",
        point: { x: touch.clientX, y: touch.clientY },
        rect: rect ?? undefined,
      });
    },

    handleTouchMove(e: MiniAppTouchEvent) {
      if (computed("isDisabled") || computed("isReadOnly")) return;
      const touch = e.touches[0];
      if (!touch) return;
      service.send({
        type: "POINTER_MOVE",
        point: { x: touch.clientX, y: touch.clientY },
      });
    },

    handleTouchEnd(_e: MiniAppTouchEvent) {
      if (computed("isDisabled") || computed("isReadOnly")) return;
      service.send({
        type: "POINTER_UP",
      });
    },

    async handleTap(e: MiniAppCustomEvent) {
      if (computed("isDisabled") || computed("isReadOnly")) return;
      const detail = e.detail as { x?: number; y?: number } | undefined;
      const touches = (e as any).touches as
        | Array<{ clientX: number; clientY: number }>
        | undefined;
      const x = detail?.x ?? touches?.[0]?.clientX;
      const y = detail?.y ?? touches?.[0]?.clientY;
      if (x === undefined || y === undefined) return;
      const comp = service.prop("component");
      const controlId = dom.getControlId(scope);
      const selector = `#${controlId}`;
      let rect = refs.get("rect");
      if (comp) {
        const queried = await queryRect(selector, comp);
        if (queried) {
          rect = queried;
          refs.set("rect", rect);
        }
      }
      service.send({
        type: "POINTER_DOWN",
        point: { x, y },
        rect: rect ?? undefined,
      });
      service.send({
        type: "POINTER_UP",
      });
    },
  };
}

