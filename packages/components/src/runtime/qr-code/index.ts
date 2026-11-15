import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { resolveSlots } from "../../utils/ui";
import {
  qrCodeMachine,
  connectQrCode,
  defaultQrCodeProps,
  type QrCodeApi,
  type QrCodeEncodingOptions,
} from "@code-ui/qr-code";
import themeConfig from "virtual:cui/theme/qr-code";
import { tv } from "../../utils/variants";

const qrCodeTheme = tv(themeConfig);

const qrCodeBehavior = createMachineBehavior({
  machine: qrCodeMachine,
  connect: connectQrCode,
  key: "qrCode",
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [qrCodeBehavior, computedBehavior],
    slots: {
      overlay: false,
    },

    properties: createProperties(defaultQrCodeProps, {
      className: {
        type: String,
        value: "",
      },
      rootStyle: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const themeFns = qrCodeTheme({
          size: this.data.size,
          color: this.data.color,
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      setValue(value: string) {
        const api = getApi<QrCodeApi>(this, "qrCode");
        api?.setValue(value);
      },

      setEncoding(encoding: QrCodeEncodingOptions) {
        const api = getApi<QrCodeApi>(this, "qrCode");
        api?.setEncoding(encoding);
      },

      getDataUrl(type: "svg" = "svg"): string {
        const api = getApi<QrCodeApi>(this, "qrCode");
        return api?.getDataUrl(type) ?? "";
      },
    },
  }),
);
