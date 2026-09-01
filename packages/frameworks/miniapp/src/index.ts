/**
 * @code-ui/miniapp
 *
 * MiniApp framework integration for code-ui FSM.
 */

export { MiniappMachine } from "./machine";
export { connectToPage, connectToComponent } from "./connect";
export type { ConnectFn, MiniAppInstance } from "./connect";
export { useMachine } from "./use-machine";
export type { UseMachineOptions, UseMachineReturn } from "./use-machine";
export { createMachineBehavior, createProperties } from "./behavior";
export type { CreateMachineBehaviorOptions } from "./behavior";
export { wxButtonBehavior } from "./behaviors/button";
export { bindable } from "./bindable";
export {
  computedBehavior,
  createComponentOptions,
  createPageOptions,
} from "./behaviors/computed-behavior";
export type {
  ComputedDefs,
  ComponentOptionsWithComputed,
  PageOptionsWithComputed,
} from "./behaviors/computed-behavior";
