import { createMachine } from "@code-ui/core";
import type {
  AccordionGroupContext,
  AccordionSize,
  AccordionVariant,
} from "@code-ui/accordion";
import type {
  AccordionItemContext,
  AccordionItemMachine,
  AccordionItemParams,
  AccordionItemProps,
  AccordionItemSchema,
} from "./accordion-item.types";
import { defaultAccordionItemProps } from "./accordion-item.props";

function measureBodyHeight(
  scope: AccordionItemParams["scope"] | undefined,
  context: AccordionItemParams["context"],
): void {
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
  if (isTap) {
    prop("onTap")?.(details);
  }

  const group = prop("groupContext") as AccordionGroupContext | undefined;
  if (group) {
    if (isTap) {
      group.toggleItem(val);
    } else {
      group.setItemOpen(val, nextOpen);
    }
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

      return {
        id: propBindable("id", ""),
        value: propBindable("value", ""),
        label: propBindable("label", ""),
        description: propBindable("description", ""),
        content: propBindable("content", ""),
        icon: propBindable("icon", ""),
        trailingIcon: propBindable("trailingIcon", ""),
        disabled: propBindable("disabled", false),
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
        size: propBindable("size", ""),
        variant: propBindable("variant", ""),
        collapsible: propBindable("collapsible", true),
        contentHeight: propBindable("contentHeight", 0),
        accordionId: propBindable("accordionId", ""),
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

      isOpen: ({ context, computed, prop }) => {
        const group = prop("groupContext") as
          | AccordionGroupContext
          | undefined;
        if (group) {
          return group.value().includes(computed("resolvedValue"));
        }
        return Boolean(context.get("open"));
      },

      isDisabled: ({ context, prop }) => {
        const group = prop("groupContext") as
          | AccordionGroupContext
          | undefined;
        return Boolean(context.get("disabled") || group?.disabled());
      },

      isCollapsible: ({ context, prop }) => {
        const group = prop("groupContext") as
          | AccordionGroupContext
          | undefined;
        return group
          ? group.collapsible()
          : context.get("collapsible") !== false;
      },

      effectiveSize: ({ context, prop }): AccordionSize => {
        const group = prop("groupContext") as
          | AccordionGroupContext
          | undefined;
        return (context.get("size") || group?.size() || "md") as AccordionSize;
      },

      effectiveVariant: ({ context, prop }): AccordionVariant => {
        const group = prop("groupContext") as
          | AccordionGroupContext
          | undefined;
        return (context.get("variant") ||
          group?.variant() ||
          "outline") as AccordionVariant;
      },
    },

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
          const { computed, prop } = params;
          const isOpen = computed("isOpen");
          const isCollapsible = computed("isCollapsible");
          const group = prop("groupContext") as
            | AccordionGroupContext
            | undefined;

          if (!group && isOpen && !isCollapsible) return;

          setItemOpen(params, !isOpen, true);
        },

        openAction: (params) => {
          if (params.computed("isOpen")) return;
          setItemOpen(params, true);
        },

        closeAction: (params) => {
          if (!params.computed("isOpen") || !params.computed("isCollapsible")) {
            return;
          }
          setItemOpen(params, false);
        },
      },
    },
  });
