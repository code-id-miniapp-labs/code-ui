import type {
  GuardFn,
  Machine,
  MachineConfig,
  MachineExtension,
  MachineOverride,
  MachineSchema,
  Params,
  Transition,
} from "./types";
import { ensureStateIndex } from "./state";
import { extendMachine } from "./extend-machine";

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

export function createMachine<
  T extends MachineSchema = any,
  Base extends MachineSchema = any,
>(config: MachineConfig<T, Base>): Machine<T> {
  if (config && "extend" in config && config.extend) {
    return extendMachine<T, Base>(config.extend, config);
  }
  ensureStateIndex(config as Machine<T>);
  return config as Machine<T>;
}

export function setup<T extends MachineSchema>() {
  return {
    guards: createGuards<T>(),

    createMachine: <Base extends MachineSchema = any>(
      config: MachineConfig<T, Base>,
    ) => createMachine(config),

    extendMachine: <Base extends MachineSchema = any>(
      base: Machine<Base> | Array<Machine<Base>>,
      config:
        | MachineOverride<T>
        | MachineExtension<T, Base>
        | Partial<Machine<T>>,
    ) => extendMachine(base, config),

    /** Inline transition chooser — selects first matching transition */
    choose: (transitions: Transition<T> | Transition<T>[]) => {
      return function chooseFn({ choose }: Params<T>) {
        return choose(transitions)?.actions;
      };
    },
  };
}
