// DOM utilities
export {
  createDOM,
  createDOMQuery,
  createQuery,
  queryRect,
  queryAllRects,
  queryScrollOffset,
  queryViewportScrollOffset,
  queryFields,
  queryComputedStyle,
  queryAnimationDuration,
  parseTimeValue,
  isMiniApp,
} from "./dom";

export type {
  DOMQueryHelpers,
  MiniAppRect,
  MiniAppScrollOffset,
  MiniAppNodeFields,
  MiniAppComponent,
} from "./dom";

export { triggerEvent, createEventTrigger, createEventBus } from "./event";
export type {
  MiniAppBaseEvent,
  MiniAppCustomEvent,
  MiniAppTouchEvent,
  TriggerEventOptions,
  EventTrigger,
  EventHandler,
  EventBus,
} from "./event";

export { isEqual } from "./equal";

export {
  isDev,
  isArray,
  isBoolean,
  isObjectLike,
  isObject,
  isNumber,
  isString,
  isFunction,
  isNull,
  hasProp,
  isPlainObject,
} from "./guard";

export {
  runIfFn,
  cast,
  identity,
  noop,
  callAll,
  uuid,
  match,
  tryCatch,
  throttle,
  debounce,
  hash,
  isPromise,
} from "./function";

export { ensure, ensureProps, invariant, warn } from "./warning";

export { toArray } from "./array";

export { defu, createDefu, defuReplace, defuFn } from "./defu";
export type { Defu, DefuCustomMerger } from "./defu";

export { cx } from "./cx";
export type { ClassValue } from "./cx";

export type { MaybeFunction, Nullable } from "./function";
