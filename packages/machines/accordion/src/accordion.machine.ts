import { createMachine } from "@code-ui/core";
import { isEqual } from "@code-ui/utils";
import type {
  AccordionGroupContext,
  AccordionMachine,
  AccordionSchema,
} from "./accordion.types";
import { defaultAccordionProps } from "./accordion.props";

function normalizeValue(
  raw: string | number | (string | number)[] | undefined | null,
): string[] {
  if (raw === undefined || raw === null || raw === "") return [];
  return Array.isArray(raw) ? raw.map(String) : [String(raw)];
}

function resolveControlledValue(prop: (key: any) => any): string[] | undefined {
  const raw = prop("value") ?? prop("modelValue");
  return raw !== null && raw !== undefined ? normalizeValue(raw) : undefined;
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

    context: ({ prop, bindable }) => ({
      value: bindable<string[]>(() => {
        const controlledVal = resolveControlledValue(prop);
        return {
          value: controlledVal,
          defaultValue: controlledVal ?? normalizeValue(prop("defaultValue")),
          isEqual,
          onChange: (nextValue) => {
            prop("onChange")?.({ value: nextValue, expanded: nextValue });
            prop("onUpdateModelValue")?.(
              prop("multiple") ? nextValue : (nextValue[0] ?? ""),
            );
          },
        };
      }),
    }),

    computed: {
      expandedValues: ({ context }) => context.get("value") ?? [],
      isMultiple: ({ prop }) => Boolean(prop("multiple")),
      isCollapsible: ({ prop }) => prop("collapsible") !== false,
      isDisabled: ({ prop }) => Boolean(prop("disabled")),
      totalCount: ({ prop }) => {
        const items = prop("items") ?? [];
        return Array.isArray(items) && items.length > 0
          ? items.length
          : Number(prop("linkedCount") ?? 0);
      },
    },

    on: {
      "VALUE.SET": { actions: ["setValueAction"] },
      "VALUE.TOGGLE": { actions: ["toggleValueAction"] },
      "ITEM.SET_OPEN": { actions: ["setItemOpenAction"] },
      EXPAND_ALL: { actions: ["expandAllAction"] },
      COLLAPSE_ALL: { actions: ["collapseAllAction"] },
    },

    states: {
      idle: { tags: ["idle"] },
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
          if (event.type !== "VALUE.TOGGLE" || computed("isDisabled")) return;
          const target = String(event.value);
          const current = context.get("value") ?? [];
          if (current.includes(target)) {
            if (!computed("isCollapsible") && current.length <= 1) return;
            context.set(
              "value",
              current.filter((v) => v !== target),
            );
          } else {
            context.set(
              "value",
              computed("isMultiple") ? [...current, target] : [target],
            );
          }
        },

        setItemOpenAction: ({ event, context, computed }) => {
          if (event.type !== "ITEM.SET_OPEN" || computed("isDisabled")) return;
          const target = String(event.value);
          const current = context.get("value") ?? [];
          if (current.includes(target) === event.open) return;

          if (event.open) {
            context.set(
              "value",
              computed("isMultiple") ? [...current, target] : [target],
            );
            return;
          }
          if (!computed("isCollapsible") && current.length <= 1) return;
          context.set(
            "value",
            current.filter((v) => v !== target),
          );
        },

        expandAllAction: ({ context, computed, prop }) => {
          if (computed("isDisabled")) return;
          const items = prop("items") ?? [];
          context.set(
            "value",
            items.map((item, idx) => String(item.value ?? idx)),
          );
        },

        collapseAllAction: ({ context, computed }) => {
          if (!computed("isDisabled") && computed("isCollapsible")) {
            context.set("value", []);
          }
        },
      },
    },
  });
