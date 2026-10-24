import type {
  QrCodeApi,
  QrCodeEncodingOptions,
  QrCodeService,
} from "./qr-code.types";
import { parts } from "./qr-code.anatomy";
import * as dom from "./qr-code.dom";

export function connectQrCode(service: QrCodeService): QrCodeApi {
  const { state, send, context, computed, scope } = service;

  const currentState = state.get();
  const value = context.get("value");
  const size = context.get("size");
  const color = context.get("color");
  const pixelSize = context.get("pixelSize");
  const overlaySrc = context.get("overlaySrc");
  const showOverlay = Boolean(context.get("showOverlay") || overlaySrc);

  const resolvedEncoding = computed("resolvedEncoding");
  const ecc = resolvedEncoding.ecc ?? "M";
  const border = resolvedEncoding.border ?? 0;
  const encoded = computed("encoded");
  const viewBoxSize = computed("viewBoxSize");
  const path = computed("path");
  const dataUrl = computed("dataUrl");

  const rootProps: Record<string, any> = {
    id: dom.getRootId(scope),
    ...parts.root.attrs,
    "data-state": currentState,
    "data-size": size,
    "data-color": color,
    "data-ecc": ecc,
    role: "img",
    "aria-label": value ? `QR code for ${value}` : "QR code",
    style: `--qrcode-pixel-size: ${pixelSize}px; --qrcode-width: ${viewBoxSize}px; --qrcode-height: ${viewBoxSize}px;`,
  };

  const frameProps: Record<string, any> = {
    id: dom.getFrameId(scope),
    ...parts.frame.attrs,
    src: dataUrl,
    mode: "aspectFit",
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: `0 0 ${viewBoxSize} ${viewBoxSize}`,
    width: viewBoxSize,
    height: viewBoxSize,
  };

  const patternProps: Record<string, any> = {
    id: dom.getPatternId(scope),
    ...parts.pattern.attrs,
    d: path,
    fill: "currentColor",
  };

  const overlayProps: Record<string, any> = {
    id: dom.getOverlayId(scope),
    ...parts.overlay.attrs,
    "aria-hidden": "true",
  };

  return {
    state: currentState,
    value,
    encoded,
    path,
    viewBoxSize,
    matrixSize: encoded.size,
    pixelSize,
    ecc,
    border,
    encoding: resolvedEncoding,
    size,
    color,
    overlaySrc,
    showOverlay,
    dataUrl,

    setValue(nextValue: string) {
      send({ type: "VALUE.SET", value: nextValue });
    },

    setEncoding(nextEncoding: QrCodeEncodingOptions) {
      send({ type: "ENCODING.SET", encoding: nextEncoding });
    },

    getDataUrl(_type: "svg" = "svg") {
      return dataUrl;
    },

    getRootProps() {
      return rootProps;
    },

    getFrameProps() {
      return frameProps;
    },

    getPatternProps() {
      return patternProps;
    },

    getOverlayProps() {
      return overlayProps;
    },

    rootProps,
    frameProps,
    patternProps,
    overlayProps,
  };
}
