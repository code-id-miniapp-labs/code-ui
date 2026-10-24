import type { QrCodeProps } from "./qr-code.types";

export const defaultQrCodeProps: QrCodeProps = {
  value: "",
  defaultValue: "",
  ecc: "M" as const,
  border: 0,
  encoding: {},
  pixelSize: 10,
  size: "md" as const,
  color: "neutral" as const,
  overlaySrc: "",
  showOverlay: false,
  ui: {},
};
