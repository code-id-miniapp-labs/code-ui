import type {
  QrCodeApi,
  QrCodeEncodingOptions,
  QrCodeService,
} from "./qr-code.types";
import * as dom from "./qr-code.dom";

export function connectQrCode(service: QrCodeService): QrCodeApi {
  const { state, send, context, computed, scope } = service;

  const currentState = state.get();
  const value = context.get("value");
  const pixelSize = computed("pixelSize");
  const overlaySrc = computed("overlaySrc");
  const showOverlay = computed("showOverlay");

  const resolvedEncoding = computed("resolvedEncoding");
  const ecc = computed("ecc");
  const border = computed("border");
  const encoded = computed("encoded");
  const viewBoxSize = computed("viewBoxSize");
  const path = computed("path");
  const dataUrl = computed("dataUrl");

  const rootProps: Record<string, any> = {
    id: dom.getRootId(scope),
    "data-state": currentState,
    "data-ecc": ecc,
    "aria-role": "img",
    "aria-label": computed("ariaLabel"),
    style: computed("rootStyle"),
  };

  const frameProps: Record<string, any> = {
    id: dom.getFrameId(scope),
    src: dataUrl,
    mode: "aspectFit",
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: `0 0 ${viewBoxSize} ${viewBoxSize}`,
    width: viewBoxSize,
    height: viewBoxSize,
  };

  const patternProps: Record<string, any> = {
    id: dom.getPatternId(scope),
    d: path,
    fill: "currentColor",
  };

  const overlayProps: Record<string, any> = {
    id: dom.getOverlayId(scope),
    "aria-hidden": true,
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
