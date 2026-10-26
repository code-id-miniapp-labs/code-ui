import type { MachinePlugin } from "../plugin";

function getServiceBus(service: any) {
  return service?.refs?.get ? service.refs.get("bus") : undefined;
}

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
  const bus = getServiceBus(service) ?? service?.refs?.get?.("bus");
  radio.__codeUiRadioGroupBus = bus;
  if (radio.__codeUiMachine) {
    const ctx = service?.context;
    radio.__codeUiMachine.updateProps({
      groupBus: bus,
      groupValue: ctx?.get("value"),
      groupDisabled: ctx?.get("disabled"),
      groupInvalid: ctx?.get("invalid"),
      groupSize: ctx?.get("size"),
      groupColor: ctx?.get("color"),
      groupVariant: ctx?.get("variant"),
    });
  } else {
    radio.__codeUiPendingRadioGroup = group;
  }
}

export function unlinkRadioFromParentGroup(_group: any, radio: any) {
  radio.__codeUiRadioGroupBus = undefined;
  if (radio.__codeUiMachine) {
    radio.__codeUiMachine.updateProps({
      groupBus: undefined,
      groupValue: undefined,
      groupDisabled: undefined,
      groupSize: undefined,
      groupColor: undefined,
      groupVariant: undefined,
    });
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
      const bus =
        parent.__codeUiRadioGroupBus ??
        getServiceBus(pService) ??
        pService?.refs?.get?.("bus");
      if (bus) {
        initialProps.groupBus = bus;
        instance.__codeUiRadioGroupBus = bus;
      }
      if (pService) {
        const ctx = pService.context;
        initialProps.groupValue = ctx?.get("value");
        initialProps.groupDisabled = ctx?.get("disabled");
        initialProps.groupInvalid = ctx?.get("invalid");
        initialProps.groupSize = ctx?.get("size");
        initialProps.groupColor = ctx?.get("color");
        initialProps.groupVariant = ctx?.get("variant");
      }
    }
  }
}

export function handleRadioMachineStarted(
  instance: any,
  options: { radioGroup?: boolean; radioItem?: boolean },
) {
  if (options.radioGroup && typeof instance.getRelationNodes === "function") {
    const children = instance.getRelationNodes("cuiRadioChild");
    if (children && children.length > 0) {
      for (const child of children) {
        linkRadioToParentGroup(instance, child);
      }
    }
  }
}

export function handleRadioReady(
  instance: any,
  options: { radioGroup?: boolean; radioItem?: boolean },
) {
  if (options.radioGroup && typeof instance.getRelationNodes === "function") {
    const children = instance.getRelationNodes("cuiRadioChild");
    if (children && children.length > 0) {
      for (const child of children) {
        linkRadioToParentGroup(instance, child);
      }
    }
  }
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
