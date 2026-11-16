import type { MachinePlugin } from "../plugin";
import {
  collectUniqueChildren,
  createBehaviorRef,
  createRelationOption,
  patchInheritedData,
  resolveInstanceId,
  resolveParentNode,
  resolveServiceRef,
} from "./inherit";
import type {
  MiniappBehaviorRef,
  TabsInstance,
  TabsItemData,
  TabsItemInstance,
  TabsVisualData,
} from "./types";

function getTabsVisuals(
  group: TabsInstance | null | undefined,
): TabsVisualData {
  return {
    groupOrientation: group?.data?.orientation || "",
    groupVariant: group?.data?.variant || "",
    groupColor: group?.data?.color || "",
    groupSize: group?.data?.size || "",
    groupFitted:
      typeof group?.data?.fitted === "boolean" ? group.data.fitted : null,
  };
}

const EMPTY_TABS_VISUALS: TabsVisualData = {
  groupOrientation: "",
  groupVariant: "",
  groupColor: "",
  groupSize: "",
  groupFitted: null,
};

/**
 * Shared Behavior reference for `<c-tabs>` parent components.
 * Used as `relations.target` to link descendant `<c-tabs-item>` components natively.
 */
export const cuiTabsBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({});
export const cuiTabsParentBehavior: MiniappBehaviorRef = cuiTabsBehavior;

const cuiTabsObserverBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    observers: {
      "orientation, variant, color, size, fitted"(this: TabsInstance) {
        syncTabsChildren(this);
      },
    },
  });

export function syncTabsChildren(group: TabsInstance): void {
  const groupContext = resolveServiceRef(group, "groupContext");
  const allChildren = collectUniqueChildren<TabsItemInstance>(
    group,
    "cuiTabsChild",
    group.__codeUiTabsChildren,
  );
  const declarativeChildren = allChildren.filter(
    (c) => c.data?.mode !== "trigger",
  );
  const total = declarativeChildren.length;

  const childDescriptors = declarativeChildren.map((child, i) => {
    const d: Partial<TabsItemData> & Record<string, unknown> = child.data ?? {};
    return {
      index: i,
      value: (d.value as string | number | undefined) ?? i,
      label: (d.label as string | undefined) ?? `Tab ${i + 1}`,
      icon: d.icon,
      trailingIcon: d.trailingIcon,
      disabled: Boolean(d.disabled),
    };
  });

  group.setData?.({ childVisualItems: childDescriptors });

  group.__codeUiMachine?.updateProps({
    childItems: childDescriptors.map((it) => ({
      value: it.value,
      disabled: it.disabled,
    })),
    linkedCount: total,
  });

  const groupId = resolveInstanceId(group, "cui-tabs");

  for (let i = 0; i < declarativeChildren.length; i++) {
    const child = declarativeChildren[i];
    if (!child) continue;
    child.__codeUiPendingTabs = group;
    child.__codeUiTabsIndex = i;
    child.__codeUiTabsId = groupId;
    child.__codeUiMachine?.updateProps({
      tabsId: groupId,
      groupContext,
      groupIndex: i,
    });
  }

  const visuals = getTabsVisuals(group);
  for (const child of allChildren) {
    if (!child) continue;
    child.__codeUiPendingTabs = group;
    child.__codeUiTabsId = groupId;
    patchInheritedData<TabsVisualData>(child, visuals);
    child.__codeUiMachine?.updateProps({
      tabsId: groupId,
      groupContext,
    });
  }
}

export function linkTabsItemToParent(
  group: TabsInstance,
  item: TabsItemInstance,
): void {
  const children = (group.__codeUiTabsChildren ||= []);
  if (!children.includes(item)) {
    children.push(item);
  }
  item.__codeUiPendingTabs = group;
  syncTabsChildren(group);
}

export function unlinkTabsItemFromParent(
  group: TabsInstance,
  item: TabsItemInstance,
): void {
  if (Array.isArray(group.__codeUiTabsChildren)) {
    group.__codeUiTabsChildren = group.__codeUiTabsChildren.filter(
      (c) => c !== item,
    );
  }
  item.__codeUiPendingTabs = undefined;
  patchInheritedData<TabsVisualData>(item, EMPTY_TABS_VISUALS);
  item.__codeUiMachine?.updateProps({
    tabsId: undefined,
    groupContext: undefined,
    groupIndex: undefined,
  });
  syncTabsChildren(group);
}

/**
 * Shared Behavior reference for `<c-tabs-item>` child components.
 * Automatically links to ancestor `<c-tabs>`.
 */
export const cuiTabsItemBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    data: { ...EMPTY_TABS_VISUALS },
    relations: {
      cuiTabsParent: {
        type: "ancestor",
        target: cuiTabsBehavior,
        linked(this: TabsItemInstance, target: TabsInstance) {
          linkTabsItemToParent(target, this);
        },
        unlinked(this: TabsItemInstance, target: TabsInstance) {
          unlinkTabsItemFromParent(target, this);
        },
      },
    },
  });

export function setupTabsRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  options: { tabs?: boolean; tabsItem?: boolean },
): void {
  if (options.tabs) {
    relations.cuiTabsChild = createRelationOption<
      TabsInstance,
      TabsItemInstance
    >({
      type: "descendant",
      target: cuiTabsItemBehavior,
      linked(this: TabsInstance, target: TabsItemInstance) {
        linkTabsItemToParent(this, target);
      },
      unlinked(this: TabsInstance, target: TabsItemInstance) {
        unlinkTabsItemFromParent(this, target);
      },
    });
  }
  if (options.tabsItem) {
    relations.cuiTabsParent = createRelationOption<
      TabsItemInstance,
      TabsInstance
    >({
      type: "ancestor",
      target: cuiTabsBehavior,
      linked(this: TabsItemInstance, target: TabsInstance) {
        linkTabsItemToParent(target, this);
      },
      unlinked(this: TabsItemInstance, target: TabsInstance) {
        unlinkTabsItemFromParent(target, this);
      },
    });
  }
}

export function handleTabsAttached(
  instance: TabsItemInstance,
  initialProps: Record<string, unknown>,
  options: { tabs?: boolean; tabsItem?: boolean },
): void {
  if (!options.tabsItem) return;
  const parent = resolveParentNode<TabsInstance>(
    instance,
    instance.__codeUiPendingTabs,
    "cuiTabsParent",
  );
  if (!parent) return;

  patchInheritedData<TabsVisualData>(instance, getTabsVisuals(parent));
  const groupContext = resolveServiceRef(parent, "groupContext");
  if (groupContext !== undefined) {
    initialProps.groupContext = groupContext;
  }
  if (instance.__codeUiTabsIndex !== undefined) {
    initialProps.groupIndex = instance.__codeUiTabsIndex;
  }
  const tid = instance.__codeUiTabsId ?? resolveInstanceId(parent);
  if (tid !== undefined) {
    initialProps.tabsId = tid;
  }
}

export function handleTabsMachineStarted(
  instance: TabsInstance,
  options: { tabs?: boolean; tabsItem?: boolean },
): void {
  if (options.tabs) {
    syncTabsChildren(instance);
  }
}

export function handleTabsReady(
  instance: TabsInstance | TabsItemInstance,
  options: { tabs?: boolean; tabsItem?: boolean },
): void {
  if (options.tabs) {
    syncTabsChildren(instance as TabsInstance);
  }
  if (options.tabsItem && typeof instance.getRelationNodes === "function") {
    const parents = instance.getRelationNodes<TabsInstance>("cuiTabsParent");
    if (parents && parents.length > 0 && parents[0]) {
      linkTabsItemToParent(parents[0], instance as TabsItemInstance);
    }
  }
}

export function withTabs(): MachinePlugin {
  return {
    name: "tabs",
    behaviors: [cuiTabsBehavior, cuiTabsObserverBehavior],
    setupRelations(relations) {
      setupTabsRelations(relations, { tabs: true });
    },
    onMachineStarted(instance) {
      handleTabsMachineStarted(instance as TabsInstance, { tabs: true });
    },
    onReady(instance) {
      handleTabsReady(instance as TabsInstance, { tabs: true });
    },
  };
}

export function withTabsItem(): MachinePlugin {
  return {
    name: "tabs-item",
    behaviors: [cuiTabsItemBehavior],
    setupRelations(relations) {
      setupTabsRelations(relations, { tabsItem: true });
    },
    onAttached(instance, initialProps) {
      handleTabsAttached(instance as TabsItemInstance, initialProps, {
        tabsItem: true,
      });
    },
    onReady(instance) {
      handleTabsReady(instance as TabsItemInstance, { tabsItem: true });
    },
  };
}
