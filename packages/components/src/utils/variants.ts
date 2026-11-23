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

export interface TVConfigInternal {
  base?: ClassValue;
  slots?: Record<string, ClassValue>;
  variants: TVVariants;
  compoundVariants: TVCompoundVariant<any, any>[];
  defaultVariants: Record<string, any>;
}

export interface TVFn<S extends TVSlots = {}, V extends TVVariants = {}> {
  (
    props?: TVVariantProps<V> & TVClassProp & Record<string, any>,
  ): keyof S extends never
    ? (opts?: TVClassProp | string) => string
    : TVSlotFns<S>;
  slots: S;
  variants: V;
  defaultVariants: { [K in keyof V]?: StringToBoolean<keyof V[K]> };
  __config: TVConfigInternal;
}

export type VariantProps<T extends (...args: any[]) => any> =
  T extends TVFn<any, infer V>
    ? TVVariantProps<V>
    : T extends (props?: infer P) => any
      ? Omit<NonNullable<P>, "class" | "className">
      : Record<string, any>;

export function cx(...args: ClassValue[]): string {
  let str = "";
  for (let i = 0; i < args.length; i++) {
    const val = args[i];
    if (!val || typeof val === "boolean") continue;
    if (
      typeof val === "string" ||
      typeof val === "number" ||
      typeof val === "bigint"
    ) {
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

const SAFE_CLASS = /^[A-Za-z_][\w-]*$/;
const WHITESPACE = /\s+/;

const ESC_CHARS = "[]()#!/\\.:%,'\"*&@{}+;<~=>?^`|$";
const ESC_CODES = "bBpPhefrdcvmaqxntkKujlwzgQyios";
const ESCAPE_MAP: Record<string, string> = Object.create(null);
for (let i = 0; i < ESC_CHARS.length; i++) {
  const ch = ESC_CHARS[i];
  if (ch) ESCAPE_MAP[ch] = `_${ESC_CODES[i]}`;
}

function createLruCache<K, V>(limit = 512) {
  const entries = new Map<K, V>();
  return {
    get(key: K): V | undefined {
      const v = entries.get(key);
      if (v !== undefined) {
        entries.delete(key);
        entries.set(key, v);
      }
      return v;
    },
    set(key: K, value: V): void {
      if (entries.has(key)) entries.delete(key);
      else if (entries.size >= limit) {
        const oldest = entries.keys().next();
        if (!oldest.done) entries.delete(oldest.value);
      }
      entries.set(key, value);
    },
  };
}

const tokenCache = createLruCache<string, string>();

function escapeToken(token: string): string {
  if (SAFE_CLASS.test(token)) return token;
  const cached = tokenCache.get(token);
  if (cached !== undefined) return cached;

  let out = "";
  let last = 0;
  const len = token.length;
  for (let i = 0; i < len; i++) {
    const ch = token.charAt(i);
    const rep = ESCAPE_MAP[ch];
    if (rep !== undefined) {
      if (last !== i) out += token.slice(last, i);
      out += rep;
      last = i + 1;
    } else if (i === 0) {
      const c0 = token.charCodeAt(0);
      const c1 = token.charCodeAt(1);
      if (
        (c0 >= 48 && c0 <= 57) ||
        (ch === "-" && (len === 1 || (c1 >= 48 && c1 <= 57)))
      ) {
        out += `_${ch}`;
        last = 1;
      }
    }
  }
  const escaped =
    last === 0 ? token : last < len ? out + token.slice(last) : out;
  tokenCache.set(token, escaped);
  return escaped;
}

export function escapeClass(value: string | null | undefined): string {
  if (!value) return "";
  let out = "";
  for (const token of value.split(WHITESPACE)) {
    if (token) out += (out ? " " : "") + escapeToken(token);
  }
  return out;
}

function makeLookup(defs: Record<string, string>): Record<string, string> {
  const map: Record<string, string> = Object.create(null);
  for (const key in defs) {
    const tokens = defs[key];
    if (tokens) for (const token of tokens.split(",")) map[token] = key;
  }
  return map;
}

const EXACT_UTILS = makeLookup({
  display:
    "block,inline-block,inline,flex,inline-flex,grid,inline-grid,contents,list-item,hidden",
  position: "static,fixed,absolute,relative,sticky",
  truncate: "truncate",
  "font-style": "italic,not-italic",
  "text-decoration": "underline,overline,line-through,no-underline",
  "text-transform": "uppercase,lowercase,capitalize,normal-case",
  "border-width": "border",
  rounded: "rounded",
  "ring-width": "ring",
  shrink: "shrink",
  grow: "grow",
  shadow: "shadow",
});

const FONT_WEIGHT =
  /^(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/;
const TEXT_ALIGN = /^(left|center|right|justify|start|end)$/;
const TEXT_WRAP = /^(wrap|nowrap|balance|pretty|ellipsis|clip)$/;
const BG_SIZE = /^(auto|cover|contain)$/;
const BG_ATTACHMENT = /^(fixed|local|scroll)$/;
const BG_POSITION =
  /^(bottom|center|left|left-bottom|left-top|right|right-bottom|right-top|top)$/;
const BORDER_STYLE = /^(solid|dashed|dotted|double|hidden|none)$/;
const FLEX_DIRECTION = /^(row|col|row-reverse|col-reverse)$/;
const FLEX_WRAP = /^(wrap|nowrap|wrap-reverse)$/;
const FLEX = /^(1|auto|initial|none)$/;
const OBJECT_FIT = /^(contain|cover|fill|none|scale-down)$/;

const SHORTHAND_CONFLICTS: Record<string, string[]> = Object.create(null);
const conflictDefs: Record<string, string> = {
  p: "px,py,pt,pr,pb,pl,ps,pe",
  px: "pl,pr,ps,pe",
  py: "pt,pb",
  m: "mx,my,mt,mr,mb,ml,ms,me",
  mx: "ml,mr,ms,me",
  my: "mt,mb",
  size: "w,h",
  inset: "inset-x,inset-y,top,right,bottom,left,start,end",
  "inset-x": "left,right,start,end",
  "inset-y": "top,bottom",
  rounded: "t,r,b,l,s,e,tl,tr,br,bl,ss,se,ee,es".replace(/[^,]+/g, "rounded-$&"),
  "rounded-t": "rounded-tl,rounded-tr",
  "rounded-r": "rounded-tr,rounded-br",
  "rounded-b": "rounded-br,rounded-bl",
  "rounded-l": "rounded-tl,rounded-bl",
  "rounded-s": "rounded-ss,rounded-es",
  "rounded-e": "rounded-se,rounded-ee",
  gap: "gap-x,gap-y",
  overflow: "overflow-x,overflow-y",
  "text-size-leading": "text-size,leading",
  "text-size": "text-size-leading",
};
for (const k in conflictDefs) {
  const v = conflictDefs[k];
  if (v) SHORTHAND_CONFLICTS[k] = v.split(",");
}
for (const kind of ["width", "color"]) {
  SHORTHAND_CONFLICTS[`border-${kind}`] = "x,y,t,r,b,l,s,e"
    .split(",")
    .map((d) => `border-${d}-${kind}`);
  SHORTHAND_CONFLICTS[`border-x-${kind}`] = "l,r,s,e"
    .split(",")
    .map((d) => `border-${d}-${kind}`);
  SHORTHAND_CONFLICTS[`border-y-${kind}`] = [
    `border-t-${kind}`,
    `border-b-${kind}`,
  ];
}

const TEXT_SIZE_RE =
  /^([2-9]?xs|sm|md|base|lg|[2-9]?xl)$|^\[(\d+|length:|var\(--font-size)/;
const NUM_OR_LEN_RE = /^\d+$|^\[(\d+|length:)/;
const DIRECT_PREFIX_RE =
  /^(?:-?([pm][xytrblse]?|space-[xy]|inset(?:-x|-y)?|top|right|bottom|left|start|end|z|translate-[xy])|([wh]|min-[wh]|max-[wh]|size|leading|tracking|basis|items|justify|self|content|grid-cols|grid-rows|col-span|row-span|gap(?:-x|-y)?|opacity|overflow(?:-x|-y)?|cursor|select|pointer-events|aspect|shrink|grow|shadow))-/;
const ROUNDED_DIR_RE = /^rounded-(tl|tr|bl|br|ss|se|ee|es|t|b|l|r|s|e)(?:-|$)/;
const BORDER_DIR_RE = /^(t|b|l|r|x|y|s|e)(?:-(.+))?$/;
const BG_REPEAT_RE = /^(no-)?repeat(-[xy])?$/;
const BG_GRADIENT_RE =
  /^(none|gradient-to-(t|tr|r|br|b|bl|l|tl)|linear-to-|radial|conic)/;

function splitPrefixAndUtil(token: string): [prefix: string, util: string] {
  let depth = 0;
  let lastColon = -1;
  for (let i = 0; i < token.length; i++) {
    const ch = token[i];
    if (ch === "[") depth++;
    else if (ch === "]" && depth > 0) depth--;
    else if (ch === ":" && depth === 0) lastColon = i;
  }
  const prefix = lastColon !== -1 ? token.slice(0, lastColon + 1) : "";
  let util = lastColon !== -1 ? token.slice(lastColon + 1) : token;
  if (util.startsWith("!")) util = util.slice(1);
  if (util.endsWith("!")) util = util.slice(0, -1);
  return [prefix, util];
}

export function computeUtilityKey(token: string): string | null {
  const [prefix, m] = splitPrefixAndUtil(token);

  // 1. O(1) exact utility match
  const exact = EXACT_UTILS[m];
  if (exact) return `${prefix}${exact}`;

  // 2. Unified regex for spacing, sizing, inset, flex/grid & layout prefixes
  const direct = m.match(DIRECT_PREFIX_RE);
  if (direct) return `${prefix}${direct[1] || direct[2]}`;

  // 3. Typography
  if (m.startsWith("text-")) {
    const val = m.slice(5);
    const slash = val.indexOf("/");
    const base = slash !== -1 ? val.slice(0, slash) : val;
    if (TEXT_SIZE_RE.test(base))
      return `${prefix}${slash !== -1 ? "text-size-leading" : "text-size"}`;
    if (TEXT_ALIGN.test(base)) return `${prefix}text-align`;
    if (TEXT_WRAP.test(base)) return `${prefix}text-wrap`;
    return `${prefix}text-color`;
  }
  if (m.startsWith("font-")) {
    return `${prefix}${FONT_WEIGHT.test(m.slice(5)) ? "font-weight" : "font-family"}`;
  }
  if (m.startsWith("align-")) return `${prefix}vertical-align`;

  // 4. Backgrounds
  if (m.startsWith("bg-")) {
    const val = m.slice(3);
    if (BG_SIZE.test(val)) return `${prefix}bg-size`;
    if (BG_ATTACHMENT.test(val)) return `${prefix}bg-attachment`;
    if (BG_POSITION.test(val)) return `${prefix}bg-position`;
    if (val.startsWith("size:")) return `${prefix}bg-size`;
    if (val.startsWith("position:")) return `${prefix}bg-position`;
    if (BG_REPEAT_RE.test(val)) return `${prefix}bg-repeat`;
    if (BG_GRADIENT_RE.test(val)) return `${prefix}bg-image`;
    return `${prefix}bg-color`;
  }

  // 5. Borders & Rounded
  if (m.startsWith("border-")) {
    const val = m.slice(7);
    if (BORDER_STYLE.test(val)) return `${prefix}border-style`;
    const dir = val.match(BORDER_DIR_RE);
    if (dir) {
      return `${prefix}border-${dir[1]}-${!dir[2] || NUM_OR_LEN_RE.test(dir[2]) ? "width" : "color"}`;
    }
    return `${prefix}${NUM_OR_LEN_RE.test(val) ? "border-width" : "border-color"}`;
  }
  if (m.startsWith("rounded-")) {
    const s = m.match(ROUNDED_DIR_RE);
    return `${prefix}rounded${s ? `-${s[1]}` : ""}`;
  }

  // 6. Rings, Flex & Object
  if (m.startsWith("ring-")) {
    const val = m.slice(5);
    if (val === "inset") return `${prefix}ring-inset`;
    if (NUM_OR_LEN_RE.test(val)) return `${prefix}ring-width`;
    if (val.startsWith("offset-")) {
      return `${prefix}ring-offset-${NUM_OR_LEN_RE.test(val.slice(7)) ? "width" : "color"}`;
    }
    return `${prefix}ring-color`;
  }
  if (m.startsWith("flex-")) {
    const val = m.slice(5);
    if (FLEX_DIRECTION.test(val)) return `${prefix}flex-direction`;
    if (FLEX_WRAP.test(val)) return `${prefix}flex-wrap`;
    if (FLEX.test(val)) return `${prefix}flex`;
  }
  if (m.startsWith("object-")) {
    return `${prefix}${OBJECT_FIT.test(m.slice(7)) ? "object-fit" : "object-position"}`;
  }

  return null;
}

const utilKeyCache = createLruCache<string, string | null>();

export function getUtilityKey(token: string): string | null {
  const cached = utilKeyCache.get(token);
  if (cached !== undefined) return cached;
  const key = computeUtilityKey(token);
  utilKeyCache.set(token, key);
  return key;
}

export function dedupeClasses(
  ...inputs: (string | null | undefined)[]
): string {
  const tokens: string[] = [];
  const keyToIndex = new Map<string, number>();

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (!input) continue;
    for (const token of input.split(WHITESPACE)) {
      if (!token) continue;
      const fullKey = getUtilityKey(token);
      if (fullKey) {
        const prev = keyToIndex.get(fullKey);
        if (prev !== undefined) tokens[prev] = "";
        keyToIndex.set(fullKey, tokens.length);

        const colon = fullKey.lastIndexOf(":");
        const prefix = colon !== -1 ? fullKey.slice(0, colon + 1) : "";
        const prop = colon !== -1 ? fullKey.slice(colon + 1) : fullKey;
        const conflicts = SHORTHAND_CONFLICTS[prop];
        if (conflicts) {
          for (let j = 0; j < conflicts.length; j++) {
            const cKey = `${prefix}${conflicts[j]}`;
            const cIdx = keyToIndex.get(cKey);
            if (cIdx !== undefined) {
              tokens[cIdx] = "";
              keyToIndex.delete(cKey);
            }
          }
        }
      }
      tokens.push(token);
    }
  }
  return tokens.filter(Boolean).join(" ");
}

export function cn(...classes: ClassValue[]): string {
  return escapeClass(dedupeClasses(cx(...classes)));
}

const normVal = (v: unknown): string => String(v);

function resolveExtraOpts(opts?: TVClassProp | string): string {
  return !opts
    ? ""
    : typeof opts === "string"
      ? opts
      : cx(opts.class, opts.className);
}

function isSlotRecord(
  val: unknown,
  slotNames: Set<string>,
): val is Record<string, ClassValue> {
  if (!val || typeof val !== "object" || Array.isArray(val)) return false;
  for (const k in val as Record<string, unknown>) {
    if (slotNames.has(k)) return true;
  }
  return false;
}

function mergeVariantConfigs(
  parent: TVVariants | undefined,
  child: TVVariants | undefined,
  slotNames: Set<string>,
  primarySlot: string,
): TVVariants {
  if (!parent) return child ? { ...child } : {};
  if (!child) return { ...parent };
  const out: TVVariants = { ...parent };

  for (const varKey in child) {
    const pGroup = parent[varKey];
    const cGroup = child[varKey];
    if (!pGroup) {
      if (cGroup) out[varKey] = cGroup;
      continue;
    }
    const merged: Record<string, any> = { ...pGroup };
    for (const opt in cGroup) {
      const pVal = pGroup[opt];
      const cVal = cGroup[opt];
      if (pVal === undefined) {
        merged[opt] = cVal;
        continue;
      }
      const pSlots = isSlotRecord(pVal, slotNames);
      const cSlots = isSlotRecord(cVal, slotNames);

      if (pSlots && cSlots) {
        const sMap: Record<string, ClassValue> = { ...pVal };
        for (const s in cVal) sMap[s] = pVal[s] ? [pVal[s], cVal[s]] : cVal[s];
        merged[opt] = sMap;
      } else if (pSlots) {
        merged[opt] = {
          ...pVal,
          [primarySlot]: pVal[primarySlot] ? [pVal[primarySlot], cVal] : cVal,
        };
      } else if (cSlots) {
        merged[opt] = {
          ...cVal,
          [primarySlot]: cVal[primarySlot] ? [pVal, cVal[primarySlot]] : pVal,
        };
      } else {
        merged[opt] = [pVal, cVal];
      }
    }
    out[varKey] = merged;
  }
  return out;
}

type TVSlotResolver = (opts?: TVClassProp | string) => string;
type TVOutput = TVSlotResolver | Record<string, TVSlotResolver>;

function makeSlotFn(raw: string): TVSlotResolver {
  const escaped = escapeClass(raw);
  return (opts?: TVClassProp | string): string => {
    const extra = resolveExtraOpts(opts);
    return extra ? escapeClass(dedupeClasses(raw, extra)) : escaped;
  };
}

export function tv<S extends TVSlots = {}, V extends TVVariants = {}>(
  config: TVOptions<S, V>,
): TVFn<S, V>;
export function tv<T = Record<string, (opts?: any) => string>>(
  config: any,
): (props?: any) => T;
export function tv(config: any): any {
  const {
    name: componentName,
    base,
    slots,
    variants = {},
    compoundVariants = [],
    defaultVariants = {},
    extend,
  } = config || {};
  const parent: TVConfigInternal | undefined = extend?.__config;

  const baseBase: ClassValue =
    parent?.base && base ? [parent.base, base] : (base ?? parent?.base);

  let baseSlots: Record<string, ClassValue> | undefined;
  if (parent?.slots || slots) {
    baseSlots = parent?.slots ? { ...parent.slots } : {};
    for (const s in slots) {
      baseSlots[s] = baseSlots[s] ? [baseSlots[s], slots[s]] : slots[s];
    }
  }

  const baseHasSlots = Boolean(baseSlots && Object.keys(baseSlots).length > 0);
  const primarySlot =
    baseSlots && "base" in baseSlots && !("root" in baseSlots)
      ? "base"
      : "root";
  const baseSlotNames = new Set<string>(
    baseHasSlots
      ? [
          ...(baseBase ? [primarySlot] : []),
          ...Object.keys(baseSlots ?? {}),
        ]
      : [primarySlot],
  );

  const baseVariants: TVVariants = parent?.variants
    ? mergeVariantConfigs(
        parent.variants,
        variants,
        baseSlotNames,
        primarySlot,
      )
    : variants;
  const baseCompounds: TVCompoundVariant<any, any>[] = parent?.compoundVariants
    ? [...parent.compoundVariants, ...compoundVariants]
    : [...compoundVariants];
  const baseDefaults: Record<string, any> = parent?.defaultVariants
    ? { ...parent.defaultVariants, ...defaultVariants }
    : { ...defaultVariants };

  const baseDeclaredKeys = Object.keys(baseVariants);
  const cache = createLruCache<string, TVOutput>();

  type OverrideClassEntry = ClassValue | ((prev: string) => string);

  let hasSlots = baseHasSlots;
  let slotNames = new Set<string>(baseSlotNames);
  let declaredKeys = baseDeclaredKeys;
  let combinedDefaults: Record<string, any> = baseDefaults;

  let globalBaseOverrides: OverrideClassEntry[] = [];
  let globalSlotOverrides: Record<string, OverrideClassEntry[]> = {};
  let globalVariants: TVVariants = {};
  let globalCompounds: TVCompoundVariant<any, any>[] = [];

  const camelComponentName =
    typeof componentName === "string"
      ? componentName.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
      : undefined;
  const kebabComponentName =
    typeof componentName === "string"
      ? componentName
          .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
          .toLowerCase()
      : undefined;

  let appliedGlobalConfigRef: unknown = undefined;
  let appliedCompRef: unknown = undefined;
  let appliedUiRef: unknown = undefined;
  let configGen = 0;

  const lookupOverride = (
    map: Record<string, any> | undefined,
    prefix: string,
  ): Record<string, any> | undefined => {
    if (!map || typeof map !== "object" || !componentName) return undefined;
    const direct =
      map[componentName] ??
      (camelComponentName ? map[camelComponentName] : undefined) ??
      (kebabComponentName ? map[kebabComponentName] : undefined);
    if (direct && typeof direct === "object") return direct;
    if (kebabComponentName) {
      const prefixed =
        map[`${prefix}-${kebabComponentName}`] ??
        map[`c-${kebabComponentName}`] ??
        map[`cui-${kebabComponentName}`];
      if (prefixed && typeof prefixed === "object") return prefixed;
    }
    return undefined;
  };

  const applyOverrideEntry = (ov: Record<string, any> | undefined): void => {
    if (!ov || typeof ov !== "object") return;

    if (ov.base !== undefined) {
      globalBaseOverrides.push(ov.base);
    }

    const slotOverrides =
      ov.slots && typeof ov.slots === "object" && ov.ui && typeof ov.ui === "object"
        ? { ...ov.ui, ...ov.slots }
        : (ov.slots && typeof ov.slots === "object" ? ov.slots : undefined) ??
          (ov.ui && typeof ov.ui === "object" ? ov.ui : undefined);

    if (slotOverrides) {
      for (const s in slotOverrides) {
        const val = slotOverrides[s];
        if (val === undefined) continue;
        if (!globalSlotOverrides[s]) globalSlotOverrides[s] = [];
        globalSlotOverrides[s].push(val);
        slotNames.add(s);
      }
      hasSlots = baseHasSlots || Object.keys(globalSlotOverrides).length > 0;
    }

    if (ov.variants && typeof ov.variants === "object") {
      globalVariants = mergeVariantConfigs(
        globalVariants,
        ov.variants,
        slotNames,
        primarySlot,
      );
      declaredKeys = Array.from(
        new Set([...baseDeclaredKeys, ...Object.keys(globalVariants)]),
      );
    }

    if (Array.isArray(ov.compoundVariants) && ov.compoundVariants.length > 0) {
      globalCompounds = [...globalCompounds, ...ov.compoundVariants];
    }

    const ovDefaults =
      ov.defaultVariants &&
      typeof ov.defaultVariants === "object" &&
      ov.defaultProps &&
      typeof ov.defaultProps === "object"
        ? { ...ov.defaultProps, ...ov.defaultVariants }
        : (ov.defaultVariants && typeof ov.defaultVariants === "object"
            ? ov.defaultVariants
            : undefined) ??
          (ov.defaultProps && typeof ov.defaultProps === "object"
            ? ov.defaultProps
            : undefined);

    if (ovDefaults) {
      combinedDefaults = { ...combinedDefaults, ...ovDefaults };
    }
  };

  const syncGlobalConfig = (): void => {
    if (!componentName) return;
    const g =
      typeof globalThis !== "undefined"
        ? (globalThis as Record<string, any>).__CODE_UI_GLOBAL_CONFIG__
        : undefined;
    if (
      !g ||
      (g === appliedGlobalConfigRef &&
        g.components === appliedCompRef &&
        g.ui === appliedUiRef)
    ) {
      return;
    }
    appliedGlobalConfigRef = g;
    appliedCompRef = g.components;
    appliedUiRef = g.ui;

    const prefix = typeof g.prefix === "string" && g.prefix ? g.prefix : "cui";
    const uiOv = lookupOverride(g.ui as Record<string, any> | undefined, prefix);
    const compOv = lookupOverride(
      g.components as Record<string, any> | undefined,
      prefix,
    );

    // Reset override layers cleanly from immutable base so HMR / repeated setConfig() never stack
    hasSlots = baseHasSlots;
    slotNames = new Set<string>(baseSlotNames);
    declaredKeys = baseDeclaredKeys;
    combinedDefaults = baseDefaults;
    globalBaseOverrides = [];
    globalSlotOverrides = {};
    globalVariants = {};
    globalCompounds = [];

    if (uiOv || compOv) {
      applyOverrideEntry(uiOv);
      applyOverrideEntry(compOv);
    }
    configGen++;
  };

  const matchCompounds = (
    compounds: TVCompoundVariant<any, any>[],
    mergedProps: Record<string, any>,
  ) =>
    compounds.filter((cv) => {
      for (const k in cv) {
        if (k === "class" || k === "className") continue;
        const propVal = mergedProps[k];
        if (propVal === undefined || propVal === null) return false;
        const normP = normVal(propVal);
        const v = cv[k];
        if (
          Array.isArray(v)
            ? !v.some((i) => normVal(i) === normP)
            : normVal(v) !== normP
        )
          return false;
      }
      return true;
    });

  const applyOverrideValue = (
    current: string,
    val: OverrideClassEntry,
  ): string => {
    if (typeof val === "function") {
      return dedupeClasses(val(current));
    }
    const extra = cx(val);
    return extra ? dedupeClasses(current, extra) : current;
  };

  const build = (
    mergedProps: Record<string, any>,
    propExtra: string,
  ): TVOutput => {
    const variantKeys = Array.from(
      new Set([...declaredKeys, ...Object.keys(mergedProps)]),
    );
    const activeBaseCompounds = matchCompounds(baseCompounds, mergedProps);
    const activeGlobalCompounds =
      globalCompounds.length > 0
        ? matchCompounds(globalCompounds, mergedProps)
        : [];
    const hasGlobalVariants = Object.keys(globalVariants).length > 0;

    const buildSlotRaw = (slot: string): string => {
      const classes: ClassValue[] = [];
      if (slot === primarySlot && baseBase) classes.push(baseBase);
      if (baseSlots?.[slot]) classes.push(baseSlots[slot]);

      for (let i = 0; i < variantKeys.length; i++) {
        const key = variantKeys[i];
        if (key === undefined) continue;
        const val = mergedProps[key];
        if (val === undefined || val === null) continue;
        const vCfg = baseVariants[key]?.[normVal(val)];
        if (!vCfg) continue;
        if (hasSlots && isSlotRecord(vCfg, slotNames)) {
          if (vCfg[slot]) classes.push(vCfg[slot]);
        } else if (slot === primarySlot) {
          classes.push(vCfg);
        }
      }

      for (let i = 0; i < activeBaseCompounds.length; i++) {
        const compound = activeBaseCompounds[i];
        if (!compound) continue;
        const cvClass = compound.class || compound.className;
        if (hasSlots && isSlotRecord(cvClass, slotNames)) {
          if (cvClass[slot]) classes.push(cvClass[slot]);
        } else if (slot === primarySlot) {
          classes.push(cvClass);
        }
      }

      let resolved = dedupeClasses(cx(...classes));

      // Apply global config overrides AFTER built-in variants & compoundVariants
      // so `components.<name>.slots` cleanly overrides variant defaults (e.g. toast.variants.mode.default)
      if (slot === primarySlot && globalBaseOverrides.length > 0) {
        for (let i = 0; i < globalBaseOverrides.length; i++) {
          const ov = globalBaseOverrides[i];
          if (ov !== undefined) resolved = applyOverrideValue(resolved, ov);
        }
      }

      const slotOvs = globalSlotOverrides[slot];
      if (slotOvs && slotOvs.length > 0) {
        for (let i = 0; i < slotOvs.length; i++) {
          const ov = slotOvs[i];
          if (ov !== undefined) resolved = applyOverrideValue(resolved, ov);
        }
      }

      if (hasGlobalVariants) {
        for (let i = 0; i < variantKeys.length; i++) {
          const key = variantKeys[i];
          if (key === undefined) continue;
          const val = mergedProps[key];
          if (val === undefined || val === null) continue;
          const vCfg = globalVariants[key]?.[normVal(val)];
          if (!vCfg) continue;
          if (hasSlots && isSlotRecord(vCfg, slotNames)) {
            const ov = vCfg[slot] as OverrideClassEntry | undefined;
            if (ov !== undefined) resolved = applyOverrideValue(resolved, ov);
          } else if (slot === primarySlot) {
            resolved = applyOverrideValue(
              resolved,
              vCfg as OverrideClassEntry,
            );
          }
        }
      }

      for (let i = 0; i < activeGlobalCompounds.length; i++) {
        const compound = activeGlobalCompounds[i];
        if (!compound) continue;
        const cvClass = compound.class || compound.className;
        if (hasSlots && isSlotRecord(cvClass, slotNames)) {
          if (cvClass[slot]) {
            resolved = applyOverrideValue(resolved, cvClass[slot]);
          }
        } else if (slot === primarySlot && cvClass) {
          resolved = applyOverrideValue(resolved, cvClass);
        }
      }

      if (slot === primarySlot && propExtra) {
        resolved = dedupeClasses(resolved, propExtra);
      }

      return resolved;
    };

    if (!hasSlots) return makeSlotFn(buildSlotRaw(primarySlot));

    const out: Record<string, TVSlotResolver> = {};
    for (const slot of slotNames) out[slot] = makeSlotFn(buildSlotRaw(slot));
    return out;
  };

  const tvFn = (props: Record<string, any> = {}): TVOutput => {
    syncGlobalConfig();
    const mergedProps: Record<string, any> = { ...combinedDefaults };
    for (const k in props) {
      if (
        k !== "class" &&
        k !== "className" &&
        props[k] !== undefined &&
        props[k] !== ""
      ) {
        mergedProps[k] = props[k];
      }
    }
    const propExtra = cx(props.class, props.className);

    const keys = Object.keys(mergedProps);
    let cacheKey = `${configGen}|`;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k === undefined) continue;
      const v = normVal(mergedProps[k]);
      cacheKey += `${k.length}:${k}=${v.length}:${v};`;
    }
    cacheKey += `|${propExtra.length}:${propExtra}`;

    let entry = cache.get(cacheKey);
    if (!entry) {
      entry = build(mergedProps, propExtra);
      cache.set(cacheKey, entry);
    }
    return entry;
  };

  tvFn.__config = {
    base: baseBase,
    ...(baseSlots ? { slots: baseSlots } : {}),
    variants: baseVariants,
    compoundVariants: baseCompounds,
    defaultVariants: baseDefaults,
  } satisfies TVConfigInternal;

  tvFn.slots = baseSlots;
  tvFn.variants = baseVariants;
  tvFn.defaultVariants = baseDefaults;

  return tvFn;
}
