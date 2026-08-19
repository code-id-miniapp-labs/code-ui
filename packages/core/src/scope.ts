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
    dom: createDOM(props.component),
  };
}
