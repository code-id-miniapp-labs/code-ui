declare module "virtual:cui/config" {
  import type { CodeUIConfig } from "@code-ui/core";
  const config: CodeUIConfig;
  export default config;
}

declare module "virtual:cui-config" {
  import type { CodeUIConfig } from "@code-ui/core";
  const config: CodeUIConfig;
  export default config;
}

declare module "virtual:cui/theme" {
  const themes: Record<string, Record<string, any>>;
  export default themes;
}

declare module "virtual:cui/theme/*" {
  const theme: Record<string, any>;
  export default theme;
}
