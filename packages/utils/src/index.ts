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
  isMiniApp,
} from "./dom";

export type {
  DOMQueryHelpers,
  MiniAppRect,
  MiniAppScrollOffset,
  MiniAppNodeFields,
  MiniAppComponent,
} from "./dom";

// Events — MiniApp (triggerEvent + internal EventBus)
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

// Equal
export { isEqual } from "./equal";

// Guard
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

// Function utilities
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
} from "./function";

// Warning

export { ensure, ensureProps, invariant, warn } from "./warning";

export type { MaybeFunction, Nullable } from "./function";
