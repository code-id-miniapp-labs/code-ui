/** App stylesheet entry (relative to project root), e.g. `src/app.scss`. */
export const APP_STYLE_RE = /^(?:src\/)?app\.(?:scss|sass|less|css|wxss)$/;

/** App script entry (relative to project root), e.g. `src/app.ts`. */
export const APP_ENTRY_RE = /^(?:src\/)?app\.(?:ts|js|tsx|jsx)$/;

/** Fast suffix check before computing `path.relative` for stylesheets. */
export const STYLE_EXT_RE = /\.(?:scss|sass|less|css|wxss)$/;

/** Fast suffix check before computing `path.relative` for app script entry. */
export const APP_SCRIPT_SUFFIX_RE = /(?:^|[\\/])app\.(?:ts|js|tsx|jsx)$/;

/** Query parameters that indicate raw/url/worker asset imports. */
export const RAW_OR_URL_RE = /[?&](?:raw|url|worker)\b/;

export const VIRTUAL_MODULE_ID = "virtual:cui/config";
export const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

export const VIRTUAL_MODULE_SHORT = "virtual:cui-config";
export const RESOLVED_VIRTUAL_MODULE_SHORT = "\0" + VIRTUAL_MODULE_SHORT;

export const VIRTUAL_THEME_ID = "virtual:cui/theme";
export const RESOLVED_VIRTUAL_THEME_ID = "\0" + VIRTUAL_THEME_ID;

export const VIRTUAL_THEME_PREFIX = "virtual:cui/theme/";
export const RESOLVED_VIRTUAL_THEME_PREFIX = "\0" + VIRTUAL_THEME_PREFIX;
