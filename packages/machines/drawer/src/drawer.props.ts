import type { DrawerProps } from "./drawer.types";

export const defaultDrawerProps: DrawerProps = {
  open: null,
  defaultOpen: false,
  placement: "bottom",
  closeOnBackdropClick: true,
  dismissible: true,
  threshold: 80,
  duration: 300,
  shouldScaleBackground: false,
  scaleFactor: 0.94,
  scaleBackground: "bg-black",
  ui: {},
};
