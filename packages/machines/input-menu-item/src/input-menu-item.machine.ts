import { createMachine, type PropFn } from "@code-ui/core";
import type { InputMenuScalarValue } from "@code-ui/input-menu";
import { defaultInputMenuItemProps } from "./input-menu-item.props";
import type {
  InputMenuItemMachine,
  InputMenuItemSchema,
} from "./input-menu-item.types";

function resolveInputMenuItemValue(
  prop: PropFn<InputMenuItemSchema>,
): InputMenuScalarValue {
  const v = prop("value");
  if (v !== "" && v !== undefined && v !== null) return v;
  const idx = prop("groupIndex") ?? prop("index");
  return idx !== null && idx !== undefined ? idx : "";
}

function resolveInputMenuItemSelected(
  prop: PropFn<InputMenuItemSchema>,
): boolean {
  if (prop("type") !== "item") return false;
  const direct = prop("selected");
  if (direct !== null && direct !== undefined) {
    return Boolean(direct);
  }
  const group = prop("groupContext");
  if (!group) return false;
  return group.isSelected(resolveInputMenuItemValue(prop));
}

export const inputMenuItemMachine: InputMenuItemMachine =
  createMachine<InputMenuItemSchema>({
    props: ({ props }) => ({
      ...defaultInputMenuItemProps,
      ...props,
    }),

    initialState: ({ prop }) =>
      resolveInputMenuItemSelected(prop) ? "selected" : "unselected",

    computed: {
      resolvedValue: ({ prop }) => resolveInputMenuItemValue(prop),
      isSelected: ({ prop }) => resolveInputMenuItemSelected(prop),
      isDisabled: ({ prop }) => {
        if (prop("type") !== "item") return true;
        const group = prop("groupContext");
        return Boolean(prop("disabled") || group?.disabled());
      },
      isHidden: ({ prop }) => {
        if (prop("managed")) return false;
        const group = prop("groupContext");
        const groupIdx = prop("groupIndex");
        if (!group || groupIdx === undefined || groupIdx === null) return false;
        return !group.isChildIndexVisible(groupIdx);
      },
      index: ({ prop }) => prop("index") ?? prop("groupIndex") ?? 0,
    },

    watch({ computed, state }) {
      const target = computed("isSelected") ? "selected" : "unselected";
      if (!state.matches(target)) {
        state.set(target);
      }
    },

    on: {
      SELECT: {
        guard: "isInteractive",
        actions: ["selectOption"],
      },
    },

    states: {
      selected: {
        tags: ["selected"],
      },
      unselected: {
        tags: ["unselected"],
      },
    },

    implementations: {
      guards: {
        isInteractive: ({ computed }) =>
          !computed("isDisabled") && !computed("isHidden"),
      },
      actions: {
        selectOption: ({ computed, prop }) => {
          const value = computed("resolvedValue");
          const group = prop("groupContext");
          if (group && !prop("managed")) {
            group.select(value);
          }
          prop("onSelect")?.({ value });
        },
      },
    },
  });
