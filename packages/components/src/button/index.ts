import {
  createMachineBehavior,
  wxButtonBehavior,
  createProperties,
} from "../_shared/runtime";
import {
  buttonMachine,
  connectButton,
  defaultButtonProps,
} from "@code-ui/button";

const buttonBehavior = createMachineBehavior({
  machine: buttonMachine,
  connect: connectButton,
  key: "button",
  exportApi: true,
});

Component({
  behaviors: [buttonBehavior, wxButtonBehavior],

  options: {
    multipleSlots: true,
    addGlobalClass: true,
    styleIsolation: "apply-shared",
  },

  properties: createProperties(defaultButtonProps),

  methods: {
    handleTap(e: WechatMiniprogram.TouchEvent) {
      const buttonData = (this.data as any).button;
      if (buttonData?.disabled || buttonData?.loading) return;
      this.send({ type: "TAP", event: e });
    },
  },
});
