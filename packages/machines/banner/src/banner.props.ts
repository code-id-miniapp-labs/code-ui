import type { BannerProps } from "./banner.types";

export const defaultBannerProps: BannerProps = {
  id: undefined,
  open: null as any,
  defaultOpen: true,
  loading: false,
  loadingIcon: "loading",
  color: "primary",
  variant: "soft",
  placement: "top",
  mode: "fixed",
  title: "",
  description: "",
  icon: "",
  infoIcon: "info",
  successIcon: "check",
  warningIcon: "alert",
  errorIcon: "close",
  close: true,
  closeIcon: "close",
  actions: [],
  topOffset: undefined,
  bottomOffset: undefined,
  autoInset: true,
  ui: {},
};

