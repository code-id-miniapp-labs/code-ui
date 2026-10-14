import type { CodeUIConfig, ColorValue } from "@code-ui/core";

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

export const RADIUS_FACTORS: Array<[string, number]> = [
  ["xs", 0.5],
  ["sm", 1],
  ["md", 1.5],
  ["lg", 2],
  ["xl", 3],
  ["2xl", 4],
  ["3xl", 6],
];

export function getPaletteColor(
  palette: string,
  shade: number,
): string | undefined {
  return PALETTE_FALLBACKS[palette]?.[shade];
}

export function isRawColor(val: string): boolean {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  return (
    trimmed.startsWith("#") ||
    /^(?:rgb|rgba|hsl|hsla|oklch|color)\(/i.test(trimmed)
  );
}

export function generateThemeCSS(ui?: CodeUIConfig["ui"]): string {
  const themeLines: string[] = [];
  const rootLines: string[] = [];
  const darkLines: string[] = [];

  // 1. Process colors
  const defaultColors: Record<string, string> = {
    primary: "red",
    neutral: "zinc",
    danger: "red",
    success: "green",
    warning: "amber",
    info: "blue",
  };

  const configuredColors: Record<string, ColorValue | string | undefined> = {
    ...defaultColors,
    ...ui?.colors,
  };

  for (const [key, val] of Object.entries(configuredColors)) {
    if (!val || typeof val !== "string") continue;

    if (!isRawColor(val)) {
      for (const shade of SHADES) {
        themeLines.push(
          `  --color-${key}-${shade}: var(--ui-color-${key}-${shade});`,
        );
      }
      themeLines.push(`  --color-${key}: var(--ui-${key});`);

      for (const shade of SHADES) {
        const fallback = getPaletteColor(val, shade);
        const fallbackStr = fallback ? `, ${fallback}` : "";
        rootLines.push(
          `  --ui-color-${key}-${shade}: var(--color-${val}-${shade}${fallbackStr});`,
        );
      }
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

  let css = `${THEME_TAG}\n@theme default inline {\n${themeLines.join("\n")}\n}\n\n:root, page {\n${rootLines.join("\n")}\n}\n`;

  if (darkLines.length > 0) {
    css += `\n@media (prefers-color-scheme: dark) {\n  :root, page {\n  ${darkLines.join("\n  ")}\n  }\n}\n\npage[data-theme="dark"], .dark {\n${darkLines.join("\n")}\n}\n`;
  }

  return css;
}
