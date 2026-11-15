import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./stepper.anatomy";

export type StepperState = "idle" | "focused";

export type StepperColor =
  | "primary"
  | "neutral"
  | "danger"
  | "success"
  | "warning"
  | "info";

export type StepperSize = "xs" | "sm" | "md" | "lg" | "xl";

export type StepperOrientation = "horizontal" | "vertical";

export type StepperVariant = "subtle" | "solid" | "outline";

export type StepperStatus = "completed" | "current" | "upcoming" | "disabled";

export interface StepperGroupContext {
  readonly step: () => number;
  readonly count: () => number;
  readonly linear: () => boolean;
  readonly orientation: () => StepperOrientation;
  readonly color: () => StepperColor;
  readonly size: () => StepperSize;
  readonly variant: () => StepperVariant;
  readonly disabled: () => boolean;

  setStep: (step: number) => void;
  next: () => void;
  previous: () => void;
  reset: () => void;
}

export type StepperAnatomyPart = AnatomyPartName<typeof anatomy>;
export type StepperUI = ComponentUI<typeof anatomy>;
export type StepperResolvedUI = ResolvedUI<typeof anatomy>;

export interface StepperStepChangeDetails {
  step: number;
  value: string | number;
  previousStep: number;
}

export interface StepperItem {
  id?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  icon?: string | undefined;
  completedIcon?: string | undefined;
  disabled?: boolean | undefined;
  value?: string | number | undefined;
  ui?: Record<string, any> | undefined;
  [key: string]: any;
}

export interface StepItemComputed {
  index: number;
  value: string | number;
  title: string;
  description: string;
  icon: string;
  completedIcon: string;
  status: StepperStatus;
  isCurrent: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
  isDisabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  ui: Record<string, any>;
  itemProps: Record<string, any>;
}

export interface StepperProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, any> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Custom UI slot classes */
  ui?: StepperUI | undefined;
  /** Controlled active step index (0-based) */
  step?: number | null | undefined;
  /** Controlled active step alias */
  value?: number | null | undefined;
  /** Controlled v-model step alias */
  modelValue?: number | null | undefined;
  /** Default step index for uncontrolled mode */
  defaultStep?: number | undefined;
  /** Total number of steps (when not using items or linked children) */
  count?: number | undefined;
  /** Dynamically linked children count */
  linkedCount?: number | undefined;
  /** Whether progression must be strictly sequential */
  linear?: boolean | undefined;
  /** Layout orientation */
  orientation?: StepperOrientation | undefined;
  /** Semantic color variant */
  color?: StepperColor | undefined;
  /** Size variant */
  size?: StepperSize | undefined;
  /** Visual variant */
  variant?: StepperVariant | undefined;
  /** Whether the entire stepper is disabled */
  disabled?: boolean | undefined;
  /** Step items rendered in data-driven mode */
  items?: StepperItem[] | undefined;
  /** Callback fired when active step changes */
  onChange?: ((details: StepperStepChangeDetails) => void) | undefined;
  /** Callback fired when the final step is reached or completed */
  onComplete?: ((details: { step: number }) => void) | undefined;
  /** v-model update callback */
  onUpdateModelValue?: ((value: number) => void) | undefined;
}

export type StepperDefaultedKey =
  | "step"
  | "value"
  | "modelValue"
  | "defaultStep"
  | "count"
  | "linkedCount"
  | "linear"
  | "orientation"
  | "color"
  | "size"
  | "variant"
  | "disabled"
  | "items"
  | "ui";

export type StepperResolvedProps = Omit<StepperProps, StepperDefaultedKey> & {
  [K in StepperDefaultedKey]-?: Exclude<StepperProps[K], undefined>;
};

export interface StepperContext {
  step: number;
  count: number;
  items: StepperItem[];
  focusedIndex: number | null;
  scrollTargetIndex: number | null;
}

export type StepperEvent =
  | {
      type: "STEP.SET";
      step: number | null | undefined;
      value?: string | number | undefined;
    }
  | { type: "STEP.NEXT" }
  | { type: "STEP.PREV" }
  | { type: "STEP.RESET" }
  | { type: "STEP.COMPLETE" }
  | { type: "STEP.SCROLL_TO"; index: number | null | undefined }
  | { type: "COUNT.SET"; count: number }
  | { type: "ITEMS.SET"; items: StepperItem[] }
  | { type: "FOCUS"; index?: number | undefined }
  | { type: "BLUR" };

export interface StepperComputed {
  totalCount: number;
  percent: number;
  hasNext: boolean;
  hasPrev: boolean;
  isFirst: boolean;
  isLast: boolean;
  isCompleted: boolean;
  isInteractive: boolean;
  scrollTargetIndex: number;
  scrollIntoViewId: string;
}

export interface StepperRefs {
  initialStep?: number | undefined;
  groupContext: StepperGroupContext;
}

export interface StepperSchema extends MachineSchema {
  state: StepperState;
  tag: "idle" | "focused";
  event: StepperEvent;
  props: StepperResolvedProps;
  context: StepperContext;
  computed: StepperComputed;
  refs: StepperRefs;
  action: string;
  effect: string;
  guard: string;
}

export type StepperService = Service<StepperSchema>;
export type StepperMachine = Machine<StepperSchema>;
export type StepperParams = Params<StepperSchema>;

export interface StepperApi {
  /** Current machine state */
  state: StepperState;
  /** Current 0-based active step index */
  step: number;
  /** Current step value or index */
  value: string | number;
  /** Total step count */
  count: number;
  /** Progression percentage (0 - 100) */
  percent: number;
  /** Whether there is a next step */
  hasNext: boolean;
  /** Whether there is a previous step */
  hasPrev: boolean;
  /** Whether on the first step */
  isFirst: boolean;
  /** Whether on the last step */
  isLast: boolean;
  /** Whether all steps are completed */
  isCompleted: boolean;
  /** Pre-computed step items for WXML wx:for */
  steps: StepItemComputed[];
  /** Target step index for auto-scrolling */
  scrollTargetIndex: number;
  /** Element ID to scroll into view */
  scrollIntoViewId: string;
  /** Navigate directly to step index (enforces linear/disabled/bounds guards) */
  setStep: (index: number) => void;
  /** Advance to next step */
  nextStep: () => void;
  /** Return to previous step */
  prevStep: () => void;
  /** Reset to initial step */
  resetStep: () => void;
  /** Mark all steps as complete */
  completeStep: () => void;
  /** Programmatically scroll to step index */
  scrollTo: (index: number) => void;
  /** Root element props */
  rootProps: Record<string, any>;
  /** List element props */
  listProps: Record<string, any>;
  /** Content element props */
  contentProps: Record<string, any>;
  /** Get props for root */
  getRootProps: () => Record<string, any>;
  /** Get props for list */
  getListProps: () => Record<string, any>;
  /** Get props for content */
  getContentProps: (props?: {
    index?: number | undefined;
  }) => Record<string, any>;
}
