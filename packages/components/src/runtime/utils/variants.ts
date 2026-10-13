import { escape } from "@weapp-tailwindcss/escape";
import { cx, tv } from "tailwind-variants/lite";

export type { VariantProps } from "tailwind-variants/lite";

/**
 * Lite replacement for `@weapp-tailwindcss/variants`.
 *
 * - `tv` / `cx` come from `tailwind-variants/lite` (no tailwind-merge).
 * - Class names are escaped at runtime so dynamic classes (e.g. user
 *   overrides from `code-ui.ts`) match the selectors emitted by the
 *   weapp-tailwindcss compiler.
 * - No conflict resolution: user classes are appended after base classes.
 */
export { cx, tv };

/** A class that only has `[A-Za-z0-9_-]` and a safe head needs no escaping. */
const SAFE_CLASS = /^[A-Za-z_][\w-]*$/;
const WHITESPACE = /\s+/;

const TOKEN_CACHE_LIMIT = 256;
const tokenCache = new Map<string, string>();

function escapeToken(token: string): string {
  if (SAFE_CLASS.test(token)) return token;
  let escaped = tokenCache.get(token);
  if (escaped === undefined) {
    escaped = escape(token);
    if (tokenCache.size >= TOKEN_CACHE_LIMIT) {
      const oldest = tokenCache.keys().next();
      if (!oldest.done) tokenCache.delete(oldest.value);
    }
    tokenCache.set(token, escaped);
  }
  return escaped;
}

/**
 * Escapes every class in a space-separated class string.
 * Each class is escaped on its own so head rules (leading digit / `-`) apply
 * per class, exactly like the compiler does for selectors.
 */
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

  // Spacing & sizing
  if (/^p[xytrbl]?-[^\s]+$/.test(main)) return `${prefix}${main.split("-")[0]}`;
  if (/^m[xytrbl]?-[^\s]+$/.test(main)) return `${prefix}${main.split("-")[0]}`;
  if (/^(w|h|min-w|min-h|max-w|max-h)-[^\s]+$/.test(main)) {
    return `${prefix}${main.slice(0, main.lastIndexOf("-"))}`;
  }

  // Rounded
  if (/^rounded(-[^\s]+)?$/.test(main)) {
    const sideMatch = main.match(
      /^rounded-(tl|tr|bl|br|ss|se|ee|es|t|b|l|r|s|e)(?:-[^\s]+)?$/,
    );
    if (sideMatch) {
      return `${prefix}rounded-${sideMatch[1]}`;
    }
    return `${prefix}rounded`;
  }

  // Shadow
  if (/^shadow(-[^\s]+)?$/.test(main)) return `${prefix}shadow`;

  // Opacity
  if (/^opacity-[^\s]+$/.test(main)) return `${prefix}opacity`;

  // Text utilities
  if (main.startsWith("text-")) {
    const val = main.slice(5);
    if (TEXT_SIZES.has(val)) return `${prefix}text-size`;
    if (TEXT_ALIGNS.has(val)) return `${prefix}text-align`;
    if (val === "ellipsis" || val === "clip") return `${prefix}text-overflow`;
    return `${prefix}text-color`;
  }

  // Background utilities
  if (main.startsWith("bg-")) {
    const val = main.slice(3);
    if (val === "auto" || val === "cover" || val === "contain") return `${prefix}bg-size`;
    if (val === "fixed" || val === "local" || val === "scroll") return `${prefix}bg-attachment`;
    if (val === "repeat" || val === "no-repeat" || val === "repeat-x" || val === "repeat-y") return `${prefix}bg-repeat`;
    return `${prefix}bg-color`;
  }

  // Border utilities
  if (main.startsWith("border-")) {
    const val = main.slice(7);
    if (BORDER_STYLES.has(val)) return `${prefix}border-style`;
    if (/^(?:[0-9]|t|b|l|r|x|y|s|e)(?:-[0-9]+)?$/.test(val)) return `${prefix}border-width`;
    return `${prefix}border-color`;
  }
  if (main === "border") return `${prefix}border-width`;

  return null;
}

/**
 * Merges multiple class lists, dropping earlier classes that conflict with
 * later classes in the same property group (e.g. text-white dropped when text-red-500 is given).
 */
export function dedupeClasses(...inputs: (string | null | undefined)[]): string {
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
        tokens.push(token);
      } else {
        tokens.push(token);
      }
    }
  }

  return tokens.filter(Boolean).join(" ");
}

/** Joins class values (clsx-style) and escapes the result. */
export function cn(...classes: Parameters<typeof cx>): string {
  return escapeClass(dedupeClasses(cx(...classes) as string | undefined));
}

