import { createMachine, getColors } from "@code-ui/core";
import {
  encode,
  type QrCodeGenerateOptions,
  type QrCodeGenerateResult,
} from "uqr";
import type {
  QrCodeEcc,
  QrCodeEncodingOptions,
  QrCodeMachine,
  QrCodeSchema,
} from "./qr-code.types";
import { defaultQrCodeProps } from "./qr-code.props";

const VALID_ECC = new Set<QrCodeEcc>(["L", "M", "Q", "H"]);

function extractColorString(val: unknown): string | undefined {
  if (typeof val === "string") {
    return val;
  }
  if (val && typeof val === "object") {
    const dict = val as Record<string, unknown>;
    const candidate =
      dict["500"] ?? dict[500] ?? dict["default"] ?? Object.values(dict)[0];
    if (typeof candidate === "string") {
      return candidate;
    }
  }
  return undefined;
}

export function resolveColor(color: unknown): string {
  if (typeof color !== "string") {
    return "#000000";
  }

  const trimmed = color.trim();
  if (!trimmed) {
    return "#000000";
  }

  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("rgb") ||
    trimmed.startsWith("hsl") ||
    trimmed.startsWith("oklch")
  ) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();

  if (lower === "black") return "#000000";
  if (lower === "white") return "#ffffff";

  let targetColor = lower;
  try {
    const activeColors = getColors() as Record<string, unknown>;
    const visited = new Set<string>();

    while (targetColor && !visited.has(targetColor)) {
      visited.add(targetColor);
      const matched = extractColorString(activeColors[targetColor]);
      if (!matched) break;

      const trimmedMatched = matched.trim();
      if (
        trimmedMatched.startsWith("#") ||
        trimmedMatched.startsWith("rgb") ||
        trimmedMatched.startsWith("hsl") ||
        trimmedMatched.startsWith("oklch")
      ) {
        return trimmedMatched;
      }
      targetColor = trimmedMatched.toLowerCase();
    }
  } catch {
    /* Ignore dynamic color lookup failures outside MiniProgram runtime. */
  }

  return "#000000";
}

function normalizeEcc(ecc: unknown): QrCodeEcc {
  if (typeof ecc === "string") {
    const upper = ecc.toUpperCase() as QrCodeEcc;
    if (VALID_ECC.has(upper)) {
      return upper;
    }
  }
  return "M";
}

function normalizeBorder(border: unknown): number {
  const num = Number(border);
  return Number.isFinite(num) && num >= 0 ? Math.floor(num) : 0;
}

function normalizePixelSize(pixelSize: unknown): number {
  const num = Number(pixelSize);
  return Number.isFinite(num) && num > 0 ? num : 10;
}

const EMPTY_ENCODED: QrCodeGenerateResult = {
  version: 1,
  size: 0,
  maskPattern: 0,
  data: [],
  types: [],
};

export const qrCodeMachine: QrCodeMachine = createMachine<QrCodeSchema>({
  props: ({ props }) => ({
    ...defaultQrCodeProps,
    ...props,
  }),

  initialState: () => "idle",

  context: ({ prop, bindable }) => ({
    value: bindable<string>(() => {
      const propVal = prop("value");
      return {
        value: propVal !== null ? String(propVal) : undefined,
        defaultValue: prop("defaultValue"),
        onChange: (nextVal) => {
          prop("onChange")?.({ value: nextVal });
        },
      };
    }),

    ecc: bindable<QrCodeEcc>(() => ({
      value: normalizeEcc(prop("ecc")),
      defaultValue: normalizeEcc(defaultQrCodeProps.ecc),
    })),

    border: bindable<number>(() => ({
      value: normalizeBorder(prop("border")),
      defaultValue: normalizeBorder(defaultQrCodeProps.border),
    })),

    encoding: bindable<QrCodeEncodingOptions>(() => ({
      value: prop("encoding"),
      defaultValue: defaultQrCodeProps.encoding,
    })),
  }),

  computed: {
    ecc: ({ context }) =>
      normalizeEcc(context.get("encoding").ecc ?? context.get("ecc")),

    border: ({ context }) =>
      normalizeBorder(context.get("encoding").border ?? context.get("border")),

    resolvedEncoding: ({ context, computed }) => ({
      ...context.get("encoding"),
      ecc: computed("ecc"),
      border: computed("border"),
    }),

    pixelSize: ({ prop }) => normalizePixelSize(prop("pixelSize")),

    encoded: ({ context, computed }) => {
      const value = context.get("value");
      const resolvedEncoding = computed("resolvedEncoding");

      const options: QrCodeGenerateOptions = {
        ecc: computed("ecc"),
        border: computed("border"),
      };
      if (resolvedEncoding.maskPattern !== undefined) {
        options.maskPattern = resolvedEncoding.maskPattern;
      }
      if (resolvedEncoding.boostEcc !== undefined) {
        options.boostEcc = resolvedEncoding.boostEcc;
      }
      if (resolvedEncoding.minVersion !== undefined) {
        options.minVersion = resolvedEncoding.minVersion;
      }
      if (resolvedEncoding.maxVersion !== undefined) {
        options.maxVersion = resolvedEncoding.maxVersion;
      }
      if (resolvedEncoding.invert !== undefined) {
        options.invert = resolvedEncoding.invert;
      }

      try {
        return encode(value, options);
      } catch {
        return EMPTY_ENCODED;
      }
    },

    viewBoxSize: ({ computed }) =>
      computed("encoded").size * computed("pixelSize"),

    path: ({ computed }) => {
      const encoded = computed("encoded");
      const pixelSize = computed("pixelSize");
      const { size, data } = encoded;
      const paths: string[] = [];

      for (let row = 0; row < size; row++) {
        const rowData = data[row];
        if (!rowData) continue;
        for (let col = 0; col < size; col++) {
          if (rowData[col]) {
            const x = col * pixelSize;
            const y = row * pixelSize;
            paths.push(`M${x},${y}h${pixelSize}v${pixelSize}h-${pixelSize}z`);
          }
        }
      }

      return paths.join("");
    },

    dataUrl: ({ prop, computed }) => {
      const viewBoxSize = computed("viewBoxSize");
      const path = computed("path");
      if (viewBoxSize <= 0) return "";
      const color = resolveColor(prop("color"));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${viewBoxSize}" height="${viewBoxSize}"><path fill="${color}" d="${path}"/></svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    },

    rootStyle: ({ computed }) => {
      const pixelSize = computed("pixelSize");
      const viewBoxSize = computed("viewBoxSize");
      return `--qrcode-pixel-size: ${pixelSize}px; --qrcode-width: ${viewBoxSize}px; --qrcode-height: ${viewBoxSize}px;`;
    },

    ariaLabel: ({ context }) => {
      const value = context.get("value");
      return value ? `QR code for ${value}` : "QR code";
    },
  },

  on: {
    "VALUE.SET": {
      actions: ["setValueContext"],
    },
    SET_VALUE: {
      actions: ["setValueContext"],
    },
    "ENCODING.SET": {
      actions: ["setEncodingContext"],
    },
    SET_ENCODING: {
      actions: ["setEncodingContext"],
    },
  },

  states: {
    idle: {},
  },

  implementations: {
    actions: {
      setValueContext: ({ context, event }) => {
        if ("value" in event) {
          context.set("value", String(event.value));
        }
      },
      setEncodingContext: ({ context, event }) => {
        if ("encoding" in event && event.encoding) {
          const next = { ...context.get("encoding"), ...event.encoding };
          context.set("encoding", next);
          if (event.encoding.ecc !== undefined) {
            context.set("ecc", normalizeEcc(event.encoding.ecc));
          }
          if (event.encoding.border !== undefined) {
            context.set("border", normalizeBorder(event.encoding.border));
          }
        }
      },
    },
  },
});
