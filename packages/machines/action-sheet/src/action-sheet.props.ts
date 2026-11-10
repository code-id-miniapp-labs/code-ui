import type { ActionSheetResolvedProps } from "./action-sheet.types";

export const defaultActionSheetProps: ActionSheetResolvedProps = {
  open: null,
  defaultOpen: false,
  title: "",
  description: "",
  actions: [],
  cancelText: "",
  showCancel: undefined,
  cancelIcon: "",
  loadingIcon: "loading",
  close: false,
  closeIcon: "close",
  closeOnAction: true,
  closeOnBackdropClick: true,
  duration: 300,
  ui: {},
};
