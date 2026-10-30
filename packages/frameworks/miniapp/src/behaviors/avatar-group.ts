/**
 * Shared Behavior reference for `<c-avatar-group>` parent components.
 * Used as relations.target to link descendant <c-avatar> components natively.
 */
export const cuiAvatarGroupParentBehavior: any =
  typeof Behavior !== "undefined" ? Behavior({}) : {};

/**
 * Shared Behavior reference for `<c-avatar>` child components.
 * Automatically links to ancestor `<c-avatar-group>`.
 */
export const cuiAvatarItemBehavior: any =
  typeof Behavior !== "undefined"
    ? Behavior({
        relations: {
          cuiAvatarGroupParent: {
            type: "ancestor",
            target: cuiAvatarGroupParentBehavior,
            linked(this: any, target: any) {
              linkAvatarItemToParentGroup(target, this);
            },
            unlinked(this: any, target: any) {
              unlinkAvatarItemFromParentGroup(target, this);
            },
          },
        },
        lifetimes: {
          attached(this: any) {
            if (this.data?.isGroupCounter) return;
            const parent =
              this.__codeUiPendingAvatarGroup ??
              (typeof this.getRelationNodes === "function"
                ? this.getRelationNodes("cuiAvatarGroupParent")?.[0]
                : undefined);
            if (parent) {
              linkAvatarItemToParentGroup(parent, this);
            }
          },
          detached(this: any) {
            if (this.data?.isGroupCounter) return;
            const parent =
              this.__codeUiPendingAvatarGroup ??
              (typeof this.getRelationNodes === "function"
                ? this.getRelationNodes("cuiAvatarGroupParent")?.[0]
                : undefined);
            if (parent) {
              unlinkAvatarItemFromParentGroup(parent, this);
            }
          },
        },
      })
    : {};

/**
 * Shared Behavior reference for `<c-avatar-group>` parent components.
 * Automatically wires descendant relations, observers, and lifetimes.
 */
export const cuiAvatarGroupBehavior: any =
  typeof Behavior !== "undefined"
    ? Behavior({
        behaviors: [cuiAvatarGroupParentBehavior],
        relations: {
          cuiAvatarChild: {
            type: "descendant",
            target: cuiAvatarItemBehavior,
            linked(this: any, target: any) {
              linkAvatarItemToParentGroup(this, target);
            },
            linkChanged(this: any) {
              syncAvatarGroupChildren(this);
            },
            unlinked(this: any, target: any) {
              unlinkAvatarItemFromParentGroup(this, target);
            },
          },
        },
        observers: {
          "max, size, classes.base": function (this: any) {
            syncAvatarGroupChildren(this);
          },
        },
        lifetimes: {
          attached(this: any) {
            syncAvatarGroupChildren(this);
          },
          ready(this: any) {
            syncAvatarGroupChildren(this);
          },
        },
      })
    : {};

export function syncAvatarGroupChildren(group: any): void {
  if (!group) return;

  const relationChildren =
    typeof group.getRelationNodes === "function"
      ? group.getRelationNodes("cuiAvatarChild")
      : undefined;
  const templateChildren =
    typeof group.selectAllComponents === "function"
      ? group.selectAllComponents(".cui-avatar")
      : undefined;
  const rawChildren: any[] =
    Array.isArray(relationChildren) && relationChildren.length > 0
      ? relationChildren
      : Array.isArray(templateChildren) && templateChildren.length > 0
        ? templateChildren
        : group.__codeUiAvatarChildren || [];

  // Filter out any counter avatar or invalid nodes
  const children = rawChildren.filter(
    (c: any) => Boolean(c) && !c.data?.isGroupCounter && !c.__codeUiIsGroupCounter,
  );

  const total = children.length;
  const max = Number(group.data?.max) || 0;
  const overflowCount = max > 0 && total > max ? total - max : 0;
  const visibleLimit = max > 0 ? Math.min(total, max) : total;

  if (
    group.data?.totalCount !== total ||
    group.data?.overflowCount !== overflowCount
  ) {
    if (typeof group.setData === "function") {
      group.setData({
        totalCount: total,
        overflowCount,
      });
    }
  }

  const groupSize = group.data?.size;
  const groupBaseClass = group.data?.classes?.base || "";

  for (let i = 0; i < total; i++) {
    const child = children[i];
    if (!child) continue;

    const isHidden = max > 0 ? i >= max : false;
    // With flex-row-reverse justify-end:
    // Lower order goes towards main-start (right).
    // Higher order goes towards main-end (left).
    // Child 0 is visually leftmost -> highest order: total - i.
    // Child i stacks on top of child i + 1 -> zIndex: total - i.
    const order = total - i;
    const zIndex = total - i;
    const isEdge = overflowCount === 0 && i === visibleLimit - 1;

    child.__codeUiPendingAvatarGroup = group;

    const patch: Record<string, any> = {};
    if (child.data?.groupAttached !== true) patch.groupAttached = true;
    if (child.data?.groupHidden !== isHidden) patch.groupHidden = isHidden;
    if (child.data?.groupOrder !== order) patch.groupOrder = order;
    if (child.data?.groupZIndex !== zIndex) patch.groupZIndex = zIndex;
    if (child.data?.groupIsEdge !== isEdge) patch.groupIsEdge = isEdge;
    if (groupSize && child.data?.groupSize !== groupSize) patch.groupSize = groupSize;
    if (child.data?.groupBaseClass !== groupBaseClass) patch.groupBaseClass = groupBaseClass;

    if (Object.keys(patch).length > 0 && typeof child.setData === "function") {
      child.setData(patch);
    }
  }
}

export function linkAvatarItemToParentGroup(group: any, item: any): void {
  if (!group || !item) return;
  if (item.data?.isGroupCounter || item.__codeUiIsGroupCounter) {
    return;
  }
  group.__codeUiAvatarChildren = group.__codeUiAvatarChildren || [];
  if (!group.__codeUiAvatarChildren.includes(item)) {
    group.__codeUiAvatarChildren.push(item);
  }
  item.__codeUiPendingAvatarGroup = group;
  syncAvatarGroupChildren(group);
}

export function unlinkAvatarItemFromParentGroup(group: any, item: any): void {
  if (!item) return;
  if (group && Array.isArray(group.__codeUiAvatarChildren)) {
    group.__codeUiAvatarChildren = group.__codeUiAvatarChildren.filter(
      (c: any) => c !== item,
    );
  }
  item.__codeUiPendingAvatarGroup = undefined;
  if (typeof item.setData === "function") {
    item.setData({
      groupAttached: false,
      groupHidden: false,
      groupOrder: 0,
      groupZIndex: 0,
      groupIsEdge: false,
      groupSize: "",
      groupBaseClass: "",
    });
  }
  if (group) {
    syncAvatarGroupChildren(group);
  }
}

export function setupAvatarGroupRelations(
  relations: Record<string, WechatMiniprogram.Component.RelationOption>,
  role: "parent" | "child",
): void {
  if (role === "parent") {
    relations.cuiAvatarChild = {
      type: "descendant",
      target: cuiAvatarItemBehavior,
      linked(this: any, target: any) {
        linkAvatarItemToParentGroup(this, target);
      },
      linkChanged(this: any) {
        syncAvatarGroupChildren(this);
      },
      unlinked(this: any, target: any) {
        unlinkAvatarItemFromParentGroup(this, target);
      },
    };
  } else {
    relations.cuiAvatarGroupParent = {
      type: "ancestor",
      target: cuiAvatarGroupParentBehavior,
      linked(this: any, target: any) {
        linkAvatarItemToParentGroup(target, this);
      },
      unlinked(this: any, target: any) {
        unlinkAvatarItemFromParentGroup(target, this);
      },
    };
  }
}
