const mkBehavior = (def: Record<string, any>): any =>
  typeof Behavior !== "undefined" ? Behavior(def) : {};

/**
 * Shared Behavior reference for `<c-avatar-group>` parent components.
 */
export const cuiAvatarGroupParentBehavior: any = /* @__PURE__ */ mkBehavior({});

const childParentRel = {
  type: "ancestor" as const,
  target: cuiAvatarGroupParentBehavior,
  linked(this: any, target: any) {
    linkAvatarItemToParentGroup(target, this);
  },
  unlinked(this: any, target: any) {
    unlinkAvatarItemFromParentGroup(target, this);
  },
};

function resolveGroupParent(item: any): any {
  return (
    item.__codeUiPendingAvatarGroup ??
    item.getRelationNodes?.("cuiAvatarGroupParent")?.[0]
  );
}

/**
 * Shared Behavior reference for `<c-avatar>` child components.
 */
export const cuiAvatarItemBehavior: any = /* @__PURE__ */ mkBehavior({
  relations: { cuiAvatarGroupParent: childParentRel },
  lifetimes: {
    attached(this: any) {
      if (this.data?.isGroupCounter) return;
      const parent = resolveGroupParent(this);
      if (parent) linkAvatarItemToParentGroup(parent, this);
    },
    detached(this: any) {
      if (this.data?.isGroupCounter) return;
      const parent = resolveGroupParent(this);
      if (parent) unlinkAvatarItemFromParentGroup(parent, this);
    },
  },
});

const parentChildRel = {
  type: "descendant" as const,
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

/**
 * Shared Behavior reference for `<c-avatar-group>` parent components.
 */
export const cuiAvatarGroupBehavior: any = /* @__PURE__ */ mkBehavior({
  behaviors: [cuiAvatarGroupParentBehavior],
  relations: { cuiAvatarChild: parentChildRel },
  observers: {
    "max, size, classes.base"(this: any) {
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
});

export function syncAvatarGroupChildren(group: any): void {
  if (!group) return;

  const rel = group.getRelationNodes?.("cuiAvatarChild");
  const tpl =
    !rel?.length ? group.selectAllComponents?.(".cui-avatar") : undefined;
  const raw: any[] = rel?.length
    ? rel
    : tpl?.length
      ? tpl
      : group.__codeUiAvatarChildren || [];

  const children = raw.filter(
    (c: any) => c && !c.data?.isGroupCounter && !c.__codeUiIsGroupCounter,
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
    const d = child.data;

    child.__codeUiPendingAvatarGroup = group;

    const patch: Record<string, any> = {};
    let dirty = false;
    const set = (k: string, v: any) => {
      if (d?.[k] !== v) {
        patch[k] = v;
        dirty = true;
      }
    };
    set("groupAttached", true);
    set("groupHidden", isHidden);
    set("groupOrder", rank);
    set("groupZIndex", rank);
    set("groupIsEdge", isEdge);
    if (groupSize) set("groupSize", groupSize);
    set("groupBaseClass", groupBaseClass);

    if (dirty) child.setData?.(patch);
  }
}

export function linkAvatarItemToParentGroup(group: any, item: any): void {
  if (!group || !item || item.data?.isGroupCounter || item.__codeUiIsGroupCounter)
    return;
  const list = (group.__codeUiAvatarChildren ||= []);
  if (!list.includes(item)) list.push(item);
  item.__codeUiPendingAvatarGroup = group;
  syncAvatarGroupChildren(group);
}

export function unlinkAvatarItemFromParentGroup(group: any, item: any): void {
  if (!item) return;
  if (Array.isArray(group?.__codeUiAvatarChildren)) {
    group.__codeUiAvatarChildren = group.__codeUiAvatarChildren.filter(
      (c: any) => c !== item,
    );
  }
  item.__codeUiPendingAvatarGroup = undefined;
  item.setData?.({
    groupAttached: false,
    groupHidden: false,
    groupOrder: 0,
    groupZIndex: 0,
    groupIsEdge: false,
    groupSize: "",
    groupBaseClass: "",
  });
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
