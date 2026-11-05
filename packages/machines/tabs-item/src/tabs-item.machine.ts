import { createMachine } from "@code-ui/core";
import type { TabsGroupContext } from "@code-ui/tabs";
import { defaultTabsItemProps } from "./tabs-item.props";
import type { TabsItemMachine, TabsItemSchema } from "./tabs-item.types";

export const tabsItemMachine: TabsItemMachine =
  createMachine<TabsItemSchema>({
    props: ({ props }) => ({
      ...defaultTabsItemProps,
      ...props,
    }),

    initialState: () => "idle",

    computed: {
      resolvedValue: ({ prop }) => {
        const v = prop("value");
        if (v !== undefined && v !== null && v !== "") return v;
        const idx = prop("groupIndex") ?? prop("index");
        return idx !== undefined ? idx : "";
      },
      isSelected: ({ computed, prop }) => {
        const direct = prop("selected");
        if (direct !== undefined && direct !== null) {
          return Boolean(direct);
        }
        const group = prop("groupContext") as TabsGroupContext | undefined;
        if (!group) return false;
        const selfVal = computed("resolvedValue");
        return selfVal !== "" && selfVal === group.value();
      },
      isDisabled: ({ prop }) => {
        const group = prop("groupContext") as TabsGroupContext | undefined;
        return Boolean(prop("disabled") || group?.disabled());
      },
    },

    on: {
      SELECT: {
        actions: ["selectTab"],
      },
    },

    states: {
      idle: {
        tags: ["idle"],
      },
    },

    implementations: {
      actions: {
        selectTab: ({ computed, prop }) => {
          if (computed("isDisabled")) return;
          const group = prop("groupContext") as TabsGroupContext | undefined;
          group?.select(computed("resolvedValue"));
        },
      },
    },
  });
