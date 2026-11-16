import type { MachinePlugin } from "../plugin";
import {
  createBehaviorRef,
  createRelationOption,
  patchInheritedData,
  resolveInstanceId,
  resolveParentNode,
  resolveServiceRef,
} from "./inherit";
import type {
  MiniappBehaviorRef,
  StepperInstance,
  StepperItemInstance,
  StepperVisualData,
} from "./types";

function getStepperVisuals(
  group: StepperInstance | null | undefined,
): StepperVisualData {
  return {
    groupOrientation: group?.data?.orientation || "",
    groupColor: group?.data?.color || "",
    groupSize: group?.data?.size || "",
    groupVariant: group?.data?.variant || "",
  };
}

const EMPTY_STEPPER_VISUALS: StepperVisualData = {
  groupOrientation: "",
  groupColor: "",
  groupSize: "",
  groupVariant: "",
};

/**
 * Shared Behavior reference for `<c-stepper>` parent components.
 * Used as `relations.target` to link descendant `<c-stepper-item>` components natively.
 */
export const cuiStepperBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({});
export const cuiStepperParentBehavior: MiniappBehaviorRef = cuiStepperBehavior;

const cuiStepperObserverBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    observers: {
      "orientation, color, size, variant"(this: StepperInstance) {
        syncStepperChildren(this);
      },
    },
  });

export function syncStepperChildren(group: StepperInstance): void {
  const groupContext = resolveServiceRef(group, "groupContext");
  const relationChildren =
    typeof group.getRelationNodes === "function"
      ? group.getRelationNodes<StepperItemInstance>("cuiStepperChild")
      : undefined;
  const templateChildren =
    typeof group.selectAllComponents === "function"
      ? group.selectAllComponents<StepperItemInstance>(
          "c-stepper-item, .cui-stepper-item",
        )
      : undefined;
  const children: StepperItemInstance[] =
    Array.isArray(relationChildren) && relationChildren.length > 0
      ? relationChildren
      : Array.isArray(templateChildren) && templateChildren.length > 0
        ? templateChildren
        : (group.__codeUiStepperChildren ?? []);
  const total = children.length;
  const linkedItems = children.map((child) => ({
    disabled: Boolean(child.data?.disabled),
  }));

  group.__codeUiMachine?.updateProps({ linkedCount: total, linkedItems });

  const groupId = resolveInstanceId(group, "cui");
  const visuals = getStepperVisuals(group);

  for (let i = 0; i < total; i++) {
    const child = children[i];
    if (!child) continue;
    child.__codeUiPendingStepper = group;
    child.__codeUiStepperIndex = i;
    child.__codeUiStepperId = groupId;
    patchInheritedData<StepperVisualData>(child, visuals);
    child.__codeUiMachine?.updateProps({
      stepperId: groupId,
      groupContext,
      groupIndex: i,
    });
  }
}

export function linkStepperItemToParentGroup(
  group: StepperInstance,
  item: StepperItemInstance,
): void {
  const children = (group.__codeUiStepperChildren ||= []);
  if (!children.includes(item)) {
    children.push(item);
  }
  item.__codeUiPendingStepper = group;
  syncStepperChildren(group);
}

export function unlinkStepperItemFromParentGroup(
  group: StepperInstance,
  item: StepperItemInstance,
): void {
  if (Array.isArray(group.__codeUiStepperChildren)) {
    group.__codeUiStepperChildren = group.__codeUiStepperChildren.filter(
      (c) => c !== item,
    );
  }
  item.__codeUiPendingStepper = undefined;
  patchInheritedData<StepperVisualData>(item, EMPTY_STEPPER_VISUALS);
  item.__codeUiMachine?.updateProps({
    stepperId: undefined,
    groupContext: undefined,
    groupIndex: undefined,
  });
  syncStepperChildren(group);
}

/**
 * Shared Behavior reference for `<c-stepper-item>` child components.
 * Automatically links to ancestor `<c-stepper>`.
 */
export const cuiStepperItemBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    data: { ...EMPTY_STEPPER_VISUALS },
    observers: {
      disabled(this: StepperItemInstance) {
        const parent = resolveParentNode<StepperInstance>(
          this,
          this.__codeUiPendingStepper,
          "cuiStepperParent",
        );
        if (parent) {
          syncStepperChildren(parent);
        }
      },
    },
    relations: {
      cuiStepperParent: {
        type: "ancestor",
        target: cuiStepperBehavior,
        linked(this: StepperItemInstance, target: StepperInstance) {
          linkStepperItemToParentGroup(target, this);
        },
        unlinked(this: StepperItemInstance, target: StepperInstance) {
          unlinkStepperItemFromParentGroup(target, this);
        },
      },
    },
  });

export function setupStepperRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  options: { stepper?: boolean; stepperItem?: boolean },
): void {
  if (options.stepper) {
    relations.cuiStepperChild = createRelationOption<
      StepperInstance,
      StepperItemInstance
    >({
      type: "descendant",
      target: cuiStepperItemBehavior,
      linked(this: StepperInstance, target: StepperItemInstance) {
        linkStepperItemToParentGroup(this, target);
      },
      unlinked(this: StepperInstance, target: StepperItemInstance) {
        unlinkStepperItemFromParentGroup(this, target);
      },
    });
  }
  if (options.stepperItem) {
    relations.cuiStepperParent = createRelationOption<
      StepperItemInstance,
      StepperInstance
    >({
      type: "ancestor",
      target: cuiStepperBehavior,
      linked(this: StepperItemInstance, target: StepperInstance) {
        linkStepperItemToParentGroup(target, this);
      },
      unlinked(this: StepperItemInstance, target: StepperInstance) {
        unlinkStepperItemFromParentGroup(target, this);
      },
    });
  }
}

export function handleStepperAttached(
  instance: StepperItemInstance,
  initialProps: Record<string, unknown>,
  options: { stepper?: boolean; stepperItem?: boolean },
): void {
  if (!options.stepperItem) return;
  const parent = resolveParentNode<StepperInstance>(
    instance,
    instance.__codeUiPendingStepper,
    "cuiStepperParent",
  );
  if (!parent) return;

  patchInheritedData<StepperVisualData>(instance, getStepperVisuals(parent));
  const groupContext = resolveServiceRef(parent, "groupContext");
  if (groupContext !== undefined) {
    initialProps.groupContext = groupContext;
  }
  if (instance.__codeUiStepperIndex !== undefined) {
    initialProps.groupIndex = instance.__codeUiStepperIndex;
  }
  const sid = instance.__codeUiStepperId ?? resolveInstanceId(parent);
  if (sid !== undefined) {
    initialProps.stepperId = sid;
  }
}

export function handleStepperMachineStarted(
  instance: StepperInstance,
  options: { stepper?: boolean; stepperItem?: boolean },
): void {
  if (options.stepper) {
    syncStepperChildren(instance);
  }
}

export function handleStepperReady(
  instance: StepperInstance | StepperItemInstance,
  options: { stepper?: boolean; stepperItem?: boolean },
): void {
  if (options.stepper) {
    syncStepperChildren(instance as StepperInstance);
  }
  if (options.stepperItem && typeof instance.getRelationNodes === "function") {
    const parents =
      instance.getRelationNodes<StepperInstance>("cuiStepperParent");
    if (parents && parents.length > 0 && parents[0]) {
      linkStepperItemToParentGroup(parents[0], instance as StepperItemInstance);
    }
  }
}

export function withStepper(): MachinePlugin {
  return {
    name: "stepper",
    behaviors: [cuiStepperBehavior, cuiStepperObserverBehavior],
    setupRelations(relations) {
      setupStepperRelations(relations, { stepper: true });
    },
    onMachineStarted(instance) {
      handleStepperMachineStarted(instance as StepperInstance, {
        stepper: true,
      });
    },
    onReady(instance) {
      handleStepperReady(instance as StepperInstance, { stepper: true });
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
      handleStepperAttached(instance as StepperItemInstance, initialProps, {
        stepperItem: true,
      });
    },
    onReady(instance) {
      handleStepperReady(instance as StepperItemInstance, {
        stepperItem: true,
      });
    },
  };
}
