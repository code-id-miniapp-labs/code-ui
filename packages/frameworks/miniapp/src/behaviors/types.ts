import type { MachineSchema } from "@code-ui/core";

/**
 * Runtime identifier returned by MiniProgram `Behavior(...)`.
 */
export type MiniappBehaviorRef = string;

export interface MachineServiceContextLike {
  get: <T = unknown>(key: string) => T;
}

export interface MachineServiceRefsLike {
  get?: <T = unknown>(key: string) => T | undefined;
}

export interface MachineServiceLike<
  TProps extends Record<string, unknown> = Record<string, unknown>,
  TComputed extends Record<string, unknown> = Record<string, unknown>,
> {
  prop?: <K extends string>(
    key: K,
  ) => K extends keyof TProps ? TProps[K] : unknown;
  computed?: <K extends string>(
    key: K,
  ) => K extends keyof TComputed ? TComputed[K] : unknown;
  context?: MachineServiceContextLike;
  refs?: MachineServiceRefsLike;
  send?: (event: unknown) => void;
}

export interface ComponentMachineHandle<
  _T extends MachineSchema = MachineSchema,
> {
  service?: MachineServiceLike;
  updateProps: (props: Record<string, unknown>) => void;
  send?: (event: unknown) => void;
}

export interface PageRefLike {
  getPageId?: () => string;
  __cuiApp?: unknown;
}

export interface BaseComponentData extends Record<string, unknown> {
  id?: string | undefined;
  name?: string | undefined;
  size?: string | undefined;
  color?: string | undefined;
  variant?: string | undefined;
  orientation?: string | undefined;
  fitted?: boolean | undefined;
  disabled?: boolean | undefined;
  fieldSize?: string | undefined;
}

/**
 * Strongly-typed MiniApp component instance surface shared across behavior plugins,
 * component relations, ID resolution, and inherited-prop helpers.
 */
export interface CodeUiComponentInstance<
  TData extends Record<string, unknown> = BaseComponentData,
  TMachine extends ComponentMachineHandle<any> = ComponentMachineHandle<any>,
> {
  /** Native MiniProgram WXML `id` attribute (`<c-foo id="bar" />`). */
  id?: string | undefined;
  /** Component properties and reactive `setData` state (`this.data`). */
  data?: TData | undefined;
  /** Stable identifier cached by `@code-ui/miniapp`. */
  __codeUiId?: string | undefined;
  __codeUiMachine?: TMachine | null | undefined;
  __codeUiApi?: Record<string, unknown> | undefined;
  __codeUiOnSnapshot?: ((snapshot: Record<string, unknown>) => void) | undefined;
  setData?: (
    patch: Partial<TData> & Record<string, unknown>,
    callback?: () => void,
  ) => void;
  getRelationNodes?: <
    TNode extends CodeUiComponentInstance<any, any> = CodeUiComponentInstance,
  >(
    relationKey: string,
  ) => TNode[];
  selectAllComponents?: <
    TNode extends CodeUiComponentInstance<any, any> = CodeUiComponentInstance,
  >(
    selector: string,
  ) => TNode[];
  selectOwnerComponent?: (() => CodeUiComponentInstance<any, any> | null | undefined) | undefined;
  getPageId?: () => string;
  __wxExparserNodeId?: string | undefined;
  __wxWebviewId__?: number | undefined;
  __page__?: PageRefLike | undefined;
  $page?: PageRefLike | undefined;
  __cuiApp?: CodeUiComponentInstance<any, any> | undefined;
  __cuiAppParent?: CodeUiComponentInstance<any, any> | undefined;
  is?: string | undefined;
}

export interface GroupVisualData extends Record<string, unknown> {
  groupSize: string;
  groupColor: string;
  groupVariant: string;
}

export interface AccordionVisualData extends Record<string, unknown> {
  groupSize: string;
  groupVariant: string;
}

export interface StepperVisualData extends Record<string, unknown> {
  groupOrientation: string;
  groupColor: string;
  groupSize: string;
  groupVariant: string;
}

export interface TabsVisualData extends Record<string, unknown> {
  groupOrientation: string;
  groupVariant: string;
  groupColor: string;
  groupSize: string;
  groupFitted: boolean | null;
}

export interface SelectVisualData extends Record<string, unknown> {
  groupColor: string;
  groupSize: string;
  groupSelectedIcon: string;
}

export interface FormInheritedData extends Record<string, unknown> {
  fieldSize: string;
}

export interface FormSnapshotLike extends Record<string, unknown> {
  disabled?: boolean | undefined;
  name?: string | undefined;
}

export interface FormParentData extends BaseComponentData {}

export interface FormParentInstance extends CodeUiComponentInstance<FormParentData> {
  __codeUiFormHost?: unknown;
  __codeUiPendingFields?: FormFieldInstance[] | undefined;
}

export interface FormFieldWrapperData extends BaseComponentData {
  formField?: FormSnapshotLike | undefined;
}

export interface FormFieldWrapperInstance extends CodeUiComponentInstance<FormFieldWrapperData> {
  __codeUiFormHost?: unknown;
  __codeUiIsFormFieldWrapper?: boolean | undefined;
  __codeUiFieldChildren?: FormFieldInstance[] | undefined;
}

export interface FormFieldData extends BaseComponentData {
  form?: string | undefined;
  fieldSize?: string | undefined;
}

export interface FormFieldInstance extends CodeUiComponentInstance<FormFieldData> {
  __codeUiFormHost?: unknown;
  __codeUiIsFormFieldWrapper?: boolean | undefined;
  __codeUiFieldWrapper?: FormFieldWrapperInstance | undefined;
  __codeUiFieldChildren?: FormFieldInstance[] | undefined;
}

export interface RadioGroupInstance extends CodeUiComponentInstance<BaseComponentData> {
  __codeUiRadioChildren?: RadioItemInstance[] | undefined;
}

export interface RadioItemInstance extends CodeUiComponentInstance<
  BaseComponentData & Partial<GroupVisualData>
> {
  __codeUiPendingRadioGroup?: RadioGroupInstance | undefined;
}

export interface CheckboxGroupInstance extends CodeUiComponentInstance<BaseComponentData> {
  __codeUiCheckboxChildren?: CheckboxItemInstance[] | undefined;
}

export interface CheckboxItemInstance extends CodeUiComponentInstance<
  BaseComponentData & Partial<GroupVisualData>
> {
  __codeUiPendingCheckboxGroup?: CheckboxGroupInstance | undefined;
}

export interface AccordionInstance extends CodeUiComponentInstance<BaseComponentData> {
  __codeUiAccordionChildren?: AccordionItemInstance[] | undefined;
  __codeUiIsAccordion?: boolean | undefined;
}

export interface AccordionItemInstance extends CodeUiComponentInstance<
  BaseComponentData & Partial<AccordionVisualData>
> {
  __codeUiPendingAccordion?: AccordionInstance | undefined;
  __codeUiAccordionIndex?: number | undefined;
  __codeUiAccordionId?: string | undefined;
}

export interface StepperInstance extends CodeUiComponentInstance<BaseComponentData> {
  __codeUiStepperChildren?: StepperItemInstance[] | undefined;
}

export interface StepperItemInstance extends CodeUiComponentInstance<
  BaseComponentData & Partial<StepperVisualData>
> {
  __codeUiPendingStepper?: StepperInstance | undefined;
  __codeUiStepperIndex?: number | undefined;
  __codeUiStepperId?: string | undefined;
}

export interface TabsInstance extends CodeUiComponentInstance<BaseComponentData> {
  __codeUiTabsChildren?: TabsItemInstance[] | undefined;
}

export interface TabsItemData extends BaseComponentData, Partial<TabsVisualData> {
  mode?: string | undefined;
}

export interface TabsItemInstance extends CodeUiComponentInstance<TabsItemData> {
  __codeUiPendingTabs?: TabsInstance | undefined;
  __codeUiTabsIndex?: number | undefined;
  __codeUiTabsId?: string | undefined;
}

export interface SelectInstance extends CodeUiComponentInstance<BaseComponentData> {
  __codeUiSelectChildren?: SelectItemInstance[] | undefined;
}

export interface SelectItemData
  extends BaseComponentData,
    Partial<SelectVisualData> {
  managed?: boolean | undefined;
  type?: string | undefined;
  value?: string | number | boolean | undefined;
  label?: string | undefined;
  description?: string | undefined;
}

export interface SelectItemInstance extends CodeUiComponentInstance<SelectItemData> {
  __codeUiPendingSelect?: SelectInstance | undefined;
  __codeUiSelectIndex?: number | undefined;
  __codeUiSelectId?: string | undefined;
}

export interface AvatarGroupData extends BaseComponentData {
  max?: number | undefined;
  totalCount?: number | undefined;
  overflowCount?: number | undefined;
  classes?: { base?: string | undefined } | undefined;
}

export interface AvatarGroupInstance extends CodeUiComponentInstance<AvatarGroupData> {
  __codeUiAvatarChildren?: AvatarItemInstance[] | undefined;
}

export interface AvatarItemData extends BaseComponentData {
  isGroupCounter?: boolean | undefined;
  groupAttached?: boolean | undefined;
  groupHidden?: boolean | undefined;
  groupOrder?: number | undefined;
  groupZIndex?: number | undefined;
  groupIsEdge?: boolean | undefined;
  groupSize?: string | undefined;
  groupBaseClass?: string | undefined;
}

export interface AvatarItemInstance extends CodeUiComponentInstance<AvatarItemData> {
  __codeUiIsGroupCounter?: boolean | undefined;
  __codeUiPendingAvatarGroup?: AvatarGroupInstance | undefined;
}

export interface AppOwnerData extends Record<string, unknown> {
  shouldScaleBackground?: boolean | undefined;
  threshold?: number | undefined;
  scaleFactor?: number | undefined;
  scaleBackground?: string | undefined;
  open?: boolean | undefined;
  autoInset?: boolean | undefined;
  mode?: string | undefined;
  placement?: string | undefined;
  autoDetectBars?: boolean | undefined;
  detectedTopBarHeight?: number | undefined;
  detectedBottomBarHeight?: number | undefined;
  hostScaleFactor?: number | undefined;
  hostScaleBackground?: string | undefined;
  scaled?: boolean | undefined;
  topInset?: number | undefined;
  bottomInset?: number | undefined;
}

export interface RectLike {
  height?: number | undefined;
}

export type AppOwnerInstance = CodeUiComponentInstance<AppOwnerData> & {
  __cuiAppChildren?: Set<AppOwnerInstance> | undefined;
  __cuiAppAttached?: boolean | undefined;
  __cuiScaled?: boolean | undefined;
  __cuiScaleId?: string | undefined;
  __cuiScaleFactor?: number | undefined;
  __cuiScaleBackground?: string | undefined;
  __cuiScaleDragging?: boolean | undefined;
  __cuiScaleDragOffset?: number | undefined;
  __cuiScaleDragRafPending?: boolean | undefined;
  __cuiRegisteredSize?: number | undefined;
  __cuiRegisteredBannerSize?: number | undefined;
  __cuiInsetId?: string | undefined;
  __cuiBannerInsetId?: string | undefined;
  __cuiInsetEdge?: "top" | "bottom" | undefined;
  __cuiRegisteredBannerEdge?: "top" | "bottom" | undefined;
  __cuiBannerHeight?: number | undefined;
  __cuiLastKnownHeight?: number | undefined;
  __cuiMeasureRetryTimer?: ReturnType<typeof setTimeout> | null | undefined;
  __cuiBannerMeasureQueued?: boolean | undefined;
  __cuiBannerMeasureNeedsRerun?: boolean | undefined;
  __cuiBannerUnsub?: (() => void) | undefined;
  __cuiScaleUnsub?: (() => void) | undefined;
  __cuiScaleObserver?: boolean | undefined;
  __cuiScaleStop?: (() => void) | undefined;
  __cuiInsetObserver?: boolean | undefined;
  __cuiInsetStop?: (() => void) | undefined;
  __cuiBannerInsetStop?: (() => void) | undefined;
  _lastScaleProgress?: number | undefined;
  pageId?: string | undefined;
  selectOwnerComponent?: (() => AppOwnerInstance | null | undefined) | undefined;
  createSelectorQuery?: (() => unknown) | undefined;
  startScaleGesture?: (() => void) | undefined;
  applyScaleProgress?: ((progress: number) => void) | undefined;
  endScaleGesture?: ((passed: boolean) => void) | undefined;
  detectCustomBars?: (() => void) | undefined;
  applyHostState?: ((state: { insets: { top: number; bottom: number }; scale: { scaled: boolean; factor: number; background?: string | undefined } }) => void) | undefined;
};

export type ToastOwnerInstance = CodeUiComponentInstance<
  Record<string, unknown> & { maxToasts?: number | undefined }
> & {
  __cuiToastHostAttached?: boolean | undefined;
  toastManager?: unknown;
};
