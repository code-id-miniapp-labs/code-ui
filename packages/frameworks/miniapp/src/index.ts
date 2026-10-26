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
} from "./behavior";
export type { CreateMachineBehaviorOptions } from "./behavior";
export type { MachinePlugin } from "./plugin";
const instanceIds = new WeakMap<object, string>();
let instanceCounter = 0;

export function getComponentId(instance: any, explicitId?: string): string {
  if (explicitId) return explicitId;
  let id = instanceIds.get(instance);
  if (!id) {
    id = `cui-${++instanceCounter}`;
    instanceIds.set(instance, id);
  }
  return id;
}

export function cleanupComponentId(instance: any): void {
  instanceIds.delete(instance);
}

export function getServiceBus(service: any) {
  return service?.refs?.get ? service.refs.get("bus") : undefined;
}
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
  linkFieldToParentBus,
  unlinkFieldFromParentBus,
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
