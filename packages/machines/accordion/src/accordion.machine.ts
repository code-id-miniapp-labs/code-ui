import { createMachine } from "@code-ui/core";
import { createEventBus, isEqual } from "@code-ui/utils";
import type {
  AccordionBusEvents,
  AccordionChangePayload,
  AccordionContext,
  AccordionMachine,
  AccordionProps,
  AccordionSchema,
  AccordionSize,
  AccordionVariant,
} from "./accordion.types";
import { defaultAccordionProps } from "./accordion.props";

function normalizeValue(
  raw: string | number | (string | number)[] | undefined | null,
): string[] {
  if (raw === undefined || raw === null || raw === "") return [];
  if (Array.isArray(raw)) return raw.map(String);
  return [String(raw)];
}

function resolveControlledValue(
  prop: (key: any) => any,
): string[] | undefined {
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

    refs: ({ prop }) => {
      const bus = createEventBus<AccordionBusEvents>();
      const controlled = resolveControlledValue(prop);
      const initial =
        controlled ?? normalizeValue(prop("defaultValue"));
      return {
        initialValue: initial,
        bus,
        busDisposers: [],
        syncingFromProps: false,
        prevControlledValue: controlled,
      };
    },

    context: ({ prop, bindable, getRefs }) => {
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
          const initial =
            controlledVal ?? normalizeValue(prop("defaultValue"));

          return {
            value: controlledVal,
            defaultValue: initial,
            isEqual,
            onChange: (nextValue) => {
              const refs = getRefs();
              if (refs.get("syncingFromProps")) {
                return;
              }

              const details = {
                value: nextValue,
                expanded: nextValue,
              };

              prop("onChange")?.(details);
              prop("onValueChange")?.(details);

              const comp = prop("component");
              comp?.triggerEvent?.("change", details);
              const modelVal = prop("multiple")
                ? nextValue
                : (nextValue[0] ?? "");
              comp?.triggerEvent?.("update:modelValue", modelVal);

              // Notify connected items via bus
              const bus = refs.get("bus");
              if (bus) {
                const payload: AccordionChangePayload = {
                  value: nextValue,
                  multiple: Boolean(prop("multiple")),
                  collapsible: prop("collapsible") !== false,
                  disabled: Boolean(prop("disabled")),
                  size: (prop("size") ?? "md") as AccordionSize,
                  variant: (prop("variant") ?? "outline") as AccordionVariant,
                };
                bus.emit("accordion:change", payload);
              }
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

    entry: ["setupBus"],

    exit: ["cleanupBus"],

    watch: ({ prop, context, refs, computed }) => {
      const propCollapsible = prop("collapsible");
      if (
        propCollapsible !== undefined &&
        context.get("collapsible") !== propCollapsible
      ) {
        context.set("collapsible", propCollapsible);
      }
      const propMultiple = prop("multiple");
      if (
        propMultiple !== undefined &&
        context.get("multiple") !== propMultiple
      ) {
        context.set("multiple", propMultiple);
      }
      const propDisabled = prop("disabled");
      if (
        propDisabled !== undefined &&
        context.get("disabled") !== propDisabled
      ) {
        context.set("disabled", propDisabled);
      }

      const controlled = resolveControlledValue(prop);
      const prevControlled = refs.get("prevControlledValue");
      if (
        controlled !== undefined &&
        !isEqual(controlled, prevControlled)
      ) {
        refs.set("prevControlledValue", controlled);
        if (
          !computed("isCollapsible") &&
          controlled.length === 0 &&
          (context.get("value") ?? []).length > 0
        ) {
          // Do not allow collapsing to empty when not collapsible
        } else {
          refs.set("syncingFromProps", true);
          context.set("value", controlled);
          refs.set("syncingFromProps", false);
        }
      }

      const bus = refs.get("bus");
      if (bus) {
        const payload: AccordionChangePayload = {
          value: context.get("value") ?? [],
          multiple: Boolean(context.get("multiple")),
          collapsible: context.get("collapsible") !== false,
          disabled: Boolean(context.get("disabled")),
          size: context.get("size") || "md",
          variant: context.get("variant") || "outline",
        };
        bus.emit("accordion:change", payload);
      }
    },

    on: {
      "VALUE.SET": {
        actions: ["setValueAction"],
      },
      "VALUE.TOGGLE": {
        actions: ["toggleValueAction"],
      },
      "ITEM.TOGGLE": {
        actions: ["toggleValueAction"],
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
        setupBus: ({ refs, send, context }) => {
          const bus = refs.get("bus");
          if (!bus) return;
          const unsub = bus.on("item:toggle", ({ value }) => {
            send({ type: "VALUE.TOGGLE", value });
          });
          refs.set("busDisposers", [unsub]);

          const payload: AccordionChangePayload = {
            value: context.get("value") ?? [],
            multiple: Boolean(context.get("multiple")),
            collapsible: Boolean(context.get("collapsible")),
            disabled: Boolean(context.get("disabled")),
            size: context.get("size") || "md",
            variant: context.get("variant") || "outline",
          };
          bus.emit("accordion:change", payload);
        },

        cleanupBus: ({ refs }) => {
          const disposers = refs.get("busDisposers") || [];
          for (const d of disposers) d?.();
          refs.set("busDisposers", []);
        },

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
          if (event.type !== "VALUE.TOGGLE" && event.type !== "ITEM.TOGGLE") return;
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

        expandAllAction: ({ context, computed }) => {
          if (computed("isDisabled")) return;
          const items = context.get("items") ?? [];
          const allValues: string[] = items.map(
            (item, idx) => String(item.value ?? idx),
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
