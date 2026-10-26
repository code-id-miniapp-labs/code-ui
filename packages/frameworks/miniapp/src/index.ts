/**
 * @code-ui/miniapp
 *
 * MiniApp framework integration for code-ui FSM.
 */

export { MiniappMachine } from "./machine";
export { connectToPage, connectToComponent } from "./connect";
export type { ConnectFn, MiniAppInstance } from "./connect";
export {
  createMachineBehavior,
  createProperties,
  cuiFormParentBehavior,
  cuiFormFieldBehavior,
  cuiFormFieldWrapperBehavior,
  cuiRadioGroupBehavior,
  cuiRadioGroupParentBehavior,
  cuiRadioItemBehavior,
  cuiCheckboxGroupBehavior,
  cuiCheckboxGroupParentBehavior,
  cuiCheckboxItemBehavior,
  cuiStepperBehavior,
  cuiStepperParentBehavior,
  cuiStepperItemBehavior,
} from "./behavior";
export type { CreateMachineBehaviorOptions } from "./behavior";
export { wxButtonBehavior } from "./behaviors/button";
export { bindable } from "./bindable";
export { batch } from "./batch";
export {
  computedBehavior,
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
