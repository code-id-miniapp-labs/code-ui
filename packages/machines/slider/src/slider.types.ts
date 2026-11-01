import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type {
  BoundFormField,
  FormBusEvents,
  FormValidateOn,
} from "@code-ui/form";
import type {
  EventBus,
  MiniAppComponent,
  MiniAppCustomEvent,
  MiniAppRect,
  MiniAppTouchEvent,
} from "@code-ui/utils";
import type { anatomy } from "./slider.anatomy";

export type SliderOrientation = "horizontal" | "vertical";
export type SliderSize = "xs" | "sm" | "md" | "lg" | "xl";

export type SliderAnatomyPart = AnatomyPartName<typeof anatomy>;
export type SliderUI = ComponentUI<typeof anatomy>;
export type SliderResolvedUI = ResolvedUI<typeof anatomy>;

export interface SliderMark {
  value: number;
  label?: string | undefined;
}

export interface SliderPoint {
  x: number;
  y: number;
}

export interface SliderChangeDetails {
  value: number | number[];
  values: number[];
}

export interface SliderProps {
  id?: string | undefined;
  name?: string | undefined;
  form?: string | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  value?: number | number[] | undefined;
  defaultValue?: number | number[] | undefined;
  orientation?: SliderOrientation | undefined;
  inverted?: boolean | undefined;
  minStepsBetweenThumbs?: number | undefined;
  color?: string | undefined;
  size?: SliderSize | undefined;
  label?: string | undefined;
  marks?: boolean | SliderMark[] | undefined;
  formBus?: EventBus<FormBusEvents> | null | undefined;
  formDisabled?: boolean | undefined;
  formReadOnly?: boolean | undefined;
  fieldDisabled?: boolean | undefined;
  fieldSize?: string | undefined;
  validateOn?: FormValidateOn | undefined;
  component?: MiniAppComponent | undefined;
  ui?: SliderUI | undefined;
  className?: string | undefined;
  onChange?: ((details: SliderChangeDetails) => void) | undefined;
  onChangeEnd?: ((details: SliderChangeDetails) => void) | undefined;
  onFocus?: ((details: { index: number; value: number }) => void) | undefined;
  onBlur?: ((details: { index: number; value: number }) => void) | undefined;
}

export interface SliderContext {
  disabled: boolean;
  readOnly: boolean;
  invalid: boolean;
  required: boolean;
  min: number;
  max: number;
  step: number;
  value: number[];
  orientation: SliderOrientation;
  inverted: boolean;
  minStepsBetweenThumbs: number;
  color: string;
  size: SliderSize;
  name: string;
  form: string;
  label: string;
  marks: boolean | SliderMark[];
  formDisabled: boolean;
  formReadOnly: boolean;
  fieldDisabled: boolean;
  fieldSize: string;
  activeThumbIndex: number;
  ui: Record<string, string>;
}

export type SliderState = "idle" | "dragging";

export type SliderEvent =
  | {
      type: "POINTER_DOWN";
      point: SliderPoint;
      rect?: MiniAppRect | undefined;
      index?: number | undefined;
    }
  | {
      type: "POINTER_MOVE";
      point: SliderPoint;
    }
  | {
      type: "POINTER_UP";
    }
  | {
      type: "SET_VALUE";
      value: number | number[];
      index?: number | undefined;
    }
  | {
      type: "STEP_UP";
      index?: number | undefined;
      step?: number | undefined;
    }
  | {
      type: "STEP_DOWN";
      index?: number | undefined;
      step?: number | undefined;
    }
  | {
      type: "RESET_VALUE";
    };

export interface SliderComputed {
  isDisabled: boolean;
  isReadOnly: boolean;
  isInteractive: boolean;
  isDragging: boolean;
  effectiveSize: SliderSize;
  values: number[];
  value: number | number[];
  valueAsPercent: number[];
}

export interface SliderRefs {
  initialValue: number[];
  isRange: boolean;
  rect: MiniAppRect | null;
  activeThumbIndex: number;
  currentFormBus: EventBus<FormBusEvents> | null | undefined;
  formField: BoundFormField | undefined;
}

export interface SliderThumbSnapshot {
  index: number;
  value: number;
  percent: number;
  id: string;
  style: string;
  thumbProps: Record<string, any>;
}

export interface SliderMarkerSnapshot {
  value: number;
  label?: string | undefined;
  percent: number;
  style: string;
  active: boolean;
  markerProps: Record<string, any>;
}

export interface SliderApi {
  state: SliderState;
  value: number | number[];
  values: number[];
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  readOnly: boolean;
  invalid: boolean;
  dragging: boolean;
  orientation: SliderOrientation;
  activeThumbIndex: number;
  thumbs: SliderThumbSnapshot[];
  markers: SliderMarkerSnapshot[];
  rangeStyle: string;
  valueText: string;
  rootProps: Record<string, any>;
  controlProps: Record<string, any>;
  trackProps: Record<string, any>;
  rangeProps: Record<string, any>;
  labelProps: Record<string, any>;
  valueTextProps: Record<string, any>;
  markerGroupProps: Record<string, any>;
  getThumbProps(index?: number): Record<string, any>;
  getMarkerProps(value: number): Record<string, any>;
  setValue(value: number | number[], index?: number): void;
  stepUp(index?: number, step?: number): void;
  stepDown(index?: number, step?: number): void;
  reset(): void;
  handleTouchStart(e: MiniAppTouchEvent): Promise<void> | void;
  handleTouchMove(e: MiniAppTouchEvent): void;
  handleTouchEnd(e: MiniAppTouchEvent): void;
  handleTap(e: MiniAppCustomEvent): Promise<void> | void;
}

export interface SliderSchema extends MachineSchema {
  props: SliderProps;
  context: SliderContext;
  state: SliderState;
  event: SliderEvent;
  computed: SliderComputed;
  refs: SliderRefs;
  action: string;
  guard: string;
  effect: string;
}

export type SliderMachine = Machine<SliderSchema>;
export type SliderService = Service<SliderSchema>;
export type SliderParams = Params<SliderSchema>;
