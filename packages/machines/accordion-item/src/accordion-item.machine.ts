import { createMachine } from "@code-ui/core";
import { isMiniApp, isNotNull, queryRect } from "@code-ui/utils";
import type { AccordionGroupContext } from "@code-ui/accordion";
import type {
  AccordionItemMachine,
  AccordionItemParams,
  AccordionItemSchema,
} from "./accordion-item.types";
import { defaultAccordionItemProps } from "./accordion-item.props";

function resolveItemValue(prop: AccordionItemParams["prop"]): string {
  const explicitVal = prop("value");
  if (explicitVal !== "") {
    return String(explicitVal);
  }
  const gIdx = prop("groupIndex");
  if (isNotNull(gIdx)) {
    return String(gIdx);
  }
  return prop("id") || "0";
}

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

function emitStandaloneChange(
  { computed, prop }: Pick<AccordionItemParams, "computed" | "prop">,
  nextOpen: boolean,
  isTap = false,
): void {
  const val = computed("resolvedValue");
  const details = { value: val, open: nextOpen };
  if (isTap) prop("onTap")?.(details);
  prop("onOpenChange")?.(details);
  prop("onChange")?.(details);
}

export const accordionItemMachine: AccordionItemMachine =
  createMachine<AccordionItemSchema>({
    props: ({ props }) => ({
      ...defaultAccordionItemProps,
      ...props,
    }),

    initialState: ({ prop }) => {
      const group = prop("groupContext") as AccordionGroupContext | undefined;
      if (group) {
        return group.value().includes(resolveItemValue(prop))
          ? "open"
          : "closed";
      }
      const rawOpen = prop("open");
      const initialOpen = isNotNull(rawOpen)
        ? Boolean(rawOpen)
        : prop("defaultOpen");
      return initialOpen ? "open" : "closed";
    },

    context: ({ prop, bindable }) => ({
      contentHeight: bindable<number>(() => {
        const rawHeight = prop("contentHeight");
        return {
          value: isNotNull(rawHeight) ? rawHeight : undefined,
          defaultValue: 0,
        };
      }),
    }),

    computed: {
      resolvedValue: ({ prop }) => resolveItemValue(prop),

      isOpen: ({ state, computed, prop }) => {
        const group = prop("groupContext") as AccordionGroupContext | undefined;
        return group
          ? group.value().includes(computed("resolvedValue"))
          : state.matches("open");
      },

      isDisabled: ({ prop }) => {
        const group = prop("groupContext") as AccordionGroupContext | undefined;
        return Boolean(prop("disabled") || group?.disabled());
      },

      isInteractive: ({ computed }) => !computed("isDisabled"),

      isCollapsible: ({ prop }) => {
        const group = prop("groupContext") as AccordionGroupContext | undefined;
        return group ? group.collapsible() : prop("collapsible");
      },
    },

    watch: ({ prop, computed, state, scope, context, track }) => {
      track(
        [
          () => {
            const group = prop("groupContext") as
              | AccordionGroupContext
              | undefined;
            return group
              ? group.value().includes(computed("resolvedValue"))
              : prop("open");
          },
        ],
        () => {
          const group = prop("groupContext") as
            | AccordionGroupContext
            | undefined;
          if (group) {
            const target = group.value().includes(computed("resolvedValue"))
              ? "open"
              : "closed";
            if (!state.matches(target)) state.set(target);
            return;
          }
          const controlledOpen = prop("open");
          if (isNotNull(controlledOpen)) {
            const target = controlledOpen ? "open" : "closed";
            if (!state.matches(target)) state.set(target);
          }
        },
      );

      track([() => prop("content")], () => {
        measureBodyHeight(scope, context);
      });
    },

    effects: ["measureOnMount"],

    on: {
      MEASURE: { actions: ["measureHeightAction"] },
      "CONTENT_HEIGHT.SET": { actions: ["setContentHeightAction"] },
    },

    states: {
      closed: {
        tags: ["closed"],
        on: {
          TOGGLE: [
            {
              guard: "hasGroupContext",
              actions: ["toggleGroupAction"],
            },
            {
              guard: "isControlled",
              actions: ["emitControlledOpen"],
            },
            {
              guard: "canInteract",
              target: "open",
              actions: ["emitTapOpen"],
            },
          ],
          OPEN: [
            {
              guard: "hasGroupContext",
              actions: ["openGroupAction"],
            },
            {
              guard: "isControlled",
              actions: ["emitControlledOpen"],
            },
            {
              guard: "canInteract",
              target: "open",
              actions: ["emitOpenChangeTrue"],
            },
          ],
        },
      },

      open: {
        tags: ["open"],
        entry: ["measureHeightAction"],
        on: {
          TOGGLE: [
            {
              guard: "hasGroupContext",
              actions: ["toggleGroupAction"],
            },
            {
              guard: "isControlledCollapse",
              actions: ["emitControlledClose"],
            },
            {
              guard: "canCollapse",
              target: "closed",
              actions: ["emitTapClose"],
            },
          ],
          CLOSE: [
            {
              guard: "hasGroupContext",
              actions: ["closeGroupAction"],
            },
            {
              guard: "isControlledCollapse",
              actions: ["emitControlledClose"],
            },
            {
              guard: "canCollapse",
              target: "closed",
              actions: ["emitOpenChangeFalse"],
            },
          ],
        },
      },
    },

    implementations: {
      guards: {
        canInteract: ({ computed }) => computed("isInteractive"),
        canCollapse: ({ computed }) =>
          computed("isInteractive") && computed("isCollapsible"),
        hasGroupContext: ({ prop, computed }) =>
          computed("isInteractive") && Boolean(prop("groupContext")),
        isControlled: ({ prop, computed }) =>
          computed("isInteractive") && isNotNull(prop("open")),
        isControlledCollapse: ({ prop, computed }) =>
          computed("isInteractive") &&
          computed("isCollapsible") &&
          isNotNull(prop("open")),
      },

      effects: {
        measureOnMount: ({ scope, context }) => {
          let cancelled = false;
          const schedule =
            typeof Promise !== "undefined"
              ? (fn: () => void) => Promise.resolve().then(fn)
              : (fn: () => void) => fn();
          schedule(() => {
            if (!cancelled) measureBodyHeight(scope, context);
          });
          return () => {
            cancelled = true;
          };
        },
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

        toggleGroupAction: ({ prop, computed }) => {
          const val = computed("resolvedValue");
          const nextOpen = !computed("isOpen");
          prop("onTap")?.({ value: val, open: nextOpen });
          const group = prop("groupContext") as
            | AccordionGroupContext
            | undefined;
          group?.toggleItem(val);
        },

        openGroupAction: ({ prop, computed }) => {
          const val = computed("resolvedValue");
          const group = prop("groupContext") as
            | AccordionGroupContext
            | undefined;
          group?.setItemOpen(val, true);
        },

        closeGroupAction: ({ prop, computed }) => {
          const val = computed("resolvedValue");
          const group = prop("groupContext") as
            | AccordionGroupContext
            | undefined;
          group?.setItemOpen(val, false);
        },

        emitTapOpen: (params) => {
          emitStandaloneChange(params, true, true);
        },

        emitTapClose: (params) => {
          emitStandaloneChange(params, false, true);
        },

        emitControlledOpen: (params) => {
          emitStandaloneChange(params, true, true);
        },

        emitControlledClose: (params) => {
          emitStandaloneChange(params, false, true);
        },

        emitOpenChangeTrue: (params) => {
          emitStandaloneChange(params, true, false);
        },

        emitOpenChangeFalse: (params) => {
          emitStandaloneChange(params, false, false);
        },
      },
    },
  });
