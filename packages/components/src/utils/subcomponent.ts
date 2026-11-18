import { defu } from "@code-id-labs/utils";

/**
 * Merges a Nuxt UI v4-style boolean / string / object subcomponent prop with
 * parent-inherited defaults using `defu`.
 *
 * - `false` / `null`: disables the subcomponent (`null`)
 * - `true`: renders the subcomponent with `defaults`
 * - non-empty string: sets `[stringKey]` to the string value merged onto `defaults`
 * - object: merges user object overrides on top of `defaults` (deeply merging `ui`)
 */
export function resolveSubcomponentProps<T extends Record<string, any>>(
  value: boolean | string | Partial<T> | null | undefined,
  defaults: Partial<T>,
  stringKey: keyof T = "label" as keyof T,
): T | null {
  if (value === false || value === null || value === undefined) {
    return null;
  }

  if (value === true) {
    return defu({}, defaults) as T;
  }

  if (typeof value === "string") {
    if (!value) return null;
    return defu({ [stringKey]: value } as Partial<T>, defaults) as T;
  }

  if (typeof value === "object") {
    return defu({ ...value }, defaults) as T;
  }

  return null;
}

/**
 * Resolves a button/icon-button subcomponent prop (e.g. `close`, `more`) with
 * parent slot class fallback that yields when custom `color` or `variant` is set.
 */
export function resolveTriggerButtonProps<
  T extends {
    color?: string | undefined;
    variant?: string | undefined;
    className?: string | undefined;
    ui?: Record<string, any> | undefined;
  },
>(
  value: boolean | string | Partial<T> | null | undefined,
  defaults: Partial<T>,
  slotClass?: string,
  stringKey: keyof T = "label" as keyof T,
): T | null {
  const hasCustomAppearance =
    typeof value === "object" &&
    value !== null &&
    Boolean(value.color || value.variant);

  const resolved = resolveSubcomponentProps<T>(value, defaults, stringKey);
  if (!resolved) {
    return null;
  }

  return {
    ...resolved,
    ui: resolved.ui ?? {},
    className: [hasCustomAppearance ? "" : slotClass, resolved.className]
      .filter(Boolean)
      .join(" "),
  };
}

/**
 * Normalizes an optional subcomponent list (e.g. `actions`) where each item may
 * be a label string or partial subcomponent props, deep-merging parent defaults.
 */
export function resolveSubcomponentList<
  T extends Record<string, any>,
  TOut extends Record<string, any> = T & { index: number },
>(
  items: ReadonlyArray<string | Partial<T>> | null | undefined,
  defaults: Partial<T> | ((item: Partial<T>, index: number) => Partial<T>),
  stringKey: keyof T = "label" as keyof T,
  transform?: (
    merged: T & { index: number },
    raw: string | Partial<T>,
  ) => TOut,
): TOut[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const resolved: TOut[] = [];
  for (let i = 0; i < items.length; i++) {
    const raw = items[i];
    if (!raw && raw !== "") continue;
    const itemObj: Partial<T> =
      typeof raw === "string"
        ? ({ [stringKey]: raw } as Partial<T>)
        : { ...raw };
    const itemDefaults =
      typeof defaults === "function" ? defaults(itemObj, i) : defaults;
    const merged = defu(itemObj, itemDefaults) as Record<string, any>;
    merged.index = i;
    const typedMerged = merged as T & { index: number };
    resolved.push(
      transform ? transform(typedMerged, raw) : (typedMerged as unknown as TOut),
    );
  }
  return resolved;
}
