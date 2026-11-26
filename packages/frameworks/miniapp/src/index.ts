/**
 * @code-id-labs/miniapp
 *
 * MiniApp framework integration for code-ui FSM.
 */

export { MiniappMachine } from "./machine";
export { createMachinePropGetter } from "./prop-getter";
export type { UserPropsGetter } from "./prop-getter";
export { normalizeEvent, toMiniEventName } from "./normalize-event";
export type { NormalizedMiniEvent } from "./normalize-event";
export { normalizeProps, createNormalizer } from "./normalize-props";
export type { Normalizer, NormalizerFn } from "./normalize-props";
export { connectToPage, connectToComponent } from "./connect";
export type { ConnectFn, MiniAppInstance } from "./connect";
export {
  createMachineBehavior,
  createProperties,
  getComponentId,
  cleanupComponentId,
} from "./behavior";
export type { CreateMachineBehaviorOptions } from "./behavior";
export type { MachinePlugin } from "./plugin";
export type {
  MiniappBehaviorRef,
  CodeUiComponentInstance,
  BaseComponentData,
  FormParentInstance,
  FormFieldWrapperInstance,
  FormFieldInstance,
  RadioGroupInstance,
  RadioItemInstance,
  CheckboxGroupInstance,
  CheckboxItemInstance,
  AccordionInstance,
  AccordionItemInstance,
  StepperInstance,
  StepperItemInstance,
  TabsInstance,
  TabsItemInstance,
  AvatarGroupInstance,
  AvatarItemInstance,
  AppOwnerInstance,
  ToastOwnerInstance,
} from "./behaviors/types";

export {
  wxButtonBehavior,
} from "./behaviors/button";
export {
  cuiFormParentBehavior,
  cuiFormFieldBehavior,
  cuiFormFieldWrapperBehavior,
  withFormParent,
  withFormField,
  withFormFieldWrapper,
  setupFormRelations,
  handleFormAttached,
  handleFormMachineStarted,
  handleFormReady,
  handleFormDetached,
  linkFieldToParentHost,
  unlinkFieldFromParentHost,
  linkFieldToWrapper,
  unlinkFieldFromWrapper,
  updateChildFromFormFieldWrapper,
} from "./behaviors/form";
export type { WithFormFieldOptions } from "./behaviors/form";
export {
  cuiRadioGroupBehavior,
  cuiRadioGroupParentBehavior,
  cuiRadioItemBehavior,
  withRadioGroup,
  withRadioItem,
  setupRadioRelations,
  handleRadioAttached,
  handleRadioMachineStarted,
  handleRadioReady,
  linkRadioToParentGroup,
  unlinkRadioFromParentGroup,
} from "./behaviors/radio";
export {
  cuiCheckboxGroupBehavior,
  cuiCheckboxGroupParentBehavior,
  cuiCheckboxItemBehavior,
  withCheckboxGroup,
  withCheckboxItem,
  setupCheckboxRelations,
  handleCheckboxAttached,
  handleCheckboxMachineStarted,
  handleCheckboxReady,
  linkCheckboxToParentGroup,
  unlinkCheckboxFromParentGroup,
} from "./behaviors/checkbox";
export {
  cuiStepperBehavior,
  cuiStepperParentBehavior,
  cuiStepperItemBehavior,
  withStepper,
  withStepperItem,
  setupStepperRelations,
  handleStepperAttached,
  handleStepperMachineStarted,
  handleStepperReady,
  syncStepperChildren,
  linkStepperItemToParentGroup,
  unlinkStepperItemFromParentGroup,
} from "./behaviors/stepper";
export {
  cuiAppParentBehavior,
  cuiAppChildBehavior,
  setupAppRelations,
  linkAppChildToParent,
  unlinkAppChildFromParent,
  withAppScale,
  withAppInset,
  withAppBannerInset,
  registerAppHost,
  unregisterAppHost,
  setAppHostVisible,
  getAppHost,
  getAppState,
  getAppMetrics,
  refreshAppMetrics,
  appMetricsSignal,
  getPageAppSignals,
  registerInset,
  unregisterInset,
  requestAppScale,
  releaseAppScale,
  isAppScaled,
  notifyScaleGestureStart,
  notifyScaleGestureProgress,
  notifyScaleGestureEnd,
  notifyScaleGestureDragStart,
  notifyScaleGestureDragMove,
  notifyScaleGestureDragEnd,
} from "./behaviors/app";
export type {
  AppSignal,
  AppInsetEdge,
  AppInsetEntry,
  AppInsets,
  AppScaleRequest,
  AppScaleState,
  AppHostState,
  AppHostAdapter,
  AppMetrics,
  PageAppSignals,
  WithAppScaleOptions,
  WithAppInsetOptions,
} from "./behaviors/app";
export {
  getAppTheme,
  subscribeAppTheme,
  createAppThemeBehavior,
} from "./behaviors/theme";
export type {
  AppColorMode,
  ResolvedThemeMode,
  AppThemeColors,
  AppThemeState,
  AppThemeListener,
} from "./behaviors/theme";
export {
  resolveLifecyclePageId,
  registerPageLifecycleHost,
  subscribePageLifecycle,
  emitPageLifecycle,
  getPageLifecycleSubscriberCount,
} from "./behaviors/page-lifecycle";
export type {
  PageLifecycleEvent,
  PageLifecycleSubscriber,
  PageLifecycleInstanceLike,
} from "./behaviors/page-lifecycle";
export {
  createPresenceController,
  createPresenceBehavior,
  resolvePresenceName,
} from "./behaviors/presence";
export type {
  PresenceLifecycleState,
  PresenceSnapshot,
  PresenceControllerOptions,
  PresenceController,
  PresenceEventLike,
  CreatePresenceBehaviorOptions,
} from "./behaviors/presence";
export { bindable } from "./bindable";
export { batch } from "./batch";
export {
  computedBehavior,
  staticComputedBehavior,
  createComponentOptions,
  createPageOptions,
  setupComputed,
} from "./behaviors/computed-behavior";
export type {
  ComputedDefs,
  ComputedDef,
  ComputedGetter,
  ComputedSetter,
  WritableComputedDef,
  ExtractComputedReturns,
  ComponentOptionsWithComputed,
  PageOptionsWithComputed,
} from "./behaviors/computed-behavior";
