import type {
  FormRule,
  FormRuleFn,
  FormRuleObject,
  FormRuleResult,
  FormValidateOn,
  FormValidateTrigger,
} from "./form.types";

const DEFAULT_ERROR_MESSAGE = "Invalid value";

function isPromiseLike<T = unknown>(val: unknown): val is Promise<T> {
  return (
    val !== null &&
    typeof val === "object" &&
    typeof (val as { then?: unknown }).then === "function"
  );
}

function normalizeRuleOutcome(result: FormRuleResult): string | null {
  if (result === true) return null;
  if (typeof result === "string") {
    return result.trim().length > 0 ? result : DEFAULT_ERROR_MESSAGE;
  }
  return DEFAULT_ERROR_MESSAGE;
}

function getEffectiveLength(value: any): number {
  if (value === null || value === undefined) return 0;
  if (Array.isArray(value)) {
    // Support PinInput string[] where empty cells are ""
    return value.filter((item) =>
      typeof item === "string"
        ? item.trim().length > 0
        : item !== null && item !== undefined,
    ).length;
  }
  if (typeof value === "string") return value.length;
  return String(value).length;
}

function isEmptyValue(value: any): boolean {
  if (value === null || value === undefined || value === false) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) {
    if (value.length === 0) return true;
    return value.every((item) =>
      typeof item === "string"
        ? item.trim().length === 0
        : item === null || item === undefined,
    );
  }
  return false;
}

function attachRuleJSON(fn: FormRuleFn, descriptor: FormRuleObject): FormRuleFn {
  Object.defineProperty(fn, "toJSON", {
    value: () => descriptor,
    enumerable: false,
    configurable: true,
  });
  return fn;
}

function expandRuleObject(ruleObj: FormRuleObject): FormRuleFn[] {
  const fns: FormRuleFn[] = [];
  const msg = ruleObj.message;

  if (ruleObj.required) {
    fns.push(formRules.required(msg));
  }
  if (typeof ruleObj.minLength === "number") {
    fns.push(formRules.minLength(ruleObj.minLength, msg));
  }
  if (typeof ruleObj.maxLength === "number") {
    fns.push(formRules.maxLength(ruleObj.maxLength, msg));
  }
  if (typeof ruleObj.exactLength === "number") {
    fns.push(formRules.exactLength(ruleObj.exactLength, msg));
  }
  if (ruleObj.pattern !== undefined) {
    const regex =
      ruleObj.pattern instanceof RegExp
        ? ruleObj.pattern
        : new RegExp(String(ruleObj.pattern), ruleObj.patternFlags ?? "");
    fns.push(formRules.pattern(regex, msg));
  }
  if (ruleObj.email) {
    fns.push(formRules.email(msg));
  }
  if (ruleObj.numeric) {
    fns.push(formRules.numeric(msg));
  }
  if (typeof ruleObj.min === "number") {
    fns.push(formRules.min(ruleObj.min, msg));
  }
  if (typeof ruleObj.max === "number") {
    fns.push(formRules.max(ruleObj.max, msg));
  }
  if (typeof ruleObj.sameAs === "string" && ruleObj.sameAs.length > 0) {
    fns.push(formRules.sameAs(ruleObj.sameAs, msg));
  }
  if (typeof ruleObj.validator === "function") {
    fns.push(ruleObj.validator);
  }
  return fns;
}

/**
 * Evaluates an array of Vuetify-style validation rules against `value`.
 * Returns `string[]` synchronously when all rules are synchronous, or
 * `Promise<string[]>` when one or more rules return a Promise.
 */
export function evaluateRules(
  value: any,
  rules: FormRule[],
  values: Record<string, any> = {},
): string[] | Promise<string[]> {
  if (!rules || rules.length === 0) return [];

  const syncErrors: string[] = [];
  const pendingPromises: Array<Promise<string | null>> = [];

  const runnableFns: FormRuleFn[] = [];
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (typeof rule === "function") {
      runnableFns.push(rule);
    } else if (rule !== null && typeof rule === "object") {
      runnableFns.push(...expandRuleObject(rule));
    }
  }

  for (let i = 0; i < runnableFns.length; i++) {
    const ruleFn = runnableFns[i];
    if (!ruleFn) continue;

    try {
      const out = ruleFn(value, values);
      if (isPromiseLike<FormRuleResult>(out)) {
        pendingPromises.push(
          out.then(
            (res: FormRuleResult) => normalizeRuleOutcome(res),
            (err: unknown) =>
              err instanceof Error && err.message
                ? err.message
                : DEFAULT_ERROR_MESSAGE,
          ),
        );
      } else {
        const msg = normalizeRuleOutcome(out);
        if (msg !== null) syncErrors.push(msg);
      }
    } catch (err) {
      syncErrors.push(
        err instanceof Error && err.message
          ? err.message
          : DEFAULT_ERROR_MESSAGE,
      );
    }
  }

  if (pendingPromises.length === 0) {
    return syncErrors;
  }

  return Promise.all(pendingPromises).then((asyncOutcomes) => {
    const combined = [...syncErrors];
    for (let i = 0; i < asyncOutcomes.length; i++) {
      const msg = asyncOutcomes[i];
      if (msg !== null && msg !== undefined) {
        combined.push(msg);
      }
    }
    return combined;
  });
}

/**
 * Always-async wrapper around `evaluateRules`.
 */
export async function runRules(
  value: any,
  rules: FormRule[],
  values: Record<string, any> = {},
): Promise<string[]> {
  return await evaluateRules(value, rules, values);
}

/**
 * Determines whether a given field event (`input`, `change`, `blur`, `focus`, `submit`)
 * should trigger validation based on `validateOn`, `validateLazy`, and field state.
 */
export function shouldValidateOnTrigger(
  trigger: FormValidateTrigger,
  validateOn: FormValidateOn | undefined,
  options: {
    validateLazy?: boolean | undefined;
    isTouched?: boolean | undefined;
    hasErrors?: boolean | undefined;
    submitCount?: number | undefined;
  } = {},
): boolean {
  if (trigger === "submit") return true;

  const mode = validateOn ?? ["input", "change", "blur"];
  const isLazyOption =
    Boolean(options.validateLazy) ||
    mode === "lazy" ||
    (typeof mode === "string" && mode.endsWith(" lazy"));

  // Once a field already has an error, re-validate on input/change/blur so error clears immediately
  if (
    options.hasErrors &&
    (trigger === "input" || trigger === "change" || trigger === "blur")
  ) {
    return true;
  }

  let activeTriggers: FormValidateTrigger[];
  if (Array.isArray(mode)) {
    activeTriggers = mode;
  } else if (mode === "eager") {
    activeTriggers = ["input", "change", "blur", "focus"];
  } else if (mode === "lazy") {
    activeTriggers = ["input", "change", "blur"];
  } else if (mode.endsWith(" lazy")) {
    const baseTrigger = mode.slice(0, -5) as FormValidateTrigger;
    activeTriggers = [baseTrigger];
  } else {
    activeTriggers = [mode as FormValidateTrigger];
  }

  if (!activeTriggers.includes(trigger)) {
    return false;
  }

  if (isLazyOption && (trigger === "input" || trigger === "change")) {
    const hasBeenInteracted =
      Boolean(options.isTouched) || (options.submitCount ?? 0) > 0;
    return hasBeenInteracted;
  }

  return true;
}

/**
 * Built-in Vuetify-inspired validation rule factories.
 * Each returned function also defines `toJSON()` so it survives WeChat MiniProgram `data` serialization.
 */
export const formRules = {
  required(message = "This field is required"): FormRuleFn {
    return attachRuleJSON(
      (value: any) => !isEmptyValue(value) || message,
      { required: true, message },
    );
  },

  minLength(min: number, message?: string): FormRuleFn {
    const msg = message ?? `Must be at least ${min} characters`;
    return attachRuleJSON(
      (value: any) => {
        if (isEmptyValue(value)) return true;
        return getEffectiveLength(value) >= min || msg;
      },
      { minLength: min, message: msg },
    );
  },

  maxLength(max: number, message?: string): FormRuleFn {
    const msg = message ?? `Must be at most ${max} characters`;
    return attachRuleJSON(
      (value: any) => {
        if (isEmptyValue(value)) return true;
        return getEffectiveLength(value) <= max || msg;
      },
      { maxLength: max, message: msg },
    );
  },

  exactLength(length: number, message?: string): FormRuleFn {
    const msg = message ?? `Must be exactly ${length} characters`;
    return attachRuleJSON(
      (value: any) => {
        if (isEmptyValue(value)) return true;
        return getEffectiveLength(value) === length || msg;
      },
      { exactLength: length, message: msg },
    );
  },

  pattern(regex: RegExp, message = "Invalid format"): FormRuleFn {
    return attachRuleJSON(
      (value: any) => {
        if (isEmptyValue(value)) return true;
        const str = Array.isArray(value) ? value.join("") : String(value);
        return regex.test(str) || message;
      },
      {
        pattern: regex.source,
        patternFlags: regex.flags,
        message,
      },
    );
  },

  email(message = "Invalid email address"): FormRuleFn {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return attachRuleJSON(
      (value: any) => {
        if (isEmptyValue(value)) return true;
        return emailRegex.test(String(value).trim()) || message;
      },
      { email: true, message },
    );
  },

  numeric(message = "Must contain only numbers"): FormRuleFn {
    const numRegex = /^[0-9]+$/;
    return attachRuleJSON(
      (value: any) => {
        if (isEmptyValue(value)) return true;
        const str = Array.isArray(value) ? value.join("") : String(value);
        return numRegex.test(str) || message;
      },
      { numeric: true, message },
    );
  },

  min(minVal: number, message?: string): FormRuleFn {
    const msg = message ?? `Must be greater than or equal to ${minVal}`;
    return attachRuleJSON(
      (value: any) => {
        if (isEmptyValue(value)) return true;
        const num = Number(value);
        return (!Number.isNaN(num) && num >= minVal) || msg;
      },
      { min: minVal, message: msg },
    );
  },

  max(maxVal: number, message?: string): FormRuleFn {
    const msg = message ?? `Must be less than or equal to ${maxVal}`;
    return attachRuleJSON(
      (value: any) => {
        if (isEmptyValue(value)) return true;
        const num = Number(value);
        return (!Number.isNaN(num) && num <= maxVal) || msg;
      },
      { max: maxVal, message: msg },
    );
  },

  sameAs(targetField: string, message?: string): FormRuleFn {
    const msg = message ?? `Must match ${targetField}`;
    return attachRuleJSON(
      (value: any, values: Record<string, any>) => {
        const targetVal = values?.[targetField];
        const normA = Array.isArray(value) ? value.join("") : value;
        const normB = Array.isArray(targetVal) ? targetVal.join("") : targetVal;
        return normA === normB || msg;
      },
      { sameAs: targetField, message: msg },
    );
  },
};
