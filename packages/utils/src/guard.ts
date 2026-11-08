type AnyFunction = (...args: unknown[]) => unknown;

export const isDev = () => process.env.NODE_ENV !== "production";
export const isArray = (v: unknown): v is unknown[] => Array.isArray(v);
export const isBoolean = (v: unknown): v is boolean =>
  v === true || v === false;
export const isObjectLike = (v: unknown): v is Record<string, unknown> =>
  v !== null && v !== undefined && typeof v === "object";
export const isObject = (v: unknown): v is Record<string, unknown> =>
  isObjectLike(v) && !isArray(v);
export const isNumber = (v: unknown): v is number =>
  typeof v === "number" && !Number.isNaN(v);
export const isString = (v: unknown): v is string => typeof v === "string";
export const isFunction = (v: unknown): v is AnyFunction =>
  typeof v === "function";
export const isNull = (v: unknown): v is null | undefined =>
  v === null || v === undefined;

export const hasProp = <T extends string>(
  obj: unknown,
  prop: T,
): obj is Record<T, unknown> =>
  Boolean(obj) && Object.prototype.hasOwnProperty.call(obj, prop);

export const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  if (typeof v !== "object" || v === null) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === null || proto === Object.prototype;
};

export const isEmpty = (v: unknown): boolean => {
  if (v === null || v === undefined) return true;
  if (typeof v === "boolean") return !v;
  if (typeof v === "number") return Number.isNaN(v);
  if (typeof v === "string") return v.trim().length === 0;
  if (isArray(v)) {
    if (v.length === 0) return true;
    return v.every(isEmpty);
  }
  if (v instanceof Map || v instanceof Set) {
    return v.size === 0;
  }
  if (isPlainObject(v)) {
    return Object.keys(v).length === 0;
  }
  return false;
};

export const isNotEmpty = (v: unknown): boolean => !isEmpty(v);

export const isNotNull = <T>(v: T): v is NonNullable<T> => !isNull(v);
