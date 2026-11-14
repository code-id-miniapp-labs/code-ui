import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";
import type {
  StepperColor,
  StepperGroupContext,
  StepperOrientation,
  StepperSize,
  StepperStatus,
  StepperVariant,
} from "@code-ui/stepper";
import type { anatomy } from "./stepper-item.anatomy";

export type StepperItemState = StepperStatus;

export type StepperItemAnatomyPart = AnatomyPartName<typeof anatomy>;
export type StepperItemUI = ComponentUI<typeof anatomy>;
export type StepperItemResolvedUI = ResolvedUI<typeof anatomy>;

export interface StepperItemProps {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  stepperId?: string | undefined;
  component?: MiniAppComponent | undefined;
  groupContext?: StepperGroupContext | undefined;
  groupIndex?: number | undefined;
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
  onTap?:
    | ((details: {
        index: number;
        value: string | number;
        status: StepperStatus;
      }) => void)
    | undefined;
}

export type StepperItemDefaultedKey =
  | "stepperId"
  | "index"
  | "isLast"
  | "title"
  | "description"
  | "icon"
  | "completedIcon"
  | "disabled"
  | "completed"
  | "status"
  | "value"
  | "orientation"
  | "color"
  | "size"
  | "variant"
  | "ui";

export type StepperItemResolvedProps = Omit<
  StepperItemProps,
  StepperItemDefaultedKey
> & {
  [K in StepperItemDefaultedKey]-?: Exclude<StepperItemProps[K], undefined>;
};

export interface StepperItemContext {}

export type StepperItemEvent = { type: "TAP" };

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

export interface StepperItemSchema extends MachineSchema {
  state: StepperItemState;
  tag: StepperStatus;
  event: StepperItemEvent;
  props: StepperItemResolvedProps;
  context: StepperItemContext;
  computed: StepperItemComputed;
  action: string;
  effect: string;
  guard: string;
}

export type StepperItemService = Service<StepperItemSchema>;
export type StepperItemMachine = Machine<StepperItemSchema>;
export type StepperItemParams = Params<StepperItemSchema>;

export interface StepperItemApi {
  state: StepperItemState;
  index: number;
  isLast: boolean;
  value: string | number;
  status: StepperStatus;
  isCompleted: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
  isDisabled: boolean;
  orientation: StepperOrientation;
  color: StepperColor;
  size: StepperSize;
  variant: StepperVariant;
  handleTap: () => void;
  itemProps: Record<string, any>;
  triggerProps: Record<string, any>;
}
