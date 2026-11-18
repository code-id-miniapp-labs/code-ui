import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-id-labs/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-id-labs/core";
import type {
  BoundFormField,
  FormHostContext,
  FormRule,
  FormValidateOn,
} from "@code-id-labs/form";
import type { MiniAppComponent, MiniAppRect } from "@code-id-labs/utils";
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
  value?: number | number[] | string | null | undefined;
  defaultValue?: number | number[] | string | null | undefined;
  orientation?: SliderOrientation | undefined;
  inverted?: boolean | undefined;
  minStepsBetweenThumbs?: number | undefined;
  marks?: boolean | SliderMark[] | undefined;
  rules?: FormRule[] | undefined;
  formContext?: FormHostContext | null | undefined;
  fieldDisabled?: boolean | undefined;
  validateOn?: FormValidateOn | undefined;
  component?: MiniAppComponent | undefined;
  onChange?: ((details: SliderChangeDetails) => void) | undefined;
  onChangeEnd?: ((details: SliderChangeDetails) => void) | undefined;
  onFocus?: ((details: { index: number; value: number }) => void) | undefined;
  onBlur?: ((details: { index: number; value: number }) => void) | undefined;
}

export interface SliderContext {
  invalid: boolean;
  value: number[];
  activeThumbIndex: number;
  rect: MiniAppRect | null;
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
      type: "TAP";
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
      type: "RECT.RESOLVED";
      rect: MiniAppRect;
      point?: SliderPoint | undefined;
      index?: number | undefined;
      commit?: boolean | undefined;
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
  formDisabled: boolean;
  formReadOnly: boolean;
  fieldDisabled: boolean;
  isInvalid: boolean;

  isDisabled: boolean;
  isReadOnly: boolean;
  isInteractive: boolean;
  isDragging: boolean;
  isRange: boolean;
  values: number[];
  value: number | number[];
  valueAsPercent: number[];
}

export interface SliderRefs {
  initialValue: number[];
  rect: MiniAppRect | null;
  formField: BoundFormField | undefined;
}

export interface SliderThumbSnapshot {
  index: number;
  value: number;
  percent: number;
  id: string;
  style: string;
}

export interface SliderMarkerSnapshot {
  value: number;
  label?: string | undefined;
  percent: number;
  style: string;
  active: boolean;
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
  isRange: boolean;
  activeThumbIndex: number;
  thumbs: SliderThumbSnapshot[];
  thumbIds: string;
  thumbPercents: number[];
  rect: MiniAppRect | null;
  markers: SliderMarkerSnapshot[];
  rangeStyle: string;
  valueText: string;
  rootProps: Record<string, any>;
  controlProps: Record<string, any>;
  rangeProps: Record<string, any>;
  setValue(value: number | number[], index?: number): void;
  stepUp(index?: number, step?: number): void;
  stepDown(index?: number, step?: number): void;
  reset(): void;
  handleTouchStart(point?: SliderPoint, rect?: MiniAppRect, index?: number): void;
  handleTouchMove(point?: SliderPoint): void;
  handleTouchEnd(): void;
  handleTap(point?: SliderPoint): void;
}

type SliderDefaultedKey =
  | "value"
  | "defaultValue"
  | "name"
  | "form"
  | "disabled"
  | "readOnly"
  | "invalid"
  | "required"
  | "min"
  | "max"
  | "step"
  | "orientation"
  | "inverted"
  | "minStepsBetweenThumbs"
  | "marks"
  | "fieldDisabled";

export type SliderResolvedProps = Omit<SliderProps, SliderDefaultedKey> & {
  [K in SliderDefaultedKey]-?: Exclude<SliderProps[K], undefined>;
};

export interface SliderSchema extends MachineSchema {
  props: SliderResolvedProps;
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
