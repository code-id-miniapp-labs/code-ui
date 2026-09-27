import { tv } from "tailwind-variants/lite";
import { getComponentConfig } from "@code-ui/core";

const themeCache = new Map<string, any>();

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
  let cached = themeCache.get(componentName);
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

  cached = tv({
    extend: baseTheme as any,
    slots: globalConfig.slots as any,
    variants: globalConfig.variants as any,
    compoundVariants: globalConfig.compoundVariants as any,
    defaultVariants: globalConfig.defaultVariants as any,
  });

  themeCache.set(componentName, cached);
  return cached as T;
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
