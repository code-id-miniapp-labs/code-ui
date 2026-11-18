export interface CodeUIPluginOptions {
  /**
   * Which prebuilt components to include from @code-id-labs/components/dist.
   * These will be copied into the miniprogram npm output directory.
   * Defaults to all available components: ["drawer", "button"].
   */
  components?: string[];

  /**
   * The source path of @code-id-labs/components/dist to copy from.
   * Defaults to "node_modules/@code-id-labs/components/dist".
   */
  sourcePath?: string;

  /**
   * Output path for the native miniprogram components inside the build output.
   * Defaults to "dist/miniprogram_npm/@code-id-labs/components".
   */
  outputPath?: string;

  /**
   * Additional webpack include patterns beyond the default /@code-id-labs/ regex.
   * Useful for monorepo setups where packages are symlinked via workspace paths.
   */
  extraIncludes?: Array<string | RegExp | ((path: string) => boolean)>;

  /**
   * Whether to inject JSX intrinsic element type declarations for
   * `cui-button`, `cui-drawer`, etc. into the webpack build context.
   * Defaults to true.
   */
  injectTypes?: boolean;

  /**
   * Theme preset to apply ("default" | "light" | "emerald" | "sunset") or
   * a custom dictionary of CSS custom property tokens.
   * Automatically copies/generates theme.wxss into the miniprogram output.
   */
  theme?: "default" | "light" | "emerald" | "sunset" | Record<string, string>;
}
