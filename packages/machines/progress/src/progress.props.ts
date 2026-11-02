import type { ProgressProps } from "./progress.types";

export const defaultProgressProps: ProgressProps = {
  value: null,
  defaultValue: null,
  min: 0,
  max: 100,
  orientation: "horizontal" as const,
  type: "linear" as const,
  size: "md" as const,
  color: "primary" as const,
  trackColor: "#e5e7eb",
  striped: false,
  animated: false,
  animation: "carousel" as const,
  inverted: false,
  circleRadius: 42,
  strokeWidth: 8,
  ui: {},
};

