import { escape } from "@weapp-tailwindcss/escape";

export type ClassValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | { [key: string]: any }
  | ClassValue[];

export type TVSlots = Record<string, ClassValue>;

export type TVVariants = Record<
  string,
  Record<string, ClassValue | Record<string, ClassValue>>
>;

export type StringToBoolean<T> = T extends "true" | "false" ? boolean : T;

export type TVVariantProps<V extends TVVariants> = {
  [K in keyof V]?: StringToBoolean<keyof V[K]> | (string & {});
};

export type TVClassProp = {
  class?: ClassValue;
  className?: ClassValue;
};

export type TVSlotFns<S extends TVSlots> = {
  [K in keyof S]: (opts?: TVClassProp | string) => string;
};

export type TVCompoundVariant<
  V extends TVVariants = TVVariants,
  S extends TVSlots = TVSlots,
> = {
  [K in keyof V]?: StringToBoolean<keyof V[K]> | StringToBoolean<keyof V[K]>[];
} & {
  class?: ClassValue | { [K in keyof S]?: ClassValue };
  className?: ClassValue | { [K in keyof S]?: ClassValue };
};

export type TVOptions<S extends TVSlots = {}, V extends TVVariants = {}> = {
  base?: ClassValue;
  slots?: S;
  variants?: V;
  compoundVariants?: TVCompoundVariant<V, S>[];
  defaultVariants?: { [K in keyof V]?: StringToBoolean<keyof V[K]> };
  extend?: any;
};

export interface TVFn<S extends TVSlots = {}, V extends TVVariants = {}> {
  (
    props?: TVVariantProps<V> & TVClassProp & Record<string, any>,
  ): keyof S extends never
    ? (opts?: TVClassProp | string) => string
    : TVSlotFns<S>;
  slots: S;
  variants: V;
  defaultVariants: { [K in keyof V]?: StringToBoolean<keyof V[K]> };
}

export type VariantProps<T extends (...args: any[]) => any> =
  T extends TVFn<any, infer V>
    ? TVVariantProps<V>
    : T extends (props?: infer P) => any
      ? Omit<NonNullable<P>, "class" | "className">
      : Record<string, any>;

/**
 * Lightweight clsx equivalent that joins truthy strings, arrays, and objects.
 */
export function cx(...args: ClassValue[]): string {
  let str = "";
  for (let i = 0; i < args.length; i++) {
    const val = args[i];
    if (!val || typeof val === "boolean") continue;
    if (typeof val === "string" || typeof val === "number") {
      str += (str ? " " : "") + val;
    } else if (Array.isArray(val)) {
      const inner = cx(...val);
      if (inner) str += (str ? " " : "") + inner;
    } else if (typeof val === "object") {
      for (const k in val) {
        if (val[k]) str += (str ? " " : "") + k;
      }
    }
  }
  return str;
}

/** A class that only has `[A-Za-z0-9_-]` and a safe head needs no escaping. */
const SAFE_CLASS = /^[A-Za-z_][\w-]*$/;
const WHITESPACE = /\s+/;

const TOKEN_CACHE_LIMIT = 512;
const tokenCache = new Map<string, string>();

function escapeToken(token: string): string {
  if (SAFE_CLASS.test(token)) return token;
  let escaped = tokenCache.get(token);
  if (escaped !== undefined) {
    // Refresh LRU order
    tokenCache.delete(token);
    tokenCache.set(token, escaped);
    return escaped;
  }
  escaped = escape(token);
  if (tokenCache.size >= TOKEN_CACHE_LIMIT) {
    const oldest = tokenCache.keys().next();
    if (!oldest.done) tokenCache.delete(oldest.value);
  }
  tokenCache.set(token, escaped);
  return escaped;
}

export function escapeClass(value: string | null | undefined): string {
  if (!value) return "";
  let out = "";
  for (const token of value.split(WHITESPACE)) {
    if (!token) continue;
    out += out ? ` ${escapeToken(token)}` : escapeToken(token);
  }
  return out;
}

const TEXT_SIZES = new Set([
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "8xl",
  "9xl",
]);
const TEXT_ALIGNS = new Set([
  "left",
  "center",
  "right",
  "justify",
  "start",
  "end",
]);
const DISPLAYS = new Set([
  "block",
  "inline-block",
  "inline",
  "flex",
  "inline-flex",
  "grid",
  "inline-grid",
  "hidden",
]);
const POSITIONS = new Set([
  "static",
  "fixed",
  "absolute",
  "relative",
  "sticky",
]);
const BORDER_STYLES = new Set(["solid", "dashed", "dotted", "double", "none"]);

/**
 * Returns a property group key for common Tailwind classes so conflicting
 * properties can be deduplicated (e.g. text-red-500 replacing text-white).
 */
export function getUtilityKey(token: string): string | null {
  const lastColon = token.lastIndexOf(":");
  const prefix = lastColon !== -1 ? token.slice(0, lastColon + 1) : "";
  const main = lastColon !== -1 ? token.slice(lastColon + 1) : token;

  if (DISPLAYS.has(main)) return `${prefix}display`;
  if (POSITIONS.has(main)) return `${prefix}position`;

  // Spacing & sizing (supports negative margins like -mt-2)
  const spacingMatch = main.match(/^-?(p|m)[xytrblse]?-/);
  if (spacingMatch) {
    const dir = main.startsWith("-")
      ? main.slice(1, main.indexOf("-", 1))
      : main.slice(0, main.indexOf("-"));
    return `${prefix}${dir}`;
  }

  const sizeMatch = main.match(/^(w|h|min-w|min-h|max-w|max-h|size)-/);
  if (sizeMatch) return `${prefix}${sizeMatch[1]}`;

  // Flex / Grid common overrides
  if (
    main === "flex-row" ||
    main === "flex-col" ||
    main === "flex-row-reverse" ||
    main === "flex-col-reverse"
  ) {
    return `${prefix}flex-direction`;
  }
  if (main.startsWith("items-")) return `${prefix}items`;
  if (main.startsWith("justify-")) return `${prefix}justify`;
  if (main.startsWith("gap-")) {
    if (main.startsWith("gap-x-")) return `${prefix}gap-x`;
    if (main.startsWith("gap-y-")) return `${prefix}gap-y`;
    return `${prefix}gap`;
  }

  // Rounded
  if (main === "rounded" || main.startsWith("rounded-")) {
    const sideMatch = main.match(
      /^rounded-(tl|tr|bl|br|ss|se|ee|es|t|b|l|r|s|e)(?:-|$)/,
    );
    return sideMatch ? `${prefix}rounded-${sideMatch[1]}` : `${prefix}rounded`;
  }

  // Shadow & Opacity & Z-Index
  if (main === "shadow" || main.startsWith("shadow-")) return `${prefix}shadow`;
  if (main.startsWith("opacity-")) return `${prefix}opacity`;
  if (/^-?z-/.test(main)) return `${prefix}z`;

  // Font weight
  if (
    /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.test(
      main,
    )
  ) {
    return `${prefix}font-weight`;
  }

  // Text utilities
  if (main.startsWith("text-")) {
    const val = main.slice(5);
    if (TEXT_SIZES.has(val) || /^\[(\d+|length:)/.test(val))
      return `${prefix}text-size`;
    if (TEXT_ALIGNS.has(val)) return `${prefix}text-align`;
    if (
      val === "ellipsis" ||
      val === "clip" ||
      val === "wrap" ||
      val === "nowrap" ||
      val === "balance" ||
      val === "pretty"
    ) {
      return `${prefix}text-wrap-overflow`;
    }
    return `${prefix}text-color`;
  }

  // Background utilities
  if (main.startsWith("bg-")) {
    const val = main.slice(3);
    if (val === "auto" || val === "cover" || val === "contain")
      return `${prefix}bg-size`;
    if (val === "fixed" || val === "local" || val === "scroll")
      return `${prefix}bg-attachment`;
    if (
      val === "repeat" ||
      val === "no-repeat" ||
      val === "repeat-x" ||
      val === "repeat-y"
    )
      return `${prefix}bg-repeat`;
    return `${prefix}bg-color`;
  }

  // Border utilities
  if (main === "border") return `${prefix}border-width`;
  if (main.startsWith("border-")) {
    const val = main.slice(7);
    if (BORDER_STYLES.has(val)) return `${prefix}border-style`;
    const dirMatch = val.match(/^(t|b|l|r|x|y|s|e)(?:-(.+))?$/);
    if (dirMatch) {
      const dir = dirMatch[1];
      const rest = dirMatch[2];
      if (!rest || /^\d+$|^\[(\d+|length:)/.test(rest))
        return `${prefix}border-${dir}-width`;
      return `${prefix}border-${dir}-color`;
    }
    if (/^\d+$|^\[(\d+|length:)/.test(val)) return `${prefix}border-width`;
    return `${prefix}border-color`;
  }

  return null;
}

export function dedupeClasses(
  ...inputs: (string | null | undefined)[]
): string {
  const tokens: string[] = [];
  const keyToTokenIndex = new Map<string, number>();

  for (const input of inputs) {
    if (!input) continue;
    for (const token of input.split(WHITESPACE)) {
      if (!token) continue;
      const key = getUtilityKey(token);
      if (key) {
        const existingIndex = keyToTokenIndex.get(key);
        if (existingIndex !== undefined) {
          tokens[existingIndex] = "";
        }
        keyToTokenIndex.set(key, tokens.length);
      }
      tokens.push(token);
    }
  }

  return tokens.filter(Boolean).join(" ");
}

/** Joins class values (clsx-style), deduplicates conflicts, and escapes for MiniProgram. */
export function cn(...classes: ClassValue[]): string {
  return escapeClass(dedupeClasses(cx(...classes)));
}

function matchesCompound(
  cv: Record<string, any>,
  mergedProps: Record<string, any>,
): boolean {
  for (const k in cv) {
    if (k === "class" || k === "className") continue;
    const v = cv[k];
    const propVal = mergedProps[k];
    if (Array.isArray(v) ? !v.includes(propVal) : propVal !== v) {
      return false;
    }
  }
  return true;
}

function resolveExtraOpts(opts?: TVClassProp | string): string {
  if (!opts) return "";
  if (typeof opts === "string") return opts;
  return cx(opts.class, opts.className);
}

/**
 * Lightweight runtime TV (Tailwind Variants) evaluator.
 */
export function tv<S extends TVSlots = {}, V extends TVVariants = {}>(
  config: TVOptions<S, V>,
): TVFn<S, V>;
export function tv<T = Record<string, (opts?: any) => string>>(
  config: any,
): (props?: any) => T;
export function tv(config: any): any {
  const {
    base,
    slots,
    variants = {},
    compoundVariants = [],
    defaultVariants = {},
    extend,
  } = config || {};

  const combinedDefaults = extend?.defaultVariants
    ? { ...extend.defaultVariants, ...defaultVariants }
    : defaultVariants;

  const tvFn = (props: Record<string, any> = {}) => {
    const mergedProps: Record<string, any> = { ...combinedDefaults };
    for (const k in props) {
      if (k !== "class" && k !== "className" && props[k] !== undefined) {
        mergedProps[k] = props[k];
      }
    }

    const propLevelExtra = cx(props.class, props.className);
    const baseResult =
      typeof extend === "function" ? extend(mergedProps) : undefined;

    const hasSlots = Boolean(
      slots ||
      (baseResult &&
        typeof baseResult === "object" &&
        !Array.isArray(baseResult)),
    );

    if (hasSlots) {
      const slotResults: Record<
        string,
        (opts?: TVClassProp | string) => string
      > = {};
      const slotNames = new Set([
        ...Object.keys(slots || {}),
        ...(baseResult ? Object.keys(baseResult) : []),
      ]);

      for (const slot of slotNames) {
        const classes: ClassValue[] = [];

        if (slot === "root" && base) classes.push(base);
        if (slots?.[slot]) classes.push(slots[slot]);

        for (const varKey in mergedProps) {
          const varVal = mergedProps[varKey];
          if (varVal === undefined || varVal === null) continue;
          const varConfig = variants[varKey]?.[String(varVal)];
          if (varConfig) {
            if (typeof varConfig === "object" && !Array.isArray(varConfig)) {
              if (varConfig[slot]) classes.push(varConfig[slot]);
            } else if (slot === "root") {
              classes.push(varConfig);
            }
          }
        }

        for (let i = 0; i < compoundVariants.length; i++) {
          const cv = compoundVariants[i];
          if (matchesCompound(cv, mergedProps)) {
            const cvClass = cv.class || cv.className;
            if (
              cvClass &&
              typeof cvClass === "object" &&
              !Array.isArray(cvClass)
            ) {
              if (cvClass[slot]) classes.push(cvClass[slot]);
            } else if (slot === "root" && cvClass) {
              classes.push(cvClass);
            }
          }
        }

        if (slot === "root" && propLevelExtra) {
          classes.push(propLevelExtra);
        }

        const slotBaseStr = cx(...classes);

        slotResults[slot] = (opts?: TVClassProp | string) => {
          const inherited =
            baseResult && typeof baseResult[slot] === "function"
              ? baseResult[slot]()
              : "";
          return cn(inherited, slotBaseStr, resolveExtraOpts(opts));
        };
      }
      return slotResults;
    }

    // Single-element (no slots)
    const classes: ClassValue[] = [];
    if (base) classes.push(base);

    for (const varKey in mergedProps) {
      const varVal = mergedProps[varKey];
      if (varVal === undefined || varVal === null) continue;
      const varConfig = variants[varKey]?.[String(varVal)];
      if (varConfig) classes.push(varConfig);
    }

    for (let i = 0; i < compoundVariants.length; i++) {
      const cv = compoundVariants[i];
      if (matchesCompound(cv, mergedProps)) {
        const cvClass = cv.class || cv.className;
        if (cvClass) classes.push(cvClass);
      }
    }

    if (propLevelExtra) classes.push(propLevelExtra);
    const baseStr = cx(...classes);

    return (opts?: TVClassProp | string) => {
      const inherited = typeof baseResult === "function" ? baseResult() : "";
      return cn(inherited, baseStr, resolveExtraOpts(opts));
    };
  };

  tvFn.slots = slots;
  tvFn.variants = variants;
  tvFn.defaultVariants = combinedDefaults;

  return tvFn;
}
