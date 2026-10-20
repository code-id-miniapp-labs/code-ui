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
