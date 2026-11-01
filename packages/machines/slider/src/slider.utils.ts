import type { MiniAppRect } from "@code-ui/utils";
import type { SliderOrientation } from "./slider.types";

export function clampValue(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function getStepPrecision(step: number): number {
  const str = String(step);
  const dotIndex = str.indexOf(".");
  return dotIndex >= 0 ? str.length - dotIndex - 1 : 0;
}

export function snapValueToStep(
  value: number,
  min: number,
  max: number,
  step: number,
): number {
  if (step <= 0) return clampValue(value, min, max);
  const stepCount = Math.round((value - min) / step);
  let snapped = min + stepCount * step;
  const precision = getStepPrecision(step);
  snapped = Number(snapped.toFixed(precision));
  return clampValue(snapped, min, max);
}

export function getValueAsPercent(
  value: number,
  min: number,
  max: number,
): number {
  if (max <= min) return 0;
  const percent = ((value - min) / (max - min)) * 100;
  return clampValue(percent, 0, 100);
}

export function getPercentFromPoint(
  point: { x: number; y: number },
  rect: MiniAppRect,
  orientation: SliderOrientation = "horizontal",
  inverted = false,
): number {
  if (orientation === "vertical") {
    const height = rect.height;
    if (height <= 0) return 0;
    let ratio = (rect.bottom - point.y) / height;
    if (inverted) ratio = 1 - ratio;
    return clampValue(ratio * 100, 0, 100);
  }
  const width = rect.width;
  if (width <= 0) return 0;
  let ratio = (point.x - rect.left) / width;
  if (inverted) ratio = 1 - ratio;
  return clampValue(ratio * 100, 0, 100);
}

export function normalizeValues(
  raw: unknown,
  min: number,
  max: number,
  step: number,
): number[] {
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [min];
    return raw.map((item) =>
      snapValueToStep(Number(item ?? min), min, max, step),
    );
  }
  if (
    typeof raw === "string" &&
    raw.trim().startsWith("[") &&
    raw.trim().endsWith("]")
  ) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) =>
          snapValueToStep(Number(item ?? min), min, max, step),
        );
      }
    } catch {}
  }
  if (raw !== undefined && raw !== null && raw !== "" && !isNaN(Number(raw))) {
    return [snapValueToStep(Number(raw), min, max, step)];
  }
  return [min];
}

export function getClosestThumbIndex(
  values: number[],
  targetValue: number,
): number {
  if (values.length <= 1) return 0;
  let closestIndex = 0;
  let minDiff = Infinity;
  for (let i = 0; i < values.length; i++) {
    const val = values[i] ?? 0;
    const diff = Math.abs(val - targetValue);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    } else if (diff === minDiff && targetValue > val) {
      closestIndex = i;
    }
  }
  return closestIndex;
}

export function clampThumbValue(
  values: number[],
  index: number,
  nextValue: number,
  min: number,
  max: number,
  step: number,
  minStepsBetweenThumbs = 0,
): number {
  const minDistance = minStepsBetweenThumbs * step;
  const lowerBound =
    index > 0 ? (values[index - 1] ?? min) + minDistance : min;
  const upperBound =
    index < values.length - 1
      ? (values[index + 1] ?? max) - minDistance
      : max;
  const clamped = clampValue(nextValue, lowerBound, upperBound);
  return snapValueToStep(clamped, min, max, step);
}

