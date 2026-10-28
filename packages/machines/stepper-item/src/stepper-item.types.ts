import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { EventBus, MiniAppComponent } from "@code-ui/utils";
import type {
  StepperBusEvents,
  StepperColor,
  StepperOrientation,
  StepperSize,
  StepperStatus,
  StepperVariant,
} from "@code-ui/stepper";
import type { anatomy } from "./stepper-item.anatomy";

export type StepperItemState = "idle";

export type StepperItemAnatomyPart = AnatomyPartName<typeof anatomy>;
export type StepperItemUI = ComponentUI<typeof anatomy>;
export type StepperItemResolvedUI = ResolvedUI<typeof anatomy>;

export interface StepperItemProps {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  stepperId?: string | undefined;
  component?: MiniAppComponent | undefined;
  groupBus?: EventBus<StepperBusEvents> | undefined;
  ui?: StepperItemUI | undefined;
  index?: number | null | undefined;
  title?: string | undefined;
  description?: string | undefined;
  icon?: string | undefined;
  completedIcon?: string | undefined;
  disabled?: boolean | undefined;
  completed?: boolean | null | undefined;
  status?: StepperStatus | "" | undefined;
  value?: string | number | undefined;
  isLast?: boolean | null | undefined;
  orientation?: StepperOrientation | "" | undefined;
  color?: StepperColor | "" | undefined;
  size?: StepperSize | "" | undefined;
  variant?: StepperVariant | "" | undefined;
  groupStep?: number | undefined;
  groupCount?: number | undefined;
  groupIndex?: number | undefined;
  groupIsLast?: boolean | undefined;
  groupLinear?: boolean | undefined;
  groupOrientation?: StepperOrientation | "" | undefined;
  groupDisabled?: boolean | undefined;
  groupColor?: StepperColor | "" | undefined;
  groupSize?: StepperSize | "" | undefined;
  groupVariant?: StepperVariant | "" | undefined;
  onClick?:
    | ((details: {
        index: number;
        value: string | number;
        status: StepperStatus;
      }) => void)
    | undefined;
}

export interface StepperItemContext {
  stepperId: string;
  index: number | null;
  title: string;
  description: string;
  icon: string;
  completedIcon: string;
  disabled: boolean;
  completed: boolean | null;
  status: StepperStatus | "";
  value: string | number;
  isLast: boolean | null;
  orientation: StepperOrientation | "";
  color: StepperColor | "";
  size: StepperSize | "";
  variant: StepperVariant | "";
  groupStep: number;
  groupCount: number;
  groupIndex: number;
  groupIsLast: boolean;
  groupLinear: boolean;
  groupOrientation: StepperOrientation | "";
  groupDisabled: boolean;
  groupColor: StepperColor | "";
  groupSize: StepperSize | "";
  groupVariant: StepperVariant | "";
  ui: StepperItemUI;
}

export type StepperItemEvent = { type: "TAP" } | { type: "SELECT" };

export interface StepperItemComputed {
  resolvedIndex: number;
  resolvedIsLast: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
  isDisabled: boolean;
  status: StepperStatus;
  effectiveOrientation: StepperOrientation;
  effectiveColor: StepperColor;
  effectiveSize: StepperSize;
  effectiveVariant: StepperVariant;
}

export interface StepperItemRefs {
  currentGroupBus?: EventBus<StepperBusEvents> | undefined;
  busDisposers?: Array<() => void> | undefined;
}

export interface StepperItemSchema extends MachineSchema {
  state: StepperItemState;
  tag: "idle";
  event: StepperItemEvent;
  props: StepperItemProps;
  context: StepperItemContext;
  computed: StepperItemComputed;
  refs: StepperItemRefs;
  action: string;
  effect: string;
  guard: string;
}

export type StepperItemService = Service<StepperItemSchema>;
export type StepperItemMachine = Machine<StepperItemSchema>;
export type StepperItemParams = Params<StepperItemSchema>;

export interface StepperItemApi {
  stepperId: string;
  index: number;
  resolvedIndex: number;
  resolvedIsLast: boolean;
  title: string;
  description: string;
  icon: string;
  completedIcon: string;
  value: string | number;
  status: StepperStatus;
  isCompleted: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
  isDisabled: boolean;
  disabled: boolean;
  orientation: StepperOrientation;
  color: StepperColor;
  size: StepperSize;
  variant: StepperVariant;
  handleTap: (e?: any) => void;
  itemProps: Record<string, any>;
  triggerProps: Record<string, any>;
  indicatorProps: Record<string, any>;
  separatorProps: Record<string, any>;
  titleProps: Record<string, any>;
  descriptionProps: Record<string, any>;
}
