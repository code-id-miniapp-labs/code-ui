import type { ProgressResolvedProps } from "./progress.types";

export const defaultProgressProps: ProgressResolvedProps = {
  value: null,
  defaultValue: null,
  min: 0,
  max: 100,
  orientation: "horizontal",
  type: "linear",
  size: "md",
  color: "primary",
  trackColor: "#e5e7eb",
  striped: false,
  animated: false,
  animation: "carousel",
  inverted: false,
  circleRadius: 42,
  strokeWidth: 8,
  ui: {},
  indeterminate: false,
};
