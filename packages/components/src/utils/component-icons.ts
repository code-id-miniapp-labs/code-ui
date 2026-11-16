export interface UseComponentIconsOptions {
  icon?: string | undefined;
  leading?: boolean | undefined;
  leadingIcon?: string | undefined;
  trailing?: boolean | undefined;
  trailingIcon?: string | undefined;
  loading?: boolean | undefined;
  loadingIcon?: string | undefined;
  defaultLoadingIcon?: string | undefined;
  defaultLeadingIcon?: string | undefined;
  defaultTrailingIcon?: string | undefined;
  /**
   * Controls where a loading spinner attaches when `loading` is true:
   * - `"auto"` (Nuxt UI default): shows on trailing side when `trailing` is true, otherwise leading.
   * - `"trailing"`: attaches to the trailing slot (useful for inputs/textareas with right-aligned controls).
   */
  loadingPlacement?: "auto" | "trailing" | undefined;
  slots?: Record<string, boolean> | undefined;
}

export interface ComponentIconsState {
  isLeading: boolean;
  isTrailing: boolean;
  hasLeadingSlot: boolean;
  hasTrailingSlot: boolean;
  hasLoadingSlot: boolean;
  leadingIconName: string;
  trailingIconName: string;
  leadingLoading: boolean;
  trailingLoading: boolean;
}

/**
 * Nuxt UI v4-inspired composable helper for MiniProgram components.
 * Resolves leading, trailing, and loading icon visibility from props and
 * compile-time detected slot flags (`this.data.slots`).
 */
export function useComponentIcons(
  options: UseComponentIconsOptions,
): ComponentIconsState {
  const {
    icon,
    leading,
    leadingIcon,
    trailing,
    trailingIcon,
    loading = false,
    loadingIcon,
    defaultLoadingIcon = "loading",
    defaultLeadingIcon,
    defaultTrailingIcon,
    loadingPlacement = "auto",
    slots,
  } = options;

  const hasLeadingSlot = Boolean(
    slots?.leading || slots?.icon || slots?.leadingIcon,
  );
  const hasTrailingSlot = Boolean(slots?.trailing || slots?.trailingIcon);
  const hasLoadingSlot = Boolean(slots?.loadingIcon);

  const resolvedLoadingIcon = loadingIcon || defaultLoadingIcon;
  const resolvedLeadingIcon = leadingIcon || (!trailing ? icon : "") || defaultLeadingIcon || "";
  const resolvedTrailingIcon = trailingIcon || (trailing ? icon : "") || defaultTrailingIcon || "";

  const leadingLoading = Boolean(
    loading && (loadingPlacement === "auto" ? !trailing : false),
  );
  const trailingLoading = Boolean(
    loading && (loadingPlacement === "trailing" || Boolean(trailing)),
  );

  const isLeading = Boolean(
    (icon && leading) ||
      (icon && !trailing) ||
      leadingIcon ||
      defaultLeadingIcon ||
      leadingLoading ||
      hasLeadingSlot,
  );

  const isTrailing = Boolean(
    (icon && trailing) ||
      trailingIcon ||
      defaultTrailingIcon ||
      trailingLoading ||
      hasTrailingSlot ||
      (trailingLoading && hasLoadingSlot),
  );

  const leadingIconName = leadingLoading
    ? resolvedLoadingIcon
    : resolvedLeadingIcon;
  const trailingIconName = trailingLoading
    ? resolvedLoadingIcon
    : resolvedTrailingIcon;

  return {
    isLeading,
    isTrailing,
    hasLeadingSlot,
    hasTrailingSlot,
    hasLoadingSlot,
    leadingIconName,
    trailingIconName,
    leadingLoading,
    trailingLoading,
  };
}
