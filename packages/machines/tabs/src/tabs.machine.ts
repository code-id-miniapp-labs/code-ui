import { createMachine } from "@code-ui/core";
import { defaultTabsProps } from "./tabs.props";
import { performTabsScrollUpdate } from "./tabs.utils";
import type {
  NormalizedTabItem,
  TabsColor,
  TabsGroupContext,
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
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map((item, index) =>
    typeof item === "string"
      ? { label: item, value: item, disabled: false }
      : {
          ...item,
          label: item.label ?? String(item.value ?? index),
          value: item.value ?? item.label ?? index,
          disabled: Boolean(item.disabled),
        },
  );
}

const rawItemsOf = (prop: (k: any) => any) => {
  const items = prop("items");
  return items?.length ? items : prop("childItems");
};

const stepTab = (
  items: NormalizedTabItem[],
  currentIndex: number,
  delta: 1 | -1,
  loop: boolean,
): string | number | undefined => {
  const len = items.length;
  for (let i = 1; i < len; i++) {
    const idx = (currentIndex + delta * i + len) % len;
    if (!loop && (delta > 0 ? idx < currentIndex : idx > currentIndex)) break;
    const item = items[idx];
    if (item && !item.disabled) return item.value;
  }
  return undefined;
};

export const tabsMachine: TabsMachine = createMachine<TabsSchema>({
  props: ({ props }) => ({
    ...defaultTabsProps,
    ...props,
  }),

  initialState: () => "idle",

  refs: ({ prop, computed, send }) => ({
    groupContext: {
      value: () => computed("selectedValue"),
      orientation: () => (prop("orientation") ?? "horizontal") as TabsOrientation,
      variant: () => (prop("variant") ?? "pill") as TabsVariant,
      color: () => (prop("color") ?? "primary") as TabsColor,
      size: () => (prop("size") ?? "md") as TabsSize,
      disabled: () => Boolean(prop("disabled")),
      fitted: () => Boolean(prop("fitted")),
      select: (value) => send({ type: "SELECT", value }),
      setValue: (value) => send({ type: "SET_VALUE", value }),
      next: () => send({ type: "NEXT" }),
      previous: () => send({ type: "PREV" }),
      first: () => send({ type: "FIRST" }),
      last: () => send({ type: "LAST" }),
    } satisfies TabsGroupContext,
  }),

  context: ({ prop, bindable }) => ({
    value: bindable<string | number>(() => {
      const rawVal = prop("value");
      const controlledVal =
        rawVal !== null && rawVal !== undefined ? rawVal : undefined;
      const normalized = normalizeItems(rawItemsOf(prop));
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
          const items = normalizeItems(rawItemsOf(prop));
          const index = items.findIndex((it) => it.value === value);
          prop("onChange")?.({ value, index: index >= 0 ? index : 0 });
        },
      };
    }),
    focusedValue: bindable<string | number | null>(() => ({
      defaultValue: null,
    })),
    scrollLeft: bindable<number>(() => ({ defaultValue: 0 })),
    canScrollLeft: bindable<boolean>(() => ({ defaultValue: false })),
    canScrollRight: bindable<boolean>(() => ({ defaultValue: false })),
  }),

  computed: {
    normalizedItems: ({ prop }) => normalizeItems(rawItemsOf(prop)),
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
      return computed("normalizedItems").findIndex(
        (it) => it.value === selected,
      );
    },
    totalCount: ({ computed }) => computed("normalizedItems").length,
    isDisabled: ({ prop }) => Boolean(prop("disabled")),
    selectedItem: ({ computed }) => {
      const selected = computed("selectedValue");
      return computed("normalizedItems").find((it) => it.value === selected);
    },
  },

  effects: ["trackControlledValue"],

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
        if (event.type !== "SELECT" || computed("isDisabled")) return false;
        const target = computed("normalizedItems").find(
          (it) => it.value === event.value,
        );
        return target ? !target.disabled : true;
      },
    },
    actions: {
      selectTab: ({ context, event }) => {
        if (event.type === "SELECT" || event.type === "SET_VALUE") {
          context.set("value", event.value);
        }
      },
      setFocusedValue: ({ context, event }) => {
        if (event.type === "FOCUS") context.set("focusedValue", event.value);
      },
      clearFocusedValue: ({ context }) => {
        context.set("focusedValue", null);
      },
      autoSelectOnFocus: ({ context, prop, event }) => {
        if (
          event.type === "FOCUS" &&
          (prop("activationMode") ?? "automatic") === "automatic"
        ) {
          context.set("value", event.value);
        }
      },
      selectNextTab: ({ context, computed, prop }) => {
        const next = stepTab(
          computed("normalizedItems"),
          computed("selectedIndex"),
          1,
          prop("loopFocus") ?? true,
        );
        if (next !== undefined) context.set("value", next);
      },
      selectPrevTab: ({ context, computed, prop }) => {
        const prev = stepTab(
          computed("normalizedItems"),
          computed("selectedIndex"),
          -1,
          prop("loopFocus") ?? true,
        );
        if (prev !== undefined) context.set("value", prev);
      },
      selectFirstTab: ({ context, computed }) => {
        const first = computed("normalizedItems").find((it) => !it.disabled);
        if (first) context.set("value", first.value);
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
      trackControlledValue: ({ prop, context, computed, scope, track }) => {
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
          },
        );
      },
    },
  },
});
