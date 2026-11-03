import {
  addToast,
  clearToasts,
  dismissToast,
  removeToast,
  updateToast,
  updateToastHostConfig,
} from "@code-ui/miniapp/behaviors/toast";
import type {
  ToastAction,
  ToastEntry,
  ToastSlotName,
  ToastUI,
} from "@code-ui/miniapp/behaviors/toast";

export interface ToastOptions {
  id?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  icon?: string | undefined;
  mode?: "default" | "native" | undefined;
  color?: string | undefined;
  variant?: string | undefined;
  orientation?: "horizontal" | "vertical" | undefined;
  placement?: "top" | "center" | "bottom" | undefined;
  duration?: number | undefined;
  progress?: boolean | { color?: string } | undefined;
  progressPosition?: "top" | "bottom" | undefined;
  close?: boolean | undefined;
  closeIcon?: string | undefined;
  actions?: ToastAction[] | undefined;
  ui?: ToastUI | undefined;
  className?: string | undefined;
  onAction?:
    | ((details: { action: ToastAction; index: number }) => void)
    | undefined;
  onDismiss?: (() => void) | undefined;
}

export type ToastShorthandArg =
  | string
  | (Omit<ToastOptions, "color"> & { title?: string | undefined });

export interface UseToastOptions {
  /** Optional MiniProgram page or component instance owner */
  target?: any;
  /** Max toasts visible at a time */
  max?: number | undefined;
}

export interface UseToastReturn {
  add: (toast: ToastOptions) => string;
  show: (toast: ToastOptions) => string;
  update: (id: string, patch: Partial<Omit<ToastOptions, "id">>) => void;
  remove: (id: string) => void;
  dismiss: (id: string) => void;
  clear: () => void;
  config: (options: { max?: number | undefined }) => void;
  success: (
    titleOrOptions: ToastShorthandArg,
    options?: Omit<ToastOptions, "title" | "color">,
  ) => string;
  error: (
    titleOrOptions: ToastShorthandArg,
    options?: Omit<ToastOptions, "title" | "color">,
  ) => string;
  warning: (
    titleOrOptions: ToastShorthandArg,
    options?: Omit<ToastOptions, "title" | "color">,
  ) => string;
  info: (
    titleOrOptions: ToastShorthandArg,
    options?: Omit<ToastOptions, "title" | "color">,
  ) => string;
  loading: (
    titleOrOptions: ToastShorthandArg,
    options?: Omit<ToastOptions, "title" | "color">,
  ) => string;
}

function normalizeShorthand(
  titleOrOptions: ToastShorthandArg,
  extraOptions?: Omit<ToastOptions, "title" | "color">,
): Omit<ToastOptions, "color"> {
  if (typeof titleOrOptions === "string") {
    return { title: titleOrOptions, ...extraOptions };
  }
  return { ...titleOrOptions, ...extraOptions };
}

export function useToast(
  optionsOrTarget?: UseToastOptions | any,
): UseToastReturn {
  let target =
    optionsOrTarget &&
    typeof optionsOrTarget === "object" &&
    "target" in optionsOrTarget
      ? optionsOrTarget.target
      : optionsOrTarget;

  if (!target && typeof getCurrentPages === "function") {
    try {
      const pages = getCurrentPages();
      target = pages && pages[pages.length - 1];
    } catch {}
  }

  if (
    optionsOrTarget &&
    typeof optionsOrTarget === "object" &&
    typeof optionsOrTarget.max === "number"
  ) {
    updateToastHostConfig(target, { max: optionsOrTarget.max });
  }

  const add = (toast: ToastOptions): string => {
    return addToast(toast, target);
  };

  return {
    add,
    show: add,
    update: (id: string, patch: Partial<ToastOptions>) =>
      updateToast(id, patch, target),
    remove: (id: string) => removeToast(id, target),
    dismiss: (id: string) => dismissToast(id, target),
    clear: () => clearToasts(target),
    config: (opts: { max?: number | undefined }) =>
      updateToastHostConfig(target, opts),
    success: (
      titleOrOptions: ToastShorthandArg,
      opts?: Omit<ToastOptions, "title" | "color">,
    ) => add({ color: "success", ...normalizeShorthand(titleOrOptions, opts) }),
    error: (
      titleOrOptions: ToastShorthandArg,
      opts?: Omit<ToastOptions, "title" | "color">,
    ) => add({ color: "danger", ...normalizeShorthand(titleOrOptions, opts) }),
    warning: (
      titleOrOptions: ToastShorthandArg,
      opts?: Omit<ToastOptions, "title" | "color">,
    ) => add({ color: "warning", ...normalizeShorthand(titleOrOptions, opts) }),
    info: (
      titleOrOptions: ToastShorthandArg,
      opts?: Omit<ToastOptions, "title" | "color">,
    ) => add({ color: "info", ...normalizeShorthand(titleOrOptions, opts) }),
    loading: (
      titleOrOptions: ToastShorthandArg,
      opts?: Omit<ToastOptions, "title" | "color">,
    ) => {
      const normalized = normalizeShorthand(titleOrOptions, opts);
      return add({
        color: "loading",
        duration: 0,
        ...normalized,
        ui: {
          icon: "animate-spin",
          ...normalized.ui,
        },
      });
    },
  };
}

export type { ToastAction, ToastEntry, ToastSlotName, ToastUI };
