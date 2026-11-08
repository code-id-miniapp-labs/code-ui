const defaultSlotsCache = new WeakMap<object, Record<string, string>>();

function hasLocalOverrides(localUI?: Record<string, string>): boolean {
  if (!localUI) return false;
  for (const k in localUI) {
    if (localUI[k]) return true;
  }
  return false;
}

/**
 * Resolves final slot classes by passing local UI overrides into TV slot functions.
 * Fast-paths the common case (no `ui` or `className` overrides) via a WeakMap
 * keyed on the memoized `themeFns` object returned by `tv(...)`.
 */
export function resolveSlots<
  T extends Record<string, ((opts?: any) => string) | undefined>,
>(
  themeFns: T,
  localUI?: Record<string, string>,
  localClass?: string,
): Record<keyof T, string> {
  if (!localClass && !hasLocalOverrides(localUI)) {
    let cached = defaultSlotsCache.get(themeFns);
    if (!cached) {
      cached = {};
      for (const slot in themeFns) {
        const fn = themeFns[slot];
        cached[slot] = typeof fn === "function" ? fn() : "";
      }
      defaultSlotsCache.set(themeFns, cached);
    }
    return { ...cached } as Record<keyof T, string>;
  }

  const result: any = {};
  for (const slot in themeFns) {
    const fn = themeFns[slot];
    if (typeof fn === "function") {
      const override = localUI?.[slot];
      const rootCls = slot === "root" ? localClass : undefined;
      result[slot] =
        override || rootCls
          ? fn({
              class:
                override && rootCls ? [override, rootCls] : override || rootCls,
            })
          : fn();
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
