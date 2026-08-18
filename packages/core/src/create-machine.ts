// ─────────────────────────────────────────────────────────────────────────────
// create-machine.ts — machine definition factories
// ─────────────────────────────────────────────────────────────────────────────

import type { GuardFn, Machine, MachineSchema, Params, Transition } from "./types";
import { ensureStateIndex } from "./state";

// ─── Guard combinators ────────────────────────────────────────────────────────

export function createGuards<T extends MachineSchema>() {
  return {
    /** All guards must pass */
    and: (...guards: Array<GuardFn<T> | T["guard"]>) => {
      return function andGuard(params: any) {
        return guards.every((str) => params.guard(str));
      };
    },
    /** Any guard must pass */
    or: (...guards: Array<GuardFn<T> | T["guard"]>) => {
      return function orGuard(params: any) {
        return guards.some((str) => params.guard(str));
      };
    },
    /** Guard must NOT pass */
    not: (guard: GuardFn<T> | T["guard"]) => {
      return function notGuard(params: any) {
        return !params.guard(guard);
      };
    },
  };
}

// ─── createMachine ────────────────────────────────────────────────────────────
// Validates the state tree at definition time, returns config as-is.
// All runtime logic lives in MiniappMachine.

export function createMachine<T extends MachineSchema>(
  config: Machine<T>,
): Machine<T> {
  ensureStateIndex(config);
  return config;
}

// ─── setup ────────────────────────────────────────────────────────────────────
// Convenience builder with typed helpers.

export function setup<T extends MachineSchema>() {
  return {
    guards: createGuards<T>(),

    createMachine: (config: Machine<T>) => createMachine(config),

    /** Inline transition chooser — selects first matching transition */
    choose: (transitions: Transition<T> | Transition<T>[]) => {
      return function chooseFn({ choose }: Params<T>) {
        return choose(transitions)?.actions;
      };
    },
  };
}
