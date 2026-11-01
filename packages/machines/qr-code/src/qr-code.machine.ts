import { createMachine, getColors } from "@code-ui/core";
import {
  encode,
  type QrCodeGenerateOptions,
  type QrCodeGenerateResult,
} from "uqr";
import type {
  QrCodeColor,
  QrCodeEcc,
  QrCodeEncodingOptions,
  QrCodeMachine,
  QrCodeSchema,
  QrCodeSize,
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
  } catch {}

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

  context: ({ prop, bindable }) => {
    const rawVal = prop("value");
    const rawDefault = prop("defaultValue");
    const initialValue =
      rawVal !== undefined && rawVal !== null && rawVal !== ""
        ? String(rawVal)
        : rawDefault !== undefined && rawDefault !== null
          ? String(rawDefault)
          : "";

    return {
      value: bindable<string>(() => ({
        value:
          prop("value") !== undefined && prop("value") !== null
            ? String(prop("value"))
            : undefined,
        defaultValue: initialValue,
        onChange: (nextVal) => {
          prop("onChange")?.({ value: nextVal });
        },
      })),

      ecc: bindable<QrCodeEcc>(() => ({
        value:
          prop("ecc") !== undefined ? normalizeEcc(prop("ecc")) : undefined,
        defaultValue: normalizeEcc(defaultQrCodeProps.ecc),
      })),

      border: bindable<number>(() => ({
        value:
          prop("border") !== undefined
            ? normalizeBorder(prop("border"))
            : undefined,
        defaultValue: normalizeBorder(defaultQrCodeProps.border),
      })),

      encoding: bindable<QrCodeEncodingOptions>(() => ({
        value: prop("encoding"),
        defaultValue: defaultQrCodeProps.encoding ?? {},
      })),

      pixelSize: bindable<number>(() => ({
        value:
          prop("pixelSize") !== undefined
            ? normalizePixelSize(prop("pixelSize"))
            : undefined,
        defaultValue: 10,
      })),

      size: bindable<QrCodeSize>(() => ({
        value: prop("size"),
        defaultValue: "md",
      })),

      color: bindable<QrCodeColor>(() => ({
        value: prop("color"),
        defaultValue: "neutral",
      })),

      overlaySrc: bindable<string>(() => ({
        value:
          prop("overlaySrc") !== undefined
            ? String(prop("overlaySrc"))
            : undefined,
        defaultValue: "",
      })),

      showOverlay: bindable<boolean>(() => ({
        value:
          prop("showOverlay") !== undefined
            ? Boolean(prop("showOverlay"))
            : undefined,
        defaultValue: false,
      })),

      ui: bindable<any>(() => ({
        value: prop("ui"),
        defaultValue: {},
      })),
    };
  },

  computed: {
    resolvedEncoding: ({ context }) => {
      const enc = context.get("encoding") ?? {};
      const ecc = normalizeEcc(enc.ecc ?? context.get("ecc"));
      const border = normalizeBorder(enc.border ?? context.get("border"));

      return {
        ...enc,
        ecc,
        border,
      };
    },

    encoded: ({ context, computed }) => {
      const value = String(context.get("value") ?? "");
      const resolvedEncoding = computed("resolvedEncoding");

      const options: QrCodeGenerateOptions = {
        ecc: normalizeEcc(resolvedEncoding.ecc),
        border: normalizeBorder(resolvedEncoding.border),
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

    viewBoxSize: ({ context, computed }) => {
      const encoded = computed("encoded");
      const pixelSize = normalizePixelSize(context.get("pixelSize"));
      return encoded.size * pixelSize;
    },

    path: ({ context, computed }) => {
      const encoded = computed("encoded");
      const pixelSize = normalizePixelSize(context.get("pixelSize"));
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

    dataUrl: ({ context, computed }) => {
      const viewBoxSize = computed("viewBoxSize");
      const path = computed("path");
      if (viewBoxSize <= 0) return "";
      const color = resolveColor(context.get("color"));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${viewBoxSize}" height="${viewBoxSize}"><path fill="${color}" d="${path}"/></svg>`;
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
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
          context.set("value", String(event.value ?? ""));
        }
      },
      setEncodingContext: ({ context, event }) => {
        if ("encoding" in event && event.encoding) {
          const prev = context.get("encoding") ?? {};
          const next = { ...prev, ...event.encoding };
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
