import {
  createBehaviorRef,
  createRelationOption,
  patchInheritedData,
  resolveParentNode,
} from "./inherit";
import type {
  AvatarGroupInstance,
  AvatarItemData,
  AvatarItemInstance,
  MiniappBehaviorRef,
} from "./types";

/**
 * Shared Behavior reference for `<c-avatar-group>` parent components.
 * Used as `relations.target` to link descendant `<c-avatar>` components natively
 * without circular imports or tree-shaking hazards.
 */
export const cuiAvatarGroupParentBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({});

const childParentRel = createRelationOption<
  AvatarItemInstance,
  AvatarGroupInstance
>({
  type: "ancestor",
  target: cuiAvatarGroupParentBehavior,
  linked(this: AvatarItemInstance, target: AvatarGroupInstance) {
    linkAvatarItemToParentGroup(target, this);
  },
  unlinked(this: AvatarItemInstance, target: AvatarGroupInstance) {
    unlinkAvatarItemFromParentGroup(target, this);
  },
});

function resolveGroupParent(
  item: AvatarItemInstance,
): AvatarGroupInstance | undefined {
  return resolveParentNode<AvatarGroupInstance>(
    item,
    item.__codeUiPendingAvatarGroup,
    "cuiAvatarGroupParent",
  );
}

/**
 * Shared Behavior reference for `<c-avatar>` child components.
 */
export const cuiAvatarItemBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    relations: { cuiAvatarGroupParent: childParentRel },
    lifetimes: {
      attached(this: AvatarItemInstance) {
        if (this.data?.isGroupCounter) return;
        const parent = resolveGroupParent(this);
        if (parent) linkAvatarItemToParentGroup(parent, this);
      },
      detached(this: AvatarItemInstance) {
        if (this.data?.isGroupCounter) return;
        const parent = resolveGroupParent(this);
        if (parent) unlinkAvatarItemFromParentGroup(parent, this);
      },
    },
  });

const parentChildRel = createRelationOption<
  AvatarGroupInstance,
  AvatarItemInstance
>({
  type: "descendant",
  target: cuiAvatarItemBehavior,
  linked(this: AvatarGroupInstance, target: AvatarItemInstance) {
    linkAvatarItemToParentGroup(this, target);
  },
  linkChanged(this: AvatarGroupInstance) {
    syncAvatarGroupChildren(this);
  },
  unlinked(this: AvatarGroupInstance, target: AvatarItemInstance) {
    unlinkAvatarItemFromParentGroup(this, target);
  },
});

/**
 * Shared Behavior reference for `<c-avatar-group>` parent components.
 */
export const cuiAvatarGroupBehavior: MiniappBehaviorRef =
  /* @__PURE__ */ createBehaviorRef({
    behaviors: [cuiAvatarGroupParentBehavior],
    relations: { cuiAvatarChild: parentChildRel },
    observers: {
      "max, size, classes.base"(this: AvatarGroupInstance) {
        syncAvatarGroupChildren(this);
      },
    },
    lifetimes: {
      attached(this: AvatarGroupInstance) {
        syncAvatarGroupChildren(this);
      },
      ready(this: AvatarGroupInstance) {
        syncAvatarGroupChildren(this);
      },
    },
  });

const EMPTY_AVATAR_ITEM_PATCH: Partial<AvatarItemData> = {
  groupAttached: false,
  groupHidden: false,
  groupOrder: 0,
  groupZIndex: 0,
  groupIsEdge: false,
  groupSize: "",
  groupBaseClass: "",
};

export function syncAvatarGroupChildren(group: AvatarGroupInstance): void {
  if (!group) return;
  const related =
    typeof group.getRelationNodes === "function"
      ? group.getRelationNodes<AvatarItemInstance>("cuiAvatarChild")
      : undefined;
  const raw =
    Array.isArray(related) && related.length > 0
      ? related
      : (group.__codeUiAvatarChildren ?? []);

  const children = raw.filter(
    (c) => c && !c.data?.isGroupCounter && !c.__codeUiIsGroupCounter,
  );

  const total = children.length;
  const max = Number(group.data?.max) || 0;
  const overflowCount = max > 0 && total > max ? total - max : 0;
  const visibleLimit = max > 0 ? Math.min(total, max) : total;

  if (
    group.data?.totalCount !== total ||
    group.data?.overflowCount !== overflowCount
  ) {
    group.setData?.({ totalCount: total, overflowCount });
  }

  const groupSize = group.data?.size;
  const groupBaseClass = group.data?.classes?.base || "";

  for (let i = 0; i < total; i++) {
    const child = children[i];
    if (!child) continue;

    const isHidden = max > 0 && i >= max;
    const rank = total - i;
    const isEdge = overflowCount === 0 && i === visibleLimit - 1;

    child.__codeUiPendingAvatarGroup = group;

    const inheritedPatch: Partial<AvatarItemData> = {
      groupAttached: true,
      groupHidden: isHidden,
      groupOrder: rank,
      groupZIndex: rank,
      groupIsEdge: isEdge,
      groupBaseClass,
      ...(groupSize ? { groupSize } : {}),
    };
    patchInheritedData(child, inheritedPatch);
  }
}

export function linkAvatarItemToParentGroup(
  group: AvatarGroupInstance | null | undefined,
  item: AvatarItemInstance | null | undefined,
): void {
  if (
    !group ||
    !item ||
    item.data?.isGroupCounter ||
    item.__codeUiIsGroupCounter
  ) {
    return;
  }
  const list = (group.__codeUiAvatarChildren ||= []);
  if (!list.includes(item)) list.push(item);
  item.__codeUiPendingAvatarGroup = group;
  syncAvatarGroupChildren(group);
}

export function unlinkAvatarItemFromParentGroup(
  group: AvatarGroupInstance | null | undefined,
  item: AvatarItemInstance | null | undefined,
): void {
  if (!item) return;
  if (group && Array.isArray(group.__codeUiAvatarChildren)) {
    group.__codeUiAvatarChildren = group.__codeUiAvatarChildren.filter(
      (c) => c !== item,
    );
  }
  item.__codeUiPendingAvatarGroup = undefined;
  item.setData?.(EMPTY_AVATAR_ITEM_PATCH);
  if (group) syncAvatarGroupChildren(group);
}

export function setupAvatarGroupRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  role: "parent" | "child",
): void {
  if (role === "parent") {
    relations.cuiAvatarChild = parentChildRel;
  } else {
    relations.cuiAvatarGroupParent = childParentRel;
  }
}
