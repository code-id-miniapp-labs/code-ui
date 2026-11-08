import type { MachinePlugin } from "../plugin";

/**
 * Shared Behavior reference for `<c-radio-group>` parent components.
 * Used as relations.target to link descendant <c-radio> components natively
 * without file paths or tree-shaking hazards.
 */
export const cuiRadioGroupBehavior: any =
  typeof Behavior !== "undefined" ? Behavior({}) : {};
export const cuiRadioGroupParentBehavior: any = cuiRadioGroupBehavior;

export function linkRadioToParentGroup(group: any, radio: any) {
  const service = group.__codeUiMachine?.service;
  const groupContext = service?.refs?.get?.("groupContext");
  if (radio.__codeUiMachine) {
    radio.__codeUiMachine.updateProps({ groupContext });
  } else {
    radio.__codeUiPendingRadioGroup = group;
  }
}

export function unlinkRadioFromParentGroup(_group: any, radio: any) {
  if (radio.__codeUiMachine) {
    radio.__codeUiMachine.updateProps({ groupContext: undefined });
  }
}

/**
 * Shared Behavior reference for `<c-radio>` child components.
 * Automatically links to ancestor `<c-radio-group>`.
 */
export const cuiRadioItemBehavior: any =
  typeof Behavior !== "undefined"
    ? Behavior({
        relations: {
          cuiRadioGroupParent: {
            type: "ancestor",
            target: cuiRadioGroupBehavior,
            linked(this: any, target: any) {
              linkRadioToParentGroup(target, this);
            },
            unlinked(this: any, target: any) {
              unlinkRadioFromParentGroup(target, this);
            },
          },
        },
      })
    : {};

export function setupRadioRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  options: { radioGroup?: boolean; radioItem?: boolean },
) {
  if (options.radioGroup) {
    relations.cuiRadioChild = {
      type: "descendant",
      target: cuiRadioItemBehavior,
      linked(this: any, target: any) {
        linkRadioToParentGroup(this, target);
      },
      unlinked(this: any, target: any) {
        unlinkRadioFromParentGroup(this, target);
      },
    };
  }
}

export function handleRadioAttached(
  instance: any,
  initialProps: Record<string, any>,
  options: { radioGroup?: boolean; radioItem?: boolean },
) {
  if (options.radioItem) {
    const parent =
      instance.__codeUiPendingRadioGroup ??
      (typeof instance.getRelationNodes === "function"
        ? instance.getRelationNodes("cuiRadioGroupParent")?.[0]
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

function syncRadioGroupChildren(group: any) {
  if (typeof group.getRelationNodes === "function") {
    const children = group.getRelationNodes("cuiRadioChild");
    if (children) for (const c of children) linkRadioToParentGroup(group, c);
  }
}

export function handleRadioMachineStarted(
  instance: any,
  options: { radioGroup?: boolean; radioItem?: boolean },
) {
  if (options.radioGroup) syncRadioGroupChildren(instance);
}

export function handleRadioReady(
  instance: any,
  options: { radioGroup?: boolean; radioItem?: boolean },
) {
  if (options.radioGroup) syncRadioGroupChildren(instance);
  if (options.radioItem && typeof instance.getRelationNodes === "function") {
    const parents = instance.getRelationNodes("cuiRadioGroupParent");
    if (parents && parents.length > 0) {
      linkRadioToParentGroup(parents[0], instance);
    }
  }
}

export function withRadioGroup(): MachinePlugin {
  return {
    name: "radio-group",
    behaviors: [cuiRadioGroupBehavior],
    setupRelations(relations) {
      setupRadioRelations(relations, { radioGroup: true });
    },
    onMachineStarted(instance) {
      handleRadioMachineStarted(instance, { radioGroup: true });
    },
    onReady(instance) {
      handleRadioReady(instance, { radioGroup: true });
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
      handleRadioAttached(instance, initialProps, { radioItem: true });
    },
    onReady(instance) {
      handleRadioReady(instance, { radioItem: true });
    },
  };
}
