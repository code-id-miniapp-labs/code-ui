import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { formMachine, connectForm } from "@code-ui/form";
import { checkboxMachine, connectCheckbox } from "@code-ui/checkbox";
import { checkboxGroupMachine } from "../src/checkbox-group.machine";
import { connectCheckboxGroup } from "../src/checkbox-group.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("CheckboxGroup Machine", () => {
  const sampleItems = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "cherry", label: "Cherry" },
  ];

  describe("Initialization & Default Props", () => {
    it("initializes with empty array by default", () => {
      const machine = new MiniappMachine(checkboxGroupMachine, {
        items: sampleItems,
      });
      machine.start();

      expect(machine.state.get()).toBe("idle");
      expect(machine.context.get("value")).toEqual([]);
      expect(machine.computed("isInteractive")).toBe(true);

      const api = connectCheckboxGroup(machine.service);
      expect(api.value).toEqual([]);
      expect(api.disabled).toBe(false);
      expect(api.readOnly).toBe(false);
      expect(api.invalid).toBe(false);
      expect(api.size).toBe("md");
      expect(api.color).toBe("primary");
      expect(api.orientation).toBe("vertical");
      expect(api.variant).toBe("outline");
      expect(api.items).toHaveLength(3);
      expect(api.items[0]?.checked).toBe(false);
      expect(api.items[0]?.controlProps["aria-checked"]).toBe(false);

      machine.stop();
    });

    it("initializes with defaultValue", () => {
      const machine = new MiniappMachine(checkboxGroupMachine, {
        defaultValue: ["banana"],
        items: sampleItems,
      });
      machine.start();

      const api = connectCheckboxGroup(machine.service);
      expect(api.value).toEqual(["banana"]);
      expect(api.items[0]?.checked).toBe(false);
      expect(api.items[1]?.checked).toBe(true);
      expect(api.items[1]?.controlProps["aria-checked"]).toBe(true);
      expect(api.items[2]?.checked).toBe(false);

      machine.stop();
    });
  });

  describe("Toggling & Item Operations", () => {
    it("toggles items via toggleValue", async () => {
      const machine = new MiniappMachine(checkboxGroupMachine, {
        defaultValue: ["apple"],
        items: sampleItems,
      });
      machine.start();

      const api = connectCheckboxGroup(machine.service);
      expect(api.value).toEqual(["apple"]);

      // Add banana
      api.toggleValue("banana");
      await flush();
      expect(connectCheckboxGroup(machine.service).value).toEqual([
        "apple",
        "banana",
      ]);

      // Remove apple
      api.toggleValue("apple");
      await flush();
      expect(connectCheckboxGroup(machine.service).value).toEqual(["banana"]);

      machine.stop();
    });

    it("toggles items via handleItemTap", async () => {
      const machine = new MiniappMachine(checkboxGroupMachine, {
        items: sampleItems,
      });
      machine.start();

      const api = connectCheckboxGroup(machine.service);
      api.handleItemTap({ currentTarget: { dataset: { value: "cherry" } } });
      await flush();

      expect(connectCheckboxGroup(machine.service).value).toEqual(["cherry"]);

      // Also support custom event from child c-checkbox (e.detail.value)
      api.handleItemTap({ detail: { value: "banana", checked: true } });
      await flush();

      expect(connectCheckboxGroup(machine.service).value).toEqual([
        "cherry",
        "banana",
      ]);

      // Ignore boolean e.detail.value (should not add "true")
      api.handleItemTap({ detail: { value: true, checked: true } });
      await flush();

      expect(connectCheckboxGroup(machine.service).value).toEqual([
        "cherry",
        "banana",
      ]);

      machine.stop();
    });

    it("selects all items and clears selections", async () => {
      const machine = new MiniappMachine(checkboxGroupMachine, {
        items: sampleItems,
      });
      machine.start();

      const api = connectCheckboxGroup(machine.service);
      api.selectAll();
      await flush();

      expect(connectCheckboxGroup(machine.service).value).toEqual([
        "apple",
        "banana",
        "cherry",
      ]);

      api.clear();
      await flush();

      expect(connectCheckboxGroup(machine.service).value).toEqual([]);

      machine.stop();
    });

    it("respects min and max limits", async () => {
      const machine = new MiniappMachine(checkboxGroupMachine, {
        defaultValue: ["apple"],
        min: 1,
        max: 2,
        items: sampleItems,
      });
      machine.start();

      const api = connectCheckboxGroup(machine.service);

      // Cannot remove apple because min is 1
      api.toggleValue("apple");
      await flush();
      expect(connectCheckboxGroup(machine.service).value).toEqual(["apple"]);

      // Can add banana -> length 2 (max reached)
      api.toggleValue("banana");
      await flush();
      expect(connectCheckboxGroup(machine.service).value).toEqual([
        "apple",
        "banana",
      ]);

      // Cannot add cherry because max is 2
      api.toggleValue("cherry");
      await flush();
      expect(connectCheckboxGroup(machine.service).value).toEqual([
        "apple",
        "banana",
      ]);

      // clear() does nothing when min is 1
      api.clear();
      await flush();
      expect(connectCheckboxGroup(machine.service).value).toEqual([
        "apple",
        "banana",
      ]);

      machine.stop();
    });

    it("enforces min and max when child controlled checkboxes trigger change", async () => {
      // Simulate c-checkbox-group with auto-rendered items and controlled value
      let pageGroupValue = ["apple"];

      const groupMachine = new MiniappMachine(checkboxGroupMachine, {
        value: pageGroupValue,
        min: 1,
        max: 2,
        items: sampleItems,
        onChange: ({ value }: { value: string[] }) => {
          pageGroupValue = value;
          groupMachine.updateProps({ value });
        },
      });
      groupMachine.start();

      let groupApi = connectCheckboxGroup(groupMachine.service);

      // Child 1: Apple (initially checked)
      const appleMachine = new MiniappMachine(checkboxMachine, {
        value: "apple",
        checked: groupApi.items[0]?.checked,
        onChange: ({ value, checked }: any) => {
          groupApi.handleItemTap({ detail: { value, checked } });
        },
      });
      appleMachine.start();

      // Child 2: Banana (initially unchecked)
      const bananaMachine = new MiniappMachine(checkboxMachine, {
        value: "banana",
        checked: groupApi.items[1]?.checked,
        onChange: ({ value, checked }: any) => {
          groupApi.handleItemTap({ detail: { value, checked } });
        },
      });
      bananaMachine.start();

      // Child 3: Cherry (initially unchecked)
      const cherryMachine = new MiniappMachine(checkboxMachine, {
        value: "cherry",
        checked: groupApi.items[2]?.checked,
        onChange: ({ value, checked }: any) => {
          groupApi.handleItemTap({ detail: { value, checked } });
        },
      });
      cherryMachine.start();

      // 1. Deselecting below min (1): Tap Apple to uncheck
      const appleApi = connectCheckbox(appleMachine.service);
      expect(appleApi.checked).toBe(true);
      appleApi.handleTap();
      await flush();

      // Group rejected deselecting below min=1:
      expect(pageGroupValue).toEqual(["apple"]);
      // Apple must stay checked!
      expect(connectCheckbox(appleMachine.service).checked).toBe(true);
      expect(appleMachine.state.get()).toBe("checked");

      // 2. Select Banana (valid: count goes from 1 to 2)
      const bananaApi = connectCheckbox(bananaMachine.service);
      expect(bananaApi.checked).toBe(false);
      bananaApi.handleTap();
      await flush();

      // Group accepted:
      expect(pageGroupValue).toEqual(["apple", "banana"]);
      // Synchronize props to child machines (as WXML binding does):
      groupApi = connectCheckboxGroup(groupMachine.service);
      bananaMachine.updateProps({ checked: groupApi.items[1]?.checked });
      await flush();
      expect(connectCheckbox(bananaMachine.service).checked).toBe(true);
      expect(bananaMachine.state.get()).toBe("checked");

      // 3. Exceeding max (2): Tap Cherry to check 3rd item
      const cherryApi = connectCheckbox(cherryMachine.service);
      expect(cherryApi.checked).toBe(false);
      cherryApi.handleTap();
      await flush();

      // Group rejected exceeding max=2:
      expect(pageGroupValue).toEqual(["apple", "banana"]);
      // Cherry must NOT be checked!
      expect(connectCheckbox(cherryMachine.service).checked).toBe(false);
      expect(cherryMachine.state.get()).toBe("unchecked");

      appleMachine.stop();
      bananaMachine.stop();
      cherryMachine.stop();
      groupMachine.stop();
    });

    it("does not toggle when disabled or readOnly", async () => {
      const disabledMachine = new MiniappMachine(checkboxGroupMachine, {
        disabled: true,
        defaultValue: ["apple"],
        items: sampleItems,
      });
      disabledMachine.start();

      const disabledApi = connectCheckboxGroup(disabledMachine.service);
      expect(disabledApi.isInteractive).toBe(false);
      disabledApi.toggleValue("banana");
      await flush();
      expect(connectCheckboxGroup(disabledMachine.service).value).toEqual([
        "apple",
      ]);
      disabledMachine.stop();

      const readOnlyMachine = new MiniappMachine(checkboxGroupMachine, {
        readOnly: true,
        defaultValue: ["apple"],
        items: sampleItems,
      });
      readOnlyMachine.start();

      const readOnlyApi = connectCheckboxGroup(readOnlyMachine.service);
      expect(readOnlyApi.isInteractive).toBe(false);
      readOnlyApi.toggleValue("banana");
      await flush();
      expect(connectCheckboxGroup(readOnlyMachine.service).value).toEqual([
        "apple",
      ]);
      readOnlyMachine.stop();
    });
  });

  describe("Callbacks & Events", () => {
    it("fires onValueChange and onChange", async () => {
      const onValueChange = vi.fn();
      const onChange = vi.fn();

      const machine = new MiniappMachine(checkboxGroupMachine, {
        onValueChange,
        onChange,
        items: sampleItems,
      });
      machine.start();

      const api = connectCheckboxGroup(machine.service);
      api.toggleValue("banana");
      await flush();

      expect(onValueChange).toHaveBeenCalledWith({ value: ["banana"] });
      expect(onChange).toHaveBeenCalledWith({ value: ["banana"] });

      machine.stop();
    });

    it("resets to initial value via resetValue()", async () => {
      const machine = new MiniappMachine(checkboxGroupMachine, {
        defaultValue: ["apple"],
        items: sampleItems,
      });
      machine.start();

      const api = connectCheckboxGroup(machine.service);
      api.toggleValue("banana");
      await flush();
      expect(connectCheckboxGroup(machine.service).value).toEqual([
        "apple",
        "banana",
      ]);

      machine.send({ type: "RESET_VALUE" });
      await flush();
      expect(connectCheckboxGroup(machine.service).value).toEqual(["apple"]);

      machine.stop();
    });
  });

  describe("Child Checkbox Bus Coordination", () => {
    it("coordinates with descendant Checkbox via groupBus", async () => {
      const groupMachine = new MiniappMachine(checkboxGroupMachine, {
        defaultValue: ["opt1"],
      });
      groupMachine.start();

      const groupBus = groupMachine.service.refs.get("bus");
      expect(groupBus).toBeDefined();

      const child1 = new MiniappMachine(checkboxMachine, {
        value: "opt1",
        groupBus,
        groupValue: ["opt1"],
      });
      child1.start();

      const child2 = new MiniappMachine(checkboxMachine, {
        value: "opt2",
        groupBus,
        groupValue: ["opt1"],
      });
      child2.start();

      let c1Api = connectCheckbox(child1.service);
      let c2Api = connectCheckbox(child2.service);

      expect(c1Api.checked).toBe(true);
      expect(child1.state.get()).toBe("checked");
      expect(c2Api.checked).toBe(false);
      expect(child2.state.get()).toBe("unchecked");

      // User taps child2 -> emits checkbox:toggle to groupBus
      c2Api.toggle();
      await flush();

      // Group should now have both opt1 and opt2
      const gApi = connectCheckboxGroup(groupMachine.service);
      expect(gApi.value).toEqual(["opt1", "opt2"]);

      c1Api = connectCheckbox(child1.service);
      c2Api = connectCheckbox(child2.service);
      expect(c1Api.checked).toBe(true);
      expect(c2Api.checked).toBe(true);
      expect(child2.state.get()).toBe("checked");

      // User taps child1 -> unchecks opt1
      c1Api.toggle();
      await flush();

      expect(connectCheckboxGroup(groupMachine.service).value).toEqual([
        "opt2",
      ]);
      expect(connectCheckbox(child1.service).checked).toBe(false);
      expect(child1.state.get()).toBe("unchecked");
      expect(connectCheckbox(child2.service).checked).toBe(true);

      child1.stop();
      child2.stop();
      groupMachine.stop();
    });
  });

  describe("Form Integration", () => {
    it("synchronizes with Form bus and validates", async () => {
      const formComp = { setData: vi.fn(), triggerEvent: vi.fn() };
      const groupComp = {
        setData: vi.fn(),
        triggerEvent: vi.fn(),
        selectOwnerComponent: () => formComp,
      };

      const formM = new MiniappMachine(formMachine, {
        component: formComp,
        rules: {
          skills: [
            (val: string[]) =>
              Array.isArray(val) && val.length >= 2
                ? true
                : "Select at least 2 skills",
          ],
        },
      });
      formM.start();

      const formApi = connectForm(formM.service);
      const bus = formApi.bus;

      const groupM = new MiniappMachine(checkboxGroupMachine, {
        name: "skills",
        defaultValue: ["js"],
        formBus: bus,
        component: groupComp,
        items: ["js", "ts", "python"],
      });
      groupM.start();
      await flush();

      let gApi = connectCheckboxGroup(groupM.service);
      expect(gApi.value).toEqual(["js"]);
      expect(gApi.invalid).toBe(false);

      // Validate form -> should fail because only 1 skill is selected
      const result = await formApi.validate();
      await flush();

      expect(result.valid).toBe(false);
      gApi = connectCheckboxGroup(groupM.service);
      expect(gApi.invalid).toBe(true);

      // User selects 'ts' -> now 2 skills selected
      gApi.toggleValue("ts");
      await flush();

      const revalidated = await formApi.validate();
      expect(revalidated.valid).toBe(true);

      groupM.stop();
      formM.stop();
    });

    it("validates controlled checkbox-group and child checkboxes on toggle with declarative minLength rule", async () => {
      let formInterests: string[] = [];
      const formComp = { setData: vi.fn(), triggerEvent: vi.fn() };

      const formM = new MiniappMachine(formMachine, {
        component: formComp,
      });
      formM.start();

      const formApi = connectForm(formM.service);
      const formBus = formApi.bus;

      // Simulate WXML-serialized declarative minLength rule from c-form-field
      const serializedRules = JSON.parse(
        JSON.stringify([
          {
            minLength: 2,
            message: "Please choose at least 2 areas of interest",
          },
        ]),
      );
      formBus?.emit("field:rules", {
        name: "interests",
        getRules: () => serializedRules,
        required: true,
      });

      const groupComp = {
        setData: vi.fn(),
        triggerEvent: vi.fn((eventName: string, detail: any) => {
          if (eventName === "change") {
            formInterests = detail.value ?? [];
            groupM.updateProps({ value: formInterests });
          }
        }),
        selectOwnerComponent: () => formComp,
      };

      const groupM = new MiniappMachine(checkboxGroupMachine, {
        name: "interests",
        value: formInterests,
        formBus,
        component: groupComp,
      });
      groupM.start();

      const groupBus = groupM.service.refs.get("bus");

      // Child checkboxes inside c-checkbox-group also receive formBus from c-form relations,
      // but have no name prop and must NOT register as standalone form fields
      const aiCheckbox = new MiniappMachine(checkboxMachine, {
        value: "ai",
        groupBus,
        groupValue: formInterests,
        formBus,
      });
      aiCheckbox.start();

      const webCheckbox = new MiniappMachine(checkboxMachine, {
        value: "web",
        groupBus,
        groupValue: formInterests,
        formBus,
      });
      webCheckbox.start();

      await flush();

      // Only "interests" should be registered in the form
      expect(Object.keys(connectForm(formM.service).fieldStates)).toEqual([
        "interests",
      ]);

      // 1. User taps "ai" child checkbox (1 selected < minLength 2 -> invalid)
      connectCheckbox(aiCheckbox.service).handleTap();
      await flush();

      expect(formInterests).toEqual(["ai"]);
      expect(connectCheckbox(aiCheckbox.service).checked).toBe(true);
      expect(connectCheckbox(webCheckbox.service).checked).toBe(false);
      expect(connectCheckboxGroup(groupM.service).invalid).toBe(true);
      expect(connectCheckbox(aiCheckbox.service).invalid).toBe(true);
      expect(connectCheckbox(webCheckbox.service).invalid).toBe(true);
      expect(connectForm(formM.service).errorBag).toEqual({
        interests: ["Please choose at least 2 areas of interest"],
      });

      // 2. User taps "web" child checkbox (2 selected >= minLength 2 -> valid!)
      connectCheckbox(webCheckbox.service).handleTap();
      await flush();

      expect(formInterests).toEqual(["ai", "web"]);
      expect(connectCheckbox(aiCheckbox.service).checked).toBe(true);
      expect(connectCheckbox(webCheckbox.service).checked).toBe(true);
      expect(connectCheckboxGroup(groupM.service).invalid).toBe(false);
      expect(connectCheckbox(aiCheckbox.service).invalid).toBe(false);
      expect(connectCheckbox(webCheckbox.service).invalid).toBe(false);
      expect(connectForm(formM.service).isValid).toBe(true);
      expect(connectForm(formM.service).errorBag).toEqual({});

      // 3. User unchecks "web" child checkbox (back to 1 selected -> invalid)
      connectCheckbox(webCheckbox.service).handleTap();
      await flush();

      expect(formInterests).toEqual(["ai"]);
      expect(connectCheckbox(aiCheckbox.service).checked).toBe(true);
      expect(connectCheckbox(webCheckbox.service).checked).toBe(false);
      expect(connectCheckboxGroup(groupM.service).invalid).toBe(true);
      expect(connectCheckbox(aiCheckbox.service).invalid).toBe(true);
      expect(connectCheckbox(webCheckbox.service).invalid).toBe(true);

      aiCheckbox.stop();
      webCheckbox.stop();
      groupM.stop();
      formM.stop();
    });
  });
});
