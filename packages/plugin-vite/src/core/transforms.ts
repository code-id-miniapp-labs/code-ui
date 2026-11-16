/**
 * WeChat MiniProgram WXSS Compatibility:
 *
 * Tailwind CSS v4 outputs individual transform properties:
 *   `translate: var(--tw-translate-x) var(--tw-translate-y);`
 *   `scale: var(--tw-scale-x) var(--tw-scale-y);`
 *   `rotate: <angle>;`
 *
 * However, WeChat MiniProgram's WebView (especially iOS WKWebView and DevTools)
 * does NOT support the standalone `translate`, `scale`, and `rotate` properties
 * with dynamic CSS variables.
 * In contrast, `-webkit-transform` and `transform` are supported by 100% of MiniProgram runtimes.
 *
 * This transform automatically injects `-webkit-transform` and `transform` fallbacks
 * wherever Tailwind v4's individual transform properties are used.
 */
export function compatMiniProgramTransforms(css: string): string {
  if (
    !css.includes("translate:") &&
    !css.includes("scale:") &&
    !css.includes("rotate:")
  ) {
    return css;
  }

  let result = css;

  if (result.includes("translate:")) {
    result = result.replace(
      /([ \t]*)(?:(?:-webkit-transform|transform)\s*:\s*translate\s*\([^;]+\)\s*;\s*)*translate\s*:\s*var\(--tw-translate-x\)\s+var\(--tw-translate-y\)\s*;/g,
      (_, indent) =>
        `${indent}-webkit-transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0));\n${indent}transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0));\n${indent}translate: var(--tw-translate-x) var(--tw-translate-y);`,
    );
  }

  if (result.includes("scale:")) {
    result = result.replace(
      /([ \t]*)(?:(?:-webkit-transform|transform)\s*:\s*scale\s*\([^;]+\)\s*;\s*)*scale\s*:\s*var\(--tw-scale-x\)\s+var\(--tw-scale-y\)\s*;/g,
      (_, indent) =>
        `${indent}-webkit-transform: scale(var(--tw-scale-x, 1), var(--tw-scale-y, 1));\n${indent}transform: scale(var(--tw-scale-x, 1), var(--tw-scale-y, 1));\n${indent}scale: var(--tw-scale-x) var(--tw-scale-y);`,
    );
  }

  if (result.includes("rotate:")) {
    result = result.replace(
      /([ \t]*)(?:(?:-webkit-transform|transform)\s*:\s*rotate\s*\([^;]+\)\s*;\s*)*(?<![\w-])rotate\s*:\s*([^;]+);/g,
      (_, indent, val) =>
        `${indent}-webkit-transform: rotate(${val});\n${indent}transform: rotate(${val});\n${indent}rotate: ${val};`,
    );
  }

  return result;
}

const SEMANTIC_UTILITY_RE =
  /(?:^|[\s,.]|_[a-zA-Z])(?:bg|text|border|ring|divide|outline|fill|stroke|accent|caret|from|via|to)-(primary|secondary|success|warning|danger|info)(?:-(\d{2,3}))?(?:_f(\d+))?(?=$|[\s.,:[>+~{])/g;

const COLOR_PROP_PREFIX_RE =
  /(background-color|border-color|outline-color|accent-color|caret-color|color|fill|stroke|--tw-ring-color|--tw-shadow-color|--tw-gradient-from|--tw-gradient-via|--tw-gradient-to)\s*:\s*([^;}{]+)(?:;|(?=\s*$))/gi;

const STATIC_RGBA_RE = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)|#[0-9a-fA-F]{3,8}/;

/**
 * Rewrites compiled Tailwind semantic color utilities (e.g. `bg-primary`,
 * `bg-primary/10`, `bg-primary-500`) to reference runtime `--ui-*` CSS custom
 * properties so runtime color switching and dark mode updates take effect
 * across solid, shade, and alpha-modifier classes.
 */
export function compatSemanticColorVariables(css: string): string {
  if (
    !css.includes("-primary") &&
    !css.includes("-secondary") &&
    !css.includes("-success") &&
    !css.includes("-warning") &&
    !css.includes("-danger") &&
    !css.includes("-info")
  ) {
    return css;
  }

  return css.replace(
    /([^{}@]+)\{([^{}]*)\}/g,
    (fullMatch, selector: string, body: string) => {
      const trimmedSelector = selector.trim();
      if (
        !trimmedSelector ||
        trimmedSelector.startsWith("@") ||
        trimmedSelector.startsWith(":root") ||
        trimmedSelector.startsWith(":host") ||
        trimmedSelector.startsWith("page")
      ) {
        return fullMatch;
      }

      SEMANTIC_UTILITY_RE.lastIndex = 0;
      const match = SEMANTIC_UTILITY_RE.exec(trimmedSelector);
      if (!match) return fullMatch;

      const role = match[1];
      const shade = match[2];
      const alpha = match[3];
      if (!role) return fullMatch;

      let changed = false;
      const nextBody = body.replace(
        COLOR_PROP_PREFIX_RE,
        (declMatch, prop: string, rawValue: string) => {
          const val = rawValue.trim();
          const hasSemi = declMatch.endsWith(";");
          const semi = hasSemi ? ";" : "";
          if (alpha) {
            if (!STATIC_RGBA_RE.test(val) || val.includes(`--ui-${role}-a`)) {
              return declMatch;
            }
            changed = true;
            return `${prop}: var(--ui-${role}-a${alpha}, ${val})${semi}`;
          }

          if (shade) {
            const paletteVarMatch =
              /^var\(--color-[a-z0-9-]+-(\d{2,3})(?:,\s*([^)]+))?\)$/.exec(
                val,
              );
            if (paletteVarMatch && paletteVarMatch[1] === shade) {
              const hexFallback = paletteVarMatch[2]?.trim();
              changed = true;
              return hexFallback
                ? `${prop}: var(--ui-color-${role}-${shade}, ${hexFallback})${semi}`
                : `${prop}: var(--ui-color-${role}-${shade})${semi}`;
            }
            return declMatch;
          }

          if (val === `var(--color-${role}-500)`) {
            changed = true;
            return `${prop}: var(--ui-${role})${semi}`;
          }

          return declMatch;
        },
      );

      return changed ? `${selector}{${nextBody}}` : fullMatch;
    },
  );
}
