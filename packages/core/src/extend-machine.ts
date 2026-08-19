type Dict = Record<string, any>;

import type {
  ActionsOrFn,
  EffectsOrFn,
  Machine,
  MachineExtension,
  MachineOverride,
  Params,
} from "./types";
import { ensureStateIndex } from "./state";
import { createDefu, defu, isPlainObject, toArray } from "@code-ui/utils";

function mergeFn(baseFn?: (params: any) => any, extFn?: (params: any) => any) {
  if (!baseFn && !extFn) return undefined;
  if (!baseFn) return extFn;
  if (!extFn) return baseFn;
  return (params: any) => defu(extFn(params) ?? {}, baseFn(params) ?? {});
}

function mergeWatch(
  baseWatch?: (params: any) => void,
  extWatch?: (params: any) => void,
) {
  if (!baseWatch && !extWatch) return undefined;
  if (!baseWatch) return extWatch;
  if (!extWatch) return baseWatch;
  return (params: any) => {
    baseWatch(params);
    extWatch(params);
  };
}

function mergeActionsOrFn(
  baseActions?: ActionsOrFn<any>,
  extActions?: ActionsOrFn<any>,
): ActionsOrFn<any> | undefined {
  if (!baseActions && !extActions) return undefined;
  if (!baseActions) return extActions;
  if (!extActions) return baseActions;

  return (params: Params<any>) => {
    const a =
      typeof baseActions === "function" ? baseActions(params) : baseActions;
    const b =
      typeof extActions === "function" ? extActions(params) : extActions;
    const listA = a ? (Array.isArray(a) ? a : [a]) : [];
    const listB = b ? (Array.isArray(b) ? b : [b]) : [];
    return [...listA, ...listB];
  };
}

function mergeEffectsOrFn(
  baseEffects?: EffectsOrFn<any>,
  extEffects?: EffectsOrFn<any>,
): EffectsOrFn<any> | undefined {
  if (!baseEffects && !extEffects) return undefined;
  if (!baseEffects) return extEffects;
  if (!extEffects) return baseEffects;

  return (params: Params<any>) => {
    const a =
      typeof baseEffects === "function" ? baseEffects(params) : baseEffects;
    const b =
      typeof extEffects === "function" ? extEffects(params) : extEffects;
    const listA = a ? (Array.isArray(a) ? a : [a]) : [];
    const listB = b ? (Array.isArray(b) ? b : [b]) : [];
    return [...listA, ...listB];
  };
}

const mergeStates = createDefu((target, key, value) => {
  if (key === "tags" && Array.isArray(value)) {
    target.tags = Array.from(new Set([...value, ...(target.tags || [])]));
    return true;
  }
  if (key === "entry" || key === "exit") {
    target[key] = mergeActionsOrFn(value, target[key]);
    return true;
  }
  if (key === "effects") {
    target[key] = mergeEffectsOrFn(value, target[key]);
    return true;
  }
  if (key === "on" && isPlainObject(value)) {
    target.on = defu(target.on || {}, value);
    return true;
  }
});

function mergeTwoMachines<T extends Dict>(
  base: Machine<any>,
  ext:
    | MachineOverride<T>
    | MachineExtension<T>
    | Machine<T>
    | Partial<Machine<T>>,
): Machine<T> {
  const initialState = ext.initialState ?? base.initialState;
  const states = mergeStates(ext.states || {}, base.states || {});

  const merged: Machine<T> = {
    debug: ext.debug ?? base.debug,
    initialState,
    states: states as any,
    props: mergeFn(base.props, ext.props),
    context: mergeFn(base.context, ext.context),
    computed: defu(ext.computed || {}, base.computed || {}) as any,
    refs: mergeFn(base.refs, ext.refs),
    watch: mergeWatch(base.watch, ext.watch),
    entry: mergeActionsOrFn(base.entry, ext.entry),
    exit: mergeActionsOrFn(base.exit, ext.exit),
    effects: mergeEffectsOrFn(base.effects, ext.effects),
    on: defu(ext.on || {}, base.on || {}) as any,
    implementations: defu(
      ext.implementations || {},
      base.implementations || {},
    ) as any,
  };

  return merged;
}

/**
 * Extends one or more base machines with overrides and additions.
 */
export function extendMachine<T extends Dict = any, Base extends Dict = any>(
  base: Machine<Base> | Array<Machine<Base>>,
  extension:
    | MachineOverride<T>
    | MachineExtension<T, Base>
    | Partial<Machine<T>>,
): Machine<T> {
  const baseList = toArray(base);
  if (baseList.length === 0 || !baseList[0]) {
    throw new Error(
      "[code-ui] extendMachine requires at least one base machine",
    );
  }
  let result: Machine<any> = baseList[0];

  for (let i = 1; i < baseList.length; i++) {
    const nextBase = baseList[i];
    if (nextBase) {
      result = mergeTwoMachines(result, nextBase);
    }
  }

  const merged = mergeTwoMachines<T>(result, extension);
  ensureStateIndex(merged);
  return merged;
}
