import * as dom from "./select-item.dom";
import type { SelectItemApi, SelectItemService } from "./select-item.types";

export function connectSelectItem(service: SelectItemService): SelectItemApi {
  const { state, send, computed, scope } = service;

  const currentState = state.get();
  const value = computed("resolvedValue");
  const selected = computed("isSelected");
  const disabled = computed("isDisabled");
  const index = computed("index");

  return {
    state: currentState,
    value,
    selected,
    disabled,
    index,

    select() {
      send({ type: "SELECT" });
    },

    rootProps: {
      id: dom.getRootId(scope),
      "data-state": currentState,
      "data-selected": String(selected),
      "data-disabled": String(disabled),
      "aria-role": "option",
      "aria-selected": selected,
      "aria-disabled": disabled,
    },
  };
}
