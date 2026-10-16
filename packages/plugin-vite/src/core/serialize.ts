const FN_DECL_RE = /^(?:async\s+)?function[\s*(]/;
const ARROW_FN_RE = /^(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>/;
const ASYNC_METHOD_RE = /^async\s+[a-zA-Z_$][\w$]*\s*\(/;
const SYNC_METHOD_RE = /^[a-zA-Z_$][\w$]*\s*\(/;

export function serializeFunction(fn: Function): string {
  const str = fn.toString().trim();
  if (FN_DECL_RE.test(str) || ARROW_FN_RE.test(str)) {
    return str;
  }
  if (ASYNC_METHOD_RE.test(str)) {
    return str.replace(ASYNC_METHOD_RE, "async function (");
  }
  if (SYNC_METHOD_RE.test(str)) {
    return str.replace(SYNC_METHOD_RE, "function (");
  }
  return str;
}

export function serializeConfig(val: unknown, depth = 0): string {
  if (typeof val === "function") {
    return serializeFunction(val);
  }
  if (val === null || val === undefined) {
    return JSON.stringify(val);
  }

  const indent = "  ".repeat(depth);
  const nextIndent = "  ".repeat(depth + 1);

  if (Array.isArray(val)) {
    if (val.length === 0) return "[]";
    const items = val
      .map((item) => `${nextIndent}${serializeConfig(item, depth + 1)}`)
      .join(",\n");
    return `[\n${items}\n${indent}]`;
  }
  if (typeof val === "object") {
    const keys = Object.keys(val);
    if (keys.length === 0) return "{}";
    const entries = keys
      .map((key) => {
        const v = (val as Record<string, unknown>)[key];
        return `${nextIndent}${JSON.stringify(key)}: ${serializeConfig(v, depth + 1)}`;
      })
      .join(",\n");
    return `{\n${entries}\n${indent}}`;
  }
  return JSON.stringify(val);
}
