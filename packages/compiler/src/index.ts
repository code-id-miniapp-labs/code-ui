export const COMPONENT_SLOTS_MANIFEST: Record<string, readonly string[]> = {
  accordion: ["default"],
  "accordion-item": [
    "default",
    "leading",
    "label",
    "description",
    "trailing",
    "content",
  ],
  "action-sheet": [
    "default",
    "header",
    "title",
    "description",
    "close",
    "actions",
  ],
  app: ["default"],
  avatar: ["default", "icon"],
  "avatar-group": ["default"],
  badge: ["default", "leading", "trailing"],
  banner: [
    "default",
    "leading",
    "badge",
    "caption",
    "title",
    "description",
    "image",
    "close",
    "more",
    "buttonArea",
    "actions",
  ],
  button: ["default", "icon", "leading", "trailing", "loadingIcon"],
  card: ["default", "header", "footer"],
  checkbox: ["default", "indicator", "label", "description"],
  "checkbox-group": ["default", "legend"],
  chip: ["default", "content"],
  divider: ["default", "leading", "trailing"],
  drawer: ["default", "header", "close", "footer"],
  "file-upload": ["default", "icon", "loadingIcon", "title", "description"],
  "floating-menu": ["default", "trigger"],
  form: ["default"],
  "form-field": ["default", "label", "hint", "description", "error", "help"],
  input: ["trailing", "leading", "loadingIcon"],
  modal: [
    "default",
    "trigger",
    "content",
    "header",
    "title",
    "description",
    "close",
    "body",
    "footer",
  ],
  "pin-input": ["label"],
  progress: ["default", "label", "valueText"],
  "pull-down-refresh": ["default", "header", "indicator"],
  "qr-code": ["overlay"],
  radio: ["default", "indicator", "label", "description"],
  "radio-group": ["default", "legend"],
  select: [
    "default",
    "leading",
    "trailing",
    "loadingIcon",
    "value",
    "empty",
    "header",
    "footer",
  ],
  "select-item": ["default", "leading", "label", "description", "trailing"],
  skeleton: ["default"],
  slider: ["label", "value", "thumb"],
  stepper: ["default", "content"],
  "stepper-item": [
    "default",
    "indicator",
    "completedIndicator",
    "title",
    "description",
  ],
  "swipe-cell": ["default", "left", "right"],
  switch: ["default", "thumb", "label", "description", "loadingIcon"],
  tabs: ["default", "listTrailing"],
  "tabs-item": ["default", "leading", "label", "trailing"],
  textarea: ["default", "leading", "trailing", "loadingIcon"],
  toast: ["title", "description", "icon", "close", "actions"],
};

export interface TransformWxmlSlotsOptions {
  /**
   * Component tag prefix.
   * @default "c-"
   */
  prefix?: string;
  /**
   * Custom component slot manifest override/extension.
   */
  componentSlots?: Record<string, readonly string[]>;
  /**
   * Module name for auto-injected `<wxs>` helper when loop-variable slot predicates are used.
   * @default "__cuiSlots"
   */
  wxsModuleName?: string;
}

export interface TransformWxmlSlotsResult {
  code: string;
  hasChanges: boolean;
}

export interface WxmlAttribute {
  name: string;
  value: string | null;
  quote: '"' | "'" | null;
  start: number;
  end: number;
}

export interface WxmlElementNode {
  type: "element";
  tag: string;
  attrs: WxmlAttribute[];
  selfClosing: boolean;
  openStart: number;
  openEnd: number;
  insertPos: number;
  closeEnd: number;
  children: WxmlNode[];
}

export interface WxmlTextNode {
  type: "text";
  content: string;
  start: number;
  end: number;
}

export interface WxmlCommentNode {
  type: "comment";
  content: string;
  start: number;
  end: number;
}

export type WxmlNode = WxmlElementNode | WxmlTextNode | WxmlCommentNode;

function isWhitespace(ch: string | undefined): boolean {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

function isNameChar(ch: string | undefined): boolean {
  if (!ch) return false;
  return (
    ch !== " " &&
    ch !== "\t" &&
    ch !== "\n" &&
    ch !== "\r" &&
    ch !== ">" &&
    ch !== "/" &&
    ch !== "=" &&
    ch !== "<"
  );
}

/**
 * Finds the end of an opening tag `<tag ...>` or `<tag .../>`, ignoring `>` inside
 * quoted attribute values or `{{ ... }}` mustache blocks.
 */
function findOpenTagEnd(source: string, start: number): number {
  let i = start;
  const len = source.length;
  let quote: '"' | "'" | null = null;
  let mustacheDepth = 0;

  while (i < len) {
    const ch = source[i];
    if (quote !== null) {
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (ch === "{" && source[i + 1] === "{") {
        mustacheDepth++;
        i += 2;
        continue;
      }
      if (ch === "}" && source[i + 1] === "}" && mustacheDepth > 0) {
        mustacheDepth--;
        i += 2;
        continue;
      }
      if (ch === quote && mustacheDepth === 0) {
        quote = null;
      }
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      i++;
      continue;
    }

    if (ch === ">") {
      return i;
    }

    i++;
  }

  return -1;
}

function parseAttributes(
  source: string,
  attrStart: number,
  attrEnd: number,
): WxmlAttribute[] {
  const attrs: WxmlAttribute[] = [];
  let i = attrStart;

  while (i < attrEnd) {
    while (i < attrEnd && isWhitespace(source[i])) i++;
    if (i >= attrEnd) break;
    if (source[i] === "/") {
      i++;
      continue;
    }

    const nameStart = i;
    while (i < attrEnd && isNameChar(source[i])) i++;
    const name = source.slice(nameStart, i);
    if (!name) {
      i++;
      continue;
    }

    let wsCursor = i;
    while (wsCursor < attrEnd && isWhitespace(source[wsCursor])) wsCursor++;

    if (wsCursor < attrEnd && source[wsCursor] === "=") {
      i = wsCursor + 1;
      while (i < attrEnd && isWhitespace(source[i])) i++;
      const quoteChar = source[i];
      if (quoteChar === '"' || quoteChar === "'") {
        const quote: '"' | "'" = quoteChar;
        i++;
        const valStart = i;
        let mustacheDepth = 0;
        while (i < attrEnd) {
          const c = source[i];
          if (c === "\\") {
            i += 2;
            continue;
          }
          if (c === "{" && source[i + 1] === "{") {
            mustacheDepth++;
            i += 2;
            continue;
          }
          if (c === "}" && source[i + 1] === "}" && mustacheDepth > 0) {
            mustacheDepth--;
            i += 2;
            continue;
          }
          if (c === quote && mustacheDepth === 0) {
            break;
          }
          i++;
        }
        const value = source.slice(valStart, i);
        if (i < attrEnd && source[i] === quote) i++;
        attrs.push({
          name,
          value,
          quote,
          start: nameStart,
          end: i,
        });
      } else {
        const valStart = i;
        while (
          i < attrEnd &&
          !isWhitespace(source[i]) &&
          source[i] !== ">" &&
          source[i] !== "/"
        ) {
          i++;
        }
        const value = source.slice(valStart, i);
        attrs.push({
          name,
          value,
          quote: null,
          start: nameStart,
          end: i,
        });
      }
    } else {
      attrs.push({
        name,
        value: null,
        quote: null,
        start: nameStart,
        end: i,
      });
    }
  }

  return attrs;
}

/**
 * Parses a WXML template into an AST with exact source offsets.
 */
export function parseWxml(source: string): WxmlNode[] {
  const rootChildren: WxmlNode[] = [];
  const stack: WxmlElementNode[] = [];
  const len = source.length;
  let i = 0;

  const currentChildren = (): WxmlNode[] => {
    const top = stack[stack.length - 1];
    return top ? top.children : rootChildren;
  };

  const pushText = (start: number, end: number) => {
    if (end <= start) return;
    currentChildren().push({
      type: "text",
      content: source.slice(start, end),
      start,
      end,
    });
  };

  while (i < len) {
    const lt = source.indexOf("<", i);
    if (lt === -1) {
      pushText(i, len);
      break;
    }

    if (lt > i) {
      pushText(i, lt);
      i = lt;
    }

    // Comment <!-- ... -->
    if (source.startsWith("<!--", i)) {
      const closeComment = source.indexOf("-->", i + 4);
      const end = closeComment === -1 ? len : closeComment + 3;
      currentChildren().push({
        type: "comment",
        content: source.slice(i + 4, closeComment === -1 ? len : closeComment),
        start: i,
        end,
      });
      i = end;
      continue;
    }

    // Closing tag </tag>
    if (source[i + 1] === "/") {
      const closeGt = source.indexOf(">", i + 2);
      if (closeGt === -1) {
        pushText(i, len);
        break;
      }
      const closeTagName = source.slice(i + 2, closeGt).trim();
      const closeEnd = closeGt + 1;

      // Match the nearest open tag on stack
      let matchIdx = -1;
      for (let s = stack.length - 1; s >= 0; s--) {
        const item = stack[s];
        if (item && item.tag === closeTagName) {
          matchIdx = s;
          break;
        }
      }

      if (matchIdx !== -1) {
        while (stack.length > matchIdx) {
          const popped = stack.pop();
          if (popped) {
            popped.closeEnd = closeEnd;
          }
        }
      }

      i = closeEnd;
      continue;
    }

    // Check if `<` is followed by a valid tag name start
    const firstTagChar = source[i + 1];
    if (
      !firstTagChar ||
      isWhitespace(firstTagChar) ||
      firstTagChar === "=" ||
      firstTagChar === ">" ||
      firstTagChar === "{"
    ) {
      pushText(i, i + 1);
      i += 1;
      continue;
    }

    const gt = findOpenTagEnd(source, i + 1);
    if (gt === -1) {
      pushText(i, len);
      break;
    }

    let nameCursor = i + 1;
    while (nameCursor < gt && isNameChar(source[nameCursor])) {
      nameCursor++;
    }
    const tag = source.slice(i + 1, nameCursor);
    if (!tag) {
      pushText(i, i + 1);
      i += 1;
      continue;
    }

    // Check if self-closing `/>`
    let slashCursor = gt - 1;
    while (slashCursor > i && isWhitespace(source[slashCursor])) {
      slashCursor--;
    }
    const selfClosing = source[slashCursor] === "/";
    const insertPos = selfClosing ? slashCursor : gt;
    const openEnd = gt + 1;
    const attrs = parseAttributes(source, nameCursor, insertPos);

    // Special handling for <wxs> raw content blocks
    if (tag === "wxs" && !selfClosing) {
      const closeWxs = source.indexOf("</wxs>", openEnd);
      const closeEnd = closeWxs === -1 ? len : closeWxs + 6;
      const wxsNode: WxmlElementNode = {
        type: "element",
        tag,
        attrs,
        selfClosing: false,
        openStart: i,
        openEnd,
        insertPos,
        closeEnd,
        children:
          closeWxs > openEnd
            ? [
                {
                  type: "text",
                  content: source.slice(openEnd, closeWxs),
                  start: openEnd,
                  end: closeWxs,
                },
              ]
            : [],
      };
      currentChildren().push(wxsNode);
      i = closeEnd;
      continue;
    }

    const elemNode: WxmlElementNode = {
      type: "element",
      tag,
      attrs,
      selfClosing,
      openStart: i,
      openEnd,
      insertPos,
      closeEnd: openEnd,
      children: [],
    };

    currentChildren().push(elemNode);
    if (!selfClosing) {
      stack.push(elemNode);
    }

    i = openEnd;
  }

  while (stack.length > 0) {
    const unclosed = stack.pop();
    if (unclosed) {
      unclosed.closeEnd = len;
    }
  }

  return rootChildren;
}

function getAttr(
  node: WxmlElementNode,
  name: string,
): WxmlAttribute | undefined {
  for (const attr of node.attrs) {
    if (attr.name === name) return attr;
  }
  return undefined;
}

function escapeSingleQuotes(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/**
 * Converts any double-quoted string literals `"..."` inside a JS/WXML expression
 * into single-quoted `'...'` literals so the expression can be safely embedded
 * inside a double-quoted WXML attribute `slots="{{ { ... } }}"`.
 */
export function normalizeSingleQuotesInExpr(expr: string): string {
  let out = "";
  let i = 0;
  const len = expr.length;

  while (i < len) {
    const ch = expr[i];
    if (ch === "'") {
      out += "'";
      i++;
      while (i < len) {
        const c = expr[i];
        if (c === "\\") {
          out += expr.slice(i, i + 2);
          i += 2;
          continue;
        }
        out += c;
        i++;
        if (c === "'") break;
      }
      continue;
    }

    if (ch === '"') {
      out += "'";
      i++;
      while (i < len) {
        const c = expr[i];
        if (c === "\\") {
          const next = expr[i + 1];
          if (next === '"') {
            out += '"';
          } else {
            out += "\\" + (next ?? "");
          }
          i += 2;
          continue;
        }
        if (c === '"') {
          i++;
          break;
        }
        if (c === "'") {
          out += "\\'";
          i++;
          continue;
        }
        out += c;
        i++;
      }
      out += "'";
      continue;
    }

    out += ch;
    i++;
  }

  return out;
}

interface MustachePart {
  type: "static" | "expr";
  value: string;
}

function splitMustacheParts(raw: string): MustachePart[] {
  const parts: MustachePart[] = [];
  let i = 0;
  const len = raw.length;

  while (i < len) {
    const open = raw.indexOf("{{", i);
    if (open === -1) {
      parts.push({ type: "static", value: raw.slice(i) });
      break;
    }
    if (open > i) {
      parts.push({ type: "static", value: raw.slice(i, open) });
    }

    // Find matching `}}` respecting quotes and nested braces
    let j = open + 2;
    let braceDepth = 0;
    let quote: '"' | "'" | null = null;
    while (j < len) {
      const c = raw[j];
      if (quote !== null) {
        if (c === "\\") {
          j += 2;
          continue;
        }
        if (c === quote) quote = null;
        j++;
        continue;
      }
      if (c === '"' || c === "'") {
        quote = c;
        j++;
        continue;
      }
      if (c === "{") {
        braceDepth++;
        j++;
        continue;
      }
      if (c === "}") {
        if (braceDepth > 0) {
          braceDepth--;
          j++;
          continue;
        }
        if (raw[j + 1] === "}") {
          break;
        }
      }
      j++;
    }

    if (j < len && raw[j] === "}" && raw[j + 1] === "}") {
      const expr = normalizeSingleQuotesInExpr(raw.slice(open + 2, j).trim());
      parts.push({ type: "expr", value: expr });
      i = j + 2;
    } else {
      parts.push({ type: "static", value: raw.slice(open) });
      break;
    }
  }

  return parts;
}

/**
 * Extracts a WXML directive expression from e.g. `wx:if="{{cond}}"`.
 */
function extractDirectiveExpr(attr: WxmlAttribute | undefined): string | null {
  if (!attr) return null;
  if (attr.value === null) return "true";
  const trimmed = attr.value.trim();
  if (!trimmed) return "false";

  const parts = splitMustacheParts(trimmed);
  if (parts.length === 1 && parts[0]?.type === "expr") {
    return parts[0].value || "false";
  }
  const hasExpr = parts.some((p) => p.type === "expr");
  if (!hasExpr) {
    // Static non-empty attribute value without mustache is truthy in WXML
    return "true";
  }

  return parts
    .map((p) =>
      p.type === "static" ? `'${escapeSingleQuotes(p.value)}'` : `(${p.value})`,
    )
    .join(" + ");
}

function mixedAttrToJsExpr(raw: string): string {
  const parts = splitMustacheParts(raw);
  if (parts.length === 0) return "''";
  if (parts.length === 1) {
    const first = parts[0];
    if (!first) return "''";
    return first.type === "expr"
      ? first.value
      : `'${escapeSingleQuotes(first.value)}'`;
  }
  return parts
    .map((p) =>
      p.type === "static" ? `'${escapeSingleQuotes(p.value)}'` : `(${p.value})`,
    )
    .join(" + ");
}

const VALID_IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Converts a slot name (such as `completed-indicator` or `value-text`) into a valid
 * unquoted WXML object literal identifier key (`completedIndicator`, `valueText`).
 * WeChat MiniProgram's WXML compiler (`wcc`) only supports unquoted identifier keys
 * inside `{{ { key: val } }}` object literals.
 */
export function toSlotIdentifierKey(key: string): string {
  if (VALID_IDENTIFIER_RE.test(key)) return key;
  const camel = key
    .replace(/[-_.\s]+([A-Za-z0-9_$])/g, (_, ch: string) => ch.toUpperCase())
    .replace(/[^A-Za-z0-9_$]/g, "");
  if (!camel) return "_slot";
  return /^[0-9]/.test(camel) ? `_${camel}` : camel;
}

export function formatSlotObjectKey(key: string): string {
  return toSlotIdentifierKey(key);
}

function formatSlotPropertyAccess(objExpr: string, key: string): string {
  const ident = toSlotIdentifierKey(key);
  return `${objExpr}.${ident}`;
}

function stripOuterParens(expr: string): string {
  let s = expr.trim();
  while (s.startsWith("(") && s.endsWith(")")) {
    let depth = 0;
    let balanced = true;
    let quote: '"' | "'" | null = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (quote !== null) {
        if (c === "\\") {
          i++;
          continue;
        }
        if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'") {
        quote = c;
        continue;
      }
      if (c === "(") depth++;
      else if (c === ")") {
        depth--;
        if (depth === 0 && i < s.length - 1) {
          balanced = false;
          break;
        }
      }
    }
    if (balanced) {
      s = s.slice(1, -1).trim();
    } else {
      break;
    }
  }
  return s;
}

function isStaticTrue(expr: string | null): boolean {
  if (expr === null) return true;
  const s = stripOuterParens(expr);
  return s === "true" || s === "!false" || s === "!!true";
}

function isStaticFalse(expr: string | null): boolean {
  if (expr === null) return false;
  const s = stripOuterParens(expr);
  return (
    s === "false" ||
    s === "!true" ||
    s === "!!false" ||
    s === "null" ||
    s === "undefined" ||
    s === "0" ||
    s === "''"
  );
}

function negateExpr(expr: string): string {
  const s = stripOuterParens(expr);
  if (s === "true") return "false";
  if (s === "false") return "true";
  if (s.startsWith("!") && !s.startsWith("!!")) {
    const inner = stripOuterParens(s.slice(1));
    if (VALID_IDENTIFIER_RE.test(inner)) {
      return inner;
    }
  }
  return `!(${s})`;
}

function isWrappedUnit(expr: string): boolean {
  if (VALID_IDENTIFIER_RE.test(expr)) return true;
  if (/^[A-Za-z_$][A-Za-z0-9_$.]*\([A-Za-z0-9_$.\s,]*\)$/.test(expr)) {
    return true;
  }
  if (expr.startsWith("!(") && expr.endsWith(")")) {
    const inner = expr.slice(2, -1);
    if (stripOuterParens(`(${inner})`) === inner.trim()) return true;
  }
  return false;
}

function andConditions(a: string | null, b: string | null): string | null {
  if (a === null || isStaticTrue(a)) return b;
  if (b === null || isStaticTrue(b)) return a;
  if (isStaticFalse(a) || isStaticFalse(b)) return "false";
  const sa = stripOuterParens(a);
  const sb = stripOuterParens(b);
  if (sa === sb) return sa;
  const left = isWrappedUnit(sa) ? sa : `(${sa})`;
  const right = isWrappedUnit(sb) ? sb : `(${sb})`;
  return `${left} && ${right}`;
}

export type SlotCondition =
  | { kind: "static"; value: true }
  | { kind: "expr"; expr: string };

function orSlotConditions(
  existing: SlotCondition | undefined,
  incoming: SlotCondition,
): SlotCondition {
  if (!existing) return incoming;
  if (existing.kind === "static" || incoming.kind === "static") {
    return { kind: "static", value: true };
  }
  const a = stripOuterParens(existing.expr);
  const b = stripOuterParens(incoming.expr);
  if (a === b) return existing;
  if (b === negateExpr(a) || a === negateExpr(b)) {
    return { kind: "static", value: true };
  }
  return {
    kind: "expr",
    expr: `(${a}) || (${b})`,
  };
}

function conditionFromExpr(expr: string | null): SlotCondition | null {
  if (expr === null || isStaticTrue(expr)) {
    return { kind: "static", value: true };
  }
  if (isStaticFalse(expr)) {
    return null;
  }
  return { kind: "expr", expr: stripOuterParens(expr) };
}

/**
 * Formats a `SlotCondition` into its WXML object property value expression.
 */
function serializeSlotCondition(cond: SlotCondition): string {
  if (cond.kind === "static") return "true";
  const stripped = stripOuterParens(cond.expr);
  if (stripped === "true" || stripped === "false") return stripped;
  if (
    stripped.startsWith("!!") &&
    !stripped.includes("||") &&
    !stripped.includes("&&")
  ) {
    return stripped;
  }
  return `!!(${stripped})`;
}

interface LoopScope {
  listExpr: string;
  itemVar: string;
  indexVar: string;
  guardCondition: string | null;
}

const JS_KEYWORDS = new Set([
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity",
  "typeof",
  "instanceof",
  "in",
  "new",
  "void",
  "delete",
  "Math",
  "Number",
  "String",
  "Boolean",
  "Object",
  "Array",
  "Date",
  "RegExp",
  "JSON",
  "parseInt",
  "parseFloat",
  "isNaN",
  "isFinite",
]);

/**
 * Extracts top-level root identifiers referenced in a JS expression
 * (excluding property accesses after `.` and string literals).
 */
export function extractReferencedIdentifiers(expr: string): string[] {
  const ids = new Set<string>();
  let i = 0;
  const len = expr.length;
  let afterDot = false;

  while (i < len) {
    const ch = expr[i];
    if (ch === "'" || ch === '"') {
      const q = ch;
      i++;
      while (i < len) {
        if (expr[i] === "\\") {
          i += 2;
          continue;
        }
        if (expr[i] === q) {
          i++;
          break;
        }
        i++;
      }
      afterDot = false;
      continue;
    }

    if (ch === ".") {
      afterDot = true;
      i++;
      continue;
    }

    if (ch && /[A-Za-z_$]/.test(ch)) {
      const start = i;
      i++;
      while (i < len && /[A-Za-z0-9_$]/.test(expr[i] ?? "")) {
        i++;
      }
      const ident = expr.slice(start, i);

      // Skip object literal keys `{ key: val }`
      let ws = i;
      while (ws < len && isWhitespace(expr[ws])) ws++;
      const isObjKey = expr[ws] === ":" && !afterDot;

      if (!afterDot && !isObjKey && !JS_KEYWORDS.has(ident)) {
        ids.add(ident);
      }
      afterDot = false;
      continue;
    }

    if (!isWhitespace(ch)) {
      afterDot = false;
    }
    i++;
  }

  return [...ids];
}

export interface WxsHelperSpec {
  fnName: string;
  code: string;
}

class WxsHelperRegistry {
  private helpers = new Map<string, WxsHelperSpec>();
  private counter = 0;
  readonly moduleName: string;

  constructor(moduleName = "__cuiSlots") {
    this.moduleName = moduleName;
  }

  /**
   * Registers or reuses an ES5 WXS loop predicate helper and returns the WXML call expression.
   */
  registerLoopPredicate(loops: LoopScope[], predicateExpr: string): string {
    const loopVars = new Set<string>();
    for (const loop of loops) {
      loopVars.add(loop.itemVar);
      loopVars.add(loop.indexVar);
    }

    const innerLoops = loops.slice(1);
    const allInnerExprs = [
      predicateExpr,
      ...innerLoops.map((l) => l.listExpr),
      ...innerLoops
        .map((l) => l.guardCondition)
        .filter((g): g is string => g !== null),
    ];

    const freeVarsSet = new Set<string>();
    for (const e of allInnerExprs) {
      for (const id of extractReferencedIdentifiers(e)) {
        if (!loopVars.has(id)) {
          freeVarsSet.add(id);
        }
      }
    }

    const freeVars = [...freeVarsSet];
    const outerListExpr = stripOuterParens(loops[0]?.listExpr ?? "[]");
    const signatureKey = JSON.stringify({
      loops: loops.map((l, idx) => ({
        listExpr: idx === 0 ? "_list0" : l.listExpr,
        itemVar: l.itemVar,
        indexVar: l.indexVar,
        guardCondition: idx === 0 ? null : l.guardCondition,
      })),
      predicateExpr,
      freeVars,
    });

    const callArgs = [outerListExpr, ...freeVars].join(", ");
    const existing = this.helpers.get(signatureKey);
    if (existing) {
      return `${this.moduleName}.${existing.fnName}(${callArgs})`;
    }

    const fnName = `s${this.counter++}`;
    const paramList = ["_list0", ...freeVars];

    let body = `if (${predicateExpr}) return true;`;
    for (let idx = loops.length - 1; idx >= 0; idx--) {
      const loop = loops[idx];
      if (!loop) continue;
      const listRef = idx === 0 ? "_list0" : loop.listExpr;
      const idxVar = `_i${idx}`;
      const lenVar = `_len${idx}`;
      const arrVar = `_arr${idx}`;
      const guardPrefix =
        idx > 0 && loop.guardCondition ? `if (${loop.guardCondition}) { ` : "";
      const guardSuffix = idx > 0 && loop.guardCondition ? " }" : "";

      body =
        `${guardPrefix}var ${arrVar} = ${listRef}; ` +
        `var ${lenVar} = ${arrVar} && ${arrVar}.length ? ${arrVar}.length : (typeof ${arrVar} === 'number' && ${arrVar} > 0 ? ${arrVar} : 0); ` +
        `for (var ${idxVar} = 0; ${idxVar} < ${lenVar}; ${idxVar}++) { ` +
        `var ${loop.indexVar} = ${idxVar}; ` +
        `var ${loop.itemVar} = ${arrVar} && ${arrVar}.length ? ${arrVar}[${idxVar}] : ${idxVar}; ` +
        `${body} ` +
        `}${guardSuffix}`;
    }

    const fnCode = `function ${fnName}(${paramList.join(", ")}) { ${body} return false; }`;
    this.helpers.set(signatureKey, { fnName, code: fnCode });

    return `${this.moduleName}.${fnName}(${callArgs})`;
  }

  hasHelpers(): boolean {
    return this.helpers.size > 0;
  }

  generateWxsBlock(usedInCode?: string): string {
    if (!this.hasHelpers()) return "";
    const fns: string[] = [];
    const exportsEntries: string[] = [];
    for (const spec of this.helpers.values()) {
      if (
        usedInCode !== undefined &&
        !usedInCode.includes(`${this.moduleName}.${spec.fnName}(`)
      ) {
        continue;
      }
      fns.push(spec.code);
      exportsEntries.push(`${spec.fnName}: ${spec.fnName}`);
    }
    if (fns.length === 0) return "";
    return `<wxs module="${this.moduleName}">\n${fns.join("\n")}\nmodule.exports = { ${exportsEntries.join(", ")} };\n</wxs>\n`;
  }
}

interface TernarySlotBranch {
  condition: string | null;
  slotName: string;
}

/**
 * Attempts to decompose a ternary expression like `cond ? 'leading' : 'trailing'`
 * into static slot name branches with their respective conditions.
 * Returns `null` if the expression is not a static-string ternary.
 */
function tryParseTernaryStringLiterals(
  expr: string,
): TernarySlotBranch[] | null {
  const s = stripOuterParens(expr);

  // Single string literal `'foo'`
  if (
    s.length >= 2 &&
    ((s.startsWith("'") && s.endsWith("'")) ||
      (s.startsWith('"') && s.endsWith('"')))
  ) {
    const inner = s.slice(1, -1);
    if (!inner.includes("'") && !inner.includes('"')) {
      return [{ condition: null, slotName: inner }];
    }
  }

  // Find top-level `?` and `:`
  let qPos = -1;
  let colonPos = -1;
  let parenDepth = 0;
  let ternaryDepth = 0;
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote !== null) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") {
      parenDepth++;
      continue;
    }
    if (c === ")" || c === "]" || c === "}") {
      parenDepth--;
      continue;
    }
    if (parenDepth === 0) {
      if (c === "?") {
        if (ternaryDepth === 0 && qPos === -1) {
          qPos = i;
        }
        ternaryDepth++;
      } else if (c === ":") {
        ternaryDepth--;
        if (ternaryDepth === 0 && colonPos === -1) {
          colonPos = i;
          break;
        }
      }
    }
  }

  if (qPos === -1 || colonPos === -1) return null;

  const condPart = s.slice(0, qPos).trim();
  const truePart = s.slice(qPos + 1, colonPos).trim();
  const falsePart = s.slice(colonPos + 1).trim();
  if (!condPart || !truePart || !falsePart) return null;

  const trueBranches = tryParseTernaryStringLiterals(truePart);
  const falseBranches = tryParseTernaryStringLiterals(falsePart);
  if (!trueBranches || !falseBranches) return null;

  const result: TernarySlotBranch[] = [];
  for (const tb of trueBranches) {
    result.push({
      condition: andConditions(condPart, tb.condition),
      slotName: tb.slotName,
    });
  }
  const negCond = negateExpr(condPart);
  for (const fb of falseBranches) {
    result.push({
      condition: andConditions(negCond, fb.condition),
      slotName: fb.slotName,
    });
  }
  return result;
}

interface ChildAnalysisContext {
  condition: string | null;
  activeLoops: LoopScope[];
  inheritedSlot: string | null;
  knownSlots: readonly string[];
  wxsRegistry: WxsHelperRegistry;
}

function wrapWithLoops(
  condExpr: string | null,
  activeLoops: LoopScope[],
  wxsRegistry: WxsHelperRegistry,
): SlotCondition | null {
  if (isStaticFalse(condExpr)) return null;
  if (activeLoops.length === 0) {
    return conditionFromExpr(condExpr);
  }

  const loopVars = new Set<string>();
  for (const loop of activeLoops) {
    loopVars.add(loop.itemVar);
    loopVars.add(loop.indexVar);
  }

  const innerLoopExprs = activeLoops
    .slice(1)
    .flatMap((l) =>
      l.guardCondition ? [l.listExpr, l.guardCondition] : [l.listExpr],
    );
  const allRelevantExprs = condExpr
    ? [condExpr, ...innerLoopExprs]
    : innerLoopExprs;

  const usesLoopVar = allRelevantExprs.some((expr) =>
    extractReferencedIdentifiers(expr).some((id) => loopVars.has(id)),
  );

  if (usesLoopVar) {
    const wxsCall = wxsRegistry.registerLoopPredicate(
      activeLoops,
      condExpr ?? "true",
    );
    const guarded = andConditions(
      activeLoops[0]?.guardCondition ?? null,
      wxsCall,
    );
    return conditionFromExpr(guarded);
  }

  // Pure WXML non-empty loop condition when predicate does not depend on item/index
  let combined: string | null = condExpr;
  for (let i = activeLoops.length - 1; i >= 0; i--) {
    const loop = activeLoops[i];
    if (!loop) continue;
    const listExpr = stripOuterParens(loop.listExpr);
    const safeListRef = /^[A-Za-z_$][A-Za-z0-9_$.[\]]*$/.test(listExpr)
      ? listExpr
      : `(${listExpr})`;
    const nonEmptyExpr = `${safeListRef} && (${safeListRef}.length > 0 || ${safeListRef} > 0)`;
    combined = andConditions(nonEmptyExpr, combined);
    combined = andConditions(loop.guardCondition, combined);
  }

  return conditionFromExpr(combined);
}

function recordSlotActivation(
  targetMap: Map<string, SlotCondition>,
  rawSlotAttr: string | null,
  effectiveCond: string | null,
  ctx: ChildAnalysisContext,
): void {
  const slotSpec = rawSlotAttr ?? ctx.inheritedSlot ?? "default";
  const trimmedSpec = slotSpec.trim() || "default";
  const parts = splitMustacheParts(trimmedSpec);
  const hasExpr = parts.some((p) => p.type === "expr");

  if (!hasExpr) {
    const wrapped = wrapWithLoops(
      effectiveCond,
      ctx.activeLoops,
      ctx.wxsRegistry,
    );
    if (wrapped) {
      targetMap.set(
        trimmedSpec,
        orSlotConditions(targetMap.get(trimmedSpec), wrapped),
      );
    }
    return;
  }

  // Dynamic slot="{{...}}"
  if (parts.length === 1 && parts[0]?.type === "expr") {
    const expr = parts[0].value;
    const ternaryBranches = tryParseTernaryStringLiterals(expr);
    if (ternaryBranches) {
      for (const branch of ternaryBranches) {
        if (!branch.slotName) continue;
        const branchCond = andConditions(effectiveCond, branch.condition);
        const wrapped = wrapWithLoops(
          branchCond,
          ctx.activeLoops,
          ctx.wxsRegistry,
        );
        if (wrapped) {
          targetMap.set(
            branch.slotName,
            orSlotConditions(targetMap.get(branch.slotName), wrapped),
          );
        }
      }
      return;
    }
  }

  const slotJsExpr = mixedAttrToJsExpr(trimmedSpec);
  for (const candidateSlot of ctx.knownSlots) {
    const matchExpr = `(${slotJsExpr}) === '${escapeSingleQuotes(candidateSlot)}'`;
    const combinedCond = andConditions(effectiveCond, matchExpr);
    const wrapped = wrapWithLoops(
      combinedCond,
      ctx.activeLoops,
      ctx.wxsRegistry,
    );
    if (wrapped) {
      targetMap.set(
        candidateSlot,
        orSlotConditions(targetMap.get(candidateSlot), wrapped),
      );
    }
  }
}

/**
 * Computes the set of static slot names that a node activates unconditionally
 * (assuming the node's own entry condition is satisfied).
 */
function collectUnconditionalSlotsFromNodes(
  nodes: WxmlNode[],
  inheritedSlot: string | null,
): Set<string> {
  const out = new Set<string>();
  let chain: { isElse: boolean; slots: Set<string> }[] = [];

  const flush = () => {
    if (chain.length >= 2 && chain[chain.length - 1]?.isElse === true) {
      const first = chain[0];
      if (first) {
        for (const s of first.slots) {
          if (chain.every((b) => b.slots.has(s))) {
            out.add(s);
          }
        }
      }
    }
    chain = [];
  };

  for (const node of nodes) {
    if (node.type === "comment") continue;
    if (node.type === "text") {
      const trimmed = node.content.trim();
      if (!trimmed) continue;
      flush();
      const parts = splitMustacheParts(trimmed);
      const hasStatic = parts.some(
        (p) => p.type === "static" && p.value.trim().length > 0,
      );
      if (hasStatic) {
        const slotSpec = (inheritedSlot ?? "default").trim() || "default";
        if (!splitMustacheParts(slotSpec).some((p) => p.type === "expr")) {
          out.add(slotSpec);
        }
      }
      continue;
    }

    const wxIf = getAttr(node, "wx:if");
    const wxElif = getAttr(node, "wx:elif");
    const wxElse = getAttr(node, "wx:else");

    if (wxIf !== undefined) {
      flush();
      const condExpr = extractDirectiveExpr(wxIf);
      if (isStaticTrue(condExpr)) {
        for (const s of collectUnconditionalSlotsFromElement(
          node,
          inheritedSlot,
        )) {
          out.add(s);
        }
      } else if (!isStaticFalse(condExpr)) {
        chain.push({
          isElse: false,
          slots: collectUnconditionalSlotsFromElement(node, inheritedSlot),
        });
      }
    } else if (wxElif !== undefined && chain.length > 0) {
      const condExpr = extractDirectiveExpr(wxElif);
      if (!isStaticFalse(condExpr)) {
        chain.push({
          isElse: false,
          slots: collectUnconditionalSlotsFromElement(node, inheritedSlot),
        });
      }
    } else if (wxElse !== undefined && chain.length > 0) {
      chain.push({
        isElse: true,
        slots: collectUnconditionalSlotsFromElement(node, inheritedSlot),
      });
      flush();
    } else {
      flush();
      for (const s of collectUnconditionalSlotsFromElement(
        node,
        inheritedSlot,
      )) {
        out.add(s);
      }
    }
  }

  flush();
  return out;
}

function collectUnconditionalSlotsFromElement(
  node: WxmlElementNode,
  inheritedSlot: string | null,
): Set<string> {
  if (
    getAttr(node, "wx:for") !== undefined ||
    getAttr(node, "wx:for-items") !== undefined
  ) {
    return new Set();
  }
  if (node.tag === "slot") {
    return new Set();
  }
  const nodeSlotAttr = getAttr(node, "slot")?.value ?? null;
  if (node.tag === "block") {
    return collectUnconditionalSlotsFromNodes(
      node.children,
      nodeSlotAttr ?? inheritedSlot,
    );
  }
  const slotSpec =
    (nodeSlotAttr ?? inheritedSlot ?? "default").trim() || "default";
  if (splitMustacheParts(slotSpec).some((p) => p.type === "expr")) {
    return new Set();
  }
  return new Set([slotSpec]);
}

function analyzeChildrenIntoMap(
  nodes: WxmlNode[],
  ctx: ChildAnalysisContext,
): Map<string, SlotCondition> {
  const result = new Map<string, SlotCondition>();

  interface ChainBranchRecord {
    rawCondition: string;
    effectiveCondition: string | null;
    isElse: boolean;
    unconditionalSlots: Set<string>;
    slotMap: Map<string, SlotCondition>;
  }

  let currentChain: ChainBranchRecord[] = [];

  const flushChain = () => {
    if (currentChain.length === 0) return;

    const hasElse = currentChain[currentChain.length - 1]?.isElse === true;
    const unanimouslyUnconditionalSlots = new Set<string>();

    if (hasElse && currentChain.length >= 2) {
      const firstBranch = currentChain[0];
      if (firstBranch) {
        for (const slotName of firstBranch.unconditionalSlots) {
          const allHaveUnconditional = currentChain.every((b) =>
            b.unconditionalSlots.has(slotName),
          );
          if (allHaveUnconditional) {
            unanimouslyUnconditionalSlots.add(slotName);
          }
        }
      }
    }

    for (const slotName of unanimouslyUnconditionalSlots) {
      const baseCond = wrapWithLoops(
        ctx.condition,
        ctx.activeLoops,
        ctx.wxsRegistry,
      );
      if (baseCond) {
        result.set(slotName, orSlotConditions(result.get(slotName), baseCond));
      }
    }

    for (const branch of currentChain) {
      for (const [slotName, branchSlotCond] of branch.slotMap.entries()) {
        if (unanimouslyUnconditionalSlots.has(slotName)) continue;

        result.set(
          slotName,
          orSlotConditions(result.get(slotName), branchSlotCond),
        );
      }
    }

    currentChain = [];
  };

  for (const node of nodes) {
    if (node.type === "comment") {
      continue;
    }

    if (node.type === "text") {
      const trimmed = node.content.trim();
      if (!trimmed) {
        continue;
      }

      flushChain();

      const parts = splitMustacheParts(trimmed);
      const hasStaticNonEmpty = parts.some(
        (p) => p.type === "static" && p.value.trim().length > 0,
      );

      if (hasStaticNonEmpty) {
        recordSlotActivation(result, null, ctx.condition, ctx);
      } else {
        const exprParts = parts.filter(
          (p) => p.type === "expr" && p.value.length > 0,
        );
        if (exprParts.length > 0) {
          const nonEmptyChecks = exprParts
            .map(
              (p) =>
                `((${p.value}) !== '' && (${p.value}) !== null && (${p.value}) !== undefined)`,
            )
            .join(" || ");
          const textCond = andConditions(ctx.condition, nonEmptyChecks);
          recordSlotActivation(result, null, textCond, ctx);
        }
      }
      continue;
    }

    // Element node
    const wxIfAttr = getAttr(node, "wx:if");
    const wxElifAttr = getAttr(node, "wx:elif");
    const wxElseAttr = getAttr(node, "wx:else");

    let isChainMember = false;
    let isElseBranch = false;
    let rawBranchCond = "true";
    let priorChainNegated: string | null = null;
    let effectiveBranchCond: string | null = ctx.condition;

    if (wxIfAttr !== undefined) {
      flushChain();
      isChainMember = true;
      rawBranchCond = extractDirectiveExpr(wxIfAttr) ?? "false";
      effectiveBranchCond = andConditions(ctx.condition, rawBranchCond);
    } else if (wxElifAttr !== undefined && currentChain.length > 0) {
      isChainMember = true;
      rawBranchCond = extractDirectiveExpr(wxElifAttr) ?? "false";
      priorChainNegated = currentChain
        .map((b) => negateExpr(b.rawCondition))
        .join(" && ");
      const elifCond = andConditions(priorChainNegated, rawBranchCond);
      effectiveBranchCond = andConditions(ctx.condition, elifCond);
    } else if (wxElseAttr !== undefined && currentChain.length > 0) {
      isChainMember = true;
      isElseBranch = true;
      rawBranchCond = "true";
      priorChainNegated = currentChain
        .map((b) => negateExpr(b.rawCondition))
        .join(" && ");
      effectiveBranchCond = andConditions(ctx.condition, priorChainNegated);
    } else {
      flushChain();
      effectiveBranchCond = ctx.condition;
    }

    // Check wx:for / wx:for-items on this element
    // Note: in WeChat WXML, when `wx:for` and `wx:if` are on the same element,
    // `wx:for` runs first and `wx:if` is evaluated per-item inside the loop scope.
    const wxForAttr = getAttr(node, "wx:for") ?? getAttr(node, "wx:for-items");
    let elementLoops = ctx.activeLoops;
    let innerConditionForElement = effectiveBranchCond;

    if (wxForAttr !== undefined) {
      const listExpr = extractDirectiveExpr(wxForAttr) ?? "[]";
      const itemAttr = getAttr(node, "wx:for-item");
      const indexAttr = getAttr(node, "wx:for-index");
      const itemVar = itemAttr?.value?.trim() || "item";
      const indexVar = indexAttr?.value?.trim() || "index";

      const loopGuard = andConditions(ctx.condition, priorChainNegated);
      elementLoops = [
        ...ctx.activeLoops,
        {
          listExpr,
          itemVar,
          indexVar,
          guardCondition: loopGuard,
        },
      ];
      if (isChainMember && !isElseBranch) {
        innerConditionForElement = rawBranchCond;
      } else {
        innerConditionForElement = null;
      }
    }

    const branchMap = new Map<string, SlotCondition>();
    const nodeSlotAttr = getAttr(node, "slot")?.value ?? null;

    if (node.tag === "block") {
      const childMap = analyzeChildrenIntoMap(node.children, {
        condition: innerConditionForElement,
        activeLoops: elementLoops,
        inheritedSlot: nodeSlotAttr ?? ctx.inheritedSlot,
        knownSlots: ctx.knownSlots,
        wxsRegistry: ctx.wxsRegistry,
      });
      for (const [k, v] of childMap.entries()) {
        branchMap.set(k, orSlotConditions(branchMap.get(k), v));
      }
    } else if (node.tag === "slot") {
      // Forwarding `<slot name="X" slot="Y" />` inside a component's own template
      const forwardedName = getAttr(node, "name")?.value?.trim() || "default";
      const nameParts = splitMustacheParts(forwardedName);
      const isDynamicName = nameParts.some((p) => p.type === "expr");
      const forwardCheckExpr = isDynamicName
        ? `slots && slots[${mixedAttrToJsExpr(forwardedName)}]`
        : `slots && ${formatSlotPropertyAccess("slots", forwardedName)}`;

      const combinedForwardCond = andConditions(
        innerConditionForElement,
        forwardCheckExpr,
      );
      recordSlotActivation(branchMap, nodeSlotAttr, combinedForwardCond, {
        condition: innerConditionForElement,
        activeLoops: elementLoops,
        inheritedSlot: ctx.inheritedSlot,
        knownSlots: ctx.knownSlots,
        wxsRegistry: ctx.wxsRegistry,
      });
    } else {
      recordSlotActivation(branchMap, nodeSlotAttr, innerConditionForElement, {
        condition: innerConditionForElement,
        activeLoops: elementLoops,
        inheritedSlot: ctx.inheritedSlot,
        knownSlots: ctx.knownSlots,
        wxsRegistry: ctx.wxsRegistry,
      });
    }

    if (isChainMember) {
      currentChain.push({
        rawCondition: rawBranchCond,
        effectiveCondition: effectiveBranchCond,
        isElse: isElseBranch,
        unconditionalSlots: collectUnconditionalSlotsFromElement(
          node,
          ctx.inheritedSlot,
        ),
        slotMap: branchMap,
      });
      if (isElseBranch) {
        flushChain();
      }
    } else {
      for (const [k, v] of branchMap.entries()) {
        result.set(k, orSlotConditions(result.get(k), v));
      }
    }
  }

  flushChain();
  return result;
}

/**
 * Parses an existing `slots="{{ { a: true, b: !!(cond) } }}"` attribute value
 * into key -> raw value expression pairs so re-running the transform is idempotent.
 */
function parseExistingSlotsAttr(attr: WxmlAttribute): Map<string, string> {
  const entries = new Map<string, string>();
  if (!attr.value) return entries;
  const expr = extractDirectiveExpr(attr);
  if (!expr) return entries;
  const trimmed = expr.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return entries;
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return entries;

  // Split top-level comma-separated entries
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (quote !== null) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === "," && depth === 0) {
      parts.push(inner.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(inner.slice(start).trim());

  for (const part of parts) {
    if (!part) continue;
    let colonIdx = -1;
    let d = 0;
    let q: '"' | "'" | null = null;
    for (let i = 0; i < part.length; i++) {
      const c = part[i];
      if (q !== null) {
        if (c === "\\") {
          i++;
          continue;
        }
        if (c === q) q = null;
        continue;
      }
      if (c === "'" || c === '"') {
        q = c;
        continue;
      }
      if (c === "(" || c === "[" || c === "{") d++;
      else if (c === ")" || c === "]" || c === "}") d--;
      else if (c === ":" && d === 0) {
        colonIdx = i;
        break;
      }
    }
    if (colonIdx === -1) continue;
    let key = part.slice(0, colonIdx).trim();
    const val = part.slice(colonIdx + 1).trim();
    if (
      key.length >= 2 &&
      ((key.startsWith("'") && key.endsWith("'")) ||
        (key.startsWith('"') && key.endsWith('"')))
    ) {
      key = key.slice(1, -1);
    }
    if (key && val) {
      entries.set(key, val);
    }
  }

  return entries;
}

interface TextReplacement {
  start: number;
  end: number;
  text: string;
}

/**
 * Transforms a WXML template by analyzing `<c-*>` component call sites and injecting
 * `slots="{{ { ... } }}"` onto tags that have active or conditional slots.
 */
export function transformWxmlSlots(
  source: string,
  options: TransformWxmlSlotsOptions = {},
): TransformWxmlSlotsResult {
  const prefix = options.prefix ?? "c-";
  if (!source.includes(`<${prefix}`)) {
    return { code: source, hasChanges: false };
  }

  const manifest: Record<string, readonly string[]> = options.componentSlots
    ? { ...COMPONENT_SLOTS_MANIFEST, ...options.componentSlots }
    : COMPONENT_SLOTS_MANIFEST;
  const wxsModuleName = options.wxsModuleName ?? "__cuiSlots";
  const wxsRegistry = new WxsHelperRegistry(wxsModuleName);
  const ast = parseWxml(source);
  const replacements: TextReplacement[] = [];

  const visitNodes = (nodes: WxmlNode[]) => {
    for (const node of nodes) {
      if (node.type !== "element") continue;

      // Recurse into children first (handles nested `<c-*>` inside `<c-*>`)
      if (node.children.length > 0) {
        visitNodes(node.children);
      }

      if (!node.tag.startsWith(prefix)) continue;
      const compName = node.tag.slice(prefix.length);
      const knownSlots = manifest[compName] ?? ["default"];

      const detectedMap = analyzeChildrenIntoMap(node.children, {
        condition: null,
        activeLoops: [],
        inheritedSlot: null,
        knownSlots,
        wxsRegistry,
      });

      const existingSlotsAttr = getAttr(node, "slots");
      const finalEntries = new Map<string, string>();

      if (existingSlotsAttr) {
        for (const [k, v] of parseExistingSlotsAttr(existingSlotsAttr)) {
          finalEntries.set(toSlotIdentifierKey(k), v);
        }
      }

      for (const [slotName, cond] of detectedMap.entries()) {
        finalEntries.set(
          toSlotIdentifierKey(slotName),
          serializeSlotCondition(cond),
        );
      }

      if (finalEntries.size === 0) continue;

      const serializedPairs: string[] = [];
      for (const [k, v] of finalEntries.entries()) {
        serializedPairs.push(`${formatSlotObjectKey(k)}: ${v}`);
      }
      const newAttrText = `slots="{{ { ${serializedPairs.join(", ")} } }}"`;

      if (existingSlotsAttr) {
        const oldAttrText = source.slice(
          existingSlotsAttr.start,
          existingSlotsAttr.end,
        );
        if (oldAttrText !== newAttrText) {
          replacements.push({
            start: existingSlotsAttr.start,
            end: existingSlotsAttr.end,
            text: newAttrText,
          });
        }
      } else {
        const charBeforeInsert = source[node.insertPos - 1];
        const needsLeadingSpace = !isWhitespace(charBeforeInsert);
        const needTrailingSpace =
          node.selfClosing && !isWhitespace(charBeforeInsert);
        const prefixSpace = needsLeadingSpace ? " " : "";
        const suffixSpace = needTrailingSpace ? " " : "";
        replacements.push({
          start: node.insertPos,
          end: node.insertPos,
          text: `${prefixSpace}${newAttrText}${suffixSpace}`,
        });
      }
    }
  };

  visitNodes(ast);

  if (replacements.length === 0) {
    return { code: source, hasChanges: false };
  }

  // Apply replacements from right to left to preserve character offsets
  replacements.sort((a, b) => b.start - a.start);
  let out = source;
  for (const rep of replacements) {
    out = out.slice(0, rep.start) + rep.text + out.slice(rep.end);
  }

  if (wxsRegistry.hasHelpers()) {
    const wxsBlock = wxsRegistry.generateWxsBlock(out);
    if (wxsBlock) {
      const existingWxsRe = new RegExp(
        `<wxs\\s+module=["']${wxsModuleName}["']>[\\s\\S]*?<\\/wxs>\\n?`,
      );
      if (existingWxsRe.test(out)) {
        out = out.replace(existingWxsRe, wxsBlock);
      } else {
        out = wxsBlock + out;
      }
    }
  }

  return {
    code: out,
    hasChanges: out !== source,
  };
}
