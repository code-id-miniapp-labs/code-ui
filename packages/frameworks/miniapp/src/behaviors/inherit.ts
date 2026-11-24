import type {
  CodeUiComponentInstance,
  MiniappBehaviorRef,
} from "./types";

let autoIdCounter = 0;

/**
 * Strongly-typed relation definition helper avoiding `TrivialInstance` erasure.
 */
export interface TypedRelationOption<
  TThis extends CodeUiComponentInstance<any, any>,
  TTarget extends CodeUiComponentInstance<any, any>,
> {
  type: "parent" | "child" | "ancestor" | "descendant";
  target?: MiniappBehaviorRef;
  linked?(this: TThis, target: TTarget): void;
  linkChanged?(this: TThis, target: TTarget): void;
  unlinked?(this: TThis, target: TTarget): void;
}

export function createRelationOption<
  TThis extends CodeUiComponentInstance<any, any>,
  TTarget extends CodeUiComponentInstance<any, any>,
>(
  option: TypedRelationOption<TThis, TTarget>,
): WechatMiniprogram.Component.RelationOption {
  return option as unknown as WechatMiniprogram.Component.RelationOption;
}

/**
 * Creates a WeChat MiniProgram `Behavior` with a safe empty sentinel fallback
 * in non-MiniProgram SSR/test environments.
 */
export function createBehaviorRef(
  definition: Record<string, unknown>,
): MiniappBehaviorRef {
  return typeof Behavior !== "undefined"
    ? (
        Behavior as unknown as (
          options: Record<string, unknown>,
        ) => MiniappBehaviorRef
      )(definition)
    : ({} as unknown as MiniappBehaviorRef);
}

function readNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

/**
 * Resolves a component instance's ID consistently across native WXML `id`,
 * component `data.id`, and `@code-id-labs/miniapp`'s cached `__codeUiId`.
 * When `prefix` is given and no ID exists yet, generates and caches one.
 */
export function resolveInstanceId(
  instance?: CodeUiComponentInstance<Record<string, unknown>> | null,
  prefix?: string,
): string | undefined {
  if (!instance) return undefined;
  const existing =
    readNonEmptyString(instance.id) ??
    readNonEmptyString(instance.data?.id) ??
    readNonEmptyString(instance.__codeUiId);
  if (existing) {
    instance.__codeUiId = existing;
    return existing;
  }
  if (!prefix) return undefined;
  const generated = `${prefix}-${++autoIdCounter}`;
  instance.__codeUiId = generated;
  return generated;
}

/**
 * Reads a machine prop from a component instance's attached FSM service.
 */
export function resolveServiceProp<T = unknown>(
  instance: CodeUiComponentInstance<Record<string, unknown>> | null | undefined,
  key: string,
): T | undefined {
  return instance?.__codeUiMachine?.service?.prop?.(key) as T | undefined;
}

/**
 * Reads a machine ref (e.g. `groupContext`, `hostContext`) from an instance's FSM service.
 */
export function resolveServiceRef<T = unknown>(
  instance: CodeUiComponentInstance<Record<string, unknown>> | null | undefined,
  key: string,
): T | undefined {
  return instance?.__codeUiMachine?.service?.refs?.get?.(key) as T | undefined;
}

/**
 * Resolves a parent component reference from either a pending relation link
 * or MiniProgram's live `getRelationNodes(relationKey)`.
 */
export function resolveParentNode<
  TParent extends CodeUiComponentInstance<any, any>,
>(
  instance: CodeUiComponentInstance<any, any> | null | undefined,
  pendingParent: TParent | undefined,
  relationKey: string,
): TParent | undefined {
  if (pendingParent) return pendingParent;
  if (typeof instance?.getRelationNodes === "function") {
    return instance.getRelationNodes<TParent>(relationKey)?.[0];
  }
  return undefined;
}

/**
 * Deduplicates linked/tracked/queried child component instances in order.
 */
export function collectUniqueChildren<
  TChild extends CodeUiComponentInstance<any, any>,
>(
  parent: CodeUiComponentInstance<any, any>,
  relationKey: string,
  trackedChildren?: TChild[],
  extraSelector?: string,
): TChild[] {
  const seen = new Set<TChild>();
  if (typeof parent.getRelationNodes === "function") {
    const relationChildren = parent.getRelationNodes<TChild>(relationKey);
    if (Array.isArray(relationChildren)) {
      for (const child of relationChildren) seen.add(child);
    }
  }
  if (Array.isArray(trackedChildren)) {
    for (const child of trackedChildren) seen.add(child);
  }
  if (extraSelector && typeof parent.selectAllComponents === "function") {
    const selectors = extraSelector.split(",");
    for (const rawSel of selectors) {
      const sel = rawSel.trim();
      if (!sel) continue;
      const templateChildren = parent.selectAllComponents<TChild>(sel);
      if (Array.isArray(templateChildren)) {
        for (const child of templateChildren) seen.add(child);
      }
    }
  }
  return Array.from(seen);
}

/**
 * Resolves a host or page's MiniProgram page identifier across runtime and mocks.
 */
export function resolvePageId(
  instance?: CodeUiComponentInstance<Record<string, unknown>> | null,
): string | undefined {
  if (!instance) return undefined;
  try {
    if (typeof instance.getPageId === "function") {
      const id = instance.getPageId();
      if (id !== undefined && id !== null && id !== "") return String(id);
    }
    if (
      instance.__wxWebviewId__ !== undefined &&
      instance.__wxWebviewId__ !== null &&
      String(instance.__wxWebviewId__) !== ""
    ) {
      return String(instance.__wxWebviewId__);
    }
    if (typeof instance.__page__?.getPageId === "function") {
      const id = instance.__page__.getPageId();
      if (id !== undefined && id !== null && id !== "") return String(id);
    }
    if (typeof instance.$page?.getPageId === "function") {
      const id = instance.$page.getPageId();
      if (id !== undefined && id !== null && id !== "") return String(id);
    }
  } catch {
    // Ignore getter errors from partially mocked page instances
  }
  return undefined;
}

/**
 * Patches inherited presentation properties (such as `groupSize`, `groupColor`,
 * `groupVariant`, `fieldSize`, etc.) onto child MiniApp component instances.
 * Only calls `setData` for keys whose value actually changed.
 */
export function patchInheritedData<TInherited extends Record<string, unknown>>(
  child: CodeUiComponentInstance<any, any> | null | undefined,
  values: TInherited,
): void {
  if (!child) return;
  const current = child.data;
  const patch: Record<string, unknown> = {};
  let changed = false;
  for (const key of Object.keys(values)) {
    const nextVal = values[key];
    const curVal = current ? current[key] : undefined;
    if (Object.is(curVal, nextVal)) continue;
    // Skip no-op default inheritance when child hasn't initialized the key yet
    // (`undefined` in `child.data` is equivalent to `""` / `false` for inherited fallbacks)
    if (curVal === undefined && (nextVal === "" || nextVal === false)) {
      continue;
    }
    patch[key] = nextVal;
    changed = true;
  }
  if (!changed) return;
  if (
    typeof (child as any).__cuiBufferMountData === "function" &&
    (child as any).__cuiBufferMountData(patch)
  ) {
    return;
  }
  if (typeof child.setData === "function") {
    child.setData(patch);
  } else if (child.data) {
    Object.assign(child.data, patch);
  }
}
