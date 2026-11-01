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
  if (g.disabled !== undefined) {
    context.set("groupDisabled", g.disabled);
  }
}

function bindGroupBus(
  bus: any,
  context: TabsItemParams["context"],
  refs: TabsItemParams["refs"],
): void {
  for (const d of refs.get("busDisposers") ?? []) d?.();
  refs.set("currentGroupBus", bus);
  refs.set(
    "busDisposers",
    bus
      ? [
          bus.on("tabs:change", (snapshot: TabsItemGroupStateSnapshot) => {
            applyGroupState(context, snapshot);
          }),
        ]
      : [],
  );
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

    context: ({ prop, bindable }) => ({
      groupValue: bindable<string | number | undefined>(() => ({
        defaultValue: prop("groupValue"),
      })),
      groupDisabled: bindable<boolean | undefined>(() => ({
        defaultValue: prop("groupDisabled"),
      })),
    }),

    computed: {
      resolvedValue: ({ prop }) => {
        const v = prop("value");
        if (v !== undefined && v !== null && v !== "") return v;
        const idx = prop("groupIndex") ?? prop("index");
        return idx !== undefined ? idx : "";
      },
      isSelected: ({ context, computed, prop }) => {
        const direct = prop("selected");
        if (direct !== undefined && direct !== null) {
          return Boolean(direct);
        }
        const selfVal = computed("resolvedValue");
        const gVal = context.get("groupValue") ?? prop("groupValue");
        return selfVal !== "" && gVal !== undefined && selfVal === gVal;
      },
      isDisabled: ({ context, prop }) => {
        return Boolean(
          prop("disabled") ||
            context.get("groupDisabled") ||
            prop("groupDisabled"),
        );
      },
    },

    watch: ({ prop, refs, context }) => {
      const nextBus = prop("groupBus");
      if (nextBus !== refs.get("currentGroupBus")) {
        bindGroupBus(nextBus, context, refs);
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
          bindGroupBus(prop("groupBus") ?? refs.get("currentGroupBus"), context, refs);
        },
        cleanupBusListener: ({ refs }) => {
          for (const d of refs.get("busDisposers") ?? []) d?.();
          refs.set("busDisposers", []);
          refs.set("currentGroupBus", undefined);
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
