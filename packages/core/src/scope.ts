import { createDOM } from "@code-ui/utils";
import type { MiniAppComponent } from "@code-ui/utils";
import type { Scope } from "./types";

interface ScopeProps {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  /** Optional component/page instance to scope SelectorQuery correctly */
  component?: MiniAppComponent | undefined;
}

/**
 * Creates a miniapp Scope with DOM query helpers bound to an optional component.
 *
 * @example
 * // In a Page — no component needed
 * const scope = createScope({ id: "my-modal" })
 *
 * // In a Component — pass `this` to scope queries correctly
 * attached() {
 *   const scope = createScope({ id: "my-select", component: this })
 *   const rect = await scope.dom.rect("#my-select")
 * }
 */
export function createScope(props: ScopeProps = {}): Scope {
  return {
    id: props.id,
    ids: props.ids,
    component: props.component,
    // ⚡ Binds all query helpers (rect, allRects, fields, etc.) to the component
    // so SelectorQuery resolves correctly within custom components
    dom: createDOM(props.component),
  };
}
