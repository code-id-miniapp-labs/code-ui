import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withFormField } from "@code-ui/miniapp/behaviors/form";
import { resolveSlots } from "../../utils/ui";
import {
  fileUploadMachine,
  connectFileUpload,
  defaultFileUploadProps,
  stopActiveAudio,
} from "@code-ui/file-upload";
import themeConfig from "virtual:cui/theme/file-upload";
import { tv } from "../../utils/variants";

const fileUploadTheme = tv(themeConfig);

const fileUploadBehavior = createMachineBehavior({
  machine: fileUploadMachine,
  connect: connectFileUpload,
  key: "fileUpload",
  plugins: [withFormField()],
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [fileUploadBehavior, computedBehavior],

    properties: createProperties(defaultFileUploadProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    lifetimes: {
      detached() {
        stopActiveAudio();
      },
    },

    computed: {
      classes() {
        const api = this.data.fileUpload;
        const themeFns = fileUploadTheme({
          variant: this.data.variant,
          color: this.data.color,
          size: this.data.size || "md",
          layout: this.data.layout || "list",
          invalid: Boolean(api?.invalid ?? this.data.invalid),
          disabled: Boolean(api?.disabled ?? this.data.disabled),
        });
        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },

      dropzoneAriaLabel() {
        const api = this.data.fileUpload;
        const maxFiles = this.data.maxFiles ?? 10;
        const count = api?.fileCount ?? 0;
        if (api?.isMaxFiles) {
          return `Maximum ${maxFiles} files uploaded`;
        }
        return `Upload files, ${count} of ${maxFiles} files selected`;
      },
    },

    methods: {
      async handleDropzoneTap(e: WechatMiniprogram.CustomEvent) {
        return getApi(this, "fileUpload")?.handleDropzoneTap?.(e);
      },

      handleRemove(e: WechatMiniprogram.CustomEvent) {
        return getApi(this, "fileUpload")?.handleRemove?.(e);
      },

      handlePreview(e: WechatMiniprogram.CustomEvent) {
        return getApi(this, "fileUpload")?.handlePreview?.(e);
      },

      handleFileClick(e: WechatMiniprogram.CustomEvent) {
        return getApi(this, "fileUpload")?.handleFileClick?.(e);
      },
    },
  }),
);
