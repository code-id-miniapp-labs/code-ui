import { createMachine } from "@code-ui/core";
import { isMiniApp, queryRect } from "@code-ui/utils";
import type {
  AccordionGroupContext,
  AccordionSize,
  AccordionVariant,
} from "@code-ui/accordion";
import type {
  AccordionItemMachine,
  AccordionItemParams,
  AccordionItemSchema,
} from "./accordion-item.types";
import { defaultAccordionItemProps } from "./accordion-item.props";

function measureBodyHeight(
  scope: AccordionItemParams["scope"] | undefined,
  context: AccordionItemParams["context"],
): void {
  const comp = scope?.component;
  const canQuery =
    Boolean(
      comp &&
        typeof (comp as { createSelectorQuery?: unknown })
          .createSelectorQuery === "function",
    ) || isMiniApp();
  if (!canQuery) return;
  queryRect(".cui-accordion-body", comp)
    .then((res) => {
      if (
        res &&
        typeof res.height === "number" &&
        res.height > 0 &&
        res.height !== context.get("contentHeight")
      ) {
        context.set("contentHeight", res.height);
      }
    })
    .catch(() => {});
}

function setItemOpen(
  {
    context,
    computed,
    prop,
  }: Pick<AccordionItemParams, "context" | "computed" | "prop">,
  nextOpen: boolean,
  isTap = false,
): void {
  const val = computed("resolvedValue");
  const details = { value: val, open: nextOpen };
  if (isTap) prop("onTap")?.(details);

  const group = prop("groupContext") as AccordionGroupContext | undefined;
  if (group) {
    if (isTap) group.toggleItem(val);
    else group.setItemOpen(val, nextOpen);
    return;
  }

  context.set("open", nextOpen);
  prop("onOpenChange")?.(details);
}

export const accordionItemMachine: AccordionItemMachine =
  createMachine<AccordionItemSchema>({
    props: ({ props }) => ({
      ...defaultAccordionItemProps,
      ...props,
    }),

    initialState: () => "idle",

    context: ({ prop, bindable }) => ({
      open: bindable<boolean>(() => {
        const rawOpen = prop("open");
        const controlledOpen =
          rawOpen !== null && rawOpen !== undefined
            ? Boolean(rawOpen)
            : undefined;
        return {
          value: controlledOpen,
          defaultValue: controlledOpen ?? Boolean(prop("defaultOpen")),
        };
      }),
      contentHeight: bindable<number>(() => ({
        value: prop("contentHeight"),
        defaultValue: 0,
      })),
    }),

    computed: {
      resolvedValue: ({ prop }) => {
        const explicitVal = prop("value");
        if (
          explicitVal !== null &&
          explicitVal !== undefined &&
          explicitVal !== ""
        ) {
          return String(explicitVal);
        }
        const gIdx = prop("groupIndex");
        if (gIdx !== null && gIdx !== undefined) {
          return String(gIdx);
        }
        return prop("id") || "0";
      },

      isOpen: ({ context, computed, prop }) => {
        const group = prop("groupContext") as AccordionGroupContext | undefined;
        return group
          ? group.value().includes(computed("resolvedValue"))
          : Boolean(context.get("open"));
      },

      isDisabled: ({ prop }) => {
        const group = prop("groupContext") as AccordionGroupContext | undefined;
        return Boolean(prop("disabled") || group?.disabled());
      },

      isCollapsible: ({ prop }) => {
        const group = prop("groupContext") as AccordionGroupContext | undefined;
        return group ? group.collapsible() : prop("collapsible") !== false;
      },

      effectiveSize: ({ prop }): AccordionSize => {
        const group = prop("groupContext") as AccordionGroupContext | undefined;
        return (prop("size") || group?.size() || "md") as AccordionSize;
      },

      effectiveVariant: ({ prop }): AccordionVariant => {
        const group = prop("groupContext") as AccordionGroupContext | undefined;
        return (prop("variant") ||
          group?.variant() ||
          "outline") as AccordionVariant;
      },
    },

    on: {
      MEASURE: { actions: ["measureHeightAction"] },
      "CONTENT_HEIGHT.SET": { actions: ["setContentHeightAction"] },
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
      idle: { tags: ["idle"] },
    },

    implementations: {
      guards: {
        canInteract: ({ computed }) => !computed("isDisabled"),
      },

      actions: {
        measureHeightAction: ({ scope, context }) => {
          measureBodyHeight(scope, context);
        },

        setContentHeightAction: ({ event, context }) => {
          if (
            event.type === "CONTENT_HEIGHT.SET" &&
            typeof event.height === "number"
          ) {
            context.set("contentHeight", event.height);
          }
        },

        handleTapAction: (params) => {
          const isOpen = params.computed("isOpen");
          if (
            !params.prop("groupContext") &&
            isOpen &&
            !params.computed("isCollapsible")
          ) {
            return;
          }
          setItemOpen(params, !isOpen, true);
        },

        openAction: (params) => {
          if (!params.computed("isOpen")) setItemOpen(params, true);
        },

        closeAction: (params) => {
          if (params.computed("isOpen") && params.computed("isCollapsible")) {
            setItemOpen(params, false);
          }
        },
      },
    },
  });
