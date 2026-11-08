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
  /^(?:-?([pm][xytrblse]?|space-[xy]|inset(?:-x|-y)?|top|right|bottom|left|start|end|z)|([wh]|min-[wh]|max-[wh]|size|leading|tracking|basis|items|justify|self|content|grid-cols|grid-rows|col-span|row-span|gap(?:-x|-y)?|opacity|overflow(?:-x|-y)?|cursor|select|pointer-events|aspect|shrink|grow|shadow))-/;
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
    base,
    slots,
    variants = {},
    compoundVariants = [],
    defaultVariants = {},
    extend,
  } = config || {};
  const parent: TVConfigInternal | undefined = extend?.__config;

  const mergedBase: ClassValue =
    parent?.base && base ? [parent.base, base] : (base ?? parent?.base);

  let mergedSlots: Record<string, ClassValue> | undefined;
  if (parent?.slots || slots) {
    mergedSlots = parent?.slots ? { ...parent.slots } : {};
    for (const s in slots) {
      mergedSlots[s] = mergedSlots[s] ? [mergedSlots[s], slots[s]] : slots[s];
    }
  }

  const hasSlots = Boolean(mergedSlots && Object.keys(mergedSlots).length > 0);
  const primarySlot =
    mergedSlots && "base" in mergedSlots && !("root" in mergedSlots)
      ? "base"
      : "root";
  const slotNames = new Set<string>(
    hasSlots
      ? [
          ...(mergedBase ? [primarySlot] : []),
          ...Object.keys(mergedSlots ?? {}),
        ]
      : [primarySlot],
  );

  const mergedVariants = parent?.variants
    ? mergeVariantConfigs(
        parent.variants,
        variants,
        slotNames,
        primarySlot,
      )
    : variants;
  const mergedCompounds = parent?.compoundVariants
    ? [...parent.compoundVariants, ...compoundVariants]
    : [...compoundVariants];
  const combinedDefaults = parent?.defaultVariants
    ? { ...parent.defaultVariants, ...defaultVariants }
    : { ...defaultVariants };

  const declaredKeys = Object.keys(mergedVariants);
  const cache = createLruCache<string, TVOutput>();

  const build = (
    mergedProps: Record<string, any>,
    propExtra: string,
  ): TVOutput => {
    const variantKeys = Array.from(
      new Set([...declaredKeys, ...Object.keys(mergedProps)]),
    );
    const activeCompounds = mergedCompounds.filter((cv) => {
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

    const buildSlotRaw = (slot: string): string => {
      const classes: ClassValue[] = [];
      if (slot === primarySlot && mergedBase) classes.push(mergedBase);
      if (mergedSlots?.[slot]) classes.push(mergedSlots[slot]);

      for (let i = 0; i < variantKeys.length; i++) {
        const key = variantKeys[i];
        if (key === undefined) continue;
        const val = mergedProps[key];
        if (val === undefined || val === null) continue;
        const vCfg = mergedVariants[key]?.[normVal(val)];
        if (!vCfg) continue;
        if (hasSlots && isSlotRecord(vCfg, slotNames)) {
          if (vCfg[slot]) classes.push(vCfg[slot]);
        } else if (slot === primarySlot) {
          classes.push(vCfg);
        }
      }

      for (let i = 0; i < activeCompounds.length; i++) {
        const compound = activeCompounds[i];
        if (!compound) continue;
        const cvClass = compound.class || compound.className;
        if (hasSlots && isSlotRecord(cvClass, slotNames)) {
          if (cvClass[slot]) classes.push(cvClass[slot]);
        } else if (slot === primarySlot) {
          classes.push(cvClass);
        }
      }

      if (slot === primarySlot && propExtra) classes.push(propExtra);
      return dedupeClasses(cx(...classes));
    };

    if (!hasSlots) return makeSlotFn(buildSlotRaw(primarySlot));

    const out: Record<string, TVSlotResolver> = {};
    for (const slot of slotNames) out[slot] = makeSlotFn(buildSlotRaw(slot));
    return out;
  };

  const tvFn = (props: Record<string, any> = {}): TVOutput => {
    const mergedProps: Record<string, any> = { ...combinedDefaults };
    for (const k in props) {
      if (k !== "class" && k !== "className" && props[k] !== undefined)
        mergedProps[k] = props[k];
    }
    const propExtra = cx(props.class, props.className);

    const keys = Object.keys(mergedProps);
    let cacheKey = "";
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
    base: mergedBase,
    ...(mergedSlots ? { slots: mergedSlots } : {}),
    variants: mergedVariants,
    compoundVariants: mergedCompounds,
    defaultVariants: combinedDefaults,
  } satisfies TVConfigInternal;

  tvFn.slots = mergedSlots;
  tvFn.variants = mergedVariants;
  tvFn.defaultVariants = combinedDefaults;

  return tvFn;
}
