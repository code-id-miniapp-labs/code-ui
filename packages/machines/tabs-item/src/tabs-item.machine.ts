import { createMachine } from "@code-ui/core";
import { defaultTabsItemProps } from "./tabs-item.props";
import type {
  TabsItemGroupStateSnapshot,
  TabsItemMachine,
  TabsItemParams,
  TabsItemSchema,
} from "./tabs-item.types";

export function applyGroupState(
  context: TabsItemParams["context"],
  g: TabsItemGroupStateSnapshot,
) {
  if (g.value !== undefined) {
    context.set("groupValue", g.value);
  }
  if (g.orientation !== undefined) {
    context.set("groupOrientation", g.orientation);
  }
  if (g.variant !== undefined) {
    context.set("groupVariant", g.variant);
  }
  if (g.color !== undefined) {
    context.set("groupColor", g.color);
  }
  if (g.size !== undefined) {
    context.set("groupSize", g.size);
  }
  if (g.disabled !== undefined) {
    context.set("groupDisabled", g.disabled);
  }
}

export const tabsItemMachine: TabsItemMachine =
  createMachine<TabsItemSchema>({
    props: ({ props }) => ({
      ...defaultTabsItemProps,
      ...props,
    }),

    initialState: () => "idle",

    refs: ({ prop }) => ({
      currentGroupBus: prop("groupBus"),
      busDisposers: [],
    }),

    context: ({ prop, bindable }) => {
      const propBindable = <K extends keyof TabsItemSchema["context"]>(
        key: K,
        defaultValue: TabsItemSchema["context"][K],
      ) =>
        bindable<TabsItemSchema["context"][K]>(() => ({
          value: prop(key as any) as TabsItemSchema["context"][K] | undefined,
          defaultValue,
        }));

      const stateBindable = <K extends keyof TabsItemSchema["context"]>(
        _key: K,
        defaultValue: TabsItemSchema["context"][K],
      ) =>
        bindable<TabsItemSchema["context"][K]>(() => ({
          defaultValue,
        }));

      return {
        value: propBindable("value", ""),
        label: propBindable("label", ""),
        icon: propBindable("icon", undefined),
        trailingIcon: propBindable("trailingIcon", undefined),
        badge: propBindable("badge", undefined),
        disabled: propBindable("disabled", false),
        lazy: propBindable("lazy", true),

        tabsId: propBindable("tabsId", undefined),
        groupValue: stateBindable("groupValue", prop("groupValue")),
        groupOrientation: stateBindable(
          "groupOrientation",
          prop("groupOrientation"),
        ),
        groupVariant: stateBindable("groupVariant", prop("groupVariant")),
        groupColor: stateBindable("groupColor", prop("groupColor")),
        groupSize: stateBindable("groupSize", prop("groupSize")),
        groupDisabled: stateBindable("groupDisabled", prop("groupDisabled")),
        groupIndex: propBindable("groupIndex", undefined),
      };
    },

    computed: {
      resolvedValue: ({ context }) => {
        const v = context.get("value");
        if (v !== undefined && v !== null && v !== "") return v;
        const idx = context.get("groupIndex");
        return idx !== undefined ? idx : "";
      },
      isSelected: ({ context, computed }) => {
        const selfVal = computed("resolvedValue");
        const gVal = context.get("groupValue");
        return selfVal !== "" && gVal !== undefined && selfVal === gVal;
      },
      isDisabled: ({ context }) => {
        return Boolean(context.get("disabled") || context.get("groupDisabled"));
      },
    },

    watch: ({ prop, refs, context }) => {
      const nextBus = prop("groupBus");
      if (nextBus !== refs.get("currentGroupBus")) {
        for (const d of refs.get("busDisposers") ?? []) d?.();
        refs.set("currentGroupBus", nextBus);
        refs.set(
          "busDisposers",
          nextBus
            ? [
                nextBus.on("tabs:change", (snapshot) => {
                  applyGroupState(context, snapshot);
                }),
              ]
            : [],
        );
      }
    },

    entry: ["setupBusListener"],
    exit: ["cleanupBusListener"],

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
        setupBusListener: ({ refs, context, prop }) => {
          const bus = prop("groupBus") ?? refs.get("currentGroupBus");
          if (!bus) return;
          refs.set("currentGroupBus", bus);
          const unsub = bus.on("tabs:change", (snapshot) => {
            applyGroupState(context, snapshot);
          });
          refs.set("busDisposers", [unsub]);
        },
        cleanupBusListener: ({ refs }) => {
          for (const d of refs.get("busDisposers") ?? []) d?.();
          refs.set("busDisposers", []);
        },
        selectTab: ({ computed, refs }) => {
          if (computed("isDisabled")) return;
          const val = computed("resolvedValue");
          const bus = refs.get("currentGroupBus");
          bus?.emit("item:select", { value: val });
        },
      },
    },
  });
