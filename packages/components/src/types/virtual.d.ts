declare module "virtual:cui/theme/button" {
  import type { default as buttonTheme } from "@code-ui/core/src/theme/definitions/button";
  const theme: ReturnType<typeof buttonTheme>;
  export default theme;
}

declare module "virtual:cui/theme/card" {
  import type { default as cardTheme } from "@code-ui/core/src/theme/definitions/card";
  const theme: ReturnType<typeof cardTheme>;
  export default theme;
}

declare module "virtual:cui/theme/chip" {
  import type { default as chipTheme } from "@code-ui/core/src/theme/definitions/chip";
  const theme: ReturnType<typeof chipTheme>;
  export default theme;
}

declare module "virtual:cui/theme/drawer" {
  import type { default as drawerTheme } from "@code-ui/core/src/theme/definitions/drawer";
  const theme: ReturnType<typeof drawerTheme>;
  export default theme;
}

declare module "virtual:cui/theme/form" {
  import type { default as formTheme } from "@code-ui/core/src/theme/definitions/form";
  const theme: ReturnType<typeof formTheme>;
  export default theme;
}

declare module "virtual:cui/theme/form-field" {
  import type { default as formFieldTheme } from "@code-ui/core/src/theme/definitions/form-field";
  const theme: ReturnType<typeof formFieldTheme>;
  export default theme;
}

declare module "virtual:cui/theme/pin-input" {
  import type { default as pinInputTheme } from "@code-ui/core/src/theme/definitions/pin-input";
  const theme: ReturnType<typeof pinInputTheme>;
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
