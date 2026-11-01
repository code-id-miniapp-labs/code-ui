import type { SwipeCellProps } from "./swipe-cell.types";

export const defaultSwipeCellProps: SwipeCellProps = {
  variant: "plain",
  size: "md",
  disabled: false,
  opened: null,
  defaultOpened: false,
  left: [],
  right: [],
  leftWidth: 0,
  rightWidth: 0,
  threshold: 30,
  duration: 300,
  closeOnActionClick: true,
  closeOnContentClick: true,
  ui: {},
};

