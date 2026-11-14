import { createMachine } from "@code-ui/core";
import type { PropFn } from "@code-ui/core";
import { defaultTabsProps } from "./tabs.props";
import type {
  NormalizedTabItem,
  TabsGroupContext,
  TabsItem,
  TabsMachine,
  TabsSchema,
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

const rawItemsOf = (prop: PropFn<TabsSchema>) => {
  const items = prop("items");
  return items.length ? items : prop("childItems");
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
      orientation: () => prop("orientation"),
      variant: () => prop("variant"),
      color: () => prop("color"),
      size: () => prop("size"),
      disabled: () => prop("disabled"),
      fitted: () => prop("fitted"),
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
      const controlledVal = rawVal !== null ? rawVal : undefined;
      const normalized = normalizeItems(rawItemsOf(prop));
      let defaultVal = prop("defaultValue");
      if (defaultVal === null) {
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
  }),

  computed: {
    normalizedItems: ({ prop }) => normalizeItems(rawItemsOf(prop)),
    selectedValue: ({ context, computed }) => {
      const current = context.get("value");
      if (current !== "") {
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
    isDisabled: ({ prop }) => prop("disabled"),
  },

  on: {
    SELECT: {
      guard: "canSelect",
      actions: ["selectTab"],
    },
    SET_VALUE: {
      guard: "isInteractive",
      actions: ["selectTab"],
    },
    NEXT: {
      guard: "isInteractive",
      actions: ["selectNextTab"],
    },
    PREV: {
      guard: "isInteractive",
      actions: ["selectPrevTab"],
    },
    FIRST: {
      guard: "isInteractive",
      actions: ["selectFirstTab"],
    },
    LAST: {
      guard: "isInteractive",
      actions: ["selectLastTab"],
    },
  },

  states: {
    idle: {
      tags: ["idle"],
      on: {
        FOCUS: {
          guard: "isInteractive",
          target: "focused",
          actions: ["setFocusedValue", "autoSelectOnFocus"],
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
          actions: ["setFocusedValue", "autoSelectOnFocus"],
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
        if (event.type === "FOCUS" && prop("activationMode") === "automatic") {
          context.set("value", event.value);
        }
      },
      selectNextTab: ({ context, computed, prop }) => {
        const next = stepTab(
          computed("normalizedItems"),
          computed("selectedIndex"),
          1,
          prop("loopFocus"),
        );
        if (next !== undefined) context.set("value", next);
      },
      selectPrevTab: ({ context, computed, prop }) => {
        const prev = stepTab(
          computed("normalizedItems"),
          computed("selectedIndex"),
          -1,
          prop("loopFocus"),
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
    },
  },
});
