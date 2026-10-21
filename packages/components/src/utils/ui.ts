import { getComponentConfig, getConfig } from "@code-ui/core";
import { cn, tv } from "./variants";

const themeCache = new Map<string, any>();
let cachedSource: unknown;
let cachedColorsSource: unknown;

/**
 * Clear the resolved theme cache (useful for tests or dynamic config updates).
 */
export function clearThemeCache(): void {
  themeCache.clear();
}

const DEFAULT_SEMANTIC_COLORS = new Set([
  "primary",
  "neutral",
  "danger",
  "success",
  "warning",
  "info",
]);

/**
 * Returns the component's TV theme extended with cui.config.ts overrides.
 * Cached so extending only runs once per component type.
 */
export function getResolvedTheme<T extends (...args: any[]) => any>(
  componentName: string,
  baseTheme: T,
): T {
  const currentConfig = getConfig();
  const source = currentConfig?.components;
  const colorsSource = currentConfig?.ui?.colors;
  if (source !== cachedSource || colorsSource !== cachedColorsSource) {
    themeCache.clear();
    cachedSource = source;
    cachedColorsSource = colorsSource;
  }

  const cached = themeCache.get(componentName);
  if (cached) return cached;

  const globalConfig = getComponentConfig(componentName);
  const userColors = colorsSource ? Object.keys(colorsSource) : [];
  const customColors = userColors.filter(
    (c) => !DEFAULT_SEMANTIC_COLORS.has(c),
  );

  const hasOverrides =
    (globalConfig &&
      (globalConfig.slots ||
        globalConfig.variants ||
        globalConfig.compoundVariants ||
        globalConfig.defaultVariants)) ||
    customColors.length > 0;

  if (!hasOverrides) {
    themeCache.set(componentName, baseTheme);
    return baseTheme;
  }

  const compoundVariants = [
    ...customColors.flatMap((color) => [
      {
        variant: "solid",
        color,
        class: { root: `bg-${color} text-white active:bg-${color}/90` },
      },
      {
        variant: "outline",
        color,
        class: {
          root: `border border-${color} text-${color} active:bg-${color}/10`,
        },
      },
      {
        variant: "ghost",
        color,
        class: { root: `text-${color} active:bg-${color}/10` },
      },
      {
        variant: "soft",
        color,
        class: {
          root: `bg-${color}/10 text-${color} active:bg-${color}/20`,
        },
      },
    ]),
    ...((globalConfig?.compoundVariants as any[]) || []),
  ];

  const extendedTV = tv({
    extend: baseTheme as any,
    variants: globalConfig?.variants as any,
    compoundVariants,
    defaultVariants: globalConfig?.defaultVariants as any,
  });

  const globalSlots = globalConfig?.slots;

  const resolvedThemeFn = ((props?: any) => {
    const slotFns = extendedTV(props) as any;
    if (!globalSlots || typeof slotFns !== "object" || slotFns === null) {
      return slotFns;
    }
    const wrappedSlots: any = {};
    for (const key of Object.keys(slotFns)) {
      const origFn = slotFns[key];
      if (typeof origFn === "function") {
        wrappedSlots[key] = (slotProps?: any) => {
          const baseOut = origFn(slotProps);
          const override = globalSlots[key];
          if (!override) return baseOut;
          return typeof override === "function"
            ? override(baseOut)
            : cn(baseOut, override);
        };
      } else {
        wrappedSlots[key] = origFn;
      }
    }
    return wrappedSlots;
  }) as unknown as T;

  themeCache.set(componentName, resolvedThemeFn);
  return resolvedThemeFn;
}

/**
 * Resolves final slot classes by passing local UI overrides into TV slot functions.
 */
export function resolveSlots<
  T extends Record<string, ((opts?: any) => string) | undefined>,
>(
  themeFns: T,
  localUI?: Record<string, string>,
  localClass?: string,
): Record<keyof T, string> {
  const result: any = {};
  for (const slot in themeFns) {
    const fn = themeFns[slot];
    if (typeof fn === "function") {
      result[slot] = fn({
        class: [
          localUI?.[slot],
          slot === "root" ? localClass : undefined,
        ].filter(Boolean),
      });
    } else {
      result[slot] = "";
    }
  }
  return result;
}

/**
 * Backwards compatible helper for resolveUI.
 */
export function resolveUI(
  uiFn: Record<string, any>,
  localUI?: Record<string, string>,
) {
  return resolveSlots(uiFn, localUI);
}
