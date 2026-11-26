import type { MachinePlugin } from "../plugin";
import {
  createBehaviorRef,
  createRelationOption,
  patchInheritedData,
  resolveParentNode,
  resolveServiceRef,
} from "./inherit";
import type {
  GroupVisualData,
  MiniappBehaviorRef,
  RadioGroupInstance,
  RadioItemInstance,
} from "./types";

function getRadioGroupVisuals(
  group: RadioGroupInstance | null | undefined,
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
 * Shared Behavior reference for `<c-radio-group>` parent components.
 * Used as `relations.target` to link descendant `<c-radio>` components natively
 * without file paths or tree-shaking hazards.
 */
export const cuiRadioGroupBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({});
export const cuiRadioGroupParentBehavior: MiniappBehaviorRef =
  cuiRadioGroupBehavior;

const cuiRadioGroupObserverBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    observers: {
      "size, fieldSize, color, variant"(this: RadioGroupInstance) {
        syncRadioGroupChildren(this);
      },
    },
  });

export function linkRadioToParentGroup(
  group: RadioGroupInstance,
  radio: RadioItemInstance,
): void {
  const children = (group.__codeUiRadioChildren ||= []);
  if (!children.includes(radio)) children.push(radio);
  patchInheritedData<GroupVisualData>(radio, getRadioGroupVisuals(group));
  const groupContext = resolveServiceRef(group, "groupContext");
  if (radio.__codeUiMachine) {
    radio.__codeUiMachine.updateProps({ groupContext });
  } else {
    radio.__codeUiPendingRadioGroup = group;
  }
}

export function unlinkRadioFromParentGroup(
  group: RadioGroupInstance | null | undefined,
  radio: RadioItemInstance,
): void {
  if (group?.__codeUiRadioChildren) {
    const idx = group.__codeUiRadioChildren.indexOf(radio);
    if (idx !== -1) group.__codeUiRadioChildren.splice(idx, 1);
  }
  radio.__codeUiPendingRadioGroup = undefined;
  patchInheritedData<GroupVisualData>(radio, EMPTY_GROUP_VISUALS);
  radio.__codeUiMachine?.updateProps({ groupContext: undefined });
}

/**
 * Shared Behavior reference for `<c-radio>` child components.
 * Automatically links to ancestor `<c-radio-group>`.
 */
export const cuiRadioItemBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    data: { ...EMPTY_GROUP_VISUALS },
    relations: {
      cuiRadioGroupParent: {
        type: "ancestor",
        target: cuiRadioGroupBehavior,
        linked(this: RadioItemInstance, target: RadioGroupInstance) {
          linkRadioToParentGroup(target, this);
        },
        unlinked(this: RadioItemInstance, target: RadioGroupInstance) {
          unlinkRadioFromParentGroup(target, this);
        },
      },
    },
  });

export function setupRadioRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  options: { radioGroup?: boolean; radioItem?: boolean },
): void {
  if (options.radioGroup) {
    relations.cuiRadioChild = createRelationOption<
      RadioGroupInstance,
      RadioItemInstance
    >({
      type: "descendant",
      target: cuiRadioItemBehavior,
      linked(this: RadioGroupInstance, target: RadioItemInstance) {
        linkRadioToParentGroup(this, target);
      },
      unlinked(this: RadioGroupInstance, target: RadioItemInstance) {
        unlinkRadioFromParentGroup(this, target);
      },
    });
  }
  if (options.radioItem) {
    relations.cuiRadioGroupParent = createRelationOption<
      RadioItemInstance,
      RadioGroupInstance
    >({
      type: "ancestor",
      target: cuiRadioGroupBehavior,
      linked(this: RadioItemInstance, target: RadioGroupInstance) {
        linkRadioToParentGroup(target, this);
      },
      unlinked(this: RadioItemInstance, target: RadioGroupInstance) {
        unlinkRadioFromParentGroup(target, this);
      },
    });
  }
}

export function handleRadioAttached(
  instance: RadioItemInstance,
  initialProps: Record<string, unknown>,
  options: { radioGroup?: boolean; radioItem?: boolean },
): void {
  if (!options.radioItem) return;
  const parent = resolveParentNode<RadioGroupInstance>(
    instance,
    instance.__codeUiPendingRadioGroup,
    "cuiRadioGroupParent",
  );
  if (!parent) return;

  patchInheritedData<GroupVisualData>(instance, getRadioGroupVisuals(parent));
  const groupContext = resolveServiceRef(parent, "groupContext");
  if (groupContext !== undefined) {
    initialProps.groupContext = groupContext;
  }
}

function syncRadioGroupChildren(group: RadioGroupInstance): void {
  const relChildren =
    group.getRelationNodes?.<RadioItemInstance>("cuiRadioChild") ?? [];
  const trackedChildren = group.__codeUiRadioChildren ?? [];
  const seen = new Set<RadioItemInstance>();
  for (const child of relChildren) {
    seen.add(child);
    linkRadioToParentGroup(group, child);
  }
  for (const child of trackedChildren) {
    if (!seen.has(child)) {
      linkRadioToParentGroup(group, child);
    }
  }
}

export function handleRadioMachineStarted(
  instance: RadioGroupInstance,
  options: { radioGroup?: boolean; radioItem?: boolean },
): void {
  if (options.radioGroup) {
    syncRadioGroupChildren(instance);
  }
}

export function handleRadioReady(
  instance: RadioGroupInstance | RadioItemInstance,
  options: { radioGroup?: boolean; radioItem?: boolean },
): void {
  if (options.radioGroup) {
    syncRadioGroupChildren(instance as RadioGroupInstance);
  }
  if (options.radioItem && typeof instance.getRelationNodes === "function") {
    const parents =
      instance.getRelationNodes<RadioGroupInstance>("cuiRadioGroupParent");
    if (parents && parents.length > 0 && parents[0]) {
      linkRadioToParentGroup(parents[0], instance as RadioItemInstance);
    }
  }
}

export function withRadioGroup(): MachinePlugin {
  return {
    name: "radio-group",
    behaviors: [cuiRadioGroupBehavior, cuiRadioGroupObserverBehavior],
    setupRelations(relations) {
      setupRadioRelations(relations, { radioGroup: true });
    },
    onMachineStarted(instance) {
      handleRadioMachineStarted(instance as RadioGroupInstance, {
        radioGroup: true,
      });
    },
    onReady(instance) {
      handleRadioReady(instance as RadioGroupInstance, { radioGroup: true });
    },
    onDetached(instance) {
      const group = instance as RadioGroupInstance;
      if (group.__codeUiRadioChildren) {
        for (const child of group.__codeUiRadioChildren) {
          if (child.__codeUiPendingRadioGroup === group) {
            child.__codeUiPendingRadioGroup = undefined;
          }
        }
        group.__codeUiRadioChildren = undefined;
      }
    },
  };
}

export function withRadioItem(): MachinePlugin {
  return {
    name: "radio-item",
    behaviors: [cuiRadioItemBehavior],
    setupRelations(relations) {
      setupRadioRelations(relations, { radioItem: true });
    },
    onAttached(instance, initialProps) {
      handleRadioAttached(instance as RadioItemInstance, initialProps, {
        radioItem: true,
      });
    },
    onReady(instance) {
      handleRadioReady(instance as RadioItemInstance, { radioItem: true });
    },
    onDetached(instance) {
      const item = instance as RadioItemInstance;
      const group = item.__codeUiPendingRadioGroup;
      if (group?.__codeUiRadioChildren) {
        const idx = group.__codeUiRadioChildren.indexOf(item);
        if (idx !== -1) group.__codeUiRadioChildren.splice(idx, 1);
      }
      item.__codeUiPendingRadioGroup = undefined;
    },
  };
}
