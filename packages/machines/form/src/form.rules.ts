import { isEmpty } from "@code-ui/utils";
import {
  evaluateRules,
  getEffectiveLength,
  parseRegex,
  runRules,
  shouldValidateOnTrigger,
} from "./form.eval";
import type {
  FormRuleFn,
  FormRuleObject,
} from "./form.types";

export { evaluateRules, parseRegex, runRules, shouldValidateOnTrigger };

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
