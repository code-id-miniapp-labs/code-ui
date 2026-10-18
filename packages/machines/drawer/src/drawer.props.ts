import type { DrawerProps } from "./drawer.types";

export const defaultDrawerProps: DrawerProps = {
  open: null,
  defaultOpen: false,
  placement: "bottom",
  closeOnBackdropClick: true,
  dismissible: true,
  threshold: 80,
  duration: 300,
  ui: {},
};

