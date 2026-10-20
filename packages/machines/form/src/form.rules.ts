import { isEmpty } from "@code-ui/utils";
import {
  evaluateRules,
  runRules,
  shouldValidateOnTrigger,
  registerRuleEvaluator,
} from "./form.eval";
import type {
  FormRuleFn,
  FormRuleObject,
} from "./form.types";

export { evaluateRules, runRules, shouldValidateOnTrigger };

function getEffectiveLength(value: any): number {
  if (value === null || value === undefined) return 0;
  if (Array.isArray(value)) {
    return value.filter((item) =>
      typeof item === "string"
        ? item.trim().length > 0
        : item !== null && item !== undefined,
    ).length;
  }
  return typeof value === "string" ? value.length : String(value).length;
}

if (
  typeof RegExp !== "undefined" &&
  typeof (RegExp.prototype as any).toJSON !== "function"
) {
  try {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(RegExp.prototype, "toJSON", {
      value(this: RegExp) {
        return {
          __isRegExp: true,
          source: this.source,
          flags: this.flags,
        };
      },
      writable: true,
      configurable: true,
    });
  } catch {}
}

export function parseRegex(pattern: unknown, flags?: string): RegExp | null {
  if (pattern instanceof RegExp) {
    pattern.lastIndex = 0;
    return pattern;
  }
  if (typeof pattern === "string") {
    const trimmed = pattern.trim();
    if (trimmed.length === 0) return null;
    const slashMatch = /^\/(.*)\/([a-z]*)$/i.exec(trimmed);
    return slashMatch && slashMatch[1] !== undefined
      ? new RegExp(slashMatch[1], slashMatch[2] || flags || "")
      : new RegExp(trimmed, flags ?? "");
  }
  if (typeof pattern === "object" && pattern !== null) {
    const obj = pattern as Record<string, any>;
    const src =
      typeof obj.source === "string" && obj.source.length > 0
        ? obj.source
        : typeof obj.pattern === "string" && obj.pattern.length > 0
          ? obj.pattern
          : null;
    if (src) {
      const f =
        typeof obj.flags === "string"
          ? obj.flags
          : typeof obj.patternFlags === "string"
            ? obj.patternFlags
            : (flags ?? "");
      return new RegExp(src, f);
    }
  }
  return null;
}

const makeRule = (descriptor: FormRuleObject, fn: FormRuleFn): FormRuleFn => {
  Object.defineProperty(fn, "toJSON", {
    value: () => descriptor,
    enumerable: false,
    configurable: true,
  });
  return fn;
};

export const formRules = {
  required: (message = "This field is required"): FormRuleFn =>
    makeRule({ required: true, message }, (v) => !isEmpty(v) || message),

  minLength: (min: number, message?: string): FormRuleFn => {
    const msg = message ?? `Must be at least ${min} characters`;
    return makeRule({ minLength: min, message: msg }, (v) =>
      isEmpty(v) || getEffectiveLength(v) >= min || msg,
    );
  },

  maxLength: (max: number, message?: string): FormRuleFn => {
    const msg = message ?? `Must be at most ${max} characters`;
    return makeRule({ maxLength: max, message: msg }, (v) =>
      isEmpty(v) || getEffectiveLength(v) <= max || msg,
    );
  },

  exactLength: (length: number, message?: string): FormRuleFn => {
    const msg = message ?? `Must be exactly ${length} characters`;
    return makeRule({ exactLength: length, message: msg }, (v) =>
      isEmpty(v) || getEffectiveLength(v) === length || msg,
    );
  },

  pattern: (regex: RegExp, message = "Invalid format"): FormRuleFn =>
    makeRule(
      { pattern: regex.source, patternFlags: regex.flags, message },
      (v) => {
        if (isEmpty(v)) return true;
        regex.lastIndex = 0;
        return regex.test(Array.isArray(v) ? v.join("") : String(v)) || message;
      },
    ),

  email: (message = "Invalid email address"): FormRuleFn =>
    makeRule({ email: true, message }, (v) =>
      isEmpty(v) ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) ||
      message,
    ),

  numeric: (message = "Must contain only numbers"): FormRuleFn =>
    makeRule({ numeric: true, message }, (v) =>
      isEmpty(v) ||
      /^[0-9]+$/.test(Array.isArray(v) ? v.join("") : String(v)) ||
      message,
    ),

  min: (minVal: number, message?: string): FormRuleFn => {
    const msg = message ?? `Must be greater than or equal to ${minVal}`;
    return makeRule({ min: minVal, message: msg }, (v) => {
      if (isEmpty(v)) return true;
      const n = Number(v);
      return (!Number.isNaN(n) && n >= minVal) || msg;
    });
  },

  max: (maxVal: number, message?: string): FormRuleFn => {
    const msg = message ?? `Must be less than or equal to ${maxVal}`;
    return makeRule({ max: maxVal, message: msg }, (v) => {
      if (isEmpty(v)) return true;
      const n = Number(v);
      return (!Number.isNaN(n) && n <= maxVal) || msg;
    });
  },

  sameAs: (targetField: string, message?: string): FormRuleFn => {
    const msg = message ?? `Must match ${targetField}`;
    return makeRule({ sameAs: targetField, message: msg }, (v, values) => {
      const target = values?.[targetField];
      const a = Array.isArray(v) ? v.join("") : v;
      const b = Array.isArray(target) ? target.join("") : target;
      return a === b || msg;
    });
  },
};

// Auto-register built-in rule object evaluators when this module is imported
registerRuleEvaluator((rule, value, values) => {
  const msg = rule.message;
  const len = getEffectiveLength(value);
  if (typeof rule.minLength === "number" && len < rule.minLength) {
    return msg ?? `Must be at least ${rule.minLength} characters`;
  }
  if (typeof rule.maxLength === "number" && len > rule.maxLength) {
    return msg ?? `Must be at most ${rule.maxLength} characters`;
  }
  if (typeof rule.exactLength === "number" && len !== rule.exactLength) {
    return msg ?? `Must be exactly ${rule.exactLength} characters`;
  }
  if (rule.pattern !== undefined) {
    const rx = parseRegex(rule.pattern, rule.patternFlags);
    if (rx) {
      rx.lastIndex = 0;
      const str = Array.isArray(value) ? value.join("") : String(value);
      if (!rx.test(str)) return msg ?? "Invalid format";
    }
  }
  if (rule.email || (rule as any).type === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) {
      return msg ?? "Invalid email address";
    }
  }
  if (
    rule.numeric ||
    (rule as any).type === "number" ||
    (rule as any).type === "numeric"
  ) {
    const str = Array.isArray(value) ? value.join("") : String(value);
    if (!/^[0-9]+$/.test(str)) return msg ?? "Must contain only numbers";
  }
  const num = Number(value);
  if (
    typeof rule.min === "number" &&
    (!Number.isNaN(num) ? num < rule.min : true)
  ) {
    return msg ?? `Must be greater than or equal to ${rule.min}`;
  }
  if (
    typeof rule.max === "number" &&
    (!Number.isNaN(num) ? num > rule.max : true)
  ) {
    return msg ?? `Must be less than or equal to ${rule.max}`;
  }
  if (typeof rule.sameAs === "string" && rule.sameAs.length > 0) {
    const target = values?.[rule.sameAs];
    const a = Array.isArray(value) ? value.join("") : value;
    const b = Array.isArray(target) ? target.join("") : target;
    if (a !== b) return msg ?? `Must match ${rule.sameAs}`;
  }
  return undefined;
});
