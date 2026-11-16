import type { MiniAppBaseEventLike } from "@code-ui/utils";
import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withFormField } from "@code-ui/miniapp/behaviors/form";
import { useComponentIcons } from "../../utils/component-icons";
import { resolveSlots } from "../../utils/ui";
import {
  fileUploadMachine,
  connectFileUpload,
  defaultFileUploadProps,
  type FileUploadSize,
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
      dropzone: {
        type: Boolean,
        value: true,
      },
      layout: {
        type: String,
        value: "list",
      },
      title: {
        type: String,
        value: "",
      },
      label: {
        type: String,
        value: "",
      },
      description: {
        type: String,
        value: "",
      },
      icon: {
        type: String,
        value: "upload",
      },
      loadingIcon: {
        type: String,
        value: "loading",
      },
      deleteIcon: {
        type: String,
        value: "close",
      },
      fileIcon: {
        type: String,
        value: "file",
      },
      imageIcon: {
        type: String,
        value: "image",
      },
      videoIcon: {
        type: String,
        value: "video",
      },
      audioIcon: {
        type: String,
        value: "audio",
      },
      color: {
        type: String,
        value: "primary",
      },
      size: {
        type: String,
        value: "",
      },
      variant: {
        type: String,
        value: "outline",
      },
      ui: {
        type: Object,
        value: {},
      },
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      resolvedSize(): FileUploadSize {
        return (this.data.size || this.data.fieldSize || "md") as FileUploadSize;
      },

      icons() {
        return useComponentIcons({
          icon: this.data.icon,
          loading: Boolean(this.data.fileUpload?.isUploading),
          loadingIcon: this.data.loadingIcon,
          slots: this.data.slots,
        });
      },

      classes() {
        const api = this.data.fileUpload;
        const themeFns = fileUploadTheme({
          variant: this.data.variant,
          color: this.data.color,
          size: this.data.resolvedSize,
          layout: this.data.layout,
          dropzone: Boolean(this.data.dropzone),
          invalid: Boolean(api?.invalid),
          disabled: Boolean(api?.disabled),
        });
        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      handleDropzoneTap() {
        return getApi(this, "fileUpload")?.handleDropzoneTap();
      },

      handleRemove(e: MiniAppBaseEventLike<{ index?: number | string }>) {
        const raw = e?.currentTarget?.dataset?.index;
        const index = raw !== undefined ? Number(raw) : NaN;
        if (!Number.isNaN(index)) {
          getApi(this, "fileUpload")?.handleRemove(index);
        }
      },

      handlePreview(e: MiniAppBaseEventLike<{ index?: number | string }>) {
        const raw = e?.currentTarget?.dataset?.index;
        const index = raw !== undefined ? Number(raw) : NaN;
        if (!Number.isNaN(index)) {
          getApi(this, "fileUpload")?.handlePreview(index);
        }
      },

      handleFileClick(e: MiniAppBaseEventLike<{ index?: number | string }>) {
        const raw = e?.currentTarget?.dataset?.index;
        const index = raw !== undefined ? Number(raw) : NaN;
        if (!Number.isNaN(index)) {
          getApi(this, "fileUpload")?.handleFileClick(index);
        }
      },

      handleImageError(e: MiniAppBaseEventLike<{ index?: number | string }>) {
        const raw = e?.currentTarget?.dataset?.index;
        const index = raw !== undefined ? Number(raw) : NaN;
        if (!Number.isNaN(index)) {
          getApi(this, "fileUpload")?.handleImageError(index);
        }
      },
    },
  }),
);
