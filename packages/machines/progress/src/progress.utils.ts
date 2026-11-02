import { getColors } from "@code-ui/core";

const DEFAULT_PRIMARY = "#78716c";

export const DEFAULT_PROGRESS_PALETTE: Record<string, string> = {
  primary: DEFAULT_PRIMARY, // stone-500
  secondary: "#f59e0b", // amber-500
  neutral: "#71717a", // zinc-500
  danger: "#dc2626", // red-600
  success: "#16a34a", // green-600
  warning: "#ca8a04", // yellow-600
  info: "#2563eb", // blue-600
  stone: "#78716c",
  zinc: "#71717a",
  gray: "#6b7280",
  slate: "#64748b",
  amber: "#f59e0b",
  red: "#dc2626",
  green: "#16a34a",
  yellow: "#ca8a04",
  blue: "#2563eb",
  indigo: "#4f46e5",
  purple: "#9333ea",
  pink: "#ec4899",
  emerald: "#059669",
  teal: "#0d9488",
  cyan: "#0891b2",
  sky: "#0284c7",
  orange: "#ea580c",
  rose: "#e11d48",
  violet: "#7c3aed",
  fuchsia: "#c026d3",
};

function extractColorString(val: unknown): string | undefined {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith("rgb") ||
      trimmed.startsWith("hsl") ||
      trimmed.startsWith("oklch")
    ) {
      return trimmed;
    }
    const lower = trimmed.toLowerCase();
    if (DEFAULT_PROGRESS_PALETTE[lower]) {
      return DEFAULT_PROGRESS_PALETTE[lower];
    }
    return trimmed;
  }
  if (val && typeof val === "object") {
    const dict = val as Record<string, unknown>;
    const candidate =
      dict["500"] ?? dict[500] ?? dict["default"] ?? Object.values(dict)[0];
    if (typeof candidate === "string") {
      return extractColorString(candidate);
    }
  }
  return undefined;
}

export function resolveColor(color: unknown): string {
  if (typeof color !== "string") {
    return DEFAULT_PRIMARY;
  }

  const trimmed = color.trim();
  if (!trimmed) {
    return DEFAULT_PRIMARY;
  }

  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("rgb") ||
    trimmed.startsWith("hsl") ||
    trimmed.startsWith("oklch")
  ) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();

  if (lower === "black") return "#000000";
  if (lower === "white") return "#ffffff";

  try {
    const activeColors = getColors() as Record<string, unknown>;
    const custom = extractColorString(activeColors[lower]);
    if (custom) return custom;
  } catch {}

  const paletteColor = DEFAULT_PROGRESS_PALETTE[lower];
  if (paletteColor) return paletteColor;

  return lower;
}

export function createCircleDataUrl(
  radius: number,
  strokeWidth: number,
  trackColor: string,
  rangeColor: string,
  percent: number,
  isIndeterminate: boolean,
): string {
  const circumference = 2 * Math.PI * radius;
  const dashOffset = isIndeterminate
    ? circumference * 0.75
    : Math.max(
        0,
        Math.min(circumference, circumference - (percent / 100) * circumference),
      );

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">` +
    `<circle cx="50" cy="50" r="${radius}" stroke="${trackColor}" stroke-width="${strokeWidth}" fill="none"/>` +
    `<circle cx="50" cy="50" r="${radius}" stroke="${rangeColor}" stroke-width="${strokeWidth}" fill="none" ` +
    `stroke-dasharray="${circumference} ${circumference}" stroke-dashoffset="${dashOffset}" ` +
    `stroke-linecap="round" transform="rotate(-90 50 50)"/>` +
    `</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
