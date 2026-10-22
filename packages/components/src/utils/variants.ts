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

// 1. Pre-defined Sets & Regexes for O(1) / zero-allocation lookups
const DISPLAY_SET = new Set([
  "block",
  "inline-block",
  "inline",
  "flex",
  "inline-flex",
  "grid",
  "inline-grid",
  "contents",
  "list-item",
  "hidden",
]);

const POSITION_SET = new Set([
  "static",
  "fixed",
  "absolute",
  "relative",
  "sticky",
]);

const FONT_WEIGHT_SET = new Set([
  "thin",
  "extralight",
  "light",
  "normal",
  "medium",
  "semibold",
  "bold",
  "extrabold",
  "black",
]);

const TEXT_ALIGN_SET = new Set([
  "left",
  "center",
  "right",
  "justify",
  "start",
  "end",
]);

const TEXT_WRAP_SET = new Set([
  "wrap",
  "nowrap",
  "balance",
  "pretty",
  "ellipsis",
  "clip",
]);

const BG_SIZE_SET = new Set(["auto", "cover", "contain"]);
const BG_ATTACHMENT_SET = new Set(["fixed", "local", "scroll"]);
const BG_POSITION_SET = new Set([
  "bottom",
  "center",
  "left",
  "left-bottom",
  "left-top",
  "right",
  "right-bottom",
  "right-top",
  "top",
]);

const BORDER_STYLE_SET = new Set([
  "solid",
  "dashed",
  "dotted",
  "double",
  "hidden",
  "none",
]);

const TEXT_SIZE_RE =
  /^([2-9]?xs|sm|md|base|lg|[2-9]?xl)$|^\[(\d+|length:|var\(--font-size)/;
const NUMERIC_OR_LENGTH_RE = /^\d+$|^\[(\d+|length:)/;
const SPACING_RE = /^-?([pm][xytrblse]?|space-[xy])-/;
const SIZE_RE = /^(w|h|min-w|min-h|max-w|max-h|size)-/;
const INSET_RE = /^-?(inset(-[xy])?|top|right|bottom|left|start|end)-/;
const ROUNDED_DIR_RE = /^rounded-(tl|tr|bl|br|ss|se|ee|es|t|b|l|r|s|e)(?:-|$)/;
const BORDER_DIR_RE = /^(t|b|l|r|x|y|s|e)(?:-(.+))?$/;
const BG_REPEAT_RE = /^(no-)?repeat(-[xy])?$/;
const BG_GRADIENT_RE =
  /^( none|gradient-to-(t|tr|r|br|b|bl|l|tl)|linear-to-|radial|conic)/;

/**
 * Finds the last variant colon `:` that is NOT inside arbitrary brackets `[...]`.
 * Prevents breaking on `text-[length:16rpx]` or `bg-[url(https://...)]`.
 */
function splitPrefixAndUtil(token: string): [prefix: string, util: string] {
  let bracketDepth = 0;
  let lastColon = -1;

  for (let i = 0; i < token.length; i++) {
    const ch = token[i];
    if (ch === "[") bracketDepth++;
    else if (ch === "]" && bracketDepth > 0) bracketDepth--;
    else if (ch === ":" && bracketDepth === 0) lastColon = i;
  }

  const prefix = lastColon !== -1 ? token.slice(0, lastColon + 1) : "";
  let util = lastColon !== -1 ? token.slice(lastColon + 1) : token;

  // Strip Tailwind's `!` important modifier so `!p-4` deduplicates against `p-2`
  if (util.startsWith("!")) {
    util = util.slice(1);
  }

  return [prefix, util];
}

/**
 * Returns a property group key for common Tailwind classes so conflicting
 * properties can be deduplicated (e.g. text-red-500 replacing text-white).
 */
export function computeUtilityKey(token: string): string | null {
  const [prefix, m] = splitPrefixAndUtil(token);

  // 1. Exact-match standalone utilities
  if (DISPLAY_SET.has(m)) return `${prefix}display`;
  if (POSITION_SET.has(m)) return `${prefix}position`;
  if (m === "truncate") return `${prefix}truncate`;
  if (m === "italic" || m === "not-italic") return `${prefix}font-style`;
  if (
    m === "underline" ||
    m === "overline" ||
    m === "line-through" ||
    m === "no-underline"
  ) {
    return `${prefix}text-decoration`;
  }
  if (
    m === "uppercase" ||
    m === "lowercase" ||
    m === "capitalize" ||
    m === "normal-case"
  ) {
    return `${prefix}text-transform`;
  }

  // 2. Spacing (p-*, m-*, space-x-*, etc.)
  const spacingMatch = m.match(SPACING_RE);
  if (spacingMatch) return `${prefix}${spacingMatch[1]}`;

  // 3. Sizing (w-*, h-*, size-*, min-w-*, max-w-*, etc.)
  const sizeMatch = m.match(SIZE_RE);
  if (sizeMatch) return `${prefix}${sizeMatch[1]}`;

  // 4. Inset / Positioning coordinates (inset-*, top-*, left-*, etc.)
  const insetMatch = m.match(INSET_RE);
  if (insetMatch) return `${prefix}${insetMatch[1]}`;

  // 5. Typography (`text-*`, `font-*`, `leading-*`, `tracking-*`)
  if (m.startsWith("text-")) {
    const val = m.slice(5);
    if (TEXT_SIZE_RE.test(val)) return `${prefix}text-size`;
    if (TEXT_ALIGN_SET.has(val)) return `${prefix}text-align`;
    if (TEXT_WRAP_SET.has(val)) return `${prefix}text-wrap`;
    return `${prefix}text-color`;
  }

  if (m.startsWith("font-")) {
    const val = m.slice(5);
    return FONT_WEIGHT_SET.has(val)
      ? `${prefix}font-weight`
      : `${prefix}font-family`;
  }

  if (m.startsWith("leading-")) return `${prefix}leading`;
  if (m.startsWith("tracking-")) return `${prefix}tracking`;
  if (m.startsWith("align-")) return `${prefix}vertical-align`;

  // 6. Backgrounds (`bg-*`)
  if (m.startsWith("bg-")) {
    const val = m.slice(3);
    if (BG_SIZE_SET.has(val) || val.startsWith("size:"))
      return `${prefix}bg-size`;
    if (BG_ATTACHMENT_SET.has(val)) return `${prefix}bg-attachment`;
    if (BG_POSITION_SET.has(val) || val.startsWith("position:"))
      return `${prefix}bg-position`;
    if (BG_REPEAT_RE.test(val)) return `${prefix}bg-repeat`;
    if (BG_GRADIENT_RE.test(val)) return `${prefix}bg-image`;
    return `${prefix}bg-color`;
  }

  // 7. Borders (`border`, `border-*`, `rounded-*`)
  if (m === "border") return `${prefix}border-width`;
  if (m.startsWith("border-")) {
    const val = m.slice(7);
    if (BORDER_STYLE_SET.has(val)) return `${prefix}border-style`;
    const dirMatch = val.match(BORDER_DIR_RE);
    if (dirMatch) {
      const [, dir, rest] = dirMatch;
      const isWidth = !rest || NUMERIC_OR_LENGTH_RE.test(rest);
      return `${prefix}border-${dir}-${isWidth ? "width" : "color"}`;
    }
    if (NUMERIC_OR_LENGTH_RE.test(val)) return `${prefix}border-width`;
    return `${prefix}border-color`;
  }

  if (m === "rounded" || m.startsWith("rounded-")) {
    const s = m.match(ROUNDED_DIR_RE);
    return `${prefix}rounded${s ? `-${s[1]}` : ""}`;
  }

  // 8. Rings (`ring`, `ring-*`)
  if (m === "ring" || m.startsWith("ring-")) {
    const val = m === "ring" ? "" : m.slice(5);
    if (val === "inset") return `${prefix}ring-inset`;
    if (!val || NUMERIC_OR_LENGTH_RE.test(val)) return `${prefix}ring-width`;
    if (val.startsWith("offset-")) {
      return NUMERIC_OR_LENGTH_RE.test(val.slice(7))
        ? `${prefix}ring-offset-width`
        : `${prefix}ring-offset-color`;
    }
    return `${prefix}ring-color`;
  }

  // 9. Flexbox & Grid
  if (m.startsWith("flex-")) {
    const val = m.slice(5);
    if (
      val === "row" ||
      val === "col" ||
      val === "row-reverse" ||
      val === "col-reverse"
    ) {
      return `${prefix}flex-direction`;
    }
    if (val === "wrap" || val === "nowrap" || val === "wrap-reverse") {
      return `${prefix}flex-wrap`;
    }
    if (val === "1" || val === "auto" || val === "initial" || val === "none") {
      return `${prefix}flex`;
    }
  }
  if (m === "shrink" || m.startsWith("shrink-")) return `${prefix}shrink`;
  if (m === "grow" || m.startsWith("grow-")) return `${prefix}grow`;
  if (m.startsWith("basis-")) return `${prefix}basis`;
  if (m.startsWith("items-")) return `${prefix}items`;
  if (m.startsWith("justify-")) return `${prefix}justify`;
  if (m.startsWith("self-")) return `${prefix}self`;
  if (m.startsWith("content-")) return `${prefix}content`;
  if (m.startsWith("grid-cols-")) return `${prefix}grid-cols`;
  if (m.startsWith("grid-rows-")) return `${prefix}grid-rows`;
  if (m.startsWith("col-span-")) return `${prefix}col-span`;
  if (m.startsWith("row-span-")) return `${prefix}row-span`;
  if (m.startsWith("gap-")) {
    return `${prefix}gap${m.startsWith("gap-x-") ? "-x" : m.startsWith("gap-y-") ? "-y" : ""}`;
  }

  // 10. Effects, Layout & Interactivity
  if (m === "shadow" || m.startsWith("shadow-")) return `${prefix}shadow`;
  if (m.startsWith("opacity-")) return `${prefix}opacity`;
  if (/^-?z-/.test(m)) return `${prefix}z`;
  if (m.startsWith("overflow-")) {
    return `${prefix}overflow${m.startsWith("overflow-x-") ? "-x" : m.startsWith("overflow-y-") ? "-y" : ""}`;
  }
  if (m.startsWith("object-")) {
    const val = m.slice(7);
    return /^(contain|cover|fill|none|scale-down)$/.test(val)
      ? `${prefix}object-fit`
      : `${prefix}object-position`;
  }
  if (m.startsWith("cursor-")) return `${prefix}cursor`;
  if (m.startsWith("select-")) return `${prefix}select`;
  if (m.startsWith("pointer-events-")) return `${prefix}pointer-events`;
  if (m.startsWith("aspect-")) return `${prefix}aspect`;

  return null;
}

/**
 * Returns a property group key for common Tailwind classes so conflicting
 * properties can be deduplicated (e.g. text-red-500 replacing text-white).
 */
const UTIL_KEY_CACHE_LIMIT = 512;
const utilKeyCache = new Map<string, string | null>();

export function getUtilityKey(token: string): string | null {
  const cached = utilKeyCache.get(token);
  if (cached !== undefined) return cached;

  const key = computeUtilityKey(token); // <-- rename the function above to computeUtilityKey
  if (utilKeyCache.size >= UTIL_KEY_CACHE_LIMIT) {
    const oldest = utilKeyCache.keys().next();
    if (!oldest.done) utilKeyCache.delete(oldest.value);
  }
  utilKeyCache.set(token, key);
  return key;
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

function normalizeVariantValue(val: any): string {
  return val === true ? "true" : val === false ? "false" : String(val);
}

function matchesCompound(
  cv: Record<string, any>,
  mergedProps: Record<string, any>,
): boolean {
  for (const k in cv) {
    if (k === "class" || k === "className") continue;
    const v = cv[k];
    const propVal = mergedProps[k];
    if (propVal === undefined || propVal === null) return false;

    const normProp = normalizeVariantValue(propVal);
    if (Array.isArray(v)) {
      if (!v.some((item) => normalizeVariantValue(item) === normProp)) {
        return false;
      }
    } else if (normalizeVariantValue(v) !== normProp) {
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
 * Internal helper to merge and dedupe raw classes BEFORE escaping,
 * preventing double-escaping when using `extend`.
 */
function mergeRaw(...classes: ClassValue[]): string {
  return dedupeClasses(cx(...classes));
}

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

  // Merge inherited variants, slots, and defaultVariants from `extend`
  const mergedSlots = extend?.slots ? { ...extend.slots, ...slots } : slots;
  const mergedVariants = extend?.variants
    ? { ...extend.variants, ...variants }
    : variants;
  const combinedDefaults = extend?.defaultVariants
    ? { ...extend.defaultVariants, ...defaultVariants }
    : defaultVariants;

  const tvFn = (props: Record<string, any> = {}) => {
    // 1. Build mergedProps: defaults first, then explicit props (ignoring undefined)
    const mergedProps: Record<string, any> = { ...combinedDefaults };
    for (const k in props) {
      if (k !== "class" && k !== "className" && props[k] !== undefined) {
        mergedProps[k] = props[k];
      }
    }

    const propLevelExtra = cx(props.class, props.className);

    // Call raw evaluation on extended parent so tokens aren't escaped prematurely
    const baseResult =
      typeof extend?.__raw === "function"
        ? extend.__raw(mergedProps)
        : typeof extend === "function"
          ? extend(mergedProps)
          : undefined;

    const hasSlots = Boolean(
      mergedSlots ||
      (baseResult &&
        typeof baseResult === "object" &&
        !Array.isArray(baseResult)),
    );

    // Determine deterministic variant key order (config order first, then any extra keys)
    const variantKeys = Array.from(
      new Set([...Object.keys(mergedVariants), ...Object.keys(mergedProps)]),
    );

    if (hasSlots) {
      const buildSlotMap = (escapeOutput: boolean) => {
        const slotResults: Record<
          string,
          (opts?: TVClassProp | string) => string
        > = {};
        const slotNames = new Set([
          ...(base ? ["root"] : []),
          ...Object.keys(mergedSlots || {}),
          ...(baseResult && typeof baseResult === "object"
            ? Object.keys(baseResult)
            : []),
        ]);

        for (const slot of slotNames) {
          const classes: ClassValue[] = [];

          if (slot === "root" && base) classes.push(base);
          if (mergedSlots?.[slot]) classes.push(mergedSlots[slot]);

          for (const varKey of variantKeys) {
            const varVal = mergedProps[varKey];
            if (varVal === undefined || varVal === null) continue;
            const varConfig =
              mergedVariants[varKey]?.[normalizeVariantValue(varVal)];

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
            const rawMerged = mergeRaw(
              inherited,
              slotBaseStr,
              resolveExtraOpts(opts),
            );
            return escapeOutput ? escapeClass(rawMerged) : rawMerged;
          };
        }
        return slotResults;
      };

      return buildSlotMap(true);
    }

    // Single-element (no slots)
    const buildSingle = (escapeOutput: boolean) => {
      const classes: ClassValue[] = [];
      if (base) classes.push(base);

      for (const varKey of variantKeys) {
        const varVal = mergedProps[varKey];
        if (varVal === undefined || varVal === null) continue;
        const varConfig =
          mergedVariants[varKey]?.[normalizeVariantValue(varVal)];
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
        const rawMerged = mergeRaw(inherited, baseStr, resolveExtraOpts(opts));
        return escapeOutput ? escapeClass(rawMerged) : rawMerged;
      };
    };

    return buildSingle(true);
  };

  // Expose an unescaped runner so child `extend` calls can deduplicate accurately
  tvFn.__raw = (props: Record<string, any> = {}) => {
    // Same evaluation without running `escapeClass` yet
    const mergedProps: Record<string, any> = { ...combinedDefaults };
    for (const k in props) {
      if (k !== "class" && k !== "className" && props[k] !== undefined) {
        mergedProps[k] = props[k];
      }
    }
    const propLevelExtra = cx(props.class, props.className);
    const baseResult =
      typeof extend?.__raw === "function"
        ? extend.__raw(mergedProps)
        : undefined;

    const hasSlots = Boolean(
      mergedSlots ||
      (baseResult &&
        typeof baseResult === "object" &&
        !Array.isArray(baseResult)),
    );
    const variantKeys = Array.from(
      new Set([...Object.keys(mergedVariants), ...Object.keys(mergedProps)]),
    );

    if (hasSlots) {
      const slotResults: Record<
        string,
        (opts?: TVClassProp | string) => string
      > = {};
      const slotNames = new Set([
        ...(base ? ["root"] : []),
        ...Object.keys(mergedSlots || {}),
        ...(baseResult && typeof baseResult === "object"
          ? Object.keys(baseResult)
          : []),
      ]);
      for (const slot of slotNames) {
        const classes: ClassValue[] = [];
        if (slot === "root" && base) classes.push(base);
        if (mergedSlots?.[slot]) classes.push(mergedSlots[slot]);
        for (const varKey of variantKeys) {
          const varVal = mergedProps[varKey];
          if (varVal === undefined || varVal === null) continue;
          const varConfig =
            mergedVariants[varKey]?.[normalizeVariantValue(varVal)];
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
        if (slot === "root" && propLevelExtra) classes.push(propLevelExtra);
        const slotBaseStr = cx(...classes);
        slotResults[slot] = (opts?: TVClassProp | string) => {
          const inherited =
            baseResult && typeof baseResult[slot] === "function"
              ? baseResult[slot]()
              : "";
          return mergeRaw(inherited, slotBaseStr, resolveExtraOpts(opts));
        };
      }
      return slotResults;
    }

    const classes: ClassValue[] = [];
    if (base) classes.push(base);
    for (const varKey of variantKeys) {
      const varVal = mergedProps[varKey];
      if (varVal === undefined || varVal === null) continue;
      const varConfig = mergedVariants[varKey]?.[normalizeVariantValue(varVal)];
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
      return mergeRaw(inherited, baseStr, resolveExtraOpts(opts));
    };
  };

  tvFn.slots = mergedSlots;
  tvFn.variants = mergedVariants;
  tvFn.defaultVariants = combinedDefaults;

  return tvFn;
}
