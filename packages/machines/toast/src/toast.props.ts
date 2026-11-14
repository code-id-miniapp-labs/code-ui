import type { ToastResolvedProps } from "./toast.types";

export const defaultToastProps: ToastResolvedProps = {
  open: null,
  defaultOpen: true,
  mode: "default",
  color: "neutral",
  variant: "outline",
  orientation: "vertical",
  placement: "top",
  title: "",
  description: "",
  icon: "",
  duration: 4000,
  progress: true,
  progressPosition: "bottom",
  close: true,
  closeIcon: "close",
  actions: [],
  ui: {},
};
