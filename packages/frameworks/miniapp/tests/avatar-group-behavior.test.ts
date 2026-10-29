import { describe, it, expect, vi } from "vitest";
import {
  setupAvatarGroupRelations,
  syncAvatarGroupChildren,
  linkAvatarItemToParentGroup,
  unlinkAvatarItemFromParentGroup,
} from "../src/behaviors/avatar-group";

// Mock global Behavior for Node test environment
(globalThis as any).Behavior = vi.fn((config: any) => ({
  ...config,
  __isMockBehavior: true,
}));

function createGroup(data: Record<string, any> = {}) {
  const group: any = {
    data: {
      max: 0,
      size: "md",
      classes: {
        root: "inline-flex flex-row-reverse justify-end items-center",
        base: "relative rounded-full ring-bg ring-2 first:me-0 -me-1.5",
      },
      totalCount: 0,
      overflowCount: 0,
      ...data,
    },
    __codeUiAvatarChildren: [] as any[],
    setData(patch: Record<string, any>) {
      Object.assign(this.data, patch);
    },
  };
  return group;
}

function createAvatar(data: Record<string, any> = {}) {
  const avatar: any = {
    data: {
      groupAttached: false,
      groupHidden: false,
      groupOrder: 0,
      groupZIndex: 0,
      groupIsEdge: false,
      groupSize: "",
      groupBaseClass: "",
      isGroupCounter: false,
      ...data,
    },
    setData: vi.fn(function (this: any, patch: Record<string, any>) {
      Object.assign(this.data, patch);
    }),
  };
  return avatar;
}

describe("avatar-group behavior (@code-ui/miniapp)", () => {
  it("configures relations for parent and child correctly", () => {
    const parentRels: Record<string, any> = {};
    setupAvatarGroupRelations(parentRels, "parent");
    expect(parentRels.cuiAvatarChild).toBeDefined();
    expect(parentRels.cuiAvatarChild.type).toBe("descendant");

    const childRels: Record<string, any> = {};
    setupAvatarGroupRelations(childRels, "child");
    expect(childRels.cuiAvatarGroupParent).toBeDefined();
    expect(childRels.cuiAvatarGroupParent.type).toBe("ancestor");
  });

  it("links children and propagates group styles, order, and z-index", () => {
    const group = createGroup({ size: "lg" });
    const avatar1 = createAvatar();
    const avatar2 = createAvatar();

    linkAvatarItemToParentGroup(group, avatar1);
    linkAvatarItemToParentGroup(group, avatar2);

    expect(group.data.totalCount).toBe(2);
    expect(group.data.overflowCount).toBe(0);

    expect(avatar1.data.groupAttached).toBe(true);
    expect(avatar1.data.groupHidden).toBe(false);
    expect(avatar1.data.groupOrder).toBe(2);
    expect(avatar1.data.groupZIndex).toBe(2);
    expect(avatar1.data.groupIsEdge).toBe(false);
    expect(avatar1.data.groupSize).toBe("lg");
    expect(avatar1.data.groupBaseClass).toContain("ring-bg ring-2");

    expect(avatar2.data.groupAttached).toBe(true);
    expect(avatar2.data.groupHidden).toBe(false);
    expect(avatar2.data.groupOrder).toBe(1);
    expect(avatar2.data.groupZIndex).toBe(1);
    expect(avatar2.data.groupIsEdge).toBe(true);
    expect(avatar2.data.groupSize).toBe("lg");
  });

  it("handles max constraint and calculates overflowCount correctly", () => {
    const group = createGroup({ max: 2 });
    const avatar1 = createAvatar();
    const avatar2 = createAvatar();
    const avatar3 = createAvatar();
    const avatar4 = createAvatar();

    linkAvatarItemToParentGroup(group, avatar1);
    linkAvatarItemToParentGroup(group, avatar2);
    linkAvatarItemToParentGroup(group, avatar3);
    linkAvatarItemToParentGroup(group, avatar4);

    expect(group.data.totalCount).toBe(4);
    expect(group.data.overflowCount).toBe(2); // 4 - 2 = 2

    expect(avatar1.data.groupHidden).toBe(false);
    expect(avatar2.data.groupHidden).toBe(false);
    expect(avatar3.data.groupHidden).toBe(true);
    expect(avatar4.data.groupHidden).toBe(true);
  });

  it("unlinks avatar and updates count and visibility", () => {
    const group = createGroup({ max: 2 });
    const avatar1 = createAvatar();
    const avatar2 = createAvatar();
    const avatar3 = createAvatar();

    linkAvatarItemToParentGroup(group, avatar1);
    linkAvatarItemToParentGroup(group, avatar2);
    linkAvatarItemToParentGroup(group, avatar3);

    expect(group.data.overflowCount).toBe(1);
    expect(avatar3.data.groupHidden).toBe(true);

    unlinkAvatarItemFromParentGroup(group, avatar2);

    expect(group.data.totalCount).toBe(2);
    expect(group.data.overflowCount).toBe(0);
    expect(avatar3.data.groupHidden).toBe(false);

    // Unlinked avatar should have its group state reset
    expect(avatar2.data.groupAttached).toBe(false);
    expect(avatar2.data.groupHidden).toBe(false);
    expect(avatar2.data.groupOrder).toBe(0);
    expect(avatar2.data.groupZIndex).toBe(0);
  });

  it("ignores counter avatar from child registration and counting", () => {
    const group = createGroup({ max: 2 });
    const avatar1 = createAvatar();
    const counterAvatar = createAvatar({ isGroupCounter: true });

    linkAvatarItemToParentGroup(group, avatar1);
    linkAvatarItemToParentGroup(group, counterAvatar);

    expect(group.data.totalCount).toBe(1);
    expect(group.data.overflowCount).toBe(0);
    expect(group.__codeUiAvatarChildren).not.toContain(counterAvatar);
  });

  it("re-syncs children when max or size dynamically changes", () => {
    const group = createGroup({ max: 0, size: "md" });
    const avatar1 = createAvatar();
    const avatar2 = createAvatar();
    const avatar3 = createAvatar();

    linkAvatarItemToParentGroup(group, avatar1);
    linkAvatarItemToParentGroup(group, avatar2);
    linkAvatarItemToParentGroup(group, avatar3);

    expect(group.data.overflowCount).toBe(0);
    expect(avatar3.data.groupHidden).toBe(false);

    // Dynamically limit to max 1
    group.data.max = 1;
    group.data.size = "xl";
    syncAvatarGroupChildren(group);

    expect(group.data.overflowCount).toBe(2);
    expect(avatar1.data.groupHidden).toBe(false);
    expect(avatar2.data.groupHidden).toBe(true);
    expect(avatar3.data.groupHidden).toBe(true);
    expect(avatar1.data.groupSize).toBe("xl");
  });
});
