import type { MachinePlugin } from "../plugin";

const instanceIds = new WeakMap<object, string>();
let instanceCounter = 0;

function getComponentId(instance: any, explicitId?: string): string {
  if (explicitId) return explicitId;
  let id = instanceIds.get(instance);
  if (!id) {
    id = `cui-tabs-${++instanceCounter}`;
    instanceIds.set(instance, id);
  }
  return id;
}

function getServiceBus(service: any) {
  return service?.refs?.get ? service.refs.get("bus") : undefined;
}

/**
 * Shared Behavior reference for `<c-tabs>` / `<cui-tabs>` parent components.
 * Used as relations.target to link descendant <c-tabs-item> components natively.
 */
export const cuiTabsBehavior: any =
  typeof Behavior !== "undefined" ? Behavior({}) : {};
export const cuiTabsParentBehavior: any = cuiTabsBehavior;

export function syncTabsChildren(group: any) {
  const service = group.__codeUiMachine?.service;
  const bus = getServiceBus(service) ?? service?.refs?.get?.("bus");
  const relationChildren =
    typeof group.getRelationNodes === "function"
      ? group.getRelationNodes("cuiTabsChild")
      : undefined;
  const templateChildren =
    typeof group.selectAllComponents === "function"
      ? group.selectAllComponents("c-tabs-item, .cui-tabs-item")
      : undefined;
  const childrenSet = new Set<any>();
  if (Array.isArray(relationChildren)) {
    for (const c of relationChildren) childrenSet.add(c);
  }
  if (Array.isArray(group.__codeUiTabsChildren)) {
    for (const c of group.__codeUiTabsChildren) childrenSet.add(c);
  }
  if (Array.isArray(templateChildren)) {
    for (const c of templateChildren) childrenSet.add(c);
  }
  const children = Array.from(childrenSet);

  const total = children.length;
  const childDescriptors = children.map((child, i) => {
    const d = child.data || {};
    const itemData = d.tabsItem || {};
    return {
      index: i,
      value: d.value ?? itemData.value ?? i,
      label: d.label ?? itemData.label ?? `Tab ${i + 1}`,
      icon: d.icon ?? itemData.icon,
      trailingIcon: d.trailingIcon ?? itemData.trailingIcon,
      badge: d.badge ?? itemData.badge,
      disabled: Boolean(d.disabled ?? itemData.disabled),
    };
  });

  if (group.__codeUiMachine) {
    group.__codeUiMachine.updateProps({
      childItems: childDescriptors,
      linkedCount: total,
    });
  }

  const groupId = group.id || getComponentId(group);
  group.__codeUiId = groupId;

  const ctx = service?.context;
  const val = ctx?.get("value");
  for (let i = 0; i < total; i++) {
    const child = children[i];
    if (!child) continue;
    child.__codeUiTabsBus = bus;
    child.__codeUiPendingTabs = group;
    child.__codeUiTabsIndex = i;
    child.__codeUiTabsId = groupId;
    if (child.__codeUiMachine) {
      child.__codeUiMachine.updateProps({
        tabsId: groupId,
        groupBus: bus,
        groupValue: val,
        groupOrientation: group.data?.orientation || "horizontal",
        groupVariant: group.data?.variant || "pill",
        groupColor: group.data?.color || "primary",
        groupSize: group.data?.size || "md",
        groupDisabled: Boolean(group.data?.disabled),
        groupIndex: i,
      });
    }
  }

  if (bus) {
    bus.emit("tabs:change", {
      value: val,
      orientation: group.data?.orientation || "horizontal",
      variant: group.data?.variant || "pill",
      color: group.data?.color || "primary",
      size: group.data?.size || "md",
      disabled: Boolean(group.data?.disabled),
    });
  }
}

export function linkTabsItemToParent(group: any, item: any) {
  group.__codeUiTabsChildren = group.__codeUiTabsChildren || [];
  if (!group.__codeUiTabsChildren.includes(item)) {
    group.__codeUiTabsChildren.push(item);
  }
  item.__codeUiPendingTabs = group;
  syncTabsChildren(group);
}

export function unlinkTabsItemFromParent(group: any, item: any) {
  if (Array.isArray(group.__codeUiTabsChildren)) {
    group.__codeUiTabsChildren = group.__codeUiTabsChildren.filter(
      (c: any) => c !== item,
    );
  }
  item.__codeUiTabsBus = undefined;
  item.__codeUiPendingTabs = undefined;
  if (item.__codeUiMachine) {
    item.__codeUiMachine.updateProps({
      tabsId: undefined,
      groupBus: undefined,
      groupValue: undefined,
      groupOrientation: undefined,
      groupVariant: undefined,
      groupColor: undefined,
      groupSize: undefined,
      groupDisabled: undefined,
      groupIndex: undefined,
    });
  }
  syncTabsChildren(group);
}

/**
 * Shared Behavior reference for `<c-tabs-item>` child components.
 * Automatically links to ancestor `<c-tabs>`.
 */
export const cuiTabsItemBehavior: any =
  typeof Behavior !== "undefined"
    ? Behavior({
        relations: {
          cuiTabsParent: {
            type: "ancestor",
            target: cuiTabsBehavior,
            linked(this: any, target: any) {
              linkTabsItemToParent(target, this);
            },
            unlinked(this: any, target: any) {
              unlinkTabsItemFromParent(target, this);
            },
          },
        },
      })
    : {};

export function setupTabsRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  options: { tabs?: boolean; tabsItem?: boolean },
) {
  if (options.tabs) {
    relations.cuiTabsChild = {
      type: "descendant",
      target: cuiTabsItemBehavior,
      linked(this: any, target: any) {
        linkTabsItemToParent(this, target);
      },
      unlinked(this: any, target: any) {
        unlinkTabsItemFromParent(this, target);
      },
    };
  }
  if (options.tabsItem) {
    relations.cuiTabsParent = {
      type: "ancestor",
      target: cuiTabsBehavior,
      linked(this: any, target: any) {
        linkTabsItemToParent(target, this);
      },
      unlinked(this: any, target: any) {
        unlinkTabsItemFromParent(target, this);
      },
    };
  }
}

export function handleTabsAttached(
  instance: any,
  initialProps: Record<string, any>,
  options: { tabs?: boolean; tabsItem?: boolean },
) {
  if (options.tabsItem) {
    const parent =
      instance.__codeUiPendingTabs ??
      (typeof instance.getRelationNodes === "function"
        ? instance.getRelationNodes("cuiTabsParent")?.[0]
        : undefined);
    if (parent) {
      const pService = parent.__codeUiMachine?.service;
      const bus =
        parent.__codeUiTabsBus ??
        getServiceBus(pService) ??
        pService?.refs?.get?.("bus");
      if (bus) {
        initialProps.groupBus = bus;
        instance.__codeUiTabsBus = bus;
      }
      if (instance.__codeUiTabsIndex !== undefined) {
        initialProps.groupIndex = instance.__codeUiTabsIndex;
      }
      const tid =
        instance.__codeUiTabsId ??
        parent.data?.id ??
        parent.id ??
        parent.__codeUiId;
      if (tid !== undefined) {
        initialProps.tabsId = tid;
      }
      if (pService) {
        const ctx = pService.context;
        initialProps.groupValue = ctx?.get("value");
        initialProps.groupOrientation = parent.data?.orientation || "horizontal";
        initialProps.groupVariant = parent.data?.variant || "pill";
        initialProps.groupColor = parent.data?.color || "primary";
        initialProps.groupSize = parent.data?.size || "md";
        initialProps.groupDisabled = Boolean(parent.data?.disabled);
      }
    }
  }
}

export function handleTabsMachineStarted(
  instance: any,
  options: { tabs?: boolean; tabsItem?: boolean },
) {
  if (options.tabs) {
    syncTabsChildren(instance);
  }
}

export function handleTabsReady(
  instance: any,
  options: { tabs?: boolean; tabsItem?: boolean },
) {
  if (options.tabs) {
    syncTabsChildren(instance);
  }
  if (
    options.tabsItem &&
    typeof instance.getRelationNodes === "function"
  ) {
    const parents = instance.getRelationNodes("cuiTabsParent");
    if (parents && parents.length > 0) {
      linkTabsItemToParent(parents[0], instance);
    }
  }
}

export function withTabs(): MachinePlugin {
  return {
    name: "tabs",
    behaviors: [cuiTabsBehavior],
    setupRelations(relations) {
      setupTabsRelations(relations, { tabs: true });
    },
    onMachineStarted(instance) {
      handleTabsMachineStarted(instance, { tabs: true });
    },
    onReady(instance) {
      handleTabsReady(instance, { tabs: true });
    },
    onPropChanged(instance) {
      syncTabsChildren(instance);
    },
  };
}

export function withTabsItem(): MachinePlugin {
  return {
    name: "tabs-item",
    behaviors: [cuiTabsItemBehavior],
    onAttached(instance, initialProps) {
      handleTabsAttached(instance, initialProps, { tabsItem: true });
    },
    onReady(instance) {
      handleTabsReady(instance, { tabsItem: true });
    },
  };
}
