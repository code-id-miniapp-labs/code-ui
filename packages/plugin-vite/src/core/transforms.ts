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
      /translate:\s*var\(--tw-translate-x\)\s+var\(--tw-translate-y\);/g,
      "-webkit-transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0));\n    transform: translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0));\n    translate: var(--tw-translate-x) var(--tw-translate-y);",
    );
  }

  if (result.includes("scale:")) {
    result = result.replace(
      /scale:\s*var\(--tw-scale-x\)\s+var\(--tw-scale-y\);/g,
      "-webkit-transform: scale(var(--tw-scale-x, 1), var(--tw-scale-y, 1));\n    transform: scale(var(--tw-scale-x, 1), var(--tw-scale-y, 1));\n    scale: var(--tw-scale-x) var(--tw-scale-y);",
    );
  }

  if (result.includes("rotate:")) {
    result = result.replace(
      /(?<![\w-])rotate:\s*([^;]+);/g,
      "-webkit-transform: rotate($1);\n    transform: rotate($1);\n    rotate: $1;",
    );
  }

  return result;
}
