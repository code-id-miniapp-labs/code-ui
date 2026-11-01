import { createMachine } from "@code-ui/core";
import type { BindableRefs } from "@code-ui/core";
import { isEqual } from "@code-ui/utils";
import type { EventBus } from "@code-ui/utils";
import type {
  AccordionBusEvents,
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

function bindGroupBus(
  bus: EventBus<AccordionBusEvents> | undefined,
  context: AccordionItemParams["context"],
  refs: BindableRefs<AccordionItemSchema>,
  scope?: AccordionItemParams["scope"],
): void {
  for (const d of refs.get("busDisposers") ?? []) d?.();
  refs.set("currentGroupBus", bus);
  refs.set(
    "busDisposers",
    bus
      ? [
          bus.on("accordion:change", (gState: AccordionChangePayload) => {
            applyGroupState(context, gState);
            if (Array.isArray(gState.value) && gState.value.length > 0) {
              measureBodyHeight(scope, context);
            }
          }),
        ]
      : [],
  );
}

function setItemOpen(
  {
    context,
    computed,
    refs,
    prop,
  }: Pick<AccordionItemParams, "context" | "computed" | "refs" | "prop">,
  nextOpen: boolean,
  isTap = false,
): void {
  const val = computed("resolvedValue");
  const details = { value: val, open: nextOpen };
  if (isTap) {
    (prop("onTap") ?? prop("onClick"))?.(details);
  }

  const bus = refs.get("currentGroupBus") || prop("groupBus");
  if (bus) {
    bus.emit("item:toggle", { value: val });
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

    refs: ({ prop }) => ({
      currentGroupBus: prop("groupBus"),
      busDisposers: [],
    }),

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
        groupValue: bindable<AccordionItemContext["groupValue"]>(() => ({
          value: prop("groupValue"),
          defaultValue: prop("groupValue"),
          isEqual,
        })),
        groupMultiple: propBindable(
          "groupMultiple",
          Boolean(prop("groupMultiple")),
        ),
        groupCollapsible: propBindable(
          "groupCollapsible",
          prop("groupCollapsible") !== false,
        ),
        groupDisabled: propBindable(
          "groupDisabled",
          Boolean(prop("groupDisabled")),
        ),
        groupSize: propBindable("groupSize", prop("groupSize") ?? ""),
        groupVariant: propBindable("groupVariant", prop("groupVariant") ?? ""),
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

      isOpen: ({ context, computed, refs, prop }) => {
        const gv = context.get("groupValue");
        if (
          Array.isArray(gv) &&
          Boolean(
            refs.get("currentGroupBus") ||
              prop("groupBus") ||
              prop("groupValue") !== undefined,
          )
        ) {
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

    watch: ({ prop, context, refs, scope }) => {
      const nextBus = prop("groupBus");
      if (nextBus !== refs.get("currentGroupBus")) {
        bindGroupBus(nextBus, context, refs, scope);
      }
    },

    entry: ["setupGroupBus"],
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
          const { context, computed, refs, prop } = params;
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

        setupGroupBus: ({ prop, context, computed, refs, scope }) => {
          const bus = prop("groupBus");
          if (bus) {
            bindGroupBus(bus, context, refs, scope);
          }
          if (computed("isOpen")) {
            measureBodyHeight(scope, context);
          }
        },

        cleanupGroupBus: ({ context, refs }) => {
          bindGroupBus(undefined, context, refs);
        },
      },
    },
  });
