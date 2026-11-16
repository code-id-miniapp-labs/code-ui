import type { SwipeCellResolvedProps } from "./swipe-cell.types";

export const defaultSwipeCellProps: SwipeCellResolvedProps = {
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
};

