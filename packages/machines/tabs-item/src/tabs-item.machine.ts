import { createMachine } from "@code-id-labs/core";
import type { PropFn } from "@code-id-labs/core";
import { defaultTabsItemProps } from "./tabs-item.props";
import type { TabsItemMachine, TabsItemSchema } from "./tabs-item.types";

function resolveTabsItemValue(prop: PropFn<TabsItemSchema>): string | number {
  const v = prop("value");
  if (v !== "") return v;
  const idx = prop("groupIndex") ?? prop("index");
  return idx !== null ? idx : "";
}

function resolveTabsItemSelected(prop: PropFn<TabsItemSchema>): boolean {
  const direct = prop("selected");
  if (direct !== null) {
    return Boolean(direct);
  }
  const group = prop("groupContext");
  if (!group) return false;
  const selfVal = resolveTabsItemValue(prop);
  return selfVal !== "" && selfVal === group.value();
}

export const tabsItemMachine: TabsItemMachine = createMachine<TabsItemSchema>({
  props: ({ props }) => ({
    ...defaultTabsItemProps,
    ...props,
  }),

  initialState: ({ prop }) =>
    resolveTabsItemSelected(prop) ? "active" : "inactive",

  computed: {
    resolvedValue: ({ prop }) => resolveTabsItemValue(prop),
    isSelected: ({ prop }) => resolveTabsItemSelected(prop),
    isDisabled: ({ prop }) => {
      const group = prop("groupContext");
      return Boolean(prop("disabled") || group?.disabled());
    },
    index: ({ prop }) => prop("index") ?? prop("groupIndex") ?? 0,
  },

  watch({ track, computed, state }) {
    track([() => computed("isSelected")], () => {
      state.set(computed("isSelected") ? "active" : "inactive");
    });
  },

  states: {
    active: {
      tags: ["active"],
    },
    inactive: {
      tags: ["inactive"],
      on: {
        SELECT: {
          guard: "isInteractive",
          actions: ["selectTab"],
        },
      },
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => !computed("isDisabled"),
    },
    actions: {
      selectTab: ({ computed, prop }) => {
        const value = computed("resolvedValue");
        const group = prop("groupContext");
        if (group) {
          group.select(value);
          return;
        }
        prop("onSelect")?.({ value });
      },
    },
  },
});
