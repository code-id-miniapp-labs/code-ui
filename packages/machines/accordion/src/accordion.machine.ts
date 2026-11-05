import { createMachine } from "@code-ui/core";
import { isEqual } from "@code-ui/utils";
import type {
  AccordionContext,
  AccordionGroupContext,
  AccordionMachine,
  AccordionProps,
  AccordionSchema,
} from "./accordion.types";
import { defaultAccordionProps } from "./accordion.props";

function normalizeValue(
  raw: string | number | (string | number)[] | undefined | null,
): string[] {
  if (raw === undefined || raw === null || raw === "") return [];
  if (Array.isArray(raw)) return raw.map(String);
  return [String(raw)];
}

function resolveControlledValue(prop: (key: any) => any): string[] | undefined {
  const raw = prop("value") ?? prop("modelValue");
  if (raw !== null && raw !== undefined) {
    return normalizeValue(raw);
  }
  return undefined;
}

export const accordionMachine: AccordionMachine =
  createMachine<AccordionSchema>({
    props: ({ props }) => ({
      ...defaultAccordionProps,
      ...props,
    }),

    initialState: () => "idle",

    refs: ({ prop, context, send }) => ({
      groupContext: {
        value: () => context.get("value") ?? [],
        multiple: () => Boolean(prop("multiple")),
        collapsible: () => prop("collapsible") !== false,
        disabled: () => Boolean(prop("disabled")),
        size: () => prop("size") ?? "md",
        variant: () => prop("variant") ?? "outline",
        toggleItem: (value) => send({ type: "VALUE.TOGGLE", value }),
        setItemOpen: (value, open) =>
          send({ type: "ITEM.SET_OPEN", value, open }),
        setValue: (value) => send({ type: "VALUE.SET", value }),
        expandAll: () => send({ type: "EXPAND_ALL" }),
        collapseAll: () => send({ type: "COLLAPSE_ALL" }),
      } satisfies AccordionGroupContext,
    }),

    context: ({ prop, bindable }) => {
      const propBindable = <
        K extends keyof AccordionContext & keyof AccordionProps,
      >(
        key: K,
        defaultValue: AccordionContext[K],
      ) =>
        bindable<AccordionContext[K]>(() => ({
          value: prop(key) as AccordionContext[K] | undefined,
          defaultValue,
        }));

      return {
        id: propBindable("id", ""),
        value: bindable<string[]>(() => {
          const controlledVal = resolveControlledValue(prop);
          const initial = controlledVal ?? normalizeValue(prop("defaultValue"));

          return {
            value: controlledVal,
            defaultValue: initial,
            isEqual,
            onChange: (nextValue) => {
              const details = {
                value: nextValue,
                expanded: nextValue,
              };

              prop("onChange")?.(details);
              const modelVal = prop("multiple")
                ? nextValue
                : (nextValue[0] ?? "");
              prop("onUpdateModelValue")?.(modelVal);
            },
          };
        }),
        multiple: propBindable("multiple", false),
        collapsible: propBindable("collapsible", true),
        disabled: propBindable("disabled", false),
        size: propBindable("size", "md"),
        variant: propBindable("variant", "outline"),
        items: propBindable("items", []),
        linkedCount: propBindable("linkedCount", 0),
        ui: propBindable("ui", {}),
      };
    },

    computed: {
      expandedValues: ({ context }) => context.get("value") ?? [],

      isMultiple: ({ context }) => Boolean(context.get("multiple")),

      isCollapsible: ({ context }) => context.get("collapsible") !== false,

      isDisabled: ({ context }) => Boolean(context.get("disabled")),

      totalCount: ({ context }) => {
        const items = context.get("items") ?? [];
        if (Array.isArray(items) && items.length > 0) return items.length;
        return Number(context.get("linkedCount") ?? 0);
      },
    },

    on: {
      "VALUE.SET": {
        actions: ["setValueAction"],
      },
      "VALUE.TOGGLE": {
        actions: ["toggleValueAction"],
      },
      "ITEM.SET_OPEN": {
        actions: ["setItemOpenAction"],
      },
      EXPAND_ALL: {
        actions: ["expandAllAction"],
      },
      COLLAPSE_ALL: {
        actions: ["collapseAllAction"],
      },
    },

    states: {
      idle: {
        tags: ["idle"],
      },
    },

    implementations: {
      actions: {
        setValueAction: ({ event, context, computed }) => {
          if (event.type !== "VALUE.SET") return;
          const normalized = normalizeValue(event.value);
          if (
            !computed("isCollapsible") &&
            normalized.length === 0 &&
            (context.get("value") ?? []).length > 0
          ) {
            return;
          }
          context.set("value", normalized);
        },

        toggleValueAction: ({ event, context, computed }) => {
          if (event.type !== "VALUE.TOGGLE") return;
          if (computed("isDisabled")) return;

          const target = String(event.value);
          const current = [...(context.get("value") ?? [])];
          const isMultiple = computed("isMultiple");
          const isCollapsible = computed("isCollapsible");
          const isOpen = current.includes(target);

          let next: string[];
          if (isOpen) {
            if (!isCollapsible && current.length <= 1) {
              return;
            }
            if (isCollapsible || current.length > 1) {
              next = current.filter((v) => v !== target);
            } else {
              return;
            }
          } else {
            if (isMultiple) {
              next = [...current, target];
            } else {
              next = [target];
            }
          }

          context.set("value", next);
        },

        setItemOpenAction: ({ event, context, computed }) => {
          if (event.type !== "ITEM.SET_OPEN") return;
          if (computed("isDisabled")) return;

          const target = String(event.value);
          const current = context.get("value") ?? [];
          const isOpen = current.includes(target);
          if (isOpen === event.open) return;

          if (event.open) {
            const next = computed("isMultiple")
              ? [...current, target]
              : [target];
            context.set("value", next);
            return;
          }

          if (!computed("isCollapsible") && current.length <= 1) return;
          context.set(
            "value",
            current.filter((v) => v !== target),
          );
        },

        expandAllAction: ({ context, computed }) => {
          if (computed("isDisabled")) return;
          const items = context.get("items") ?? [];
          const allValues: string[] = items.map((item, idx) =>
            String(item.value ?? idx),
          );
          context.set("value", allValues);
        },

        collapseAllAction: ({ context, computed }) => {
          if (computed("isDisabled")) return;
          if (!computed("isCollapsible")) return;
          context.set("value", []);
        },
      },
    },
  });
