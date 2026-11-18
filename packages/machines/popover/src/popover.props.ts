import type { PopoverResolvedProps } from "./popover.types";

export const defaultPopoverProps: PopoverResolvedProps = {
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
