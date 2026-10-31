import { isEmpty } from "@code-ui/utils";
import type {
  FormRule,
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

export type RuleEvaluator = (
  rule: FormRuleObject,
  value: any,
  values: Record<string, any>,
) => FormRuleResult | Promise<FormRuleResult> | undefined;

const ruleEvaluators: RuleEvaluator[] = [];

export function registerRuleEvaluator(evaluator: RuleEvaluator) {
  if (!ruleEvaluators.includes(evaluator)) {
    ruleEvaluators.push(evaluator);
  }
}

export function getEffectiveLength(value: any): number {
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

export function evaluateRuleObject(
  rule: FormRuleObject,
  value: any,
  values: Record<string, any>,
): FormRuleResult | Promise<FormRuleResult> {
  if (rule.required && isEmpty(value)) {
    return rule.message || "This field is required";
  }
  if (typeof rule.validator === "function") {
    return rule.validator(value, values);
  }
  if (isEmpty(value)) return true;

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

  for (let i = 0; i < ruleEvaluators.length; i++) {
    const fn = ruleEvaluators[i];
    if (fn) {
      const res = fn(rule, value, values);
      if (res !== undefined && res !== true) return res;
    }
  }

  return true;
}

export function evaluateRules(
  value: any,
  rules: FormRule[],
  values: Record<string, any> = {},
): string[] | Promise<string[]> {
  if (!rules || rules.length === 0) return [];

  const syncErrors: string[] = [];
  const pendingPromises: Array<Promise<string | null>> = [];

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (!rule) continue;

    try {
      const out =
        typeof rule === "function"
          ? rule(value, values)
          : evaluateRuleObject(rule, value, values);

      if (isPromiseLike<FormRuleResult>(out)) {
        pendingPromises.push(
          out.then(
            (res) => normalizeRuleOutcome(res),
            (err) =>
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

export async function runRules(
  value: any,
  rules: FormRule[],
  values: Record<string, any> = {},
): Promise<string[]> {
  return await evaluateRules(value, rules, values);
}

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
    activeTriggers = [mode.slice(0, -5) as FormValidateTrigger];
  } else {
    activeTriggers = [mode as FormValidateTrigger];
  }

  if (!activeTriggers.includes(trigger)) {
    return false;
  }

  if (isLazyOption && (trigger === "input" || trigger === "change")) {
    return Boolean(options.isTouched) || (options.submitCount ?? 0) > 0;
  }

  return true;
}
