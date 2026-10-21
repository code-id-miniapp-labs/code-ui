/**
 * @code-ui/miniapp
 *
 * MiniApp framework integration for code-ui FSM.
 */

if (
  typeof RegExp !== "undefined" &&
  typeof (RegExp.prototype as any).toJSON !== "function"
) {
  try {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(RegExp.prototype, "toJSON", {
      value(this: RegExp) {
        return {
          __isRegExp: true,
          source: this.source,
          flags: this.flags,
        };
      },
      writable: true,
      configurable: true,
    });
  } catch {}
}

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
