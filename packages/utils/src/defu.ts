import { isArray, isFunction, isPlainObject } from "./guard";

export type DefuCustomMerger = (
  target: Record<string, any>,
  key: string,
  value: any,
  namespace: string,
) => boolean | void;

export type Defu<Source, Defaults> = Source extends undefined | null
  ? Defaults
  : Source extends Array<infer SItem>
    ? Defaults extends Array<infer DItem>
      ? Array<SItem | DItem>
      : Source
    : Source extends (...args: any[]) => any
      ? Source
      : Source extends Record<string, any>
        ? Defaults extends Record<string, any>
          ? {
              [K in keyof Source | keyof Defaults]: K extends keyof Source
                ? K extends keyof Defaults
                  ? Defu<Source[K], Defaults[K]>
                  : Source[K]
                : K extends keyof Defaults
                  ? Defaults[K]
                  : never;
            }
          : Source
        : Source;

export interface DefuFn {
  <Source = any, Defaults = any>(
    source: Source,
    defaults: Defaults,
  ): Defu<Source, Defaults>;
  <Source = any, D1 = any, D2 = any>(
    source: Source,
    d1: D1,
    d2: D2,
  ): Defu<Defu<Source, D1>, D2>;
  <Source = any, D1 = any, D2 = any, D3 = any>(
    source: Source,
    d1: D1,
    d2: D2,
    d3: D3,
  ): Defu<Defu<Defu<Source, D1>, D2>, D3>;
  <Source = any, Defaults = any>(source: Source, ...defaults: Defaults[]): any;
}

function mergeDeep(
  target: Record<string, any>,
  source: Record<string, any>,
  merger?: DefuCustomMerger,
  ns = "",
): Record<string, any> {
  if (!source || typeof source !== "object") return target;

  for (const key of Object.keys(source)) {
    if (key === "__proto__" || key === "constructor") continue;
    const sVal = source[key];
    if (sVal === undefined) continue;

    const path = ns ? `${ns}.${key}` : key;
    if (merger && merger(target, key, sVal, path)) continue;

    const tVal = target[key];
    if (isArray(sVal)) {
      target[key] = isArray(tVal) ? [...tVal, ...sVal] : [...sVal];
    } else if (isPlainObject(sVal)) {
      target[key] = mergeDeep(
        isPlainObject(tVal) ? tVal : {},
        sVal,
        merger,
        path,
      );
    } else if (tVal === undefined) {
      target[key] = sVal;
    }
  }
  return target;
}

export function createDefu(merger?: DefuCustomMerger): DefuFn {
  return function defuInstance(source: any, ...defaults: any[]): any {
    const res = isPlainObject(source) ? mergeDeep({}, source, merger) : source;
    const target = isPlainObject(res) ? res : {};
    for (const d of defaults) {
      if (d && typeof d === "object") {
        mergeDeep(target, d, merger);
      }
    }
    return res && typeof res === "object" ? target : (res ?? target);
  } as DefuFn;
}

export const defu: DefuFn = createDefu();

export const defuReplace: DefuFn = createDefu((target, key, value) => {
  if (isArray(target[key]) || isArray(value)) {
    if (target[key] !== undefined) return true;
    target[key] = isArray(value) ? [...value] : value;
    return true;
  }
});

export const defuFn: DefuFn = createDefu((target, key, value) => {
  if (isFunction(target[key])) {
    target[key] = target[key](value);
    return true;
  }
});
