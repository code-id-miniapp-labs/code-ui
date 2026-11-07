import {
  DEFAULT_THEME_COLORS,
  type CodeUIConfig,
  type ColorSystem,
  type ColorValue,
} from "@code-ui/core";

export const THEME_TAG = "/* @code-ui:theme */";

export const TAILWIND_PALETTES = new Set([
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "mauve",
  "olive",
  "mist",
  "taupe",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
]);

export const SHADES = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;

export type Shade = (typeof SHADES)[number];

export const PALETTE_FALLBACKS: Record<string, Record<number, string>> = {
  emerald: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
    950: "#022c22",
  },
  zinc: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
    950: "#09090b",
  },
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0a0a0a",
  },
  stone: {
    50: "#fafaf9",
    100: "#f5f5f4",
    200: "#e7e5e4",
    300: "#d6d3d1",
    400: "#a8a29e",
    500: "#78716c",
    600: "#57534e",
    700: "#44403c",
    800: "#292524",
    900: "#1c1917",
    950: "#0c0a09",
  },
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a",
  },
  rose: {
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    300: "#fda4af",
    400: "#fb7185",
    500: "#f43f5e",
    600: "#e11d48",
    700: "#be123c",
    800: "#9f1239",
    900: "#881337",
    950: "#4c0519",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },
};

export const TAILWIND_500_FALLBACKS: Record<string, string> = {
  slate: "#64748b",
  gray: "#6b7280",
  zinc: "#71717a",
  neutral: "#737373",
  stone: "#78716c",
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  emerald: "#10b981",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",
  mauve: "#717079",
  olive: "#6f746d",
  mist: "#667479",
  taupe: "#7b7268",
};

export const RADIUS_FACTORS: Array<[string, number]> = [
  ["xs", 0.5],
  ["sm", 1],
  ["md", 1.5],
  ["lg", 2],
  ["xl", 3],
  ["2xl", 4],
  ["3xl", 6],
];

const RAW_COLOR_FN_RE = /^(?:rgb|rgba|hsl|hsla|oklch|color)\(/i;
const WHITESPACE_RE = /\s+/;

export const DEFAULT_COLORS: Record<string, string> = {
  primary: "red",
  secondary: "stone",
  neutral: "zinc",
  danger: "red",
  success: "green",
  warning: "amber",
  info: "blue",
};

export function getPaletteColor(
  palette: string,
  shade: number,
): string | undefined {
  return PALETTE_FALLBACKS[palette]?.[shade];
}

export function isRawColor(val: string): boolean {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  return trimmed.startsWith("#") || RAW_COLOR_FN_RE.test(trimmed);
}

const BORDER_SIDES = new Set(["x", "y", "t", "r", "b", "l", "s", "e"]);
const BORDER_STYLES = new Set([
  "solid",
  "dashed",
  "dotted",
  "double",
  "hidden",
  "none",
]);
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
const TEXT_WRAPS = new Set(["wrap", "nowrap", "balance", "pretty"]);
const TEXT_OVERFLOWS = new Set(["ellipsis", "clip"]);
const BG_SIZES = new Set(["auto", "cover", "contain"]);
const BG_ATTACHMENTS = new Set(["fixed", "local", "scroll"]);
const BG_POSITION_RE = /^(?:top|bottom|left|right)(?:-|$)/;
const BG_REPEAT_RE = /^repeat(?:-|$)/;
const BG_IMAGE_RE = /^(?:gradient|linear|radial|conic)-/;
const SHADOW_SIZES = new Set([
  "2xs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "none",
  "inner",
]);
const DISPLAY_UTILS = new Set([
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
  "table",
  "inline-table",
  "table-row",
  "table-cell",
]);
const POSITION_UTILS = new Set([
  "static",
  "fixed",
  "absolute",
  "relative",
  "sticky",
]);
const VISIBILITY_UTILS = new Set(["visible", "invisible", "collapse"]);
const ARBITRARY_COLOR_RE =
  /^\[(?:#|rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color|var\()/i;

function splitClassToken(token: string): {
  variants: string[];
  utility: string;
} {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;

  for (let i = 0; i < token.length; i++) {
    const ch = token.charAt(i);
    if (ch === "[" || ch === "(" || ch === "{") depth++;
    else if (ch === "]" || ch === ")" || ch === "}") {
      depth = Math.max(0, depth - 1);
    } else if (ch === ":" && depth === 0) {
      parts.push(token.slice(start, i));
      start = i + 1;
    }
  }

  parts.push(token.slice(start));
  return {
    variants: parts.slice(0, -1),
    utility: parts[parts.length - 1] ?? "",
  };
}

function isArbitraryColor(value: string): boolean {
  return value.startsWith("[") && ARBITRARY_COLOR_RE.test(value);
}

/**
 * Groups a utility by the CSS property it controls. This lets the dark color
 * system drop only the light counterpart of a `dark:` utility without touching
 * unrelated classes (e.g. `border` width vs `border-neutral-200` color).
 */
function getPropertyFamily(utility: string): string | null {
  if (!utility) return null;

  if (DISPLAY_UTILS.has(utility)) return "display";
  if (POSITION_UTILS.has(utility)) return "position";
  if (VISIBILITY_UTILS.has(utility)) return "visibility";

  if (utility === "flex") return "display";
  if (/^flex-(?:1|auto|initial|none)$/.test(utility)) return "flex";
  if (/^flex-(?:row|col)(?:-reverse)?$/.test(utility)) return "flex-direction";
  if (/^flex-(?:wrap|nowrap|wrap-reverse)$/.test(utility)) return "flex-wrap";

  if (utility.startsWith("border-spacing")) return "border-spacing";
  if (utility === "border-collapse" || utility === "border-separate") {
    return "border-collapse";
  }
  if (utility === "border") return "border-width";
  if (utility.startsWith("border-")) {
    const parts = utility.slice("border-".length).split("-");
    let side = "";
    const first = parts[0] ?? "";
    if (BORDER_SIDES.has(first)) {
      side = `-${first}`;
      parts.shift();
    }
    const value = parts.join("-");
    if (!value) return `border-width${side}`;
    if (/^\d+$/.test(value) || value.startsWith("[")) {
      return isArbitraryColor(value.slice(0, value.indexOf("]") + 1))
        ? `border-color${side}`
        : `border-width${side}`;
    }
    if (BORDER_STYLES.has(value)) return `border-style${side}`;
    return `border-color${side}`;
  }

  if (utility.startsWith("text-")) {
    const value = utility.slice("text-".length);
    if (TEXT_SIZES.has(value) || /^\d/.test(value)) return "text-size";
    if (TEXT_ALIGNS.has(value)) return "text-align";
    if (TEXT_WRAPS.has(value)) return "text-wrap";
    if (TEXT_OVERFLOWS.has(value)) return "text-overflow";
    if (value.startsWith("[") && !isArbitraryColor(value)) return "text-size";
    return "text-color";
  }

  if (utility === "bg") return null;
  if (utility.startsWith("bg-")) {
    const value = utility.slice("bg-".length);
    if (BG_SIZES.has(value)) return "bg-size";
    if (BG_ATTACHMENTS.has(value)) return "bg-attachment";
    if (BG_POSITION_RE.test(value)) return "bg-position";
    if (BG_REPEAT_RE.test(value)) return "bg-repeat";
    if (BG_IMAGE_RE.test(value) || value === "none") return "bg-image";
    if (/^(?:clip|origin|blend)-/.test(value))
      return `bg-${value.split("-")[0]}`;
    if (value.startsWith("[") && !isArbitraryColor(value))
      return "bg-arbitrary";
    return "bg-color";
  }

  if (utility === "ring") return "ring-width";
  if (utility === "ring-inset") return "ring-inset";
  if (utility.startsWith("ring-offset-")) {
    const value = utility.slice("ring-offset-".length);
    if (/^\d+$/.test(value) || value.startsWith("[")) {
      return "ring-offset-width";
    }
    return "ring-offset-color";
  }
  if (utility.startsWith("ring-")) {
    const value = utility.slice("ring-".length);
    if (/^\d+$/.test(value) || value.startsWith("[")) return "ring-width";
    return "ring-color";
  }

  if (utility === "outline") return "outline-width";
  if (utility.startsWith("outline-offset-")) return "outline-offset";
  if (utility.startsWith("outline-")) {
    const value = utility.slice("outline-".length);
    if (
      /^\d+$/.test(value) ||
      value === "none" ||
      value === "hidden" ||
      value === "solid" ||
      value === "dashed" ||
      value === "dotted" ||
      value === "double"
    ) {
      return "outline-style";
    }
    return "outline-color";
  }

  if (
    utility === "divide-x" ||
    utility === "divide-y" ||
    /^divide-[xy]-\d+$/.test(utility)
  ) {
    return "divide-width";
  }
  if (utility.startsWith("divide-")) return "divide-color";

  if (utility === "shadow") return "shadow-size";
  if (utility.startsWith("shadow-")) {
    const value = utility.slice("shadow-".length);
    if (SHADOW_SIZES.has(value)) return "shadow-size";
    if (value.startsWith("[")) return "shadow-arbitrary";
    return "shadow-color";
  }

  if (utility.startsWith("decoration-")) {
    const value = utility.slice("decoration-".length);
    if (
      /^\d+$/.test(value) ||
      /^(?:solid|double|dotted|dashed|wavy)$/.test(value)
    ) {
      return "text-decoration";
    }
    return "text-decoration-color";
  }

  if (utility.startsWith("font-")) {
    const value = utility.slice("font-".length);
    if (
      /^(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.test(
        value,
      )
    ) {
      return "font-weight";
    }
    if (value === "italic" || value === "not-italic") return "font-style";
    return "font-family";
  }

  if (/^(?:translate|scale)-[xyz](?:-|$)/.test(utility)) {
    return utility.slice(0, utility.indexOf("-", utility.indexOf("-") + 1));
  }
  if (utility.startsWith("min-w-")) return "min-width";
  if (utility.startsWith("max-w-")) return "max-width";
  if (utility.startsWith("min-h-")) return "min-height";
  if (utility.startsWith("max-h-")) return "max-height";
  if (/^(?:w|h)-/.test(utility))
    return utility.slice(0, 1) === "w" ? "width" : "height";

  const separator = utility.indexOf("-");
  return separator === -1 ? utility : utility.slice(0, separator);
}

function createColorSystemClassTransformer(
  colorSystem: ColorSystem,
): (value: string) => string {
  if (colorSystem === "light") {
    return (value) =>
      value
        .split(WHITESPACE_RE)
        .filter(
          (token) => token && !splitClassToken(token).variants.includes("dark"),
        )
        .join(" ");
  }

  return (value) => {
    const tokens = value.split(WHITESPACE_RE).filter(Boolean);
    const parsed = tokens.map((token) => ({
      token,
      ...splitClassToken(token),
    }));

    const darkFamilies = new Set<string>();
    for (const entry of parsed) {
      const darkIndex = entry.variants.indexOf("dark");
      if (darkIndex === -1) continue;
      const family = getPropertyFamily(entry.utility);
      if (!family) continue;
      const variants = entry.variants.filter((_, index) => index !== darkIndex);
      darkFamilies.add(`${variants.join(":")}|${family}`);
    }

    const result: string[] = [];
    const seen = new Set<string>();

    for (const entry of parsed) {
      const darkIndex = entry.variants.indexOf("dark");
      if (darkIndex !== -1) {
        const variants = entry.variants.filter(
          (_, index) => index !== darkIndex,
        );
        const token = [...variants, entry.utility].join(":");
        if (token && !seen.has(token)) {
          seen.add(token);
          result.push(token);
        }
        continue;
      }

      const family = getPropertyFamily(entry.utility);
      if (family && darkFamilies.has(`${entry.variants.join(":")}|${family}`)) {
        continue;
      }

      if (!seen.has(entry.token)) {
        seen.add(entry.token);
        result.push(entry.token);
      }
    }

    return result.join(" ");
  };
}

function transformColorSystemNode(
  value: any,
  transform: (value: string) => string,
): any {
  if (typeof value === "string") return transform(value);

  if (Array.isArray(value)) {
    const tokens: string[] = [];
    for (const item of value) {
      if (typeof item === "string") tokens.push(item);
      else if (Array.isArray(item))
        tokens.push(transformColorSystemNode(item, transform));
    }
    return transform(tokens.join(" "));
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    const isConditional =
      entries.length > 0 &&
      entries.every(([, val]) => typeof val === "boolean");

    if (isConditional) {
      const result: Record<string, any> = {};
      for (const [key, val] of entries) {
        result[transform(key)] = val;
      }
      return result;
    }

    const result: Record<string, any> = {};
    for (const [key, val] of entries) {
      result[key] = transformColorSystemNode(val, transform);
    }
    return result;
  }

  return value;
}

/**
 * Rewrites component theme classes for the configured color system.
 *
 * - `system`: keep light + `dark:` classes untouched.
 * - `light`: remove all `dark:` classes.
 * - `dark`: convert `dark:` classes to unconditional classes and remove their
 *   light counterparts (e.g. `bg-white dark:bg-neutral-900` → `bg-neutral-900`).
 */
export function applyColorSystemToTheme(
  theme: any,
  colorSystem: ColorSystem | undefined,
): any {
  if (!colorSystem || colorSystem === "system") return theme;

  const transform = createColorSystemClassTransformer(colorSystem);

  return {
    ...theme,
    base: transformColorSystemNode(theme.base, transform),
    slots: transformColorSystemNode(theme.slots, transform),
    variants: transformColorSystemNode(theme.variants, transform),
    compoundVariants: Array.isArray(theme.compoundVariants)
      ? theme.compoundVariants.map((compound: any) => ({
          ...compound,
          class: transformColorSystemNode(compound.class, transform),
          ...(compound.className !== undefined
            ? {
                className: transformColorSystemNode(
                  compound.className,
                  transform,
                ),
              }
            : {}),
        }))
      : theme.compoundVariants,
  };
}

export function generateThemeCSS(ui?: CodeUIConfig["ui"]): string {
  const themeLines: string[] = [];
  const rootLines: string[] = [];
  const darkLines: string[] = [];
  const colorSystem = ui?.colorSystem ?? "system";

  const configuredColors: Record<string, ColorValue | string | undefined> = {
    ...DEFAULT_COLORS,
    ...ui?.colors,
  };

  for (const [key, val] of Object.entries(configuredColors)) {
    if (!val || typeof val !== "string") continue;

    if (!isRawColor(val)) {
      for (const shade of SHADES) {
        const fallback = getPaletteColor(val, shade);
        const fallbackStr = fallback ? `, ${fallback}` : "";
        themeLines.push(
          `  --color-${key}-${shade}: var(--color-${val}-${shade}${fallbackStr});`,
        );
        rootLines.push(
          `  --ui-color-${key}-${shade}: var(--color-${val}-${shade}${fallbackStr});`,
        );
      }
      themeLines.push(`  --color-${key}: var(--color-${key}-500);`);

      rootLines.push(`  --ui-${key}: var(--ui-color-${key}-500);`);
      rootLines.push(`  --color-${key}: var(--ui-${key});`);
      rootLines.push(`  --color-${val}: var(--color-${val}-500);`);

      darkLines.push(`  --ui-${key}: var(--ui-color-${key}-400);`);
      darkLines.push(`  --color-${key}: var(--ui-${key});`);
    } else {
      themeLines.push(`  --color-${key}: ${val};`);
      rootLines.push(`  --color-${key}: ${val};`);
      rootLines.push(`  --ui-${key}: ${val};`);
    }
  }

  if (ui?.radius) {
    if (typeof ui.radius === "string") {
      const baseRadius = ui.radius;
      rootLines.push(`  --ui-radius: ${baseRadius};`);
      themeLines.push(`  --radius-full: 9999px;`);
      rootLines.push(`  --radius-full: 9999px;`);
      for (const [name, factor] of RADIUS_FACTORS) {
        const expr =
          factor === 1
            ? `var(--ui-radius)`
            : `calc(var(--ui-radius) * ${factor})`;
        themeLines.push(`  --radius-${name}: ${expr};`);
        rootLines.push(`  --radius-${name}: ${expr};`);
      }
    } else if (typeof ui.radius === "object" && ui.radius !== null) {
      const radObj = ui.radius as Record<string, string | undefined>;
      if (radObj.base) {
        rootLines.push(`  --ui-radius: ${radObj.base};`);
        themeLines.push(`  --radius-full: 9999px;`);
        rootLines.push(`  --radius-full: 9999px;`);
        for (const [name, factor] of RADIUS_FACTORS) {
          const customVal = radObj[name];
          const expr =
            customVal ||
            (factor === 1
              ? `var(--ui-radius)`
              : `calc(var(--ui-radius) * ${factor})`);
          themeLines.push(`  --radius-${name}: ${expr};`);
          rootLines.push(`  --radius-${name}: ${expr};`);
        }
      } else {
        for (const [rKey, rVal] of Object.entries(radObj)) {
          if (rVal) {
            themeLines.push(`  --radius-${rKey}: ${rVal};`);
            rootLines.push(`  --radius-${rKey}: ${rVal};`);
          }
        }
      }
    }
  }

  if (themeLines.length === 0 && rootLines.length === 0) return "";

  // MiniProgram component style isolation (apply-shared) does not inherit tag-level
  // resets (e.g. `view, text { --tw-translate-x: 0 }`). Providing defaults on :root, page, :host
  // ensures transform/translate CSS variables cascade into custom components.
  rootLines.push("  --tw-translate-x: 0;");
  rootLines.push("  --tw-translate-y: 0;");
  rootLines.push("  --tw-translate-z: 0;");

  if (colorSystem === "dark") {
    rootLines.push(...darkLines);
  }

  let css = `${THEME_TAG}\n@theme default inline {\n${themeLines.join("\n")}\n}\n\n:root, page, :host {\n${rootLines.join("\n")}\n}\n`;

  if (colorSystem === "system" && darkLines.length > 0) {
    css += `\n@media (prefers-color-scheme: dark) {\n  :root, page, :host {\n  ${darkLines.join("\n  ")}\n  }\n}\n\npage[data-theme="dark"], .dark {\n${darkLines.join("\n")}\n}\n`;
  }

  return css;
}

export function isPlainObject(val: unknown): val is Record<string, any> {
  return Boolean(val) && typeof val === "object" && !Array.isArray(val);
}

export function mergeComponentConfig(
  base: Record<string, any> = {},
  overrides?: Record<string, any>,
): Record<string, any> {
  if (!overrides) return base;

  const result: Record<string, any> = {
    ...base,
    ...overrides,
  };

  if (base.base && overrides.base) {
    result.base = [base.base, overrides.base];
  }

  if (base.slots || overrides.slots) {
    result.slots = { ...base.slots };
    if (isPlainObject(overrides.slots)) {
      for (const [slotKey, slotVal] of Object.entries(overrides.slots)) {
        if (slotVal === undefined) continue;
        result.slots[slotKey] = base.slots?.[slotKey]
          ? [base.slots[slotKey], slotVal]
          : slotVal;
      }
    }
  }

  if (base.variants || overrides.variants) {
    result.variants = { ...base.variants };
    if (isPlainObject(overrides.variants)) {
      for (const [vGroup, vOptions] of Object.entries(overrides.variants)) {
        if (!isPlainObject(vOptions)) continue;
        const baseGroup = isPlainObject(base.variants?.[vGroup])
          ? base.variants[vGroup]
          : {};
        result.variants[vGroup] = { ...baseGroup };

        for (const [vKey, vVal] of Object.entries(vOptions)) {
          if (vVal === undefined) continue;
          const baseVal = baseGroup[vKey];

          if (isPlainObject(baseVal) && isPlainObject(vVal)) {
            const mergedSlots: Record<string, any> = { ...baseVal };
            for (const [sKey, sVal] of Object.entries(vVal)) {
              if (sVal === undefined) continue;
              mergedSlots[sKey] = baseVal[sKey] ? [baseVal[sKey], sVal] : sVal;
            }
            result.variants[vGroup][vKey] = mergedSlots;
          } else {
            result.variants[vGroup][vKey] = baseVal ? [baseVal, vVal] : vVal;
          }
        }
      }
    }
  }

  if (base.compoundVariants || overrides.compoundVariants) {
    result.compoundVariants = [
      ...(Array.isArray(base.compoundVariants) ? base.compoundVariants : []),
      ...(Array.isArray(overrides.compoundVariants)
        ? overrides.compoundVariants
        : []),
    ];
  }

  if (base.defaultVariants || overrides.defaultVariants) {
    result.defaultVariants = {
      ...base.defaultVariants,
      ...overrides.defaultVariants,
    };
  }

  return result;
}

export function compileComponentTheme(
  componentName: string,
  factory: any,
  resolvedConfig: CodeUIConfig,
) {
  const userColors = resolvedConfig.ui?.colors
    ? Object.keys(resolvedConfig.ui.colors)
    : [];
  const replaceColors =
    resolvedConfig.ui?.colorsMode === "replace" && userColors.length > 0;
  const allColors = replaceColors
    ? userColors
    : userColors.length > 0
      ? Array.from(new Set([...DEFAULT_THEME_COLORS, ...userColors]))
      : DEFAULT_THEME_COLORS;

  const errorColor = resolvedConfig.ui?.colors?.error ? "error" : "danger";
  const colorSystem = resolvedConfig.ui?.colorSystem ?? "system";

  const isFactoryFn = typeof factory === "function";
  const rawTheme = isFactoryFn
    ? factory({ colors: allColors, errorColor, colorSystem })
    : factory;
  const camelName = componentName.replace(/-([a-z])/g, (_, c: string) =>
    c.toUpperCase(),
  );
  const kebabName = componentName
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
  const overrides =
    resolvedConfig.components?.[componentName] ??
    resolvedConfig.components?.[camelName] ??
    resolvedConfig.components?.[kebabName];

  const baseTheme = isFactoryFn ? rawTheme : structuredClone(rawTheme);
  const compiled = overrides
    ? mergeComponentConfig(baseTheme, overrides)
    : baseTheme;

  return applyColorSystemToTheme(compiled, colorSystem);
}

export function extractClassesFromThemeConfig(themeConfig: any): string[] {
  const classes = new Set<string>();

  function collect(val: any) {
    if (!val) return;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed) return;
      for (const token of trimmed.split(WHITESPACE_RE)) {
        if (token) classes.add(token);
      }
    } else if (Array.isArray(val)) {
      for (const item of val) collect(item);
    } else if (typeof val === "object") {
      for (const v of Object.values(val)) collect(v);
    }
  }

  if (themeConfig.base) collect(themeConfig.base);
  if (themeConfig.slots) collect(themeConfig.slots);
  if (themeConfig.variants) collect(themeConfig.variants);
  if (themeConfig.compoundVariants) {
    for (const cv of themeConfig.compoundVariants) {
      if (cv.class) collect(cv.class);
      if (cv.className) collect(cv.className);
    }
  }

  return Array.from(classes);
}
