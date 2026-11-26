import type { MachinePlugin } from "../plugin";
import {
  createBehaviorRef,
  createRelationOption,
  patchInheritedData,
  resolveParentNode,
  resolveServiceRef,
} from "./inherit";
import type {
  CheckboxGroupInstance,
  CheckboxItemInstance,
  GroupVisualData,
  MiniappBehaviorRef,
} from "./types";

function getCheckboxGroupVisuals(
  group: CheckboxGroupInstance | null | undefined,
): GroupVisualData {
  return {
    groupSize: group?.data?.size || group?.data?.fieldSize || "",
    groupColor: group?.data?.color || "",
    groupVariant: group?.data?.variant || "",
  };
}

const EMPTY_GROUP_VISUALS: GroupVisualData = {
  groupSize: "",
  groupColor: "",
  groupVariant: "",
};

/**
 * Shared Behavior reference for `<c-checkbox-group>` parent components.
 * Used as `relations.target` to link descendant `<c-checkbox>` components natively.
 */
export const cuiCheckboxGroupBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({});
export const cuiCheckboxGroupParentBehavior: MiniappBehaviorRef =
  cuiCheckboxGroupBehavior;

const cuiCheckboxGroupObserverBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    observers: {
      "size, fieldSize, color, variant"(this: CheckboxGroupInstance) {
        syncCheckboxGroupChildren(this);
      },
    },
  });

export function linkCheckboxToParentGroup(
  group: CheckboxGroupInstance,
  checkbox: CheckboxItemInstance,
): void {
  const children = (group.__codeUiCheckboxChildren ||= []);
  if (!children.includes(checkbox)) children.push(checkbox);
  patchInheritedData<GroupVisualData>(checkbox, getCheckboxGroupVisuals(group));
  const groupContext = resolveServiceRef(group, "groupContext");
  if (checkbox.__codeUiMachine) {
    checkbox.__codeUiMachine.updateProps({ groupContext });
  } else {
    checkbox.__codeUiPendingCheckboxGroup = group;
  }
}

export function unlinkCheckboxFromParentGroup(
  group: CheckboxGroupInstance | null | undefined,
  checkbox: CheckboxItemInstance,
): void {
  if (group?.__codeUiCheckboxChildren) {
    const idx = group.__codeUiCheckboxChildren.indexOf(checkbox);
    if (idx !== -1) group.__codeUiCheckboxChildren.splice(idx, 1);
  }
  checkbox.__codeUiPendingCheckboxGroup = undefined;
  patchInheritedData<GroupVisualData>(checkbox, EMPTY_GROUP_VISUALS);
  checkbox.__codeUiMachine?.updateProps({ groupContext: undefined });
}

/**
 * Shared Behavior reference for `<c-checkbox>` child components.
 * Automatically links to ancestor `<c-checkbox-group>`.
 */
export const cuiCheckboxItemBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    data: { ...EMPTY_GROUP_VISUALS },
    relations: {
      cuiCheckboxGroupParent: {
        type: "ancestor",
        target: cuiCheckboxGroupBehavior,
        linked(this: CheckboxItemInstance, target: CheckboxGroupInstance) {
          linkCheckboxToParentGroup(target, this);
        },
        unlinked(this: CheckboxItemInstance, target: CheckboxGroupInstance) {
          unlinkCheckboxFromParentGroup(target, this);
        },
      },
    },
  });

export function setupCheckboxRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  options: { checkboxGroup?: boolean; checkboxItem?: boolean },
): void {
  if (options.checkboxGroup) {
    relations.cuiCheckboxChild = createRelationOption<
      CheckboxGroupInstance,
      CheckboxItemInstance
    >({
      type: "descendant",
      target: cuiCheckboxItemBehavior,
      linked(this: CheckboxGroupInstance, target: CheckboxItemInstance) {
        linkCheckboxToParentGroup(this, target);
      },
      unlinked(this: CheckboxGroupInstance, target: CheckboxItemInstance) {
        unlinkCheckboxFromParentGroup(this, target);
      },
    });
  }
  if (options.checkboxItem) {
    relations.cuiCheckboxGroupParent = createRelationOption<
      CheckboxItemInstance,
      CheckboxGroupInstance
    >({
      type: "ancestor",
      target: cuiCheckboxGroupBehavior,
      linked(this: CheckboxItemInstance, target: CheckboxGroupInstance) {
        linkCheckboxToParentGroup(target, this);
      },
      unlinked(this: CheckboxItemInstance, target: CheckboxGroupInstance) {
        unlinkCheckboxFromParentGroup(target, this);
      },
    });
  }
}

export function handleCheckboxAttached(
  instance: CheckboxItemInstance,
  initialProps: Record<string, unknown>,
  options: { checkboxGroup?: boolean; checkboxItem?: boolean },
): void {
  if (!options.checkboxItem) return;
  const parent = resolveParentNode<CheckboxGroupInstance>(
    instance,
    instance.__codeUiPendingCheckboxGroup,
    "cuiCheckboxGroupParent",
  );
  if (!parent) return;

  patchInheritedData<GroupVisualData>(instance, getCheckboxGroupVisuals(parent));
  const groupContext = resolveServiceRef(parent, "groupContext");
  if (groupContext !== undefined) {
    initialProps.groupContext = groupContext;
  }
}

function syncCheckboxGroupChildren(group: CheckboxGroupInstance): void {
  const relChildren =
    group.getRelationNodes?.<CheckboxItemInstance>("cuiCheckboxChild") ?? [];
  const trackedChildren = group.__codeUiCheckboxChildren ?? [];
  const seen = new Set<CheckboxItemInstance>();
  for (const child of relChildren) {
    seen.add(child);
    linkCheckboxToParentGroup(group, child);
  }
  for (const child of trackedChildren) {
    if (!seen.has(child)) {
      linkCheckboxToParentGroup(group, child);
    }
  }
}

export function handleCheckboxMachineStarted(
  instance: CheckboxGroupInstance,
  options: { checkboxGroup?: boolean; checkboxItem?: boolean },
): void {
  if (options.checkboxGroup) {
    syncCheckboxGroupChildren(instance);
  }
}

export function handleCheckboxReady(
  instance: CheckboxGroupInstance | CheckboxItemInstance,
  options: { checkboxGroup?: boolean; checkboxItem?: boolean },
): void {
  if (options.checkboxGroup) {
    syncCheckboxGroupChildren(instance as CheckboxGroupInstance);
  }
  if (options.checkboxItem && typeof instance.getRelationNodes === "function") {
    const parents =
      instance.getRelationNodes<CheckboxGroupInstance>("cuiCheckboxGroupParent");
    if (parents && parents.length > 0 && parents[0]) {
      linkCheckboxToParentGroup(parents[0], instance as CheckboxItemInstance);
    }
  }
}

export function withCheckboxGroup(): MachinePlugin {
  return {
    name: "checkbox-group",
    behaviors: [cuiCheckboxGroupBehavior, cuiCheckboxGroupObserverBehavior],
    setupRelations(relations) {
      setupCheckboxRelations(relations, { checkboxGroup: true });
    },
    onMachineStarted(instance) {
      handleCheckboxMachineStarted(instance as CheckboxGroupInstance, {
        checkboxGroup: true,
      });
    },
    onReady(instance) {
      handleCheckboxReady(instance as CheckboxGroupInstance, {
        checkboxGroup: true,
      });
    },
    onDetached(instance) {
      const group = instance as CheckboxGroupInstance;
      if (group.__codeUiCheckboxChildren) {
        for (const child of group.__codeUiCheckboxChildren) {
          if (child.__codeUiPendingCheckboxGroup === group) {
            child.__codeUiPendingCheckboxGroup = undefined;
          }
        }
        group.__codeUiCheckboxChildren = undefined;
      }
    },
  };
}

export function withCheckboxItem(): MachinePlugin {
  return {
    name: "checkbox-item",
    behaviors: [cuiCheckboxItemBehavior],
    setupRelations(relations) {
      setupCheckboxRelations(relations, { checkboxItem: true });
    },
    onAttached(instance, initialProps) {
      handleCheckboxAttached(instance as CheckboxItemInstance, initialProps, {
        checkboxItem: true,
      });
    },
    onReady(instance) {
      handleCheckboxReady(instance as CheckboxItemInstance, {
        checkboxItem: true,
      });
    },
    onDetached(instance) {
      const item = instance as CheckboxItemInstance;
      const group = item.__codeUiPendingCheckboxGroup;
      if (group?.__codeUiCheckboxChildren) {
        const idx = group.__codeUiCheckboxChildren.indexOf(item);
        if (idx !== -1) group.__codeUiCheckboxChildren.splice(idx, 1);
      }
      item.__codeUiPendingCheckboxGroup = undefined;
    },
  };
}
