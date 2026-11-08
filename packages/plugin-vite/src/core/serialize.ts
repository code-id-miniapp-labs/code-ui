const FN_DECL_RE = /^(?:async\s+)?function[\s*(]/;
const ARROW_FN_RE = /^(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>/;
const ASYNC_METHOD_RE = /^async\s+[a-zA-Z_$][\w$]*\s*\(/;
const SYNC_METHOD_RE = /^[a-zA-Z_$][\w$]*\s*\(/;

export function serializeFunction(fn: Function): string {
  const str = fn.toString().trim();
  if (FN_DECL_RE.test(str) || ARROW_FN_RE.test(str)) {
    return str;
  }
  if (ASYNC_METHOD_RE.test(str)) {
    return str.replace(ASYNC_METHOD_RE, "async function (");
  }
  if (SYNC_METHOD_RE.test(str)) {
    return str.replace(SYNC_METHOD_RE, "function (");
  }
  return str;
}

export function serializeConfig(val: unknown, depth = 0): string {
  if (typeof val === "function") {
    return serializeFunction(val);
  }
  if (val === null || val === undefined) {
    return JSON.stringify(val);
  }

  const indent = "  ".repeat(depth);
  const nextIndent = "  ".repeat(depth + 1);

  if (Array.isArray(val)) {
    if (val.length === 0) return "[]";
    const items = val
      .map((item) => `${nextIndent}${serializeConfig(item, depth + 1)}`)
      .join(",\n");
    return `[\n${items}\n${indent}]`;
  }
  if (typeof val === "object") {
    const keys = Object.keys(val);
    if (keys.length === 0) return "{}";
    const entries = keys
      .map((key) => {
        const v = (val as Record<string, unknown>)[key];
        return `${nextIndent}${JSON.stringify(key)}: ${serializeConfig(v, depth + 1)}`;
      })
      .join(",\n");
    return `{\n${entries}\n${indent}}`;
  }
  return JSON.stringify(val);
}

const PLACEHOLDER = "__CUI_COLOR__";
const PLACEHOLDER_TOKEN_RE = /__CUI_COLOR__/g;

function containsFunction(val: unknown): boolean {
  if (typeof val === "function") return true;
  if (!val || typeof val !== "object") return false;
  if (Array.isArray(val)) return val.some(containsFunction);
  return Object.values(val).some(containsFunction);
}

function isPlainObj(val: unknown): val is Record<string, any> {
  return Boolean(val) && typeof val === "object" && !Array.isArray(val);
}

function replaceColorInNode(node: unknown, re: RegExp): unknown {
  if (typeof node === "string") return node.replace(re, `-${PLACEHOLDER}`);
  if (Array.isArray(node)) return node.map((v) => replaceColorInNode(v, re));
  if (isPlainObj(node)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = replaceColorInNode(v, re);
    }
    return out;
  }
  return node;
}

function instantiateTemplate(node: unknown, color: string): unknown {
  if (node === PLACEHOLDER) return color;
  if (typeof node === "string") {
    return node.replace(PLACEHOLDER_TOKEN_RE, color);
  }
  if (Array.isArray(node)) {
    return node.map((v) => instantiateTemplate(v, color));
  }
  if (isPlainObj(node)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = instantiateTemplate(v, color);
    }
    return out;
  }
  return node;
}

function extractVerifiedColorTemplate(
  obj: Record<string, any>,
  color: string,
): Record<string, any> | null {
  if (!color || typeof color !== "string") return null;
  const esc = color.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`-${esc}(?=$|[^a-zA-Z0-9_])`, "g");
  const tpl: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    tpl[k] = k === "color" && v === color ? PLACEHOLDER : replaceColorInNode(v, re);
  }
  const tplJson = JSON.stringify(tpl);
  if (!tplJson.includes(`-${PLACEHOLDER}`)) return null;
  if (JSON.stringify(instantiateTemplate(tpl, color)) !== JSON.stringify(obj)) {
    return null;
  }
  return tpl;
}

function emitTemplateExpr(node: unknown, paramName: string): string {
  if (node === PLACEHOLDER) return paramName;
  if (typeof node === "string") {
    if (!node.includes(PLACEHOLDER)) return JSON.stringify(node);
    const escaped = node
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$\{/g, "\\${")
      .replace(PLACEHOLDER_TOKEN_RE, `\${${paramName}}`);
    return `\`${escaped}\``;
  }
  if (Array.isArray(node)) {
    return `[${node.map((v) => emitTemplateExpr(v, paramName)).join(",")}]`;
  }
  if (isPlainObj(node)) {
    const entries = Object.entries(node).map(
      ([k, v]) => `${JSON.stringify(k)}:${emitTemplateExpr(v, paramName)}`,
    );
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(node);
}

function cleanThemeVariants(variants: unknown): Record<string, any> | undefined {
  if (!isPlainObj(variants)) return undefined;
  const out: Record<string, any> = {};
  for (const [group, options] of Object.entries(variants)) {
    if (!isPlainObj(options)) {
      if (options !== undefined) out[group] = options;
      continue;
    }
    const cleanedGroup: Record<string, any> = {};
    for (const [optKey, optVal] of Object.entries(options)) {
      if (optVal === "" || optVal === null || optVal === undefined) continue;
      if (isPlainObj(optVal)) {
        const cleanedSlots: Record<string, any> = {};
        let hasSlot = false;
        for (const [sKey, sVal] of Object.entries(optVal)) {
          if (sVal !== "" && sVal !== null && sVal !== undefined) {
            cleanedSlots[sKey] = sVal;
            hasSlot = true;
          }
        }
        if (hasSlot) cleanedGroup[optKey] = cleanedSlots;
      } else {
        cleanedGroup[optKey] = optVal;
      }
    }
    if (Object.keys(cleanedGroup).length > 0) {
      out[group] = cleanedGroup;
    }
  }
  return out;
}

export function serializeCompactThemeModule(themeConfig: any): string {
  if (!isPlainObj(themeConfig) || containsFunction(themeConfig)) {
    return `export default ${serializeConfig(themeConfig)};`;
  }

  const cleanedVariants = cleanThemeVariants(themeConfig.variants);
  const compounds: any[] = Array.isArray(themeConfig.compoundVariants)
    ? themeConfig.compoundVariants
    : [];

  const colorLists = new Map<string, { id: string; colors: string[] }>();
  const getColorListVar = (colors: string[]): string => {
    const key = JSON.stringify(colors);
    let entry = colorLists.get(key);
    if (!entry) {
      entry = { id: `_c${colorLists.size || ""}`, colors };
      colorLists.set(key, entry);
    }
    return entry.id;
  };

  let colorVariantExpr: string | null = null;
  if (cleanedVariants && isPlainObj(cleanedVariants.color)) {
    const colorEntries = Object.entries(cleanedVariants.color);
    if (colorEntries.length >= 3) {
      const allEmpty = colorEntries.every(
        ([, v]) => isPlainObj(v) && Object.keys(v).length === 0,
      );
      if (allEmpty) {
        const listVar = getColorListVar(colorEntries.map(([k]) => k));
        colorVariantExpr = `Object.fromEntries(${listVar}.map(c=>[c,{}]))`;
      } else {
        const groups = new Map<
          string,
          { tpl: Record<string, any>; colors: string[] }
        >();

        for (const [cName, cVal] of colorEntries) {
          if (!isPlainObj(cVal)) continue;
          const tpl = extractVerifiedColorTemplate(cVal, cName);
          if (!tpl) continue;
          const sig = JSON.stringify(tpl);
          let g = groups.get(sig);
          if (!g) {
            g = { tpl, colors: [] };
            groups.set(sig, g);
          }
          g.colors.push(cName);
        }

        let bestGroup: { tpl: Record<string, any>; colors: string[] } | null =
          null;
        for (const g of groups.values()) {
          if (
            g.colors.length >= 3 &&
            (!bestGroup || g.colors.length > bestGroup.colors.length)
          ) {
            bestGroup = g;
          }
        }

        if (bestGroup) {
          const listVar = getColorListVar(bestGroup.colors);
          const mapExpr = `...Object.fromEntries(${listVar}.map(c=>[c,${emitTemplateExpr(bestGroup.tpl, "c")}]))`;
          const remaining = colorEntries.filter(
            ([k]) => !bestGroup?.colors.includes(k),
          );
          if (remaining.length === 0) {
            colorVariantExpr = `Object.fromEntries(${listVar}.map(c=>[c,${emitTemplateExpr(bestGroup.tpl, "c")}]))`;
          } else {
            const remParts = remaining.map(
              ([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`,
            );
            colorVariantExpr = `{${[...remParts, mapExpr].join(",")}}`;
          }
        }
      }
    }
  }

  const compoundPieces: string[] = [];
  let idx = 0;
  while (idx < compounds.length) {
    const cv = compounds[idx];
    if (!isPlainObj(cv) || typeof cv.color !== "string") {
      compoundPieces.push(JSON.stringify(cv));
      idx++;
      continue;
    }

    // Check for interleaved flatMap pattern:
    // e.g. [T0(c1), T1(c1)], [T0(c2), T1(c2)], ...
    const firstColor = cv.color;
    let stride = 1;
    while (
      idx + stride < compounds.length &&
      isPlainObj(compounds[idx + stride]) &&
      compounds[idx + stride].color === firstColor
    ) {
      stride++;
    }

    if (stride >= 2) {
      // Check if all stride items yield valid templates
      const tpls: Array<Record<string, any>> = [];
      let allValid = true;
      for (let s = 0; s < stride; s++) {
        const item = compounds[idx + s];
        const t = extractVerifiedColorTemplate(item, item.color);
        if (!t) {
          allValid = false;
          break;
        }
        tpls.push(t);
      }

      if (allValid) {
        const tplSigs = tpls.map((t) => JSON.stringify(t));
        const runColors: string[] = [firstColor];
        let end = idx + stride;

        while (end + stride <= compounds.length) {
          const nextFirst = compounds[end];
          if (!isPlainObj(nextFirst) || typeof nextFirst.color !== "string") {
            break;
          }
          const nextColor = nextFirst.color;
          if (runColors.includes(nextColor)) break;

          let blockMatches = true;
          for (let s = 0; s < stride; s++) {
            const nextItem = compounds[end + s];
            if (
              !isPlainObj(nextItem) ||
              nextItem.color !== nextColor ||
              JSON.stringify(
                extractVerifiedColorTemplate(nextItem, nextColor),
              ) !== tplSigs[s]
            ) {
              blockMatches = false;
              break;
            }
          }

          if (!blockMatches) break;
          runColors.push(nextColor);
          end += stride;
        }

        if (runColors.length >= 2) {
          const listVar = getColorListVar(runColors);
          const tplExprs = tpls.map((t) => emitTemplateExpr(t, "c")).join(",");
          compoundPieces.push(`...${listVar}.flatMap(c=>[${tplExprs}])`);
          idx = end;
          continue;
        }
      }
    }

    // Standard contiguous run with stride = 1
    const tpl = extractVerifiedColorTemplate(cv, cv.color);
    if (tpl) {
      const sig = JSON.stringify(tpl);
      const runColors: string[] = [cv.color];
      let end = idx + 1;
      while (end < compounds.length) {
        const nextCv = compounds[end];
        if (!isPlainObj(nextCv) || typeof nextCv.color !== "string") break;
        const nextTpl = extractVerifiedColorTemplate(nextCv, nextCv.color);
        if (!nextTpl || JSON.stringify(nextTpl) !== sig) break;
        runColors.push(nextCv.color);
        end++;
      }
      if (runColors.length >= 3) {
        const listVar = getColorListVar(runColors);
        compoundPieces.push(
          `...${listVar}.map(c=>(${emitTemplateExpr(tpl, "c")}))`,
        );
        idx = end;
        continue;
      }
    }

    compoundPieces.push(JSON.stringify(cv));
    idx++;
  }

  const propParts: string[] = [];
  for (const [k, v] of Object.entries(themeConfig)) {
    if (v === undefined) continue;
    if (k === "variants" && cleanedVariants) {
      if (colorVariantExpr) {
        const vParts = Object.entries(cleanedVariants).map(([vk, vv]) =>
          vk === "color"
            ? `"color":${colorVariantExpr}`
            : `${JSON.stringify(vk)}:${JSON.stringify(vv)}`,
        );
        propParts.push(`"variants":{${vParts.join(",")}}`);
      } else {
        propParts.push(`"variants":${JSON.stringify(cleanedVariants)}`);
      }
    } else if (k === "compoundVariants") {
      if (compoundPieces.length > 0) {
        propParts.push(`"compoundVariants":[${compoundPieces.join(",")}]`);
      }
    } else {
      propParts.push(`${JSON.stringify(k)}:${JSON.stringify(v)}`);
    }
  }

  const preamble = Array.from(colorLists.values())
    .map(({ id, colors }) => `const ${id}=${JSON.stringify(colors)};`)
    .join("");

  return `${preamble ? `${preamble}\n` : ""}export default {\n${propParts.join(",\n")}\n};`;
}
