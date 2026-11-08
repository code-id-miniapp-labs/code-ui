import { queryRect } from "@code-ui/utils";
import type { MiniAppRect } from "@code-ui/utils";
import * as dom from "./slider.dom";
import type {
  SliderApi,
  SliderMarkerSnapshot,
  SliderOrientation,
  SliderService,
  SliderThumbSnapshot,
} from "./slider.types";
import { getValueAsPercent } from "./slider.utils";

function extractPoint(e: any): { x: number; y: number } | null {
  const detail = e?.detail as { x?: number; y?: number } | undefined;
  const touches = e?.touches as
    | Array<{ clientX: number; clientY: number }>
    | undefined;
  const x = e?.clientX ?? e?.x ?? detail?.x ?? touches?.[0]?.clientX;
  const y = e?.clientY ?? e?.y ?? detail?.y ?? touches?.[0]?.clientY;
  return x !== undefined && y !== undefined ? { x, y } : null;
}

export function connectSlider(service: SliderService): SliderApi {
  const { context, computed, prop, refs, scope, state } = service;

  const min = Number(prop("min") ?? 0);
  const max = Number(prop("max") ?? 100);
  const step = Number(prop("step") ?? 1);
  const orientation = (prop("orientation") ?? "horizontal") as SliderOrientation;
  const inverted = Boolean(prop("inverted"));
  const isDisabled = computed("isDisabled");
  const isReadOnly = computed("isReadOnly");
  const isInteractive = !isDisabled && !isReadOnly;
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
        thumbProps: { id, "data-index": index },
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
      markerProps: {
        id: dom.getMarkerId(scope, mark.value),
        "data-value": mark.value,
      },
    };
  });

  const valueText = isRange
    ? `${values[0] ?? min} - ${values[1] ?? max}`
    : String(values[0] ?? min);

  const thumbIds = thumbs.map((t) => t.id).join(",");
  const thumbPercents = thumbs.map((t) => t.percent);
  const rect = refs.get("rect");
  const controlId = dom.getControlId(scope);
  const selector = `#${controlId}`;
  const comp = prop("component");
  const canQuery =
    Boolean(comp) &&
    (Boolean((globalThis as Record<string, any>).wx) ||
      typeof (comp as any)?.createSelectorQuery === "function");

  const refreshRect = () => {
    if (canQuery) {
      queryRect(selector, comp).then((queried) => {
        if (queried) refs.set("rect", queried);
      });
    }
  };

  const resolveControlRect = async (): Promise<MiniAppRect | undefined> => {
    let r = refs.get("rect");
    if (!r && canQuery) {
      r = await queryRect(selector, comp);
      if (r) refs.set("rect", r);
    }
    return r ?? undefined;
  };

  if (!rect) refreshRect();

  const trackId = dom.getTrackId(scope);
  const valueTextId = dom.getValueTextId(scope);
  const markerGroupId = dom.getMarkerGroupId(scope);

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
    orientation,
    inverted,
    size: computed("effectiveSize"),
    color: prop("color") ?? "primary",
    label: prop("label") ?? "",
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

    trackProps: trackId ? { id: trackId } : {},

    rangeProps: {
      id: dom.getRangeId(scope),
    },

    labelProps: {
      id: dom.getLabelId(scope),
    },

    valueTextProps: valueTextId ? { id: valueTextId } : {},

    markerGroupProps: markerGroupId ? { id: markerGroupId } : {},

    getThumbProps(index = 0) {
      const val = values[index] ?? min;
      const id = dom.getThumbId(scope, index);
      return {
        id,
        "data-index": index,
        "data-disabled": String(isDisabled),
        "data-dragging": String(activeThumbIndex === index),
        "aria-role": "slider",
        "aria-disabled": isDisabled,
        "aria-valuemin": min,
        "aria-valuemax": max,
        "aria-valuenow": val,
        "aria-orientation": orientation,
      };
    },

    getMarkerProps(val: number) {
      const m = markers.find((item) => item.value === val);
      return {
        id: dom.getMarkerId(scope, val),
        "data-value": val,
        ...(m?.active ? { "data-active": "true" } : {}),
      };
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

    async handleTouchStart(e: any) {
      if (!isInteractive) return;
      const pt = extractPoint(e);
      if (!pt) return;
      service.send({
        type: "POINTER_DOWN",
        point: pt,
        rect: await resolveControlRect(),
      });
      refreshRect();
    },

    handleTouchMove(e: any) {
      if (!isInteractive) return;
      const pt = extractPoint(e);
      if (pt) service.send({ type: "POINTER_MOVE", point: pt });
    },

    handleTouchEnd(_e?: any) {
      if (isInteractive) service.send({ type: "POINTER_UP" });
    },

    async handleTap(e: any) {
      if (!isInteractive) return;
      const pt = extractPoint(e);
      if (!pt) return;
      service.send({
        type: "POINTER_DOWN",
        point: pt,
        rect: await resolveControlRect(),
      });
      service.send({ type: "POINTER_UP" });
      refreshRect();
    },
  };
}
