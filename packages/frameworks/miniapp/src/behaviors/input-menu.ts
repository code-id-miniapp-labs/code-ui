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
  InputMenuInstance,
  InputMenuItemData,
  InputMenuItemInstance,
  InputMenuVisualData,
  MiniappBehaviorRef,
} from "./types";

function getInputMenuVisuals(
  group: InputMenuInstance | null | undefined,
): InputMenuVisualData {
  const rawIcon = group?.data?.selectedIcon;
  return {
    groupColor: group?.data?.color || "",
    groupSize: group?.data?.size || group?.data?.fieldSize || "",
    groupSelectedIcon: typeof rawIcon === "string" ? rawIcon : "",
  };
}

const EMPTY_INPUT_MENU_VISUALS: InputMenuVisualData = {
  groupColor: "",
  groupSize: "",
  groupSelectedIcon: "",
};

/**
 * Shared Behavior reference for `<c-input-menu>` parent components.
 * Used as `relations.target` to link descendant `<c-input-menu-item>` components natively.
 */
export const cuiInputMenuBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({});
export const cuiInputMenuParentBehavior: MiniappBehaviorRef =
  cuiInputMenuBehavior;

const cuiInputMenuObserverBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    observers: {
      "color, size, fieldSize, selectedIcon"(this: InputMenuInstance) {
        syncInputMenuChildren(this);
      },
    },
  });

export function syncInputMenuChildren(group: InputMenuInstance): void {
  const groupContext = resolveServiceRef(group, "groupContext");
  const allChildren = collectUniqueChildren<InputMenuItemInstance>(
    group,
    "cuiInputMenuChild",
    group.__codeUiInputMenuChildren,
  );
  const declarativeChildren = allChildren.filter((c) => !c.data?.managed);

  const childDescriptors = declarativeChildren.map((child, i) => {
    const d: Partial<InputMenuItemData> & Record<string, unknown> =
      child.data ?? {};
    const val = d.value;
    const resolvedVal = val !== undefined && val !== "" ? val : i;
    return {
      value: resolvedVal as string | number | boolean,
      label:
        d.label !== undefined && d.label !== ""
          ? String(d.label)
          : String(resolvedVal),
      description: d.description !== undefined ? String(d.description) : "",
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

  const inputMenuId = resolveInstanceId(group, "cui-input-menu");
  const visuals = getInputMenuVisuals(group);

  for (let i = 0; i < declarativeChildren.length; i++) {
    const child = declarativeChildren[i];
    if (!child) continue;
    child.__codeUiPendingInputMenu = group;
    child.__codeUiInputMenuIndex = i;
    child.__codeUiInputMenuId = inputMenuId;
    patchInheritedData<InputMenuVisualData>(child, visuals);
    child.__codeUiMachine?.updateProps({
      inputMenuId,
      groupContext,
      groupIndex: i,
    });
  }
}

export function linkInputMenuItemToParent(
  group: InputMenuInstance,
  item: InputMenuItemInstance,
): void {
  const children = (group.__codeUiInputMenuChildren ||= []);
  if (!children.includes(item)) {
    children.push(item);
  }
  if (item.data?.managed) return;
  item.__codeUiPendingInputMenu = group;
  syncInputMenuChildren(group);
}

export function unlinkInputMenuItemFromParent(
  group: InputMenuInstance,
  item: InputMenuItemInstance,
): void {
  if (Array.isArray(group.__codeUiInputMenuChildren)) {
    group.__codeUiInputMenuChildren = group.__codeUiInputMenuChildren.filter(
      (c) => c !== item,
    );
  }
  if (item.data?.managed) return;
  item.__codeUiPendingInputMenu = undefined;
  patchInheritedData<InputMenuVisualData>(item, EMPTY_INPUT_MENU_VISUALS);
  item.__codeUiMachine?.updateProps({
    inputMenuId: undefined,
    groupContext: undefined,
    groupIndex: undefined,
  });
  syncInputMenuChildren(group);
}

/**
 * Shared Behavior reference for `<c-input-menu-item>` child components.
 * Automatically links to ancestor `<c-input-menu>`.
 */
export const cuiInputMenuItemBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    data: { ...EMPTY_INPUT_MENU_VISUALS },
    observers: {
      "value, label, description, disabled, type"(this: InputMenuItemInstance) {
        if (this.data?.managed) return;
        const parent = resolveParentNode<InputMenuInstance>(
          this,
          this.__codeUiPendingInputMenu,
          "cuiInputMenuParent",
        );
        if (parent) {
          syncInputMenuChildren(parent);
        }
      },
    },
    relations: {
      cuiInputMenuParent: {
        type: "ancestor",
        target: cuiInputMenuBehavior,
        linked(this: InputMenuItemInstance, target: InputMenuInstance) {
          linkInputMenuItemToParent(target, this);
        },
        unlinked(this: InputMenuItemInstance, target: InputMenuInstance) {
          unlinkInputMenuItemFromParent(target, this);
        },
      },
    },
  });

export function setupInputMenuRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  options: { inputMenu?: boolean; inputMenuItem?: boolean },
): void {
  if (options.inputMenu) {
    relations.cuiInputMenuChild = createRelationOption<
      InputMenuInstance,
      InputMenuItemInstance
    >({
      type: "descendant",
      target: cuiInputMenuItemBehavior,
      linked(this: InputMenuInstance, target: InputMenuItemInstance) {
        linkInputMenuItemToParent(this, target);
      },
      unlinked(this: InputMenuInstance, target: InputMenuItemInstance) {
        unlinkInputMenuItemFromParent(this, target);
      },
    });
  }
  if (options.inputMenuItem) {
    relations.cuiInputMenuParent = createRelationOption<
      InputMenuItemInstance,
      InputMenuInstance
    >({
      type: "ancestor",
      target: cuiInputMenuBehavior,
      linked(this: InputMenuItemInstance, target: InputMenuInstance) {
        linkInputMenuItemToParent(target, this);
      },
      unlinked(this: InputMenuItemInstance, target: InputMenuInstance) {
        unlinkInputMenuItemFromParent(target, this);
      },
    });
  }
}

export function handleInputMenuAttached(
  instance: InputMenuItemInstance,
  initialProps: Record<string, unknown>,
  options: { inputMenu?: boolean; inputMenuItem?: boolean },
): void {
  if (!options.inputMenuItem || instance.data?.managed) return;
  const parent = resolveParentNode<InputMenuInstance>(
    instance,
    instance.__codeUiPendingInputMenu,
    "cuiInputMenuParent",
  );
  if (!parent) return;

  patchInheritedData<InputMenuVisualData>(
    instance,
    getInputMenuVisuals(parent),
  );
  const groupContext = resolveServiceRef(parent, "groupContext");
  if (groupContext !== undefined) {
    initialProps.groupContext = groupContext;
  }
  if (instance.__codeUiInputMenuIndex !== undefined) {
    initialProps.groupIndex = instance.__codeUiInputMenuIndex;
  }
  const imid = instance.__codeUiInputMenuId ?? resolveInstanceId(parent);
  if (imid !== undefined) {
    initialProps.inputMenuId = imid;
  }
}

export function handleInputMenuMachineStarted(
  instance: InputMenuInstance,
  options: { inputMenu?: boolean; inputMenuItem?: boolean },
): void {
  if (options.inputMenu) {
    syncInputMenuChildren(instance);
  }
}

export function handleInputMenuReady(
  instance: InputMenuInstance | InputMenuItemInstance,
  options: { inputMenu?: boolean; inputMenuItem?: boolean },
): void {
  if (options.inputMenu) {
    syncInputMenuChildren(instance as InputMenuInstance);
  }
  if (
    options.inputMenuItem &&
    !(instance as InputMenuItemInstance).data?.managed &&
    typeof instance.getRelationNodes === "function"
  ) {
    const parents =
      instance.getRelationNodes<InputMenuInstance>("cuiInputMenuParent");
    if (parents && parents.length > 0 && parents[0]) {
      linkInputMenuItemToParent(parents[0], instance as InputMenuItemInstance);
    }
  }
}

export function withInputMenu(): MachinePlugin {
  return {
    name: "input-menu",
    behaviors: [cuiInputMenuBehavior, cuiInputMenuObserverBehavior],
    setupRelations(relations) {
      setupInputMenuRelations(relations, { inputMenu: true });
    },
    onMachineStarted(instance) {
      handleInputMenuMachineStarted(instance as InputMenuInstance, {
        inputMenu: true,
      });
    },
    onReady(instance) {
      handleInputMenuReady(instance as InputMenuInstance, { inputMenu: true });
    },
    onDetached(instance) {
      const parent = instance as InputMenuInstance;
      if (parent.__codeUiInputMenuChildren) {
        for (const child of parent.__codeUiInputMenuChildren) {
          if (child.__codeUiPendingInputMenu === parent) {
            child.__codeUiPendingInputMenu = undefined;
          }
        }
        parent.__codeUiInputMenuChildren = undefined;
      }
    },
  };
}

export function withInputMenuItem(): MachinePlugin {
  return {
    name: "input-menu-item",
    behaviors: [cuiInputMenuItemBehavior],
    setupRelations(relations) {
      setupInputMenuRelations(relations, { inputMenuItem: true });
    },
    onAttached(instance, initialProps) {
      handleInputMenuAttached(
        instance as InputMenuItemInstance,
        initialProps,
        {
          inputMenuItem: true,
        },
      );
    },
    onReady(instance) {
      handleInputMenuReady(instance as InputMenuItemInstance, {
        inputMenuItem: true,
      });
    },
    onDetached(instance) {
      const item = instance as InputMenuItemInstance;
      const parent = item.__codeUiPendingInputMenu;
      if (parent?.__codeUiInputMenuChildren) {
        const idx = parent.__codeUiInputMenuChildren.indexOf(item);
        if (idx !== -1) parent.__codeUiInputMenuChildren.splice(idx, 1);
      }
      item.__codeUiPendingInputMenu = undefined;
    },
  };
}
