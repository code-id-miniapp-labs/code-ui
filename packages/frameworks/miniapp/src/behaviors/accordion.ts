import type { MachinePlugin } from "../plugin";

const instanceIds = new WeakMap<object, string>();
let instanceCounter = 0;

function getComponentId(instance: any, explicitId?: string): string {
  if (explicitId) return explicitId;
  let id = instanceIds.get(instance);
  if (!id) {
    id = `cui-accordion-${++instanceCounter}`;
    instanceIds.set(instance, id);
  }
  return id;
}

function getServiceBus(service: any) {
  return service?.refs?.get ? service.refs.get("bus") : undefined;
}

/**
 * Shared Behavior reference for `<c-accordion>` / `<cui-accordion>` parent components.
 * Used as relations.target to link descendant <c-accordion-item> components natively.
 */
export const cuiAccordionBehavior: any =
  typeof Behavior !== "undefined" ? Behavior({}) : {};
export const cuiAccordionParentBehavior: any = cuiAccordionBehavior;

export function syncAccordionChildren(group: any) {
  const service = group.__codeUiMachine?.service;
  const bus = getServiceBus(service) ?? service?.refs?.get?.("bus");
  const relationChildren =
    typeof group.getRelationNodes === "function"
      ? group.getRelationNodes("cuiAccordionChild")
      : undefined;
  const templateChildren =
    typeof group.selectAllComponents === "function"
      ? group.selectAllComponents("c-accordion-item, .cui-accordion-item")
      : undefined;
  const childrenSet = new Set<any>();
  if (Array.isArray(relationChildren)) {
    for (const c of relationChildren) childrenSet.add(c);
  }
  if (Array.isArray(group.__codeUiAccordionChildren)) {
    for (const c of group.__codeUiAccordionChildren) childrenSet.add(c);
  }
  if (Array.isArray(templateChildren)) {
    for (const c of templateChildren) childrenSet.add(c);
  }
  const children = Array.from(childrenSet);

  const total = children.length;
  if (group.__codeUiMachine) {
    group.__codeUiMachine.updateProps({ linkedCount: total });
  }

  const groupId = group.id || getComponentId(group);
  group.__codeUiId = groupId;

  const ctx = service?.context;
  for (let i = 0; i < total; i++) {
    const child = children[i];
    if (!child) continue;
    child.__codeUiAccordionBus = bus;
    child.__codeUiPendingAccordion = group;
    child.__codeUiAccordionIndex = i;
    child.__codeUiAccordionId = groupId;
    if (child.__codeUiMachine) {
      child.__codeUiMachine.updateProps({
        accordionId: groupId,
        groupBus: bus,
        groupValue: ctx?.get("value") ?? [],
        groupMultiple: Boolean(ctx?.get("multiple")),
        groupCollapsible: ctx?.get("collapsible") !== false,
        groupDisabled: Boolean(ctx?.get("disabled")),
        groupSize: ctx?.get("size") || "md",
        groupVariant: ctx?.get("variant") || "outline",
        groupIndex: i,
      });
    }
  }

  if (bus && ctx) {
    bus.emit("accordion:change", {
      value: ctx.get("value") ?? [],
      multiple: Boolean(ctx.get("multiple")),
      collapsible: ctx.get("collapsible") !== false,
      disabled: Boolean(ctx.get("disabled")),
      size: ctx.get("size") || "md",
      variant: ctx.get("variant") || "outline",
    });
  }
}

export function linkAccordionItemToParent(group: any, item: any) {
  group.__codeUiAccordionChildren = group.__codeUiAccordionChildren || [];
  if (!group.__codeUiAccordionChildren.includes(item)) {
    group.__codeUiAccordionChildren.push(item);
  }
  item.__codeUiPendingAccordion = group;
  syncAccordionChildren(group);
}

export function unlinkAccordionItemFromParent(group: any, item: any) {
  if (Array.isArray(group.__codeUiAccordionChildren)) {
    group.__codeUiAccordionChildren = group.__codeUiAccordionChildren.filter(
      (c: any) => c !== item,
    );
  }
  item.__codeUiAccordionBus = undefined;
  item.__codeUiPendingAccordion = undefined;
  if (item.__codeUiMachine) {
    item.__codeUiMachine.updateProps({
      accordionId: undefined,
      groupBus: undefined,
      groupValue: undefined,
      groupMultiple: undefined,
      groupCollapsible: undefined,
      groupDisabled: undefined,
      groupSize: undefined,
      groupVariant: undefined,
      groupIndex: undefined,
    });
  }
  syncAccordionChildren(group);
}

/**
 * Shared Behavior reference for `<c-accordion-item>` child components.
 * Automatically links to ancestor `<c-accordion>`.
 */
export const cuiAccordionItemBehavior: any =
  typeof Behavior !== "undefined"
    ? Behavior({
        relations: {
          cuiAccordionParent: {
            type: "ancestor",
            target: cuiAccordionBehavior,
            linked(this: any, target: any) {
              linkAccordionItemToParent(target, this);
            },
            unlinked(this: any, target: any) {
              unlinkAccordionItemFromParent(target, this);
            },
          },
        },
      })
    : {};

export function setupAccordionRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  options: { accordion?: boolean; accordionItem?: boolean },
) {
  if (options.accordion) {
    relations.cuiAccordionChild = {
      type: "descendant",
      target: cuiAccordionItemBehavior,
      linked(this: any, target: any) {
        linkAccordionItemToParent(this, target);
      },
      unlinked(this: any, target: any) {
        unlinkAccordionItemFromParent(this, target);
      },
    };
  }
  if (options.accordionItem) {
    relations.cuiAccordionParent = {
      type: "ancestor",
      target: cuiAccordionBehavior,
      linked(this: any, target: any) {
        linkAccordionItemToParent(target, this);
      },
      unlinked(this: any, target: any) {
        unlinkAccordionItemFromParent(target, this);
      },
    };
  }
}

export function handleAccordionAttached(
  instance: any,
  initialProps: Record<string, any>,
  options: { accordion?: boolean; accordionItem?: boolean },
) {
  if (options.accordionItem) {
    const parent =
      instance.__codeUiPendingAccordion ??
      (typeof instance.getRelationNodes === "function"
        ? instance.getRelationNodes("cuiAccordionParent")?.[0]
        : undefined);
    if (parent) {
      const pService = parent.__codeUiMachine?.service;
      const bus =
        parent.__codeUiAccordionBus ??
        getServiceBus(pService) ??
        pService?.refs?.get?.("bus");
      if (bus) {
        initialProps.groupBus = bus;
        instance.__codeUiAccordionBus = bus;
      }
      if (instance.__codeUiAccordionIndex !== undefined) {
        initialProps.groupIndex = instance.__codeUiAccordionIndex;
      }
      const aid =
        instance.__codeUiAccordionId ??
        parent.data?.id ??
        parent.id ??
        parent.__codeUiId;
      if (aid !== undefined) {
        initialProps.accordionId = aid;
      }
      if (pService) {
        const ctx = pService.context;
        initialProps.groupValue = ctx?.get("value") ?? [];
        initialProps.groupMultiple = Boolean(ctx?.get("multiple"));
        initialProps.groupCollapsible = ctx?.get("collapsible") !== false;
        initialProps.groupDisabled = Boolean(ctx?.get("disabled"));
        initialProps.groupSize = ctx?.get("size") || "md";
        initialProps.groupVariant = ctx?.get("variant") || "outline";
      }
    }
  }
}

export function handleAccordionMachineStarted(
  instance: any,
  options: { accordion?: boolean; accordionItem?: boolean },
) {
  if (options.accordion) {
    syncAccordionChildren(instance);
  }
}

export function handleAccordionReady(
  instance: any,
  options: { accordion?: boolean; accordionItem?: boolean },
) {
  if (options.accordion) {
    syncAccordionChildren(instance);
  }
  if (
    options.accordionItem &&
    typeof instance.getRelationNodes === "function"
  ) {
    const parents = instance.getRelationNodes("cuiAccordionParent");
    if (parents && parents.length > 0) {
      linkAccordionItemToParent(parents[0], instance);
    }
  }
}

export function withAccordion(): MachinePlugin {
  return {
    name: "accordion",
    behaviors: [cuiAccordionBehavior],
    setupRelations(relations) {
      setupAccordionRelations(relations, { accordion: true });
    },
    onMachineStarted(instance) {
      handleAccordionMachineStarted(instance, { accordion: true });
    },
    onReady(instance) {
      handleAccordionReady(instance, { accordion: true });
    },
    onPropChanged(instance) {
      syncAccordionChildren(instance);
    },
  };
}

export function withAccordionItem(): MachinePlugin {
  return {
    name: "accordion-item",
    behaviors: [cuiAccordionItemBehavior],
    onAttached(instance, initialProps) {
      handleAccordionAttached(instance, initialProps, { accordionItem: true });
    },
    onReady(instance) {
      handleAccordionReady(instance, { accordionItem: true });
    },
  };
}
