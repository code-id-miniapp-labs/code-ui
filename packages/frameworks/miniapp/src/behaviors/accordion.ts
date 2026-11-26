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
  AccordionInstance,
  AccordionItemInstance,
  AccordionVisualData,
  MiniappBehaviorRef,
} from "./types";

function getAccordionVisuals(
  group: AccordionInstance | null | undefined,
): AccordionVisualData {
  return {
    groupSize: group?.data?.size || "",
    groupVariant: group?.data?.variant || "",
  };
}

const EMPTY_ACCORDION_VISUALS: AccordionVisualData = {
  groupSize: "",
  groupVariant: "",
};

/**
 * Shared Behavior reference for `<c-accordion>` / `<cui-accordion>` parent components.
 * Used as `relations.target` to link descendant `<c-accordion-item>` components natively.
 */
export const cuiAccordionBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({});
export const cuiAccordionParentBehavior: MiniappBehaviorRef =
  cuiAccordionBehavior;

const cuiAccordionObserverBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    lifetimes: {
      created(this: AccordionInstance) {
        this.__codeUiIsAccordion = true;
      },
    },
    observers: {
      "size, variant"(this: AccordionInstance) {
        syncAccordionChildren(this);
      },
      items(this: AccordionInstance) {
        syncAccordionChildren(this);
        Promise.resolve().then(() => {
          syncAccordionChildren(this);
        });
      },
    },
  });

function resolveAccordionParent(
  instance: AccordionItemInstance,
): AccordionInstance | undefined {
  const relationParent = resolveParentNode<AccordionInstance>(
    instance,
    instance.__codeUiPendingAccordion,
    "cuiAccordionParent",
  );
  if (relationParent) return relationParent;
  const owner =
    typeof instance.selectOwnerComponent === "function"
      ? (instance.selectOwnerComponent() as AccordionInstance | null | undefined)
      : undefined;
  return owner?.__codeUiIsAccordion ? owner : undefined;
}

export function syncAccordionChildren(group: AccordionInstance): void {
  const groupContext = resolveServiceRef(group, "groupContext");
  const children = collectUniqueChildren<AccordionItemInstance>(
    group,
    "cuiAccordionChild",
    group.__codeUiAccordionChildren,
    "c-accordion-item, .cui-accordion-item",
  );

  const total = children.length;
  group.__codeUiMachine?.updateProps({ linkedCount: total });

  const groupId = resolveInstanceId(group, "cui-accordion");
  const visuals = getAccordionVisuals(group);

  for (let i = 0; i < total; i++) {
    const child = children[i];
    if (!child) continue;
    child.__codeUiPendingAccordion = group;
    child.__codeUiAccordionIndex = i;
    child.__codeUiAccordionId = groupId;
    patchInheritedData<AccordionVisualData>(child, visuals);
    child.__codeUiMachine?.updateProps({
      accordionId: groupId,
      groupContext,
      groupIndex: i,
    });
  }
}

export function linkAccordionItemToParent(
  group: AccordionInstance,
  item: AccordionItemInstance,
): void {
  const children = (group.__codeUiAccordionChildren ||= []);
  if (!children.includes(item)) {
    children.push(item);
  }
  item.__codeUiPendingAccordion = group;
  syncAccordionChildren(group);
}

export function unlinkAccordionItemFromParent(
  group: AccordionInstance,
  item: AccordionItemInstance,
): void {
  if (Array.isArray(group.__codeUiAccordionChildren)) {
    group.__codeUiAccordionChildren = group.__codeUiAccordionChildren.filter(
      (c) => c !== item,
    );
  }
  item.__codeUiPendingAccordion = undefined;
  patchInheritedData<AccordionVisualData>(item, EMPTY_ACCORDION_VISUALS);
  item.__codeUiMachine?.updateProps({
    accordionId: undefined,
    groupContext: undefined,
    groupIndex: undefined,
  });
  syncAccordionChildren(group);
}

/**
 * Shared Behavior reference for `<c-accordion-item>` child components.
 * Automatically links to ancestor `<c-accordion>`.
 */
export const cuiAccordionItemBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    data: { ...EMPTY_ACCORDION_VISUALS },
    relations: {
      cuiAccordionParent: {
        type: "ancestor",
        target: cuiAccordionBehavior,
        linked(this: AccordionItemInstance, target: AccordionInstance) {
          linkAccordionItemToParent(target, this);
        },
        unlinked(this: AccordionItemInstance, target: AccordionInstance) {
          unlinkAccordionItemFromParent(target, this);
        },
      },
    },
  });

export function setupAccordionRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  options: { accordion?: boolean; accordionItem?: boolean },
): void {
  if (options.accordion) {
    relations.cuiAccordionChild = createRelationOption<
      AccordionInstance,
      AccordionItemInstance
    >({
      type: "descendant",
      target: cuiAccordionItemBehavior,
      linked(this: AccordionInstance, target: AccordionItemInstance) {
        linkAccordionItemToParent(this, target);
      },
      unlinked(this: AccordionInstance, target: AccordionItemInstance) {
        unlinkAccordionItemFromParent(this, target);
      },
    });
  }
  if (options.accordionItem) {
    relations.cuiAccordionParent = createRelationOption<
      AccordionItemInstance,
      AccordionInstance
    >({
      type: "ancestor",
      target: cuiAccordionBehavior,
      linked(this: AccordionItemInstance, target: AccordionInstance) {
        linkAccordionItemToParent(target, this);
      },
      unlinked(this: AccordionItemInstance, target: AccordionInstance) {
        unlinkAccordionItemFromParent(target, this);
      },
    });
  }
}

export function handleAccordionAttached(
  instance: AccordionItemInstance,
  initialProps: Record<string, unknown>,
  options: { accordion?: boolean; accordionItem?: boolean },
): void {
  if (options.accordion) {
    (instance as unknown as AccordionInstance).__codeUiIsAccordion = true;
  }
  if (!options.accordionItem) return;
  const parent = resolveAccordionParent(instance);
  if (!parent) return;
  instance.__codeUiPendingAccordion = parent;

  patchInheritedData<AccordionVisualData>(instance, getAccordionVisuals(parent));
  const groupContext = resolveServiceRef(parent, "groupContext");
  if (groupContext !== undefined) {
    initialProps.groupContext = groupContext;
  }
  if (instance.__codeUiAccordionIndex !== undefined) {
    initialProps.groupIndex = instance.__codeUiAccordionIndex;
  }
  const aid = instance.__codeUiAccordionId ?? resolveInstanceId(parent);
  if (aid !== undefined) {
    initialProps.accordionId = aid;
  }
}

export function handleAccordionMachineStarted(
  instance: AccordionInstance,
  options: { accordion?: boolean; accordionItem?: boolean },
): void {
  if (options.accordion) {
    syncAccordionChildren(instance);
  }
}

export function handleAccordionReady(
  instance: AccordionInstance | AccordionItemInstance,
  options: { accordion?: boolean; accordionItem?: boolean },
): void {
  if (options.accordion) {
    syncAccordionChildren(instance as AccordionInstance);
  }
  if (options.accordionItem) {
    const parent = resolveAccordionParent(instance as AccordionItemInstance);
    if (parent) {
      linkAccordionItemToParent(parent, instance as AccordionItemInstance);
    }
  }
}

export function withAccordion(): MachinePlugin {
  return {
    name: "accordion",
    behaviors: [cuiAccordionBehavior, cuiAccordionObserverBehavior],
    setupRelations(relations) {
      setupAccordionRelations(relations, { accordion: true });
    },
    onAttached(instance, initialProps) {
      handleAccordionAttached(instance as AccordionItemInstance, initialProps, {
        accordion: true,
      });
    },
    onMachineStarted(instance) {
      handleAccordionMachineStarted(instance as AccordionInstance, {
        accordion: true,
      });
    },
    onReady(instance) {
      handleAccordionReady(instance as AccordionInstance, { accordion: true });
    },
    onDetached(instance) {
      const parent = instance as AccordionInstance;
      if (parent.__codeUiAccordionChildren) {
        for (const child of parent.__codeUiAccordionChildren) {
          if (child.__codeUiPendingAccordion === parent) {
            child.__codeUiPendingAccordion = undefined;
          }
        }
        parent.__codeUiAccordionChildren = undefined;
      }
    },
  };
}

export function withAccordionItem(): MachinePlugin {
  return {
    name: "accordion-item",
    behaviors: [cuiAccordionItemBehavior],
    onAttached(instance, initialProps) {
      handleAccordionAttached(instance as AccordionItemInstance, initialProps, {
        accordionItem: true,
      });
    },
    onReady(instance) {
      handleAccordionReady(instance as AccordionItemInstance, {
        accordionItem: true,
      });
    },
    onDetached(instance) {
      const item = instance as AccordionItemInstance;
      const parent = item.__codeUiPendingAccordion;
      if (parent?.__codeUiAccordionChildren) {
        const idx = parent.__codeUiAccordionChildren.indexOf(item);
        if (idx !== -1) parent.__codeUiAccordionChildren.splice(idx, 1);
      }
      item.__codeUiPendingAccordion = undefined;
    },
  };
}
