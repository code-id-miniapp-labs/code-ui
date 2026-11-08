import type { DOMQueryHelpers, MiniAppComponent } from "@code-ui/utils";
import type { Scope } from "./types";

interface ScopeProps {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  /** Optional component/page instance to scope SelectorQuery correctly */
  component?: MiniAppComponent | undefined;
  dom?: DOMQueryHelpers | undefined;
}

export function createScope(props: ScopeProps = {}): Scope {
  return {
    id: props.id,
    ids: props.ids,
    component: props.component,
    dom: props.dom,
    toJSON() {
      return { id: props.id, ids: props.ids };
    },
  };
}

export function partId(
  scope: Scope,
  prefix: string,
  part: string,
  short?: string,
): string {
  return scope.ids?.[part] ?? `${prefix}-${scope.id ?? "d"}-${short ?? part}`;
}

export function itemPartId(
  scope: Scope,
  prefix: string,
  part: string,
  index: number | string,
  short?: string,
): string {
  const custom = scope.ids?.[part];
  return (
    (typeof custom === "function" ? custom(index) : undefined) ??
    `${prefix}-${scope.id ?? "d"}-${short ?? part}-${index}`
  );
}

export function optPartId(scope: Scope, part: string): string | undefined {
  const custom = scope.ids?.[part];
  return typeof custom === "string" ? custom : undefined;
}

export function isMinimalDataAttrs(): boolean {
  const cfg = (
    typeof globalThis !== "undefined"
      ? (globalThis as Record<string, any>)
      : undefined
  )?.__CODE_UI_GLOBAL_CONFIG__;
  return (
    (cfg?.components?.dataAttributes ?? cfg?.dataAttributes) === "minimal"
  );
}

export function dataAttrs(
  optional: Record<string, unknown>,
): Record<string, any> {
  if (isMinimalDataAttrs()) return {};
  const out: Record<string, any> = {};
  for (const k in optional) {
    const v = optional[k];
    if (v !== undefined) {
      out[k.startsWith("data-") ? k : `data-${k}`] =
        typeof v === "boolean" ? String(v) : v;
    }
  }
  return out;
}

export function dataControlState(
  state?: string,
  disabled?: boolean,
  optional?: Record<string, unknown>,
  focused?: boolean,
): Record<string, any> {
  const out: Record<string, any> = {};
  if (state !== undefined) out["data-state"] = state;
  if (disabled !== undefined) out["data-disabled"] = String(disabled);
  if (focused !== undefined) out["data-focused"] = String(focused);
  if (optional && !isMinimalDataAttrs()) {
    for (const k in optional) {
      const v = optional[k];
      if (v !== undefined) {
        out[k.startsWith("data-") ? k : `data-${k}`] =
          typeof v === "boolean" ? String(v) : v;
      }
    }
  }
  return out;
}

export function ariaControlState(
  disabled?: boolean,
  invalid?: boolean,
  extra?: Record<string, unknown>,
): Record<string, any> {
  const out: Record<string, any> = {};
  if (disabled !== undefined) out["aria-disabled"] = Boolean(disabled);
  if (invalid !== undefined) out["aria-invalid"] = Boolean(invalid);
  if (extra) Object.assign(out, extra);
  return out;
}
