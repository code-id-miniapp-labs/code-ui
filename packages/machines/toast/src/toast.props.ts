import type { ToastProps } from "./toast.types";

export const defaultToastProps: ToastProps = {
  id: undefined,
  open: null as any,
  defaultOpen: true,
  mode: "default",
  color: "neutral",
  variant: "outline",
  orientation: "horizontal",
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
