import type { AnatomyPartName, ComponentUI } from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";
import type { QrCodeGenerateResult } from "uqr";
import type { anatomy } from "./qr-code.anatomy";

export type QrCodeEcc = "L" | "M" | "Q" | "H";

export type QrCodeSize = "xs" | "sm" | "md" | "lg" | "xl" | (string & {});

export type QrCodeColor =
  | "primary"
  | "neutral"
  | "danger"
  | "success"
  | "warning"
  | "info"
  | (string & {});

export type QrCodeState = "idle";

export type QrCodeAnatomyPart = AnatomyPartName<typeof anatomy>;
export type QrCodeUI = ComponentUI<typeof anatomy>;

export interface QrCodeEncodingOptions {
  /**
   * Error correction level
   * - L: ~7% data loss recovery
   * - M: ~15% data loss recovery
   * - Q: ~25% data loss recovery
   * - H: ~30% data loss recovery
   * @default "M"
   */
  ecc?: QrCodeEcc | undefined;
  /**
   * Quiet zone border around the QR code (in modules)
   * @default 0
   */
  border?: number | undefined;
  /**
   * Mask pattern to use (-1 for auto)
   * @default -1
   */
  maskPattern?: number | undefined;
  /**
   * Boost the error correction level to maximum allowed by version and size
   */
  boostEcc?: boolean | undefined;
  /**
   * Minimum version of the QR code (1-40)
   * @default 1
   */
  minVersion?: number | undefined;
  /**
   * Maximum version of the QR code (1-40)
   * @default 40
   */
  maxVersion?: number | undefined;
  /**
   * Invert black and white modules
   */
  invert?: boolean | undefined;
}

export interface QrCodeValueChangeDetails {
  value: string;
}

export interface QrCodeProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, string> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Custom UI slot classes for qr-code anatomy parts */
  ui?: QrCodeUI | undefined;
  /** The payload string/URL to encode into the QR code */
  value?: string | undefined;
  /** Initial value when uncontrolled */
  defaultValue?: string | undefined;
  /** Error correction level shorthand ("L" | "M" | "Q" | "H") */
  ecc?: QrCodeEcc | undefined;
  /** Quiet zone border module count shorthand */
  border?: number | undefined;
  /** Full encoding configuration options for uqr */
  encoding?: QrCodeEncodingOptions | undefined;
  /** Pixel size multiplier per QR module (used for SVG viewBox calculations) */
  pixelSize?: number | undefined;
  /** Size variant of the QR code */
  size?: QrCodeSize | undefined;
  /** Color theme of the QR code pattern */
  color?: QrCodeColor | undefined;
  /** Optional center logo/image source URL */
  overlaySrc?: string | undefined;
  /** Whether to render the center overlay slot when no overlaySrc is provided */
  showOverlay?: boolean | undefined;
  /** Callback fired when encoded value changes */
  onValueChange?: ((details: QrCodeValueChangeDetails) => void) | undefined;
}

export type QrCodeEvent =
  | { type: "VALUE.SET"; value: string }
  | { type: "SET_VALUE"; value: string }
  | { type: "ENCODING.SET"; encoding: QrCodeEncodingOptions }
  | { type: "SET_ENCODING"; encoding: QrCodeEncodingOptions };

export interface QrCodeContext {
  value: string;
  ecc: QrCodeEcc;
  border: number;
  encoding: QrCodeEncodingOptions;
  pixelSize: number;
  size: QrCodeSize;
  color: QrCodeColor;
  overlaySrc: string;
  showOverlay: boolean;
  ui: QrCodeUI;
}

export interface QrCodeComputed {
  resolvedEncoding: QrCodeEncodingOptions;
  encoded: QrCodeGenerateResult;
  path: string;
  viewBoxSize: number;
  dataUrl: string;
}

export interface QrCodeRefs {
  prevValueProp: string | undefined;
  prevEccProp: QrCodeEcc | undefined;
  prevBorderProp: number | undefined;
  prevEncodingProp: QrCodeEncodingOptions | undefined;
}

export interface QrCodeSchema extends MachineSchema {
  state: QrCodeState;
  tag: never;
  event: QrCodeEvent;
  props: QrCodeProps;
  context: QrCodeContext;
  computed: QrCodeComputed;
  refs: QrCodeRefs;
  action: string;
  effect: string;
  guard: string;
}

export type QrCodeMachine = Machine<QrCodeSchema>;
export type QrCodeService = Service<QrCodeSchema>;
export type QrCodeParams = Params<QrCodeSchema>;

export interface QrCodeApi {
  /** Current machine state ('idle') */
  state: QrCodeState;
  /** Current encoded payload string */
  value: string;
  /** Computed QR matrix result from uqr */
  encoded: QrCodeGenerateResult;
  /** Computed SVG `<path d="...">` string for the dark modules */
  path: string;
  /** Total SVG coordinate size (`encoded.size * pixelSize`) */
  viewBoxSize: number;
  /** Matrix module count (`encoded.size`, including quiet zone border) */
  matrixSize: number;
  /** Size multiplier per module */
  pixelSize: number;
  /** Active error correction level */
  ecc: QrCodeEcc;
  /** Active quiet zone border width (in modules) */
  border: number;
  /** Resolved encoding options */
  encoding: QrCodeEncodingOptions;
  /** Size variant ('xs' | 'sm' | 'md' | 'lg' | 'xl') */
  size: QrCodeSize;
  /** Color theme */
  color: QrCodeColor;
  /** Optional center logo/image source URL */
  overlaySrc: string;
  /** Whether center overlay slot is visible */
  showOverlay: boolean;
  /** Data URL (`data:image/svg+xml;utf8,...`) for image rendering or export */
  dataUrl: string;

  /** Update the encoded QR code value */
  setValue(value: string): void;
  /** Update the encoding options (ecc, border, etc.) */
  setEncoding(encoding: QrCodeEncodingOptions): void;
  /** Generate a Data URL string (`data:image/svg+xml;utf8,...`) */
  getDataUrl(type?: "svg"): string;

  /** Prop getter for Root container */
  getRootProps(): Record<string, any>;
  /** Prop getter for SVG Frame */
  getFrameProps(): Record<string, any>;
  /** Prop getter for SVG Pattern path */
  getPatternProps(): Record<string, any>;
  /** Prop getter for Center Overlay */
  getOverlayProps(): Record<string, any>;

  /** Pre-computed WXML data & attributes for Root container */
  rootProps: Record<string, any>;
  /** Pre-computed WXML data & attributes for SVG Frame */
  frameProps: Record<string, any>;
  /** Pre-computed WXML data & attributes for SVG Pattern path */
  patternProps: Record<string, any>;
  /** Pre-computed WXML data & attributes for Center Overlay */
  overlayProps: Record<string, any>;
}
