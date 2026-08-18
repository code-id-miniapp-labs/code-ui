const isArrayLike = (value: unknown): boolean =>
  Boolean(value) &&
  (value as Record<string, unknown>).constructor?.name === "Array";

const isArrayEqual = (a: unknown[], b: unknown[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const aItem = a[i];
    const bItem = b[i];
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

  if (isArrayLike(a) && isArrayLike(b)) {
    return isArrayEqual(
      Array.from(a as ArrayLike<unknown>),
      Array.from(b as ArrayLike<unknown>),
    );
  }

  if (typeof a !== "object" || typeof b !== "object") return false;

  const keys = Object.keys(bObj ?? Object.create(null));

  for (const key of keys) {
    const hasKey = Reflect.has(aObj, key);
    if (!hasKey) return false;
  }

  for (const key of keys) {
    if (!isEqual(aObj[key], bObj[key])) return false;
  }

  return true;
};
