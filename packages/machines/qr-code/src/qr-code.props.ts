import type { QrCodeResolvedProps } from "./qr-code.types";

export const defaultQrCodeProps: QrCodeResolvedProps = {
  value: null,
  defaultValue: "",
  ecc: "M",
  border: 0,
  encoding: {},
  pixelSize: 10,
  size: "md",
  color: "neutral",
  overlaySrc: "",
  showOverlay: false,
  ui: {},
};
