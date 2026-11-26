import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-id-labs/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-id-labs/core";
import type {
  BoundFormField,
  FormHostContext,
  FormRule,
  FormValidateOn,
} from "@code-id-labs/form";
import type { MiniAppComponent } from "@code-id-labs/utils";
import type { anatomy } from "./file-upload.anatomy";

export type FileUploadState = "idle" | "choosing" | "uploading";
export type FileUploadVariant = "outline" | "soft" | "subtle" | "none";
export type FileUploadColor =
  | "primary"
  | "neutral"
  | "danger"
  | "success"
  | "warning"
  | "info";
export type FileUploadSize = "sm" | "md" | "lg" | "xl";
export type FileUploadLayout = "list" | "grid";
export type FileUploadMode = "auto" | "media" | "messageFile";
export type FileUploadPreviewMode = "overlay" | "native";
export type FileUploadSourceType = "album" | "camera";
export type FileUploadMediaType = "image" | "video";

export type FileUploadAnatomyPart = AnatomyPartName<typeof anatomy>;
export type FileUploadUI = ComponentUI<typeof anatomy>;
export type FileUploadResolvedUI = ResolvedUI<typeof anatomy>;

export interface FileUploadFile {
  id: string;
  name: string;
  size: number;
  type?: string | undefined;
  path?: string | undefined;
  thumb?: string | undefined;
  status?: "idle" | "uploading" | "success" | "error" | undefined;
  progress?: number | null | undefined;
  error?: string | undefined;
  duration?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  [key: string]: any;
}

export type FileUploadRejectReason =
  | "size-too-large"
  | "size-too-small"
  | "type-not-allowed"
  | "max-files-exceeded";

export interface FileUploadRejectedFile {
  file: Partial<FileUploadFile>;
  reason: FileUploadRejectReason;
}

export interface FileUploadChangeDetails {
  value: FileUploadFile[];
}

export interface FileUploadProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, any> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Field-level validation rules */
  rules?: FormRule[] | undefined;
  /** Optional explicit reactive form host */
  formContext?: FormHostContext | null | undefined;
  /** Optional target `<c-form>` id/name */
  form?: string | undefined;
  /** Form field name for registration */
  name?: string | undefined;
  /** Field-level override for Form validation triggers */
  validateOn?: FormValidateOn | undefined;
  /** Whether the field is currently invalid */
  invalid?: boolean | null | undefined;
  /** Form field wrapper disabled state */
  fieldDisabled?: boolean | undefined;
  /** Controlled files array */
  value?: FileUploadFile[] | null | undefined;
  /** Default files array */
  defaultValue?: FileUploadFile[] | undefined;
  /** Whether the component is disabled */
  disabled?: boolean | undefined;
  /** Whether the component is read-only */
  readOnly?: boolean | undefined;
  /** Whether selecting multiple files is allowed */
  multiple?: boolean | undefined;
  /** Maximum number of files */
  maxFiles?: number | undefined;
  /** Maximum file size in bytes */
  maxSize?: number | undefined;
  /** Minimum file size in bytes */
  minSize?: number | undefined;
  /** Accepted file MIME types or extensions (e.g. "image/*", [".jpg", ".png"]) */
  accept?: string | string[] | undefined;
  /** Selection mode: auto, media, messageFile */
  mode?: FileUploadMode | undefined;
  /** Image preview mode: built-in fullscreen overlay or native wx.previewImage/previewMedia */
  previewMode?: FileUploadPreviewMode | undefined;
  /** Source type for media picking */
  sourceType?: FileUploadSourceType[] | undefined;
  /** Media type for media picking */
  mediaType?: FileUploadMediaType[] | undefined;
  /** Size type: original or compressed */
  sizeType?: Array<"original" | "compressed"> | undefined;
  /** Camera mode for media picking */
  camera?: "back" | "front" | undefined;
  /** Maximum duration for video in seconds */
  maxDuration?: number | undefined;
  /** Whether the dropzone is clickable */
  interactive?: boolean | undefined;
  /** Whether component is in uploading state */
  uploading?: boolean | undefined;
  /** Overall upload progress percentage (0-100) or null */
  progress?: number | null | undefined;
  /** Value change callback */
  onChange?: ((details: FileUploadChangeDetails) => void) | undefined;
  /** Files accepted callback */
  onAccept?: ((details: { files: FileUploadFile[] }) => void) | undefined;
  /** Files rejected callback */
  onReject?:
    | ((details: { files: FileUploadRejectedFile[] }) => void)
    | undefined;
  /** File removed callback */
  onRemove?:
    | ((details: { file: FileUploadFile; index: number }) => void)
    | undefined;
  /** File preview callback */
  onPreview?:
    | ((details: { file: FileUploadFile; index: number }) => void)
    | undefined;
  /** File clicked callback */
  onFileClick?:
    | ((details: { file: FileUploadFile; index: number }) => void)
    | undefined;
}

export interface FileUploadContext {
  files: FileUploadFile[];
  invalid: boolean;
  failedThumbs: string[];
  resolvedSources: Record<string, string>;
  previewOpen: boolean;
  previewIndex: number;
}

export interface FileUploadComputed {
  isInvalid: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  isInteractive: boolean;
  isMaxFiles: boolean;
  hasFiles: boolean;
  fileCount: number;
  isUploading: boolean;
  formDisabled: boolean;
  formReadOnly: boolean;
  fieldDisabled: boolean;
}

export interface FileUploadRefs {
  initialFiles: FileUploadFile[];
  formField?: BoundFormField | undefined;
  chooseDone?: (() => void) | undefined;
  resolvingPaths: Set<string>;
  actionSheetTimer?: ReturnType<typeof setTimeout> | undefined;
  disposed: boolean;
}

export type FileUploadAction =
  | "setValue"
  | "addFiles"
  | "ingestPickedFiles"
  | "removeFile"
  | "clearFiles"
  | "previewFile"
  | "closePreview"
  | "setPreviewIndex"
  | "clickFile"
  | "markImageError"
  | "setUploading"
  | "setChooseCallback"
  | "flushChooseCallback"
  | "resolveChooseFromEvent"
  | "setupFormField"
  | "cleanupFormField"
  | "cleanupAudio"
  | "markDisposed";

export type FileUploadGuard =
  | "isInteractive"
  | "canChoose"
  | "canAddFiles"
  | "isUploadingTrue"
  | "isUploadingFalse";
export type FileUploadEffect = "pickWeChatFiles" | "hydrateLocalImages";

export type FileUploadEvent =
  | { type: "CHOOSE"; onDone?: (() => void) | undefined }
  | { type: "CHOOSE_COMPLETE" }
  | { type: "SET_VALUE"; value: FileUploadFile[] }
  | { type: "ADD_FILES"; files: FileUploadFile[] }
  | { type: "PICKED_RAW"; files: unknown[] }
  | {
      type: "REMOVE_FILE";
      index?: number | undefined;
      idOrIndex?: string | number | undefined;
    }
  | { type: "PREVIEW_FILE"; idOrIndex: string | number }
  | { type: "PREVIEW_CLOSE" }
  | { type: "PREVIEW_CHANGE"; index: number }
  | { type: "FILE_CLICK"; index: number }
  | { type: "IMAGE_ERROR"; index: number }
  | { type: "CLEAR_FILES" }
  | { type: "SET_UPLOADING"; uploading: boolean };

type FileUploadDefaultedKey =
  | "value"
  | "defaultValue"
  | "name"
  | "form"
  | "invalid"
  | "disabled"
  | "readOnly"
  | "multiple"
  | "maxFiles"
  | "maxSize"
  | "minSize"
  | "accept"
  | "mode"
  | "previewMode"
  | "sourceType"
  | "mediaType"
  | "sizeType"
  | "camera"
  | "maxDuration"
  | "interactive"
  | "uploading"
  | "progress";

export type FileUploadResolvedProps = Omit<
  FileUploadProps,
  FileUploadDefaultedKey
> & {
  [K in FileUploadDefaultedKey]-?: Exclude<FileUploadProps[K], undefined>;
};

export interface FileUploadSchema extends MachineSchema {
  state: FileUploadState;
  tag: "idle" | "busy";
  props: FileUploadResolvedProps;
  context: FileUploadContext;
  computed: FileUploadComputed;
  refs: FileUploadRefs;
  action: FileUploadAction;
  guard: FileUploadGuard;
  effect: FileUploadEffect;
  event: FileUploadEvent;
}

export type FileUploadService = Service<FileUploadSchema>;
export type FileUploadMachine = Machine<FileUploadSchema>;
export type FileUploadParams = Params<FileUploadSchema>;

export type FileUploadItemType = "image" | "video" | "audio" | "file";

export interface FileUploadItemView extends FileUploadFile {
  index: number;
  formattedSize: string;
  fileType: FileUploadItemType;
  thumbFailed: boolean;
  itemProps: Record<string, any>;
  removeProps: Record<string, any>;
  previewProps: Record<string, any>;
}

export interface FileUploadPreviewItem {
  id: string;
  name: string;
  formattedSize: string;
  src: string;
  fileIndex: number;
}

export interface FileUploadApi {
  state: FileUploadState;
  files: FileUploadItemView[];
  fileCount: number;
  hasFiles: boolean;
  isMaxFiles: boolean;
  isUploading: boolean;
  progress: number | null;
  disabled: boolean;
  readOnly: boolean;
  invalid: boolean;
  interactive: boolean;
  previewOpen: boolean;
  previewIndex: number;
  previewItems: FileUploadPreviewItem[];
  activePreviewItem: FileUploadPreviewItem | null;
  rootProps: Record<string, any>;
  dropzoneProps: Record<string, any>;
  fileListProps: Record<string, any>;
  chooseFiles: () => Promise<void>;
  handleDropzoneTap: () => Promise<void>;
  addFiles: (files: unknown[]) => void;
  removeFile: (idOrIndex: string | number) => void;
  handleRemove: (index: number) => void;
  previewFile: (idOrIndex: string | number) => void;
  closePreview: () => void;
  setPreviewIndex: (index: number) => void;
  handlePreview: (index: number) => void;
  handlePreviewClose: () => void;
  handlePreviewChange: (index: number) => void;
  handleFileClick: (index: number) => void;
  handleImageError: (index: number) => void;
  clearFiles: () => void;
  setFiles: (files: FileUploadFile[]) => void;
}
