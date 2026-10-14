declare module "virtual:cui/theme/button" {
  import type { default as buttonTheme } from "@code-ui/core/src/theme/definitions/button";
  const theme: ReturnType<typeof buttonTheme>;
  export default theme;
}

declare module "virtual:cui/theme/drawer" {
  import type { default as drawerTheme } from "@code-ui/core/src/theme/definitions/drawer";
  const theme: ReturnType<typeof drawerTheme>;
  export default theme;
}

declare module "virtual:cui/theme/*" {
  const theme: any;
  export default theme;
}

declare module "virtual:cui/theme" {
  const themes: Record<string, any>;
  export default themes;
}

declare module "virtual:cui/config" {
  const config: any;
  export default config;
}
