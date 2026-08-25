export interface CodeUIPluginOptions {
  /**
   * Which prebuilt components to include from @code-ui/components/dist.
   * These will be copied into the miniprogram npm output directory.
   * Defaults to all available components: ["drawer", "button"].
   */
  components?: string[];

  /**
   * The source path of @code-ui/components/dist to copy from.
   * Defaults to "node_modules/@code-ui/components/dist".
   */
  sourcePath?: string;

  /**
   * Output path for the native miniprogram components inside the build output.
   * Defaults to "dist/miniprogram_npm/@code-ui/components".
   */
  outputPath?: string;

  /**
   * Additional webpack include patterns beyond the default /@code-ui/ regex.
   * Useful for monorepo setups where packages are symlinked via workspace paths.
   */
  extraIncludes?: Array<string | RegExp | ((path: string) => boolean)>;

  /**
   * Whether to inject JSX intrinsic element type declarations for
   * `cui-button`, `cui-drawer`, etc. into the webpack build context.
   * Defaults to true.
   */
  injectTypes?: boolean;
}
