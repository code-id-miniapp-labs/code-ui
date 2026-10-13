import { getComponentConfig, getConfig } from "@code-ui/core";
import { dedupeClasses, escapeClass, tv } from "./variants";

const themeCache = new Map<string, any>();
/** `components` config the cache was built from; replaced on config reload (HMR). */
let cachedSource: unknown;

/**
 * Clear the resolved theme cache (useful for tests or dynamic config updates).
 */
export function clearThemeCache(): void {
  themeCache.clear();
}

/**
 * Returns the component's TV theme extended with cui.config.ts overrides.
 * Cached so extending only runs once per component type (Nuxt UI v4 pattern).
 */
export function getResolvedTheme<T extends (...args: any[]) => any>(
  componentName: string,
  baseTheme: T,
): T {
  const source = getConfig()?.components;
  if (source !== cachedSource) {
    themeCache.clear();
    cachedSource = source;
  }

  const cached = themeCache.get(componentName);
  if (cached) return cached;

  const globalConfig = getComponentConfig(componentName);
  const hasOverrides =
    globalConfig &&
    (globalConfig.slots ||
      globalConfig.variants ||
      globalConfig.compoundVariants ||
      globalConfig.defaultVariants);

  if (!hasOverrides) {
    themeCache.set(componentName, baseTheme);
    return baseTheme;
  }

  const extendedTV = tv({
    extend: baseTheme as any,
    variants: globalConfig.variants as any,
    compoundVariants: globalConfig.compoundVariants as any,
    defaultVariants: globalConfig.defaultVariants as any,
  });

  const globalSlots = globalConfig.slots;

  // Wrap so globalConfig.slots is applied with override priority over default variant classes
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
          return override ? dedupeClasses(baseOut, override) : baseOut;
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
 * Matches Nuxt UI v4 slot resolution.
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
      const slotClass = fn({
        class: [
          localUI?.[slot],
          slot === "root" ? localClass : undefined,
        ].filter(Boolean),
      });
      result[slot] = escapeClass(dedupeClasses(slotClass));
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
