import type { ActionSheetResolvedProps } from "./action-sheet.types";

export const defaultActionSheetProps: ActionSheetResolvedProps = {
  open: null,
  defaultOpen: false,
  title: "",
  description: "",
  items: [],
  actions: [],
  close: false,
  closeIcon: "close",
  closeOnItem: true,
  closeOnBackdropClick: true,
  duration: 300,
  ui: {},
};
