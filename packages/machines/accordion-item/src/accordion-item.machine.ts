import { createMachine } from "@code-ui/core";
import { isEqual } from "@code-ui/utils";
import type {
  AccordionChangePayload,
  AccordionSize,
  AccordionVariant,
} from "@code-ui/accordion";
import type {
  AccordionGroupStateSnapshot,
  AccordionItemContext,
  AccordionItemMachine,
  AccordionItemParams,
  AccordionItemProps,
  AccordionItemSchema,
} from "./accordion-item.types";
import { defaultAccordionItemProps } from "./accordion-item.props";

export type { AccordionGroupStateSnapshot };

export function applyGroupState(
  context: AccordionItemParams["context"],
  g: AccordionGroupStateSnapshot,
) {
  if (Array.isArray(g.value)) {
    if (!isEqual(g.value, context.get("groupValue"))) {
      context.set("groupValue", g.value);
    }
  } else if (g.value === undefined && context.get("groupValue") !== undefined) {
    context.set("groupValue", undefined);
  }
  if (g.multiple !== undefined) {
    context.set("groupMultiple", Boolean(g.multiple));
  }
  if (g.collapsible !== undefined) {
    context.set("groupCollapsible", Boolean(g.collapsible));
  }
  if (g.disabled !== undefined) {
    context.set("groupDisabled", Boolean(g.disabled));
  }
  if (g.size !== undefined && g.size !== "") {
    context.set("groupSize", g.size);
  }
  if (g.variant !== undefined && g.variant !== "") {
    context.set("groupVariant", g.variant);
  }
}

export const accordionItemMachine: AccordionItemMachine =
  createMachine<AccordionItemSchema>({
    props: ({ props }) => ({
      ...defaultAccordionItemProps,
      ...props,
    }),

    initialState: () => "idle",

    refs: ({ prop }) => {
      const rawOpen = prop("open");
      const controlledOpen =
        rawOpen !== null && rawOpen !== undefined
          ? Boolean(rawOpen)
          : undefined;

      return {
        currentGroupBus: undefined,
        busDisposers: [],
        prevControlledOpen: controlledOpen,
        prevGroupProps: undefined as AccordionGroupStateSnapshot | undefined,
      };
    },

    context: ({ prop, bindable }) => {
      const propBindable = <
        K extends keyof AccordionItemContext & keyof AccordionItemProps,
      >(
        key: K,
        defaultValue: AccordionItemContext[K],
      ) =>
        bindable<AccordionItemContext[K]>(() => ({
          value: prop(key) as AccordionItemContext[K] | undefined,
          defaultValue,
        }));

      const stateBindable = <K extends keyof AccordionItemContext>(
        _key: K,
        defaultValue: AccordionItemContext[K],
      ) =>
        bindable<AccordionItemContext[K]>(() => ({
          defaultValue,
        }));

      const rawOpen = prop("open");
      const controlledOpen =
        rawOpen !== null && rawOpen !== undefined
          ? Boolean(rawOpen)
          : undefined;
      const initialOpen = controlledOpen ?? Boolean(prop("defaultOpen"));

      return {
        id: propBindable("id", ""),
        value: propBindable("value", ""),
        label: propBindable("label", ""),
        description: propBindable("description", ""),
        content: propBindable("content", ""),
        icon: propBindable("icon", ""),
        trailingIcon: propBindable("trailingIcon", ""),
        disabled: propBindable("disabled", false),
        open: bindable<boolean>(() => ({
          value: controlledOpen,
          defaultValue: initialOpen,
        })),
        size: propBindable("size", ""),
        variant: propBindable("variant", ""),
        collapsible: propBindable("collapsible", true),
        contentHeight: propBindable("contentHeight", 0),

        accordionId: propBindable("accordionId", ""),
        groupValue: stateBindable("groupValue", prop("groupValue")),
        groupMultiple: stateBindable(
          "groupMultiple",
          Boolean(prop("groupMultiple")),
        ),
        groupCollapsible: stateBindable(
          "groupCollapsible",
          prop("groupCollapsible") !== false,
        ),
        groupDisabled: stateBindable(
          "groupDisabled",
          Boolean(prop("groupDisabled")),
        ),
        groupSize: stateBindable("groupSize", prop("groupSize") ?? ""),
        groupVariant: stateBindable("groupVariant", prop("groupVariant") ?? ""),
        groupIndex: propBindable("groupIndex", 0),

        ui: propBindable("ui", {}),
      };
    },

    computed: {
      resolvedValue: ({ context }) => {
        const explicitVal = context.get("value");
        if (
          explicitVal !== null &&
          explicitVal !== undefined &&
          explicitVal !== ""
        ) {
          return String(explicitVal);
        }
        const gIdx = context.get("groupIndex");
        if (gIdx !== null && gIdx !== undefined) {
          return String(gIdx);
        }
        return context.get("id") || "0";
      },

      isOpen: ({ context, computed }) => {
        const gv = context.get("groupValue");
        if (Array.isArray(gv)) {
          return gv.includes(computed("resolvedValue"));
        }
        return Boolean(context.get("open"));
      },

      isDisabled: ({ context }) => {
        return Boolean(context.get("disabled") || context.get("groupDisabled"));
      },

      isCollapsible: ({ context, refs, prop }) => {
        const hasGroup = Boolean(
          refs.get("currentGroupBus") ||
            prop("groupBus") ||
            context.get("accordionId") ||
            context.get("groupValue") !== undefined,
        );
        if (hasGroup) {
          const gCollapsible = context.get("groupCollapsible");
          if (gCollapsible !== undefined) return Boolean(gCollapsible);
        }
        return context.get("collapsible") !== false;
      },

      effectiveSize: ({ context }): AccordionSize => {
        return (context.get("size") ||
          context.get("groupSize") ||
          "md") as AccordionSize;
      },

      effectiveVariant: ({ context }): AccordionVariant => {
        return (context.get("variant") ||
          context.get("groupVariant") ||
          "outline") as AccordionVariant;
      },
    },

    watch: ({ prop, context, refs, computed, scope }) => {
      const rawOpen = prop("open");
      if (rawOpen !== null && rawOpen !== undefined) {
        const boolVal = Boolean(rawOpen);
        if (refs.get("prevControlledOpen") !== boolVal) {
          refs.set("prevControlledOpen", boolVal);
          if (context.get("open") !== boolVal) {
            context.set("open", boolVal);
          }
        }
      }

      const readGroupProps = (): AccordionGroupStateSnapshot => ({
        value: prop("groupValue"),
        multiple: prop("groupMultiple"),
        collapsible: prop("groupCollapsible"),
        disabled: prop("groupDisabled"),
        size: prop("groupSize"),
        variant: prop("groupVariant"),
      });

      const bus = prop("groupBus");
      if (bus && bus !== refs.get("currentGroupBus")) {
        refs.set("currentGroupBus", bus);
        const prevDisposers = refs.get("busDisposers") || [];
        for (const d of prevDisposers) d?.();
        const unsub = bus.on(
          "accordion:change",
          (gState: AccordionChangePayload) => {
            applyGroupState(context, gState);
          },
        );
        refs.set("busDisposers", [unsub]);
        const currentProps = readGroupProps();
        refs.set("prevGroupProps", currentProps);
        applyGroupState(context, currentProps);
      } else {
        const currentProps = readGroupProps();
        const prevProps = refs.get("prevGroupProps");
        if (!isEqual(currentProps, prevProps)) {
          refs.set("prevGroupProps", currentProps);
          applyGroupState(context, currentProps);
        }
      }

      if (computed("isOpen") && scope?.dom?.rect) {
        scope.dom
          .rect(".cui-accordion-body")
          .then((res) => {
            if (res && typeof res.height === "number" && res.height > 0) {
              if (res.height !== context.get("contentHeight")) {
                context.set("contentHeight", res.height);
              }
            }
          })
          .catch(() => {});
      }
    },

    exit: ["cleanupGroupBus"],

    on: {
      MEASURE: {
        actions: ["measureHeightAction"],
      },
      "CONTENT_HEIGHT.SET": {
        actions: ["setContentHeightAction"],
      },
      TOGGLE: {
        guard: "canInteract",
        actions: ["measureHeightAction", "handleTapAction"],
      },
      OPEN: {
        guard: "canInteract",
        actions: ["measureHeightAction", "openAction"],
      },
      CLOSE: {
        guard: "canInteract",
        actions: ["closeAction"],
      },
    },

    states: {
      idle: {
        tags: ["idle"],
      },
    },

    implementations: {
      guards: {
        canInteract: ({ computed }) => !computed("isDisabled"),
      },

      actions: {
        measureHeightAction: ({ scope, context }) => {
          if (!scope?.dom?.rect) return;
          scope.dom
            .rect(".cui-accordion-body")
            .then((res) => {
              if (res && typeof res.height === "number" && res.height > 0) {
                if (res.height !== context.get("contentHeight")) {
                  context.set("contentHeight", res.height);
                }
              }
            })
            .catch(() => {});
        },

        setContentHeightAction: ({ event, context }) => {
          if (
            event.type === "CONTENT_HEIGHT.SET" &&
            typeof event.height === "number"
          ) {
            context.set("contentHeight", event.height);
          }
        },

        handleTapAction: ({ context, computed, refs, prop }) => {
          const val = computed("resolvedValue");
          const isOpen = computed("isOpen");
          const isCollapsible = computed("isCollapsible");
          const bus = refs.get("currentGroupBus") || prop("groupBus");
          const groupValue = context.get("groupValue");
          const isMultiple = Boolean(context.get("groupMultiple"));

          if (isOpen && !isCollapsible) {
            if (bus) {
              if (
                !isMultiple ||
                (Array.isArray(groupValue) && groupValue.length <= 1)
              ) {
                return;
              }
            } else {
              return;
            }
          }

          const nextOpen = !isOpen;
          const details = { value: val, open: nextOpen };
          prop("onClick")?.(details);
          prop("component")?.triggerEvent?.("click", details);

          if (bus) {
            bus.emit("item:toggle", { value: val });
          } else {
            // Standalone mode
            context.set("open", nextOpen);
            prop("onOpenChange")?.(details);
            prop("component")?.triggerEvent?.("open-change", details);
            prop("component")?.triggerEvent?.("change", details);
          }
        },

        openAction: ({ context, computed, refs, prop }) => {
          if (computed("isOpen")) return;
          const val = computed("resolvedValue");
          const details = { value: val, open: true };

          const bus = refs.get("currentGroupBus") || prop("groupBus");
          if (bus) {
            bus.emit("item:toggle", { value: val });
          } else {
            context.set("open", true);
            prop("onOpenChange")?.(details);
            prop("component")?.triggerEvent?.("open-change", details);
          }
        },

        closeAction: ({ context, computed, refs, prop }) => {
          if (!computed("isOpen")) return;
          if (!computed("isCollapsible")) return;
          const val = computed("resolvedValue");
          const details = { value: val, open: false };

          const bus = refs.get("currentGroupBus") || prop("groupBus");
          if (bus) {
            bus.emit("item:toggle", { value: val });
          } else {
            context.set("open", false);
            prop("onOpenChange")?.(details);
            prop("component")?.triggerEvent?.("open-change", details);
          }
        },

        cleanupGroupBus: ({ refs }) => {
          const disposers = refs.get("busDisposers") || [];
          for (const d of disposers) d?.();
          refs.set("busDisposers", []);
          refs.set("currentGroupBus", undefined);
        },
      },
    },
  });
