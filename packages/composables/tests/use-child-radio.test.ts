import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { radioGroupMachine, connectRadioGroup } from "@code-ui/radio-group";
import { radioMachine, connectRadio } from "@code-ui/radio";
import { useChild } from "../src/use-child";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("useChild with radio-group", () => {
  it("reproduces: empty -> option1 -> option2 -> clear", async () => {
    const groupComp: any = {
      setData: vi.fn((data: any) => {
        // WeChat MiniProgram property observer fires when setData modifies a property
        for (const [k, v] of Object.entries(data)) {
          groupMachine.updateProps({ [k]: v });
        }
      }),
    };

    // Create mock radio group component
    const groupMachine = new MiniappMachine(radioGroupMachine, {
      component: groupComp,
      defaultValue: null,
    });
    groupMachine.start();

    const groupService = groupMachine.service;
    const bus = groupService.refs.get("bus");

    // Create 2 child radios
    const radio1Comp: any = {
      setData: vi.fn(),
    };
    const radio1 = new MiniappMachine(radioMachine, {
      component: radio1Comp,
      value: "opt1",
      groupBus: bus,
    });
    radio1.start();

    const radio2Comp: any = {
      setData: vi.fn(),
    };
    const radio2 = new MiniappMachine(radioMachine, {
      component: radio2Comp,
      value: "opt2",
      groupBus: bus,
    });
    radio2.start();

    const snapshots: any[] = [];
    groupComp.__codeUiMachine = groupMachine;
    groupComp.__codeUiApi = connectRadioGroup(groupService);
    groupComp.getMachine = () => groupMachine;
    groupComp.getService = () => groupService;

    groupMachine.subscribe(() => {
      groupComp.__codeUiApi = connectRadioGroup(groupService);
    });

    const parent = {
      data: {} as Record<string, any>,
      setData: vi.fn(function (this: any, delta: Record<string, any>) {
        Object.assign(this.data, delta);
      }),
      selectComponent: vi.fn(() => groupComp),
    };

    const child = useChild(parent as any, "#group", {
      key: "group",
      onChange: (s) => {
        snapshots.push(s.value);
      },
    });
    await flush();

    expect(child.snapshot?.value).toBe(null);
    expect(child.api.value).toBe(null);
    expect(connectRadio(radio1.service).checked).toBe(false);
    expect(connectRadio(radio2.service).checked).toBe(false);

    // 1. User taps Option 1
    connectRadio(radio1.service).handleTap();
    await flush();
    expect(child.snapshot?.value).toBe("opt1");
    expect(connectRadio(radio1.service).checked).toBe(true);
    expect(connectRadio(radio2.service).checked).toBe(false);

    // 2. User taps Option 2
    connectRadio(radio2.service).handleTap();
    await flush();
    expect(child.snapshot?.value).toBe("opt2");
    expect(connectRadio(radio1.service).checked).toBe(false);
    expect(connectRadio(radio2.service).checked).toBe(true);

    // 3. Clear via programmatic control
    child.api.clear();
    await flush();

    console.log("Snapshots recorded during sequence:", snapshots);
    console.log("Current child.snapshot.value:", child.snapshot?.value);
    console.log("Radio 1 checked:", connectRadio(radio1.service).checked);
    console.log("Radio 2 checked:", connectRadio(radio2.service).checked);

    expect(child.snapshot?.value).toBe(null);
    expect(child.api.value).toBe(null);
    expect(connectRadio(radio1.service).checked).toBe(false);
    expect(connectRadio(radio2.service).checked).toBe(false);
  });
});
