import type { CodeUIPluginOptions } from "../types";

const CODE_UI_INCLUDE_PATTERN = /@code-ui/;

export function applyWebpackRules(
  chain: any,
  options: CodeUIPluginOptions,
): void {
  const { extraIncludes = [] } = options;

  const allIncludes: Array<string | RegExp | ((p: string) => boolean)> = [
    CODE_UI_INCLUDE_PATTERN,
    ...extraIncludes,
  ];

  // Taro's webpack chain exposes .module.rule('script') for JS/TS sources
  // We add our includes to both 'script' and 'jsx' rules to cover all files
  for (const ruleName of ["script", "jsx", "tsx"]) {
    try {
      const rule = chain.module.rule(ruleName);
      if (!rule) continue;

      for (const include of allIncludes) {
        rule.include.add(include);
      }
    } catch {
      // Rule may not exist in all Taro versions — skip silently
    }
  }

  // Also add as a standalone include on the main js rule fallback
  try {
    chain.module
      .rule("code-ui-include")
      .test(/\.(js|ts|jsx|tsx|mjs)$/)
      .include.add(CODE_UI_INCLUDE_PATTERN)
      .end()
      .use("babel-loader")
      .loader("babel-loader");
  } catch {
    // No-op if babel-loader isn't available
  }
}
