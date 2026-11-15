import type { MiniAppBaseEventLike } from "@code-ui/utils";
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
    slots: {
      default: false,
      icon: false,
      loadingIcon: false,
      title: false,
      description: false,
    },

    properties: createProperties(defaultFileUploadProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.fileUpload;
        const themeFns = fileUploadTheme({
          variant: this.data.variant,
          color: this.data.color,
          size: this.data.size || "md",
          layout: this.data.layout,
          invalid: Boolean(api?.invalid ?? this.data.invalid),
          disabled: Boolean(api?.disabled ?? this.data.disabled),
        });
        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      handleDropzoneTap(e: MiniAppBaseEventLike) {
        return getApi(this, "fileUpload")?.handleDropzoneTap(e);
      },

      handleRemove(e: MiniAppBaseEventLike<{ index: number }>) {
        getApi(this, "fileUpload")?.handleRemove(e);
      },

      handlePreview(e: MiniAppBaseEventLike<{ index: number }>) {
        getApi(this, "fileUpload")?.handlePreview(e);
      },

      handleFileClick(e: MiniAppBaseEventLike<{ index: number }>) {
        getApi(this, "fileUpload")?.handleFileClick(e);
      },

      handleImageError(e: MiniAppBaseEventLike<{ index: number }>) {
        getApi(this, "fileUpload")?.handleImageError(e);
      },
    },
  }),
);
