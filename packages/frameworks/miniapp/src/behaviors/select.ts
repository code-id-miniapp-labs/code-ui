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
  SelectInstance,
  SelectItemData,
  SelectItemInstance,
  SelectVisualData,
} from "./types";

function getSelectVisuals(
  group: SelectInstance | null | undefined,
): SelectVisualData {
  const rawIcon = group?.data?.selectedIcon;
  return {
    groupColor: group?.data?.color || "",
    groupSize: group?.data?.size || group?.data?.fieldSize || "",
    groupSelectedIcon: typeof rawIcon === "string" ? rawIcon : "",
  };
}

const EMPTY_SELECT_VISUALS: SelectVisualData = {
  groupColor: "",
  groupSize: "",
  groupSelectedIcon: "",
};

/**
 * Shared Behavior reference for `<c-select>` parent components.
 * Used as `relations.target` to link descendant `<c-select-item>` components natively.
 */
export const cuiSelectBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({});
export const cuiSelectParentBehavior: MiniappBehaviorRef = cuiSelectBehavior;

const cuiSelectObserverBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    observers: {
      "color, size, fieldSize, selectedIcon"(this: SelectInstance) {
        syncSelectChildren(this);
      },
    },
  });

export function syncSelectChildren(group: SelectInstance): void {
  const groupContext = resolveServiceRef(group, "groupContext");
  const allChildren = collectUniqueChildren<SelectItemInstance>(
    group,
    "cuiSelectChild",
    group.__codeUiSelectChildren,
  );
  const declarativeChildren = allChildren.filter((c) => !c.data?.managed);

  const childDescriptors = declarativeChildren.map((child, i) => {
    const d: Partial<SelectItemData> & Record<string, unknown> =
      child.data ?? {};
    const val = d.value;
    const resolvedVal =
      val !== undefined && val !== "" ? val : i;
    return {
      value: resolvedVal as string | number | boolean,
      label:
        d.label !== undefined && d.label !== ""
          ? String(d.label)
          : String(resolvedVal),
      description:
        d.description !== undefined ? String(d.description) : "",
      disabled: Boolean(d.disabled),
      type:
        d.type === "label" || d.type === "separator"
          ? (d.type as "label" | "separator")
          : ("item" as const),
    };
  });

  group.setData?.({ linkedChildCount: declarativeChildren.length });
  group.__codeUiMachine?.updateProps({
    childItems: childDescriptors,
  });

  const selectId = resolveInstanceId(group, "cui-select");
  const visuals = getSelectVisuals(group);

  for (let i = 0; i < declarativeChildren.length; i++) {
    const child = declarativeChildren[i];
    if (!child) continue;
    child.__codeUiPendingSelect = group;
    child.__codeUiSelectIndex = i;
    child.__codeUiSelectId = selectId;
    patchInheritedData<SelectVisualData>(child, visuals);
    child.__codeUiMachine?.updateProps({
      selectId,
      groupContext,
      groupIndex: i,
    });
  }
}

export function linkSelectItemToParent(
  group: SelectInstance,
  item: SelectItemInstance,
): void {
  const children = (group.__codeUiSelectChildren ||= []);
  if (!children.includes(item)) {
    children.push(item);
  }
  if (item.data?.managed) return;
  item.__codeUiPendingSelect = group;
  syncSelectChildren(group);
}

export function unlinkSelectItemFromParent(
  group: SelectInstance,
  item: SelectItemInstance,
): void {
  if (Array.isArray(group.__codeUiSelectChildren)) {
    group.__codeUiSelectChildren = group.__codeUiSelectChildren.filter(
      (c) => c !== item,
    );
  }
  if (item.data?.managed) return;
  item.__codeUiPendingSelect = undefined;
  patchInheritedData<SelectVisualData>(item, EMPTY_SELECT_VISUALS);
  item.__codeUiMachine?.updateProps({
    selectId: undefined,
    groupContext: undefined,
    groupIndex: undefined,
  });
  syncSelectChildren(group);
}

/**
 * Shared Behavior reference for `<c-select-item>` child components.
 * Automatically links to ancestor `<c-select>`.
 */
export const cuiSelectItemBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    data: { ...EMPTY_SELECT_VISUALS },
    observers: {
      "value, label, description, disabled, type"(this: SelectItemInstance) {
        if (this.data?.managed) return;
        const parent = resolveParentNode<SelectInstance>(
          this,
          this.__codeUiPendingSelect,
          "cuiSelectParent",
        );
        if (parent) {
          syncSelectChildren(parent);
        }
      },
    },
    relations: {
      cuiSelectParent: {
        type: "ancestor",
        target: cuiSelectBehavior,
        linked(this: SelectItemInstance, target: SelectInstance) {
          linkSelectItemToParent(target, this);
        },
        unlinked(this: SelectItemInstance, target: SelectInstance) {
          unlinkSelectItemFromParent(target, this);
        },
      },
    },
  });

export function setupSelectRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  options: { select?: boolean; selectItem?: boolean },
): void {
  if (options.select) {
    relations.cuiSelectChild = createRelationOption<
      SelectInstance,
      SelectItemInstance
    >({
      type: "descendant",
      target: cuiSelectItemBehavior,
      linked(this: SelectInstance, target: SelectItemInstance) {
        linkSelectItemToParent(this, target);
      },
      unlinked(this: SelectInstance, target: SelectItemInstance) {
        unlinkSelectItemFromParent(this, target);
      },
    });
  }
  if (options.selectItem) {
    relations.cuiSelectParent = createRelationOption<
      SelectItemInstance,
      SelectInstance
    >({
      type: "ancestor",
      target: cuiSelectBehavior,
      linked(this: SelectItemInstance, target: SelectInstance) {
        linkSelectItemToParent(target, this);
      },
      unlinked(this: SelectItemInstance, target: SelectInstance) {
        unlinkSelectItemFromParent(target, this);
      },
    });
  }
}

export function handleSelectAttached(
  instance: SelectItemInstance,
  initialProps: Record<string, unknown>,
  options: { select?: boolean; selectItem?: boolean },
): void {
  if (!options.selectItem || instance.data?.managed) return;
  const parent = resolveParentNode<SelectInstance>(
    instance,
    instance.__codeUiPendingSelect,
    "cuiSelectParent",
  );
  if (!parent) return;

  patchInheritedData<SelectVisualData>(instance, getSelectVisuals(parent));
  const groupContext = resolveServiceRef(parent, "groupContext");
  if (groupContext !== undefined) {
    initialProps.groupContext = groupContext;
  }
  if (instance.__codeUiSelectIndex !== undefined) {
    initialProps.groupIndex = instance.__codeUiSelectIndex;
  }
  const sid = instance.__codeUiSelectId ?? resolveInstanceId(parent);
  if (sid !== undefined) {
    initialProps.selectId = sid;
  }
}

export function handleSelectMachineStarted(
  instance: SelectInstance,
  options: { select?: boolean; selectItem?: boolean },
): void {
  if (options.select) {
    syncSelectChildren(instance);
  }
}

export function handleSelectReady(
  instance: SelectInstance | SelectItemInstance,
  options: { select?: boolean; selectItem?: boolean },
): void {
  if (options.select) {
    syncSelectChildren(instance as SelectInstance);
  }
  if (
    options.selectItem &&
    !(instance as SelectItemInstance).data?.managed &&
    typeof instance.getRelationNodes === "function"
  ) {
    const parents =
      instance.getRelationNodes<SelectInstance>("cuiSelectParent");
    if (parents && parents.length > 0 && parents[0]) {
      linkSelectItemToParent(parents[0], instance as SelectItemInstance);
    }
  }
}

export function withSelect(): MachinePlugin {
  return {
    name: "select",
    behaviors: [cuiSelectBehavior, cuiSelectObserverBehavior],
    setupRelations(relations) {
      setupSelectRelations(relations, { select: true });
    },
    onMachineStarted(instance) {
      handleSelectMachineStarted(instance as SelectInstance, { select: true });
    },
    onReady(instance) {
      handleSelectReady(instance as SelectInstance, { select: true });
    },
  };
}

export function withSelectItem(): MachinePlugin {
  return {
    name: "select-item",
    behaviors: [cuiSelectItemBehavior],
    setupRelations(relations) {
      setupSelectRelations(relations, { selectItem: true });
    },
    onAttached(instance, initialProps) {
      handleSelectAttached(instance as SelectItemInstance, initialProps, {
        selectItem: true,
      });
    },
    onReady(instance) {
      handleSelectReady(instance as SelectItemInstance, { selectItem: true });
    },
  };
}
