/**
 * @code-ui/core
 *
 * Core FSM type definitions, state transitions, and bindable atom store.
 */

// Types
export type {
  ActionsOrFn,
  Bindable,
  BindableContext,
  BindableFn,
  BindableParams,
  BindableRefs,
  ChooseFn,
  ComputedFn,
  EffectsOrFn,
  EventObject,
  GuardFn,
  Machine,
  MachineSchema,
  MachineState,
  Params,
  PropFn,
  Scope,
  Service,
  Transition,
  TransitionMap,
  TransitionMatch,
  TransitionSet,
  ValueOrFn,
} from "./types";
export { MachineStatus, INIT_STATE } from "./types";

// Machine factories
export { createMachine, createGuards, setup } from "./create-machine";

// Bindable (alien-signals powered)
export { bindable } from "./bindable";

// Scope + Refs
export { createScope } from "./scope";
export { createRefs } from "./refs";

// State utilities
export {
  ensureStateIndex,
  findTransition,
  getExitEnterStates,
  getStateChain,
  getStateDefinition,
  hasTag,
  matchesState,
  resolveStateValue,
} from "./state";
