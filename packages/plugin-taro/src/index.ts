import path from "node:path";
import type { IPluginContext } from "@tarojs/service";
import type { CodeUIPluginOptions } from "./types";
import { applyWebpackRules } from "./runtime/webpack";
import { copyComponents, discoverComponents } from "./runtime/copy";
import { generateTypes } from "./runtime/types";

export type { CodeUIPluginOptions };

const PLUGIN_NAME = "@code-ui/plugin-taro";

/**
 * @example
 * ```ts
 * // config/index.ts
 * plugins: ["@code-ui/plugin-taro"]
 *
 * // with options:
 * plugins: [["@code-ui/plugin-taro", { components: ["drawer"] }]]
 * ```
 */
export default (ctx: IPluginContext, options: CodeUIPluginOptions = {}) => {
  const resolvedOptions: CodeUIPluginOptions = {
    injectTypes: true,
    ...options,
  };

  ctx.onBuildStart(async () => {
    const appPath = ctx.paths?.appPath ?? process.cwd();
    const sourcePath =
      resolvedOptions.sourcePath ??
      path.join(appPath, "node_modules", "@code-ui", "components", "dist");

    const targetComponents =
      resolvedOptions.components ?? (await discoverComponents(sourcePath));

    const componentLabel = resolvedOptions.components
      ? resolvedOptions.components.join(", ")
      : `all (auto-discovered)`;

    console.log(
      `\n[@code-ui/plugin-taro] Plugin active\n` +
        `  Components : ${componentLabel}\n` +
        `  Types      : ${resolvedOptions.injectTypes !== false ? "injected" : "skipped"}\n`,
    );

    if (resolvedOptions.injectTypes !== false && targetComponents.length > 0) {
      try {
        await generateTypes(appPath, targetComponents, resolvedOptions);
      } catch (err) {
        console.error(`[${PLUGIN_NAME}] Failed to generate JSX types:`, err);
      }
    }
  });

  ctx.modifyWebpackChain(({ chain }: { chain: any }) => {
    applyWebpackRules(chain, resolvedOptions);
  });

  ctx.onBuildFinish(async () => {
    const appPath = ctx.paths?.appPath ?? process.cwd();
    try {
      await copyComponents(appPath, resolvedOptions);
    } catch (err) {
      console.error(`[${PLUGIN_NAME}] Failed to copy components:`, err);
    }
  });
};
