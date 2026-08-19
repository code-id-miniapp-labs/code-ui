import type { ButtonProps } from "@code-ui/button";
import type { DrawerProps } from "@code-ui/drawer";

export interface CuiCommonElementProps {
  id?: string;
  class?: string;
  className?: string;
  style?: string | Record<string, any>;
  slot?: string;
  key?: string | number;
  children?: any;
}

export interface CuiButtonElementProps extends CuiCommonElementProps {
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  loadingAuto?: boolean;
  autoResetDuration?: number;
  openType?: string;
  formType?: string;
  onTap?: (event?: any) => void;
  onClick?: (event?: any) => void;
  onGetPhoneNumber?: (event?: any) => void;
  onChooseAvatar?: (event?: any) => void;
}

export interface CuiDrawerElementProps extends CuiCommonElementProps {
  open?: boolean;
  placement?: DrawerProps["placement"];
  closeOnBackdropClick?: boolean;
  dismissible?: boolean;
  threshold?: number;
  duration?: number;
  onClose?: (event?: any) => void;
  onOpenChange?: (event?: any) => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "cui-button": CuiButtonElementProps;
      "cui-drawer": CuiDrawerElementProps;
    }
  }
}
