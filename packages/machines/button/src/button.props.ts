import type { ButtonProps } from "./button.types";

export const defaultButtonProps: ButtonProps = {
  disabled: false,
  loading: false,
  variant: "solid" as const,
  color: "primary" as const,
  size: "md" as const,
  block: false,
  loadingAuto: false,
  autoResetDuration: 1500,
  ui: {},
};
