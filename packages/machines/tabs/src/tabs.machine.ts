import { createMachine } from "@code-ui/core";
import { createEventBus } from "@code-ui/utils";
import { defaultTabsProps } from "./tabs.props";
import { performTabsScrollUpdate } from "./tabs.utils";
import type {
  NormalizedTabItem,
  TabsBusEvents,
  TabsColor,
  TabsItem,
  TabsMachine,
  TabsOrientation,
  TabsSchema,
  TabsSize,
  TabsVariant,
} from "./tabs.types";

export function normalizeItems(
  rawItems: Array<TabsItem | string> | undefined,
): NormalizedTabItem[] {
  if (!rawItems || !Array.isArray(rawItems)) return [];
  return rawItems.map((item, index) => {
    if (typeof item === "string") {
      return {
        label: item,
        value: item,
        disabled: false,
      };
    }
    return {
      ...item,
      label: item.label ?? String(item.value ?? index),
      value: item.value ?? item.label ?? index,
      disabled: Boolean(item.disabled),
    };
  });
}

function emitTabsChange(
  prop: any,
  refs: any,
  valueOverride?: string | number,
) {
  const bus = refs?.get?.("bus");
  if (!bus) return;
  const currentVal = valueOverride ?? prop("value");
  bus.emit("tabs:change", {
    value: currentVal !== null && currentVal !== undefined ? currentVal : "",
    orientation: (prop("orientation") ?? "horizontal") as TabsOrientation,
    variant: (prop("variant") ?? "pill") as TabsVariant,
    color: (prop("color") ?? "primary") as TabsColor,
    size: (prop("size") ?? "md") as TabsSize,
    disabled: Boolean(prop("disabled")),
  });
}

export const tabsMachine: TabsMachine = createMachine<TabsSchema>({
  props: ({ props }) => ({
    ...defaultTabsProps,
    ...props,
  }),

  initialState: () => "idle",

  refs: () => {
    const bus = createEventBus<TabsBusEvents>();
    return {
      bus,
      busDisposers: [],
    };
  },

  context: ({ prop, bindable, getRefs }) => ({
    value: bindable<string | number>(() => {
      const rawVal = prop("value");
      const controlledVal =
        rawVal !== null && rawVal !== undefined ? rawVal : undefined;

      const raw = (prop("items") && prop("items")?.length) ? prop("items") : prop("childItems");
      const normalized = normalizeItems(raw);
      let defaultVal = prop("defaultValue");
      if (defaultVal === null || defaultVal === undefined) {
        const firstEnabled =
          normalized.find((it) => !it.disabled) ?? normalized[0];
        defaultVal = firstEnabled ? firstEnabled.value : "";
      }
      return {
        value: controlledVal,
        defaultValue: defaultVal,
        onChange(value) {
          const itemsRaw = (prop("items") && prop("items")?.length) ? prop("items") : prop("childItems");
          const items = normalizeItems(itemsRaw);
          const index = items.findIndex((it) => it.value === value);
          prop("onChange")?.({
            value,
            index: index >= 0 ? index : 0,
          });
          emitTabsChange(prop, getRefs(), value);
        },
      };
    }),
    focusedValue: bindable<string | number | null>(() => ({
      defaultValue: null,
    })),
    scrollLeft: bindable<number>(() => ({
      defaultValue: 0,
    })),
    canScrollLeft: bindable<boolean>(() => ({
      defaultValue: false,
    })),
    canScrollRight: bindable<boolean>(() => ({
      defaultValue: false,
    })),
  }),

  computed: {
    normalizedItems: ({ prop }) => {
      const raw = (prop("items") && prop("items")?.length) ? prop("items") : prop("childItems");
      return normalizeItems(raw);
    },
    selectedValue: ({ context, computed }) => {
      const current = context.get("value");
      if (current !== undefined && current !== null && current !== "") {
        return current;
      }
      const items = computed("normalizedItems");
      const firstEnabled = items.find((it) => !it.disabled) ?? items[0];
      return firstEnabled ? firstEnabled.value : "";
    },
    selectedIndex: ({ computed }) => {
      const selected = computed("selectedValue");
      const items = computed("normalizedItems");
      return items.findIndex((it) => it.value === selected);
    },
    totalCount: ({ computed }) => computed("normalizedItems").length,
    isDisabled: ({ prop }) => Boolean(prop("disabled")),
    selectedItem: ({ computed }) => {
      const selected = computed("selectedValue");
      const items = computed("normalizedItems");
      return items.find((it) => it.value === selected);
    },
  },

  effects: ["trackControlledValue"],
  entry: ["setupBus"],
  exit: ["cleanupBus"],

  on: {
    SELECT: {
      guard: "canSelect",
      actions: ["selectTab", "updateScroll"],
    },
    SET_VALUE: {
      guard: "isInteractive",
      actions: ["selectTab", "updateScroll"],
    },
    NEXT: {
      guard: "isInteractive",
      actions: ["selectNextTab", "updateScroll"],
    },
    PREV: {
      guard: "isInteractive",
      actions: ["selectPrevTab", "updateScroll"],
    },
    FIRST: {
      guard: "isInteractive",
      actions: ["selectFirstTab", "updateScroll"],
    },
    LAST: {
      guard: "isInteractive",
      actions: ["selectLastTab", "updateScroll"],
    },
  },

  states: {
    idle: {
      tags: ["idle"],
      on: {
        FOCUS: {
          guard: "isInteractive",
          target: "focused",
          actions: ["setFocusedValue", "autoSelectOnFocus", "updateScroll"],
        },
      },
    },
    focused: {
      tags: ["focused"],
      on: {
        BLUR: {
          target: "idle",
          actions: ["clearFocusedValue"],
        },
        FOCUS: {
          guard: "isInteractive",
          actions: ["setFocusedValue", "autoSelectOnFocus", "updateScroll"],
        },
      },
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => !computed("isDisabled"),
      canSelect: ({ computed, event }) => {
        if (event.type !== "SELECT") return false;
        if (computed("isDisabled")) return false;
        const items = computed("normalizedItems");
        const target = items.find((it) => it.value === event.value);
        return target ? !target.disabled : true;
      },
    },
    actions: {
      setupBus: ({ refs, send, prop, computed }) => {
        const bus = refs.get("bus");
        if (!bus) return;
        const unsub = bus.on("item:select", ({ value }: { value: string | number }) => {
          send({ type: "SELECT", value });
        });
        refs.set("busDisposers", [unsub]);
        emitTabsChange(prop, refs, computed("selectedValue"));
      },
      cleanupBus: ({ refs }) => {
        for (const d of refs.get("busDisposers") ?? []) d?.();
        refs.set("busDisposers", []);
      },
      selectTab: ({ context, event }) => {
        if (event.type !== "SELECT" && event.type !== "SET_VALUE") return;
        context.set("value", event.value);
      },
      setFocusedValue: ({ context, event }) => {
        if (event.type !== "FOCUS") return;
        context.set("focusedValue", event.value);
      },
      clearFocusedValue: ({ context }) => {
        context.set("focusedValue", null);
      },
      autoSelectOnFocus: ({ context, prop, event }) => {
        if (event.type !== "FOCUS") return;
        const mode = prop("activationMode") ?? "automatic";
        if (mode === "automatic") {
          context.set("value", event.value);
        }
      },
      selectNextTab: ({ context, computed, prop }) => {
        const items = computed("normalizedItems");
        if (items.length === 0) return;
        const currentIndex = computed("selectedIndex");
        const loop = prop("loopFocus") ?? true;
        const len = items.length;
        for (let i = 1; i < len; i++) {
          const nextIdx = (currentIndex + i) % len;
          if (!loop && nextIdx < currentIndex) break;
          const item = items[nextIdx];
          if (item && !item.disabled) {
            context.set("value", item.value);
            return;
          }
        }
      },
      selectPrevTab: ({ context, computed, prop }) => {
        const items = computed("normalizedItems");
        if (items.length === 0) return;
        const currentIndex = computed("selectedIndex");
        const loop = prop("loopFocus") ?? true;
        const len = items.length;
        for (let i = 1; i < len; i++) {
          const prevIdx = (currentIndex - i + len) % len;
          if (!loop && prevIdx > currentIndex) break;
          const item = items[prevIdx];
          if (item && !item.disabled) {
            context.set("value", item.value);
            return;
          }
        }
      },
      selectFirstTab: ({ context, computed }) => {
        const items = computed("normalizedItems");
        const first = items.find((it) => !it.disabled);
        if (first) {
          context.set("value", first.value);
        }
      },
      selectLastTab: ({ context, computed }) => {
        const items = computed("normalizedItems");
        for (let i = items.length - 1; i >= 0; i--) {
          const item = items[i];
          if (item && !item.disabled) {
            context.set("value", item.value);
            return;
          }
        }
      },
      updateScroll: ({ context, computed, prop, scope }) => {
        performTabsScrollUpdate(context, computed, prop, scope);
      },
    },
    effects: {
      trackControlledValue: ({ prop, refs, context, computed, scope, track }) => {
        let initial = true;
        track(
          [
            () => prop("value"),
            () => prop("orientation"),
            () => prop("variant"),
            () => prop("color"),
            () => prop("size"),
            () => prop("disabled"),
          ],
          () => {
            if (initial) {
              initial = false;
              if (computed("selectedIndex") > 0) {
                performTabsScrollUpdate(context, computed, prop, scope);
              }
              return;
            }
            performTabsScrollUpdate(context, computed, prop, scope);
            emitTabsChange(prop, refs, computed("selectedValue"));
          },
        );
      },
    },
  },
});
