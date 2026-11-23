import type { Plugin } from "weapp-vite";
import { DEFAULT_THEME_COLORS, componentThemes } from "@code-id-labs/core";
import { serializeCompactThemeModule } from "@code-id-labs/compiler";

const VIRTUAL_THEME_PREFIX = "virtual:cui/theme/";
const RESOLVED_VIRTUAL_THEME_PREFIX = "\0virtual:cui/theme/";

/**
 * Resolves and compiles `virtual:cui/theme/<component>` directly from `@code-id-labs/core`
 * without pulling `@code-id-labs/plugin-vite` into `@code-id-labs/components`.
 */
export function virtualThemePlugin(): Plugin {
  const cache = new Map<string, string>();
  const themesMap = componentThemes as Record<string, any>;

  return {
    name: "cui:virtual-theme",
    enforce: "pre",

    resolveId(id) {
      if (id.startsWith(VIRTUAL_THEME_PREFIX)) {
        return `\0${id}`;
      }
      return null;
    },

    load(id) {
      if (!id.startsWith(RESOLVED_VIRTUAL_THEME_PREFIX)) return null;

      const componentName = id.slice(RESOLVED_VIRTUAL_THEME_PREFIX.length);
      const cached = cache.get(componentName);
      if (cached !== undefined) return cached;

      const camelName = componentName.replace(/-([a-z])/g, (_, c: string) =>
        c.toUpperCase(),
      );
      const factory = themesMap[componentName] ?? themesMap[camelName];
      if (!factory) {
        throw new Error(
          `[code-ui] Unknown component theme: "${componentName}". Available themes: ${Object.keys(themesMap).join(", ")}`,
        );
      }

      const compiled =
        typeof factory === "function"
          ? factory({
              colors: DEFAULT_THEME_COLORS,
              errorColor: "danger",
              colorMode: "system",
            })
          : structuredClone(factory);

      const code = serializeCompactThemeModule({
        name: componentName,
        ...compiled,
      });
      cache.set(componentName, code);
      return code;
    },
  };
}
