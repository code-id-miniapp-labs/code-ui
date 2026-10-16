import type { ButtonProps } from "@code-ui/button";
import type { DrawerProps } from "@code-ui/drawer";
import type {
  PinInputProps,
  PinInputValueChangeDetails,
  PinInputValueInvalidDetails,
} from "@code-ui/pin-input";
import type { ThemeColor } from "@code-ui/core";

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
  ui?: ButtonProps["ui"];
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

export interface CuiCardElementProps extends CuiCommonElementProps {
  ui?: Partial<
    Record<
      "root" | "header" | "title" | "description" | "body" | "footer",
      string
    >
  >;
  variant?: "outline" | "solid" | "soft" | "subtle";
  size?: "sm" | "md" | "lg";
  title?: string;
  description?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

export interface CuiChipElementProps extends CuiCommonElementProps {
  ui?: Partial<Record<"root" | "base", string>>;
  text?: string | number;
  color?: ThemeColor;
  size?: "3xs" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
  inset?: boolean;
  standalone?: boolean;
  show?: boolean;
}

export interface CuiDrawerElementProps extends CuiCommonElementProps {
  ui?: DrawerProps["ui"];
  open?: boolean;
  placement?: DrawerProps["placement"];
  closeOnBackdropClick?: boolean;
  dismissible?: boolean;
  threshold?: number;
  duration?: number;
  onClose?: (event?: any) => void;
  onCloseTriggerTap?: (event: WechatMiniprogram.CustomEvent) => void;
  onBackdropTap?: (event: WechatMiniprogram.CustomEvent) => void;
  onDragStart?: (event: WechatMiniprogram.CustomEvent) => void;
  onDrag?: (event: WechatMiniprogram.CustomEvent) => void;
  onDragEnd?: (event: WechatMiniprogram.CustomEvent) => void;
}

export interface CuiPinInputElementProps extends CuiCommonElementProps {
  ui?: PinInputProps["ui"];
  label?: string;
  name?: string;
  variant?: PinInputProps["variant"];
  color?: PinInputProps["color"];
  size?: PinInputProps["size"];
  highlight?: boolean;
  length?: number;
  value?: string[];
  defaultValue?: string[];
  type?: PinInputProps["type"];
  mask?: boolean;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  otp?: boolean;
  autoFocus?: boolean;
  blurOnComplete?: boolean;
  selectOnFocus?: boolean;
  separator?: PinInputProps["separator"];
  separatorChar?: string;
  onChange?: (
    event: WechatMiniprogram.CustomEvent<PinInputValueChangeDetails>,
  ) => void;
  onComplete?: (
    event: WechatMiniprogram.CustomEvent<PinInputValueChangeDetails>,
  ) => void;
  onInvalid?: (
    event: WechatMiniprogram.CustomEvent<PinInputValueInvalidDetails>,
  ) => void;
}

