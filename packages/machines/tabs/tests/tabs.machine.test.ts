import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { tabsMachine, connectTabs } from "../src";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Tabs Machine", () => {
  describe("Initialization & Default Props", () => {
    it("initializes with default props", () => {
      const machine = new MiniappMachine(tabsMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("idle");
      const api = connectTabs(machine.service);

      expect(api.value).toBe("");
      expect(api.selectedIndex).toBe(-1);
      expect(api.disabled).toBe(false);
      expect(api.activeTriggerId).toBe("");
      expect(api.items).toEqual([]);

      machine.stop();
    });

    it("initializes with string items and selects first enabled item", () => {
      const machine = new MiniappMachine(tabsMachine, {
        items: ["Account", "Password", "Settings"],
      });
      machine.start();

      const api = connectTabs(machine.service);
      expect(api.value).toBe("Account");
      expect(api.selectedIndex).toBe(0);
      expect(api.items.length).toBe(3);
      expect(api.items[0]?.isSelected).toBe(true);
      expect(api.items[1]?.isSelected).toBe(false);
      expect(api.items[0]?.label).toBe("Account");
      expect(api.items[0]?.value).toBe("Account");

      machine.stop();
    });

    it("respects defaultValue", () => {
      const machine = new MiniappMachine(tabsMachine, {
        defaultValue: "password",
        items: [
          { label: "Account", value: "account" },
          { label: "Password", value: "password" },
        ],
      });
      machine.start();

      const api = connectTabs(machine.service);
      expect(api.value).toBe("password");
      expect(api.selectedIndex).toBe(1);
      expect(api.items[1]?.isSelected).toBe(true);

      machine.stop();
    });

    it("skips disabled item when defaulting active tab", () => {
      const machine = new MiniappMachine(tabsMachine, {
        items: [
          { label: "Tab 1", value: "tab1", disabled: true },
          { label: "Tab 2", value: "tab2" },
        ],
      });
      machine.start();

      const api = connectTabs(machine.service);
      expect(api.value).toBe("tab2");
      expect(api.selectedIndex).toBe(1);

      machine.stop();
    });
  });

  describe("Selection & Change Events", () => {
    it("selects tab and fires onChange", async () => {
      const onChange = vi.fn();
      const machine = new MiniappMachine(tabsMachine, {
        items: [
          { label: "Account", value: "account" },
          { label: "Password", value: "password" },
        ],
        onChange,
      });
      machine.start();

      let api = connectTabs(machine.service);
      api.select("password");
      await flush();

      api = connectTabs(machine.service);
      expect(api.value).toBe("password");
      expect(api.selectedIndex).toBe(1);
      expect(onChange).toHaveBeenCalledWith({
        value: "password",
        index: 1,
      });

      machine.stop();
    });

    it("does not select disabled tab via select", async () => {
      const onChange = vi.fn();
      const machine = new MiniappMachine(tabsMachine, {
        defaultValue: "account",
        items: [
          { label: "Account", value: "account" },
          { label: "Disabled Tab", value: "disabled", disabled: true },
        ],
        onChange,
      });
      machine.start();

      let api = connectTabs(machine.service);
      api.select("disabled");
      await flush();

      api = connectTabs(machine.service);
      expect(api.value).toBe("account");
      expect(onChange).not.toHaveBeenCalled();

      machine.stop();
    });

    it("does not select tab when root is disabled", async () => {
      const onChange = vi.fn();
      const machine = new MiniappMachine(tabsMachine, {
        disabled: true,
        defaultValue: "account",
        items: [
          { label: "Account", value: "account" },
          { label: "Password", value: "password" },
        ],
        onChange,
      });
      machine.start();

      let api = connectTabs(machine.service);
      api.select("password");
      await flush();

      api = connectTabs(machine.service);
      expect(api.value).toBe("account");
      expect(onChange).not.toHaveBeenCalled();

      machine.stop();
    });
  });

  describe("Controlled Value", () => {
    it("syncs controlled value updates", async () => {
      const machine = new MiniappMachine(tabsMachine, {
        value: "account",
        items: [
          { label: "Account", value: "account" },
          { label: "Password", value: "password" },
        ],
      });
      machine.start();

      let api = connectTabs(machine.service);
      expect(api.value).toBe("account");

      machine.updateProps({ value: "password" });
      await flush();

      api = connectTabs(machine.service);
      expect(api.value).toBe("password");
      expect(api.selectedIndex).toBe(1);

      machine.stop();
    });

    it("exposes the controlled value through the group context", async () => {
      const machine = new MiniappMachine(tabsMachine, {
        value: "account",
        childItems: [
          { label: "Account", value: "account" },
          { label: "Security", value: "security" },
        ],
      });
      machine.start();

      const group = machine.service.refs.get("groupContext");
      expect(group.value()).toBe("account");

      machine.updateProps({ value: "security" });
      await flush();

      expect(group.value()).toBe("security");

      machine.stop();
    });
  });

  describe("Group Context", () => {
    it("exposes live getters and dispatches selection intents", async () => {
      const machine = new MiniappMachine(tabsMachine, {
        orientation: "vertical",
        variant: "link",
        color: "danger",
        size: "lg",
        fitted: true,
        items: ["Tab 1", "Tab 2"],
      });
      machine.start();

      const group = machine.service.refs.get("groupContext");
      expect(group.value()).toBe("Tab 1");
      expect(group.orientation()).toBe("vertical");
      expect(group.variant()).toBe("link");
      expect(group.color()).toBe("danger");
      expect(group.size()).toBe("lg");
      expect(group.fitted()).toBe(true);

      group.select("Tab 2");
      await flush();
      expect(group.value()).toBe("Tab 2");

      group.previous();
      await flush();
      expect(group.value()).toBe("Tab 1");

      group.last();
      await flush();
      expect(group.value()).toBe("Tab 2");

      machine.stop();
    });
  });

  describe("Navigation (Next, Prev, First, Last)", () => {
    it("navigates with selectNext and selectPrev", async () => {
      const machine = new MiniappMachine(tabsMachine, {
        items: ["Tab 1", "Tab 2", "Tab 3"],
      });
      machine.start();

      let api = connectTabs(machine.service);
      expect(api.value).toBe("Tab 1");

      api.selectNext();
      await flush();
      api = connectTabs(machine.service);
      expect(api.value).toBe("Tab 2");

      api.selectNext();
      await flush();
      api = connectTabs(machine.service);
      expect(api.value).toBe("Tab 3");

      // Loop to start
      api.selectNext();
      await flush();
      api = connectTabs(machine.service);
      expect(api.value).toBe("Tab 1");

      // Loop to end with selectPrev
      api.selectPrev();
      await flush();
      api = connectTabs(machine.service);
      expect(api.value).toBe("Tab 3");

      machine.stop();
    });

    it("respects loopFocus=false", async () => {
      const machine = new MiniappMachine(tabsMachine, {
        loopFocus: false,
        defaultValue: "Tab 2",
        items: ["Tab 1", "Tab 2"],
      });
      machine.start();

      let api = connectTabs(machine.service);
      api.selectNext();
      await flush();
      api = connectTabs(machine.service);
      expect(api.value).toBe("Tab 2");

      api.selectFirst();
      await flush();
      api = connectTabs(machine.service);
      expect(api.value).toBe("Tab 1");

      api.selectPrev();
      await flush();
      api = connectTabs(machine.service);
      expect(api.value).toBe("Tab 1");

      api.selectLast();
      await flush();
      api = connectTabs(machine.service);
      expect(api.value).toBe("Tab 2");

      machine.stop();
    });

    it("skips disabled tabs during navigation", async () => {
      const machine = new MiniappMachine(tabsMachine, {
        items: [
          { label: "Tab 1", value: "tab1" },
          { label: "Tab 2", value: "tab2", disabled: true },
          { label: "Tab 3", value: "tab3" },
        ],
      });
      machine.start();

      let api = connectTabs(machine.service);
      expect(api.value).toBe("tab1");

      api.selectNext();
      await flush();
      api = connectTabs(machine.service);
      expect(api.value).toBe("tab3");

      api.selectPrev();
      await flush();
      api = connectTabs(machine.service);
      expect(api.value).toBe("tab1");

      machine.stop();
    });
  });

  describe("Focus & Activation Modes", () => {
    it("automatically selects on focus when activationMode='automatic'", async () => {
      const machine = new MiniappMachine(tabsMachine, {
        items: ["Tab 1", "Tab 2"],
        activationMode: "automatic",
      });
      machine.start();

      let api = connectTabs(machine.service);
      api.setFocus("Tab 2");
      await flush();

      expect(machine.state.get()).toBe("focused");
      api = connectTabs(machine.service);
      expect(api.focusedValue).toBe("Tab 2");
      expect(api.value).toBe("Tab 2");

      api.clearFocus();
      await flush();
      expect(machine.state.get()).toBe("idle");
      api = connectTabs(machine.service);
      expect(api.focusedValue).toBeNull();

      machine.stop();
    });

    it("does not select on focus when activationMode='manual'", async () => {
      const machine = new MiniappMachine(tabsMachine, {
        items: ["Tab 1", "Tab 2"],
        activationMode: "manual",
      });
      machine.start();

      let api = connectTabs(machine.service);
      api.setFocus("Tab 2");
      await flush();

      expect(machine.state.get()).toBe("focused");
      api = connectTabs(machine.service);
      expect(api.focusedValue).toBe("Tab 2");
      expect(api.value).toBe("Tab 1");

      machine.stop();
    });
  });

  describe("DOM Props & Attributes", () => {
    it("generates correct DOM props for triggers and content", () => {
      const machine = new MiniappMachine(tabsMachine, {
        id: "demo",
        items: [
          { label: "Account", value: "account", icon: "user", content: "Account info" },
          { label: "Security", value: "security" },
        ],
      });
      machine.start();

      const api = connectTabs(machine.service);

      expect(api.rootProps.id).toBe("tb-demo-r");
      expect(api.rootProps["data-orientation"]).toBe("horizontal");

      expect(api.listProps["aria-role"]).toBe("tablist");
      expect(api.listProps["aria-orientation"]).toBe("horizontal");

      const item0 = api.items[0];
      expect(item0).toBeDefined();
      expect(item0?.isSelected).toBe(true);
      expect(item0?.triggerProps["aria-role"]).toBe("tab");
      expect(item0?.triggerProps["aria-selected"]).toBe(true);
      expect(item0?.triggerProps["data-state"]).toBe("active");
      expect(item0?.triggerProps["aria-controls"]).toBe("tb-demo-c-account");
      expect(item0?.contentProps["aria-role"]).toBe("tabpanel");
      expect(item0?.contentProps["hidden"]).toBe(false);

      const item1 = api.items[1];
      expect(item1).toBeDefined();
      expect(item1?.isSelected).toBe(false);
      expect(item1?.triggerProps["aria-selected"]).toBe(false);
      expect(item1?.triggerProps["data-state"]).toBe("inactive");
      expect(item1?.contentProps["hidden"]).toBe(true);

      machine.stop();
    });

    it("updates activeTriggerId and scroll-into-view when selecting tabs", async () => {
      const machine = new MiniappMachine(tabsMachine, {
        id: "demo",
        items: ["Tab 1", "Tab 2", "Tab 3", "Tab 4"],
      });
      machine.start();

      let api = connectTabs(machine.service);
      expect(api.activeTriggerId).toBe("tb-demo-tr-Tab 1");
      expect(api.listProps["scroll-into-view"]).toBe("tb-demo-tr-Tab 1");

      api.select("Tab 3");
      await flush();

      api = connectTabs(machine.service);
      expect(api.selectedIndex).toBe(2);
      expect(api.activeTriggerId).toBe("tb-demo-tr-Tab 3");
      expect(api.listProps["scroll-into-view"]).toBe("tb-demo-tr-Tab 3");

      api.select("Tab 1");
      await flush();

      api = connectTabs(machine.service);
      expect(api.activeTriggerId).toBe("tb-demo-tr-Tab 1");
      expect(api.listProps["scroll-into-view"]).toBe("tb-demo-tr-Tab 1");

      machine.stop();
    });
  });
});
