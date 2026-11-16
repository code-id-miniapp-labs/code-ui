import type { FloatingMenuResolvedProps } from "./floating-menu.types";

export const defaultFloatingMenuProps: FloatingMenuResolvedProps = {
  open: null,
  defaultOpen: false,
  disabled: false,
  closeOnBackdropClick: true,
  triggerMode: "manual",
  portal: false,
  arrow: false,
  side: "bottom",
  align: "start",
  sideOffset: 4,
  alignOffset: 0,
  collisionPadding: 8,
  avoidCollisions: true,
  matchTriggerWidth: true,
  maxHeight: 240,
  duration: 150,
};
