import { staticComputedBehavior, createComponentOptions } from "../_shared/base";
import { resolveSlots } from "../../utils/ui";
import { getIcon } from "@code-id-labs/core/icons";
import themeConfig from "virtual:cui/theme/icon";
import { tv } from "../../utils/variants";

const iconTheme = tv(themeConfig);

const PATH_RE =
  /^(?:\/|\.\.?\/|https?:\/\/|data:image\/)|\.(?:svg|png|jpe?g|webp|gif)$/i;
const NAMED_SIZES = new Set(["xs", "sm", "md", "lg", "xl"]);
const RAW_COLOR_RE = /^#|^(?:rgb|hsl|oklch)a?\(|^var\(/i;
const NUMBER_RE = /^\d+(?:\.\d+)?$/;

function normalizeIconSize(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || NAMED_SIZES.has(trimmed)) return "";
  return NUMBER_RE.test(trimmed) ? `${trimmed}px` : trimmed;
}

Component(
  createComponentOptions({
    behaviors: [staticComputedBehavior],

    properties: {
      name: {
        type: String,
        value: "",
      },
      size: {
        type: String,
        value: "",
      },
      color: {
        type: String,
        value: "",
      },
      spin: {
        type: Boolean,
        value: false,
      },
      ui: {
        type: Object,
        value: {},
      },
      className: {
        type: String,
        value: "",
      },
    },

    computed: {
      resolvedName() {
        const raw = this.data.name;
        if (!raw) return "";
        return getIcon(raw) || raw;
      },
      isPath() {
        return PATH_RE.test(this.data.resolvedName);
      },
      iconStyle() {
        const parts: string[] = [];
        const customSize = normalizeIconSize(String(this.data.size || ""));
        if (customSize) {
          parts.push(
            `width: ${customSize}`,
            `height: ${customSize}`,
            `font-size: ${customSize}`,
          );
        }
        const rawColor = String(this.data.color || "").trim();
        if (rawColor && RAW_COLOR_RE.test(rawColor)) {
          parts.push(`color: ${rawColor}`);
        }
        return parts.length > 0 ? `${parts.join("; ")};` : "";
      },
      classes() {
        const rawSize = String(this.data.size || "");
        const sizeVariant = NAMED_SIZES.has(rawSize) ? rawSize : undefined;
        const rawColor = String(this.data.color || "").trim();
        const colorVariant =
          rawColor && !RAW_COLOR_RE.test(rawColor) ? rawColor : undefined;
        const spinVariant = Boolean(this.data.spin);

        const theme = iconTheme({
          ...(sizeVariant ? { size: sizeVariant } : {}),
          ...(colorVariant ? { color: colorVariant } : {}),
          ...(spinVariant ? { spin: true } : {}),
        });
        return resolveSlots(theme, this.data.ui, this.data.className);
      },
    },
  }),
);
