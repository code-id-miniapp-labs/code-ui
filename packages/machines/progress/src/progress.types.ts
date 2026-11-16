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
  id?: string | undefined;
  ids?: Partial<Record<ProgressAnatomyPart, string>> | undefined;
  component?: MiniAppComponent | undefined;
  value?: number | null | undefined;
  defaultValue?: number | null | undefined;
  min?: number | undefined;
  max?: number | undefined;
  translations?: ProgressTranslations | undefined;
  indeterminate?: boolean | undefined;
  onValueChange?: ((details: ProgressValueChangeDetails) => void) | undefined;
}

export type ProgressDefaultedKey =
  | "value"
  | "defaultValue"
  | "min"
  | "max"
  | "indeterminate";

export type ProgressResolvedProps = Omit<
  ProgressProps,
  ProgressDefaultedKey
> & {
  [K in ProgressDefaultedKey]-?: Exclude<ProgressProps[K], undefined>;
};

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
}

export interface ProgressComputed {
  isIndeterminate: boolean;
  percent: number;
  isComplete: boolean;
  progressState: ProgressStatus;
  valueAsString: string;
}

export interface ProgressRefs {}

export interface ProgressSchema extends MachineSchema {
  state: ProgressState;
  tag: "idle";
  event: ProgressEvent;
  props: ProgressResolvedProps;
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
  state: ProgressState;
  progressState: ProgressStatus;
  value: number | null;
  min: number;
  max: number;
  percent: number;
  isIndeterminate: boolean;
  isComplete: boolean;
  valueAsString: string;

  setValue(value: number | null): void;
  setToMin(): void;
  setToMax(): void;
  reset(): void;

  rootProps: Record<string, any>;
  labelProps: Record<string, any>;
  trackProps: Record<string, any>;
  rangeProps: Record<string, any>;
  circleProps: Record<string, any>;
}
