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
