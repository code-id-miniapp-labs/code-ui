import type { MachinePlugin } from "../plugin";

/**
 * Shared Behavior reference for `<c-checkbox-group>` parent components.
 * Used as relations.target to link descendant <c-checkbox> components natively
 * without file paths or tree-shaking hazards.
 */
export const cuiCheckboxGroupBehavior: any =
  typeof Behavior !== "undefined" ? Behavior({}) : {};
export const cuiCheckboxGroupParentBehavior: any = cuiCheckboxGroupBehavior;

export function linkCheckboxToParentGroup(group: any, checkbox: any) {
  const service = group.__codeUiMachine?.service;
  const groupContext = service?.refs?.get?.("groupContext");
  if (checkbox.__codeUiMachine) {
    checkbox.__codeUiMachine.updateProps({ groupContext });
  } else {
    checkbox.__codeUiPendingCheckboxGroup = group;
  }
}

export function unlinkCheckboxFromParentGroup(_group: any, checkbox: any) {
  if (checkbox.__codeUiMachine) {
    checkbox.__codeUiMachine.updateProps({ groupContext: undefined });
  }
}

/**
 * Shared Behavior reference for `<c-checkbox>` child components.
 * Automatically links to ancestor `<c-checkbox-group>`.
 */
export const cuiCheckboxItemBehavior: any =
  typeof Behavior !== "undefined"
    ? Behavior({
        relations: {
          cuiCheckboxGroupParent: {
            type: "ancestor",
            target: cuiCheckboxGroupBehavior,
            linked(this: any, target: any) {
              linkCheckboxToParentGroup(target, this);
            },
            unlinked(this: any, target: any) {
              unlinkCheckboxFromParentGroup(target, this);
            },
          },
        },
      })
    : {};

export function setupCheckboxRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  options: { checkboxGroup?: boolean; checkboxItem?: boolean },
) {
  if (options.checkboxGroup) {
    relations.cuiCheckboxChild = {
      type: "descendant",
      target: cuiCheckboxItemBehavior,
      linked(this: any, target: any) {
        linkCheckboxToParentGroup(this, target);
      },
      unlinked(this: any, target: any) {
        unlinkCheckboxFromParentGroup(this, target);
      },
    };
  }
}

export function handleCheckboxAttached(
  instance: any,
  initialProps: Record<string, any>,
  options: { checkboxGroup?: boolean; checkboxItem?: boolean },
) {
  if (options.checkboxItem) {
    const parent =
      instance.__codeUiPendingCheckboxGroup ??
      (typeof instance.getRelationNodes === "function"
        ? instance.getRelationNodes("cuiCheckboxGroupParent")?.[0]
        : undefined);
    if (parent) {
      const pService = parent.__codeUiMachine?.service;
      const groupContext = pService?.refs?.get?.("groupContext");
      if (groupContext) {
        initialProps.groupContext = groupContext;
      }
    }
  }
}

function syncCheckboxGroupChildren(group: any) {
  if (typeof group.getRelationNodes === "function") {
    const children = group.getRelationNodes("cuiCheckboxChild");
    if (children) for (const c of children) linkCheckboxToParentGroup(group, c);
  }
}

export function handleCheckboxMachineStarted(
  instance: any,
  options: { checkboxGroup?: boolean; checkboxItem?: boolean },
) {
  if (options.checkboxGroup) syncCheckboxGroupChildren(instance);
}

export function handleCheckboxReady(
  instance: any,
  options: { checkboxGroup?: boolean; checkboxItem?: boolean },
) {
  if (options.checkboxGroup) syncCheckboxGroupChildren(instance);
  if (options.checkboxItem && typeof instance.getRelationNodes === "function") {
    const parents = instance.getRelationNodes("cuiCheckboxGroupParent");
    if (parents && parents.length > 0) {
      linkCheckboxToParentGroup(parents[0], instance);
    }
  }
}

export function withCheckboxGroup(): MachinePlugin {
  return {
    name: "checkbox-group",
    behaviors: [cuiCheckboxGroupBehavior],
    setupRelations(relations) {
      setupCheckboxRelations(relations, { checkboxGroup: true });
    },
    onMachineStarted(instance) {
      handleCheckboxMachineStarted(instance, { checkboxGroup: true });
    },
    onReady(instance) {
      handleCheckboxReady(instance, { checkboxGroup: true });
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
      handleCheckboxAttached(instance, initialProps, { checkboxItem: true });
    },
    onReady(instance) {
      handleCheckboxReady(instance, { checkboxItem: true });
    },
  };
}
