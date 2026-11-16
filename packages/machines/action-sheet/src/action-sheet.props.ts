import type { ActionSheetResolvedProps } from "./action-sheet.types";

export const defaultActionSheetProps: ActionSheetResolvedProps = {
  open: null,
  defaultOpen: false,
  items: [],
  actions: [],
  closeOnItem: true,
  closeOnBackdropClick: true,
  duration: 300,
};
