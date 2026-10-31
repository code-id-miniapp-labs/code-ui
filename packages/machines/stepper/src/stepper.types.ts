import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { EventBus, MiniAppComponent } from "@code-ui/utils";
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

export interface StepperChangePayload {
  step: number;
  count: number;
  linear: boolean;
  orientation: StepperOrientation;
  color: StepperColor;
  size: StepperSize;
  variant: StepperVariant;
  disabled: boolean;
}

export interface StepperBusEvents {
  "stepper:change": StepperChangePayload;
  "item:tap": { index: number; value?: string | number | undefined };
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
  completedIcon?: string | undefined;
  status: StepperStatus;
  isCurrent: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
  isDisabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  ui?: Record<string, any> | undefined;
  itemProps: Record<string, any>;
  triggerProps: Record<string, any>;
  indicatorProps: Record<string, any>;
  separatorProps: Record<string, any>;
  titleProps: Record<string, any>;
  descriptionProps: Record<string, any>;
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
  /** Whether content panel is present */
  hasContent?: boolean | undefined;
  /** Step items rendered in data-driven mode */
  items?: StepperItem[] | undefined;
  /** Callback fired when active step changes */
  onStepChange?: ((details: StepperStepChangeDetails) => void) | undefined;
  /** Generic change callback */
  onChange?: ((details: StepperStepChangeDetails) => void) | undefined;
  /** Callback fired when the final step is reached or completed */
  onComplete?: ((details: { step: number }) => void) | undefined;
}

export interface StepperContext {
  id: string;
  step: number;
  count: number;
  linkedCount: number;
  linear: boolean;
  orientation: StepperOrientation;
  color: StepperColor;
  size: StepperSize;
  variant: StepperVariant;
  disabled: boolean;
  hasContent: boolean;
  items: StepperItem[];
  focusedIndex: number | null;
  scrollLeft: number;
  scrollTargetIndex: number | null;
  ui: StepperUI;
}

export type StepperEvent =
  | { type: "STEP.SET"; step: number; value?: string | number | undefined }
  | { type: "STEP.NEXT" }
  | { type: "STEP.PREV" }
  | { type: "STEP.RESET" }
  | { type: "STEP.SCROLL_TO"; index: number }
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
  bus?: EventBus<StepperBusEvents> | undefined;
  busDisposers?: Array<() => void> | undefined;
}

export interface StepperSchema extends MachineSchema {
  state: StepperState;
  tag: "idle" | "focused";
  event: StepperEvent;
  props: StepperProps;
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
  /** Whether linear progression is enforced */
  linear: boolean;
  /** Current orientation */
  orientation: StepperOrientation;
  /** Current color */
  color: StepperColor;
  /** Current size */
  size: StepperSize;
  /** Current variant */
  variant: StepperVariant;
  /** Global disabled flag */
  disabled: boolean;
  /** Whether content panel is shown */
  hasContent: boolean;
  /** Pre-computed step items for WXML wx:for */
  steps: StepItemComputed[];
  /** Target step index for auto-scrolling */
  scrollTargetIndex: number;
  /** Element ID to scroll into view */
  scrollIntoViewId: string;
  /** Horizontal scroll position (in px) */
  scrollLeft: number;
  /** Navigate directly to step index */
  setStep: (index: number) => void;
  /** Safe navigation respecting linear progression */
  goToStep: (index: number) => void;
  /** Advance to next step */
  nextStep: () => void;
  /** Return to previous step */
  prevStep: () => void;
  /** Reset to initial step */
  resetStep: () => void;
  /** Mark all steps as complete */
  completeStep: () => void;
  /** Complete alias */
  complete: () => void;
  /** Programmatically scroll to step index */
  scrollTo: (index: number) => void;
  /** Programmatically scroll to step index (alias) */
  scrollToStep: (index: number) => void;
  /** Clear/reset alias for useChild compatibility */
  clear: () => void;
  /** Reset alias for useChild compatibility */
  reset: () => void;
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
  /** Get props for step item */
  /** Get props for step trigger */
  getTriggerProps: (props: { index: number }) => Record<string, any>;
  /** Get props for step indicator */
  getIndicatorProps: (props: { index: number }) => Record<string, any>;
  /** Get props for step separator */
  getSeparatorProps: (props: { index: number }) => Record<string, any>;
  /** Get props for step title */
  getTitleProps: (props: { index: number }) => Record<string, any>;
  /** Get props for step description */
  getDescriptionProps: (props: { index: number }) => Record<string, any>;
}
