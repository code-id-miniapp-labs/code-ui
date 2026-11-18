import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-id-labs/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-id-labs/core";
import type { MiniAppComponent } from "@code-id-labs/utils";
import type { StepperGroupContext, StepperStatus } from "@code-id-labs/stepper";
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
  index?: number | null | undefined;
  disabled?: boolean | undefined;
  completed?: boolean | null | undefined;
  status?: StepperStatus | "" | undefined;
  value?: string | number | undefined;
  isLast?: boolean | null | undefined;
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
  | "disabled"
  | "completed"
  | "status"
  | "value";

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
  disabled: boolean;
  handleTap: () => void;
  itemProps: Record<string, any>;
  triggerProps: Record<string, any>;
}
