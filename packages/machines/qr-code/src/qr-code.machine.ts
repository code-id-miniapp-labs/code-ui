import { createMachine, getColors } from "@code-ui/core";
import { encode, type QrCodeGenerateOptions, type QrCodeGenerateResult } from "uqr";
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

const DEFAULT_COLOR_PALETTES: Record<string, string> = {
  neutral: "#171717",
  primary: "#10b981",
  secondary: "#6366f1",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

function resolveColor(color: unknown): string {
  if (typeof color === "string") {
    const trimmed = color.trim();
    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith("rgb") ||
      trimmed.startsWith("hsl")
    ) {
      return trimmed;
    }
    try {
      const activeColors = getColors();
      const matched = activeColors[trimmed];
      if (matched) {
        return String(matched);
      }
    } catch {}
    if (DEFAULT_COLOR_PALETTES[trimmed]) {
      return DEFAULT_COLOR_PALETTES[trimmed];
    }
  }
  return "#171717";
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

  refs: ({ prop }) => ({
    prevValueProp: prop("value"),
    prevEccProp: prop("ecc"),
    prevBorderProp: prop("border"),
    prevEncodingProp: prop("encoding"),
  }),

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
        defaultValue: initialValue,
        onChange: (nextVal) => {
          prop("onValueChange")?.({ value: nextVal });
          prop("component")?.triggerEvent?.("change", { value: nextVal });
          prop("component")?.setData?.({ value: nextVal });
        },
      })),

      ecc: bindable<QrCodeEcc>(() => ({
        defaultValue: normalizeEcc(prop("ecc") ?? defaultQrCodeProps.ecc),
      })),

      border: bindable<number>(() => ({
        defaultValue: normalizeBorder(
          prop("border") ?? defaultQrCodeProps.border,
        ),
      })),

      encoding: bindable<QrCodeEncodingOptions>(() => ({
        defaultValue: prop("encoding") ?? {},
      })),

      pixelSize: bindable<number>(() => ({
        value: normalizePixelSize(
          prop("pixelSize") ?? defaultQrCodeProps.pixelSize,
        ),
        defaultValue: 10,
      })),

      size: bindable<QrCodeSize>(() => ({
        value: prop("size") ?? defaultQrCodeProps.size ?? "md",
        defaultValue: "md",
      })),

      color: bindable<QrCodeColor>(() => ({
        value: prop("color") ?? defaultQrCodeProps.color ?? "neutral",
        defaultValue: "neutral",
      })),

      overlaySrc: bindable<string>(() => ({
        value: String(prop("overlaySrc") ?? ""),
        defaultValue: "",
      })),

      showOverlay: bindable<boolean>(() => ({
        value: Boolean(prop("showOverlay")),
        defaultValue: false,
      })),

      ui: bindable<any>(() => ({
        value: prop("ui") ?? {},
        defaultValue: {},
      })),
    };
  },

  watch: ({ prop, context, refs }) => {
    const nextValueProp = prop("value");
    if (nextValueProp !== refs.get("prevValueProp")) {
      refs.set("prevValueProp", nextValueProp);
      context.set("value", String(nextValueProp ?? ""));
    }

    const nextEccProp = prop("ecc");
    if (nextEccProp !== refs.get("prevEccProp")) {
      refs.set("prevEccProp", nextEccProp);
      context.set("ecc", normalizeEcc(nextEccProp));
    }

    const nextBorderProp = prop("border");
    if (nextBorderProp !== refs.get("prevBorderProp")) {
      refs.set("prevBorderProp", nextBorderProp);
      context.set("border", normalizeBorder(nextBorderProp));
    }

    const nextEncodingProp = prop("encoding");
    if (nextEncodingProp !== refs.get("prevEncodingProp")) {
      refs.set("prevEncodingProp", nextEncodingProp);
      context.set("encoding", nextEncodingProp ?? {});
    }
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

  states: {
    idle: {
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
    },
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
