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

const ESCAPE_MAP: Record<string, string> = {
  "[": "_b",
  "]": "_B",
  "(": "_p",
  ")": "_P",
  "#": "_h",
  "!": "_e",
  "/": "_f",
  "\\": "_r",
  ".": "_d",
  ":": "_c",
  "%": "_v",
  ",": "_m",
  "'": "_a",
  '"': "_q",
  "*": "_x",
  "&": "_n",
  "@": "_t",
  "{": "_k",
  "}": "_K",
  "+": "_u",
  ";": "_j",
  "<": "_l",
  "~": "_w",
  "=": "_z",
  ">": "_g",
  "?": "_Q",
  "^": "_y",
  "`": "_i",
  "|": "_o",
  $: "_s",
};

function isAsciiDigit(code: number | undefined): boolean {
  return code !== undefined && code >= 48 && code <= 57;
}

function escapeSelector(token: string): string {
  const len = token.length;
  if (len === 0) return "";
  let out = "";
  let last = 0;
  for (let i = 0; i < len; i++) {
    const ch = token[i] as string;
    const rep = ESCAPE_MAP[ch];
    if (rep !== undefined) {
      if (last !== i) out += token.slice(last, i);
      out += rep;
      last = i + 1;
    } else if (i === 0) {
      const c1 = token.charCodeAt(0);
      if (
        isAsciiDigit(c1) ||
        (ch === "-" && (len === 1 || isAsciiDigit(token.charCodeAt(1))))
      ) {
        out += `_${ch}`;
        last = 1;
      }
    }
  }
  if (last === 0) return token;
  return last < len ? out + token.slice(last) : out;
}

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
  escaped = escapeSelector(token);
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

/**
 * Returns a property group key for common Tailwind classes so conflicting
 * properties can be deduplicated (e.g. text-red-500 replacing text-white).
 */
export function getUtilityKey(token: string): string | null {
  const lastColon = token.lastIndexOf(":");
  const prefix = lastColon !== -1 ? token.slice(0, lastColon + 1) : "";
  const m = lastColon !== -1 ? token.slice(lastColon + 1) : token;

  if (/^(block|inline(-block|-flex|-grid)?|flex|grid|hidden)$/.test(m)) {
    return `${prefix}display`;
  }
  if (/^(static|fixed|absolute|relative|sticky)$/.test(m)) {
    return `${prefix}position`;
  }

  // Spacing & sizing
  if (/^-?[pm][xytrblse]?-/.test(m)) {
    const d = m.startsWith("-")
      ? m.slice(1, m.indexOf("-", 1))
      : m.slice(0, m.indexOf("-"));
    return `${prefix}${d}`;
  }
  const sizeMatch = m.match(/^(w|h|min-w|min-h|max-w|max-h|size)-/);
  if (sizeMatch) return `${prefix}${sizeMatch[1]}`;

  // Flex / Grid
  if (/^flex-(row|col)(-reverse)?$/.test(m)) return `${prefix}flex-direction`;
  if (m.startsWith("items-")) return `${prefix}items`;
  if (m.startsWith("justify-")) return `${prefix}justify`;
  if (m.startsWith("gap-")) {
    return `${prefix}gap${m.startsWith("gap-x-") ? "-x" : m.startsWith("gap-y-") ? "-y" : ""}`;
  }

  // Rounded
  if (m === "rounded" || m.startsWith("rounded-")) {
    const s = m.match(/^rounded-(tl|tr|bl|br|ss|se|ee|es|t|b|l|r|s|e)(?:-|$)/);
    return `${prefix}rounded${s ? `-${s[1]}` : ""}`;
  }

  // Ring utilities
  if (m === "ring" || m.startsWith("ring-")) {
    const val = m === "ring" ? "" : m.slice(5);
    if (!val || val === "inset" || /^\d+$/.test(val)) return `${prefix}ring-width`;
    if (val.startsWith("offset-")) {
      return /^\d+$/.test(val.slice(7))
        ? `${prefix}ring-offset-width`
        : `${prefix}ring-offset-color`;
    }
    return `${prefix}ring-color`;
  }

  if (m === "shadow" || m.startsWith("shadow-")) return `${prefix}shadow`;
  if (m.startsWith("opacity-")) return `${prefix}opacity`;
  if (/^-?z-/.test(m)) return `${prefix}z`;
  if (
    /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.test(
      m,
    )
  ) {
    return `${prefix}font-weight`;
  }

  if (m.startsWith("text-")) {
    const val = m.slice(5);
    if (/^(xs|sm|base|lg|[2-9]?xl)$|^\[(\d+|length:)/.test(val)) {
      return `${prefix}text-size`;
    }
    if (/^(left|center|right|justify|start|end)$/.test(val)) {
      return `${prefix}text-align`;
    }
    if (/^(ellipsis|clip|wrap|nowrap|balance|pretty)$/.test(val)) {
      return `${prefix}text-wrap-overflow`;
    }
    return `${prefix}text-color`;
  }

  if (m.startsWith("bg-")) {
    const val = m.slice(3);
    if (/^(auto|cover|contain)$/.test(val)) return `${prefix}bg-size`;
    if (/^(fixed|local|scroll)$/.test(val)) return `${prefix}bg-attachment`;
    if (/^(no-)?repeat(-[xy])?$/.test(val)) return `${prefix}bg-repeat`;
    return `${prefix}bg-color`;
  }

  if (m === "border") return `${prefix}border-width`;
  if (m.startsWith("border-")) {
    const val = m.slice(7);
    if (/^(solid|dashed|dotted|double|none)$/.test(val)) {
      return `${prefix}border-style`;
    }
    const dirMatch = val.match(/^(t|b|l|r|x|y|s|e)(?:-(.+))?$/);
    if (dirMatch) {
      const rest = dirMatch[2];
      return `${prefix}border-${dirMatch[1]}-${!rest || /^\d+$|^\[(\d+|length:)/.test(rest) ? "width" : "color"}`;
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
