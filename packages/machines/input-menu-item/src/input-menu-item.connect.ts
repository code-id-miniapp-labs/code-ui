import * as dom from "./input-menu-item.dom";
import type {
  InputMenuItemApi,
  InputMenuItemService,
} from "./input-menu-item.types";

export function connectInputMenuItem(
  service: InputMenuItemService,
): InputMenuItemApi {
  const { state, send, computed, scope } = service;

  const currentState = state.get();
  const value = computed("resolvedValue");
  const selected = computed("isSelected");
  const disabled = computed("isDisabled");
  const hidden = computed("isHidden");
  const index = computed("index");

  return {
    state: currentState,
    value,
    selected,
    disabled,
    hidden,
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
