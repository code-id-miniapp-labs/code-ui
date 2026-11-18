import { createMachine, type PropFn } from "@code-id-labs/core";
import type { SelectScalarValue } from "@code-id-labs/select";
import { defaultSelectItemProps } from "./select-item.props";
import type { SelectItemMachine, SelectItemSchema } from "./select-item.types";

function resolveSelectItemValue(
  prop: PropFn<SelectItemSchema>,
): SelectScalarValue {
  const v = prop("value");
  if (v !== "" && v !== undefined && v !== null) return v;
  const idx = prop("groupIndex") ?? prop("index");
  return idx !== null && idx !== undefined ? idx : "";
}

function resolveSelectItemSelected(prop: PropFn<SelectItemSchema>): boolean {
  if (prop("type") !== "item") return false;
  const direct = prop("selected");
  if (direct !== null && direct !== undefined) {
    return Boolean(direct);
  }
  const group = prop("groupContext");
  if (!group) return false;
  return group.isSelected(resolveSelectItemValue(prop));
}

export const selectItemMachine: SelectItemMachine =
  createMachine<SelectItemSchema>({
    props: ({ props }) => ({
      ...defaultSelectItemProps,
      ...props,
    }),

    initialState: ({ prop }) =>
      resolveSelectItemSelected(prop) ? "selected" : "unselected",

    computed: {
      resolvedValue: ({ prop }) => resolveSelectItemValue(prop),
      isSelected: ({ prop }) => resolveSelectItemSelected(prop),
      isDisabled: ({ prop }) => {
        if (prop("type") !== "item") return true;
        const group = prop("groupContext");
        return Boolean(prop("disabled") || group?.disabled());
      },
      index: ({ prop }) => prop("index") ?? prop("groupIndex") ?? 0,
    },

    watch({ track, computed, state }) {
      track([() => computed("isSelected")], () => {
        const target = computed("isSelected") ? "selected" : "unselected";
        if (!state.matches(target)) {
          state.set(target);
        }
      });
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
        isInteractive: ({ computed }) => !computed("isDisabled"),
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
