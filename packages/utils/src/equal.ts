const isArrayLike = (value: unknown): value is ArrayLike<unknown> =>
  Boolean(value) &&
  typeof value === "object" &&
  "length" in (value as Record<string, unknown>);

const isArrayEqual = (a: ArrayLike<unknown>, b: ArrayLike<unknown>): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const aItem = (a as Record<number, unknown>)[i];
    const bItem = (b as Record<number, unknown>)[i];
    if (!isEqual(aItem, bItem)) return false;
  }
  return true;
};

export const isEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;

  const aNil = a === null || a === undefined;
  const bNil = b === null || b === undefined;
  if (aNil !== bNil) return false;
  if (aNil && bNil) return true;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  if (
    typeof aObj?.isEqual === "function" &&
    typeof bObj?.isEqual === "function"
  ) {
    return (aObj.isEqual as (other: unknown) => boolean)(b);
  }

  if (typeof a === "function" && typeof b === "function") {
    return a.toString() === b.toString();
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return isArrayEqual(a, b);
  }

  if (isArrayLike(a) && isArrayLike(b)) {
    return isArrayEqual(a, b);
  }

  if (typeof a !== "object" || typeof b !== "object") return false;

  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;

  for (let i = 0; i < bKeys.length; i++) {
    const key = bKeys[i];
    if (key === undefined || !Reflect.has(aObj, key)) return false;
    if (!isEqual(aObj[key], bObj[key])) return false;
  }

  return true;
};
