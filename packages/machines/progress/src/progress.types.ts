import type { AnatomyPartName, ComponentUI } from "@code-ui/anatomy";
import type {
  Machine,
  MachineSchema,
  Params,
  Service,
  ThemeColor,
} from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./progress.anatomy";

export type ProgressOrientation = "horizontal" | "vertical";
export type ProgressType = "linear" | "circular";
export type ProgressState = "idle";
export type ProgressStatus = "indeterminate" | "loading" | "complete";

export type ProgressSize =
  | "2xs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | (string & {});

export type ProgressColor = ThemeColor | (string & {});

export type ProgressAnimation =
  | "carousel"
  | "carousel-inverse"
  | "swing"
  | "elastic"
  | (string & {});

export type ProgressAnatomyPart = AnatomyPartName<typeof anatomy>;
export type ProgressUI = ComponentUI<typeof anatomy>;

export interface ProgressValueDetails {
  value: number | null;
  max: number;
  percent: number;
}

export interface ProgressValueChangeDetails {
  value: number | null;
  percent: number;
}

export interface ProgressTranslations {
  value?: ((details: ProgressValueDetails) => string) | undefined;
}

export interface ProgressProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Partial<Record<ProgressAnatomyPart, string>> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Custom UI slot classes for progress anatomy parts */
  ui?: ProgressUI | undefined;
  /** The current numeric progress value, or null for indeterminate mode */
  value?: number | null | undefined;
  /** Initial progress value when uncontrolled */
  defaultValue?: number | null | undefined;
  /** The minimum allowed value */
  min?: number | undefined;
  /** The maximum allowed value */
  max?: number | undefined;
  /** Orientation of the progress bar ("horizontal" | "vertical") */
  orientation?: ProgressOrientation | undefined;
  /** Visual type of progress bar ("linear" | "circular") */
  type?: ProgressType | undefined;
  /** Size variant */
  size?: ProgressSize | undefined;
  /** Color theme of the progress range indicator */
  color?: ProgressColor | undefined;
  /** Whether the progress bar has striped pattern */
  striped?: boolean | undefined;
  /** Whether stripes or progress bar are animated */
  animated?: boolean | undefined;
  /** Indeterminate animation style ("carousel" | "carousel-inverse" | "swing" | "elastic") */
  animation?: ProgressAnimation | undefined;
  /** Whether progress is inverted (fills right-to-left or top-to-bottom) */
  inverted?: boolean | undefined;
  /** Circular progress circle radius (viewBox 0 0 100 100) */
  circleRadius?: number | undefined;
  /** Circular progress stroke width */
  strokeWidth?: number | undefined;
  /** Localized text / formatting callbacks */
  translations?: ProgressTranslations | undefined;
  /** Callback fired when progress value changes */
  onValueChange?: ((details: ProgressValueChangeDetails) => void) | undefined;
}

export type ProgressEvent =
  | { type: "SET_VALUE"; value: number | null }
  | { type: "VALUE.SET"; value: number | null }
  | { type: "SET_MIN"; min: number }
  | { type: "SET_MAX"; max: number }
  | { type: "RESET" };

export interface ProgressContext {
  value: number | null;
  min: number;
  max: number;
  orientation: ProgressOrientation;
  type: ProgressType;
}

export interface ProgressComputed {
  isIndeterminate: boolean;
  percent: number;
  isComplete: boolean;
  progressState: ProgressStatus;
  valueAsString: string;
  circleRadius: number;
  circleCircumference: number;
  circleDashOffset: number;
}

export interface ProgressRefs {}

export interface ProgressSchema extends MachineSchema {
  state: ProgressState;
  tag: "idle";
  event: ProgressEvent;
  props: ProgressProps;
  context: ProgressContext;
  computed: ProgressComputed;
  refs: ProgressRefs;
  action: string;
  effect: string;
  guard: string;
}

export type ProgressMachine = Machine<ProgressSchema>;
export type ProgressService = Service<ProgressSchema>;
export type ProgressParams = Params<ProgressSchema>;

export interface ProgressApi {
  /** Current machine state ('idle') */
  state: ProgressState;
  /** Current numeric value (or null if indeterminate) */
  value: number | null;
  /** Minimum progress value */
  min: number;
  /** Maximum progress value */
  max: number;
  /** Percentage representation (0 to 100, or -1 when indeterminate) */
  percent: number;
  /** Whether the progress is in indeterminate state */
  isIndeterminate: boolean;
  /** Whether the progress has reached maximum value */
  isComplete: boolean;
  /** Formatted string representation of the current value */
  valueAsString: string;
  /** Progress orientation */
  orientation: ProgressOrientation;
  /** Visual type (linear or circular) */
  type: ProgressType;
  /** Size variant */
  size: ProgressSize;
  /** Color theme */
  color: ProgressColor;
  /** Whether progress has striped pattern */
  striped: boolean;
  /** Whether progress is animated */
  animated: boolean;
  /** Whether progress is inverted */
  inverted: boolean;

  /** Set the progress value */
  setValue(value: number | null): void;
  /** Jump value to min */
  setToMin(): void;
  /** Jump value to max */
  setToMax(): void;
  /** Reset value to defaultValue or null */
  reset(): void;

  /** Root element props */
  rootProps: Record<string, any>;
  /** Label element props */
  labelProps: Record<string, any>;
  /** Track element props */
  trackProps: Record<string, any>;
  /** Range indicator props */
  rangeProps: Record<string, any>;
  /** Value text element props */
  valueTextProps: Record<string, any>;
  /** SVG view container props */
  viewProps: Record<string, any>;
  /** Circular SVG root props */
  circleProps: Record<string, any>;
  /** Circular track background circle props */
  circleTrackProps: Record<string, any>;
  /** Circular range indicator circle props */
  circleRangeProps: Record<string, any>;
}
