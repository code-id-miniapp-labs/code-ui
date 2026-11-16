import type { ModalResolvedProps } from "./modal.types";

export const defaultModalProps: ModalResolvedProps = {
  open: null,
  defaultOpen: false,
  dismissible: true,
  closeOnBackdropClick: true,
  transition: true,
  duration: 300,
};
