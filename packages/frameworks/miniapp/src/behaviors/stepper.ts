import type { MachinePlugin } from "../plugin";

let stepCounter = 0;
const getComponentId = (inst: any, explicitId?: string): string =>
  explicitId || (inst.__cuiStepId ||= `cui-${++stepCounter}`);

/**
 * Shared Behavior reference for `<c-stepper>` parent components.
 * Used as relations.target to link descendant <c-stepper-item> components natively.
 */
export const cuiStepperBehavior: any =
  typeof Behavior !== "undefined" ? Behavior({}) : {};
export const cuiStepperParentBehavior: any = cuiStepperBehavior;

export function syncStepperChildren(group: any) {
  const service = group.__codeUiMachine?.service;
  const groupContext = service?.refs?.get?.("groupContext");
  const relationChildren =
    typeof group.getRelationNodes === "function"
      ? group.getRelationNodes("cuiStepperChild")
      : undefined;
  const templateChildren =
    typeof group.selectAllComponents === "function"
      ? group.selectAllComponents("c-stepper-item, .cui-stepper-item")
      : undefined;
  const children: any[] =
    Array.isArray(relationChildren) && relationChildren.length > 0
      ? relationChildren
      : Array.isArray(templateChildren) && templateChildren.length > 0
        ? templateChildren
        : group.__codeUiStepperChildren || [];
  const total = children.length;

  if (group.__codeUiMachine) {
    group.__codeUiMachine.updateProps({ linkedCount: total });
  }

  const groupId =
    group.data?.id || group.id || group.__codeUiId || getComponentId(group);
  group.__codeUiId = groupId;

  for (let i = 0; i < total; i++) {
    const child = children[i];
    if (!child) continue;
    child.__codeUiPendingStepper = group;
    child.__codeUiStepperIndex = i;
    child.__codeUiStepperId = groupId;
    if (child.__codeUiMachine) {
      child.__codeUiMachine.updateProps({
        stepperId: groupId,
        groupContext,
        groupIndex: i,
      });
    }
  }
}

export function linkStepperItemToParentGroup(group: any, item: any) {
  group.__codeUiStepperChildren = group.__codeUiStepperChildren || [];
  if (!group.__codeUiStepperChildren.includes(item)) {
    group.__codeUiStepperChildren.push(item);
  }
  item.__codeUiPendingStepper = group;
  syncStepperChildren(group);
}

export function unlinkStepperItemFromParentGroup(group: any, item: any) {
  if (Array.isArray(group.__codeUiStepperChildren)) {
    group.__codeUiStepperChildren = group.__codeUiStepperChildren.filter(
      (c: any) => c !== item,
    );
  }
  item.__codeUiPendingStepper = undefined;
  if (item.__codeUiMachine) {
    item.__codeUiMachine.updateProps({
      stepperId: undefined,
      groupContext: undefined,
      groupIndex: undefined,
    });
  }
  syncStepperChildren(group);
}

/**
 * Shared Behavior reference for `<c-stepper-item>` child components.
 * Automatically links to ancestor `<c-stepper>`.
 */
export const cuiStepperItemBehavior: any =
  typeof Behavior !== "undefined"
    ? Behavior({
        relations: {
          cuiStepperParent: {
            type: "ancestor",
            target: cuiStepperBehavior,
            linked(this: any, target: any) {
              linkStepperItemToParentGroup(target, this);
            },
            unlinked(this: any, target: any) {
              unlinkStepperItemFromParentGroup(target, this);
            },
          },
        },
      })
    : {};

export function setupStepperRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  options: { stepper?: boolean; stepperItem?: boolean },
) {
  if (options.stepper) {
    relations.cuiStepperChild = {
      type: "descendant",
      target: cuiStepperItemBehavior,
      linked(this: any, target: any) {
        linkStepperItemToParentGroup(this, target);
      },
      unlinked(this: any, target: any) {
        unlinkStepperItemFromParentGroup(this, target);
      },
    };
  }
}

export function handleStepperAttached(
  instance: any,
  initialProps: Record<string, any>,
  options: { stepper?: boolean; stepperItem?: boolean },
) {
  if (options.stepperItem) {
    const parent =
      instance.__codeUiPendingStepper ??
      (typeof instance.getRelationNodes === "function"
        ? instance.getRelationNodes("cuiStepperParent")?.[0]
        : undefined);
    if (parent) {
      const pService = parent.__codeUiMachine?.service;
      const groupContext = pService?.refs?.get?.("groupContext");
      if (groupContext) {
        initialProps.groupContext = groupContext;
      }
      if (instance.__codeUiStepperIndex !== undefined) {
        initialProps.groupIndex = instance.__codeUiStepperIndex;
      }
      const sid =
        instance.__codeUiStepperId ??
        parent.data?.id ??
        parent.id ??
        parent.__codeUiId;
      if (sid !== undefined) {
        initialProps.stepperId = sid;
      }
    }
  }
}

export function handleStepperMachineStarted(
  instance: any,
  options: { stepper?: boolean; stepperItem?: boolean },
) {
  if (options.stepper) {
    syncStepperChildren(instance);
  }
}

export function handleStepperReady(
  instance: any,
  options: { stepper?: boolean; stepperItem?: boolean },
) {
  if (options.stepper) {
    syncStepperChildren(instance);
  }
  if (options.stepperItem && typeof instance.getRelationNodes === "function") {
    const parents = instance.getRelationNodes("cuiStepperParent");
    if (parents && parents.length > 0) {
      linkStepperItemToParentGroup(parents[0], instance);
    }
  }
}

export function withStepper(): MachinePlugin {
  return {
    name: "stepper",
    behaviors: [cuiStepperBehavior],
    setupRelations(relations) {
      setupStepperRelations(relations, { stepper: true });
    },
    onMachineStarted(instance) {
      handleStepperMachineStarted(instance, { stepper: true });
    },
    onReady(instance) {
      handleStepperReady(instance, { stepper: true });
    },
  };
}

export function withStepperItem(): MachinePlugin {
  return {
    name: "stepper-item",
    behaviors: [cuiStepperItemBehavior],
    setupRelations(relations) {
      setupStepperRelations(relations, { stepperItem: true });
    },
    onAttached(instance, initialProps) {
      handleStepperAttached(instance, initialProps, { stepperItem: true });
    },
    onReady(instance) {
      handleStepperReady(instance, { stepperItem: true });
    },
  };
}
