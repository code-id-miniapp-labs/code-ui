# FileUpload (`c-file-upload`)

## Overview & Tier

- **Purpose**: A WeChat MiniProgram file upload component supporting a configurable dropzone or compact trigger button, native WeChat file/media selection (`auto`, `media`, `messageFile`), validation (`maxFiles`, `maxSize`, `minSize`, `accept`), list or grid file previews, upload progress bars, file removal, and form field integration.
- **Architecture Tier**: **Tier 3 (Domain / Form Relations)** — backed by the `@code-ui/file-upload` FSM (`createMachineBehavior` with `exportApi: true`) and integrated with `@code-ui/miniapp/behaviors/form` (`withFormField()`), alongside `computedBehavior` and `createComponentOptions` from `../_shared/base`.
- **Compound Relationships**: Standalone component (not a parent/child compound group); renders internal `<c-icon>` and `<c-progress>` components and optionally registers with a parent `<c-form>` / `<c-form-field>` via `withFormField()`.

## Props

> Note: The component defines `className` (rather than `class`) as its root class override prop in `index.ts`.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `FileUploadFile[] \| null` | `null` | Controlled list of uploaded/selected files. |
| `defaultValue` | `FileUploadFile[]` | `[]` | Initial uncontrolled list of files. |
| `name` | `string` | `""` | Form field name for registration with `<c-form>`. |
| `form` | `string` | `""` | Target `<c-form>` id or name. |
| `formContext` | `FormHostContext \| null` | `undefined` | Explicit reactive form host context. |
| `invalid` | `boolean \| null` | `null` | Marks the component as invalid (`null` defers to form validation state). |
| `disabled` | `boolean` | `false` | Disables file selection, previewing, and removal. |
| `readOnly` | `boolean` | `false` | Prevents adding or removing files while keeping previews interactive. |
| `multiple` | `boolean` | `true` | Allows selecting multiple files in a single pick. |
| `maxFiles` | `number` | `10` | Maximum number of files allowed; hides the dropzone/trigger when reached. |
| `maxSize` | `number` | `Infinity` | Maximum allowed file size in bytes. |
| `minSize` | `number` | `0` | Minimum allowed file size in bytes. |
| `accept` | `string \| string[]` | `""` | Accepted MIME types or file extensions (e.g. `"image/*"`, `[".jpg", ".png"]`). |
| `mode` | `"auto" \| "media" \| "messageFile"` | `"auto"` | WeChat file selection mode. |
| `sourceType` | `Array<"album" \| "camera">` | `["album", "camera"]` | Allowed media sources when picking media. |
| `mediaType` | `Array<"image" \| "video">` | `["image", "video"]` | Allowed media types when picking media. |
| `sizeType` | `Array<"original" \| "compressed">` | `["original", "compressed"]` | Image quality options for media selection. |
| `camera` | `"back" \| "front"` | `"back"` | Default camera facing direction for media capture. |
| `maxDuration` | `number` | `60` | Maximum video recording duration in seconds. |
| `interactive` | `boolean` | `true` | Whether tapping the dropzone triggers file selection. |
| `uploading` | `boolean` | `false` | Displays loading indicator and progress bar state. |
| `progress` | `number \| null` | `null` | Overall upload progress percentage (`0`–`100`) or `null` (overridden per file by `file.progress`). |
| `dropzone` | `boolean` | `true` | Renders a full dropzone when `true`, or a compact button-like trigger when `false`. |
| `layout` | `"list" \| "grid"` | `"list"` | Layout for the selected file list. |
| `title` | `string` | `""` | Primary heading text inside the dropzone. |
| `label` | `string` | `""` | Fallback heading text used when `title` is empty. |
| `description` | `string` | `""` | Helper text displayed below the title inside the dropzone. |
| `icon` | `string` | `"upload"` | Leading icon name in the dropzone. |
| `loadingIcon` | `string` | `"loading"` | Icon name shown when `uploading` is `true`. |
| `deleteIcon` | `string` | `"close"` | Icon name for the per-file remove button (hidden when empty). |
| `fileIcon` | `string` | `"file"` | Fallback icon name for generic files. |
| `imageIcon` | `string` | `"image"` | Fallback icon name for images without a valid thumbnail. |
| `videoIcon` | `string` | `"video"` | Icon name for video files when no thumbnail is shown. |
| `audioIcon` | `string` | `"audio"` | Icon name for audio files. |
| `color` | `"primary" \| "neutral" \| "danger" \| "success" \| "warning" \| "info"` | `"primary"` | Theme color applied to focus and hover borders and progress bars. |
| `size` | `"sm" \| "md" \| "lg" \| "xl" \| ""` | `""` | Component size (falls back to form `fieldSize` or `"md"` when empty). |
| `variant` | `"outline" \| "soft" \| "subtle" \| "none"` | `"outline"` | Visual style variant for the dropzone and file items. |
| `ui` | `FileUploadUI` (`Record<string, string>`) | `{}` | Per-slot CSS class overrides. |
| `className` | `string` | `""` | Additional CSS class(es) applied to the `root` slot (serves the `class` role). |

### Exported API Methods

Because `exportApi: true` is enabled on the component behavior, callers accessing the component instance API have access to:
- `chooseFiles(): Promise<void>`
- `addFiles(files: unknown[]): void`
- `removeFile(idOrIndex: string | number): void`
- `previewFile(idOrIndex: string | number): void`
- `clearFiles(): void`
- `setFiles(files: FileUploadFile[]): void`

## Slots

All slots follow WeChat MiniProgram static `<slot>` constraints (no scoped slots; no nested default fallback markup inside `<slot>`). Conditional fallbacks are controlled via `wx:if` / `wx:else` and the component `slots` declaration map:

| Slot | Behavior & Conditional Fallback |
| --- | --- |
| `(default)` | Replaces the entire inner content of the dropzone when provided (`slots.default` is truthy). When `dropzone` is `false` and the default slot is used, a minimal clickable wrapper (`data-part="dropzone"` without dropzone styling) wraps `<slot />`. Hidden automatically once `maxFiles` is reached. |
| `icon` | Rendered in place of the default `<c-icon name="{{icon}}" />` when `slots.icon` is enabled and not in loading state. Ignored if the default slot is used. |
| `loadingIcon` | Rendered in place of `<c-icon name="{{loadingIcon}}" />` while `uploading` is `true` and `slots.loadingIcon` is enabled. Ignored if the default slot is used. |
| `title` | Rendered only when both `title` and `label` props are empty (`wx:else`). Ignored if the default slot is used. |
| `description` | Rendered only when the `description` prop is empty (`wx:else`). Ignored if the default slot is used. |

> Note: File items in `fileList` are rendered internally via `wx:for` and do not expose custom item slots due to MiniProgram static `<slot>` limitations.

## Events

Machine callbacks from `FileUploadProps` map to MiniProgram `bind:*` component events with the following `e.detail` payloads:

| Event / Callback | `detail` Payload | Description |
| --- | --- | --- |
| `bind:change` (`onChange`) | `{ value: FileUploadFile[] }` | Fired when the file list changes (files added, removed, cleared, or updated). |
| `bind:accept` (`onAccept`) | `{ files: FileUploadFile[] }` | Fired with newly accepted files after validation passes. |
| `bind:reject` (`onReject`) | `{ files: Array<{ file: Partial<FileUploadFile>; reason: "size-too-large" \| "size-too-small" \| "type-not-allowed" \| "max-files-exceeded" }> }` | Fired when one or more picked files fail validation. |
| `bind:remove` (`onRemove`) | `{ file: FileUploadFile; index: number }` | Fired when a file is removed. |
| `bind:preview` (`onPreview`) | `{ file: FileUploadFile; index: number }` | Fired when a file leading thumbnail or content area is tapped to preview. |
| `bind:fileClick` (`onFileClick`) | `{ file: FileUploadFile; index: number }` | Fired when a file item container is tapped. |

## Theme

Defined in `packages/core/src/theme/definitions/file-upload.ts`:

- **Slots**:
  `root`, `dropzone`, `icon`, `iconInner`, `loadingIcon`, `content`, `title`, `description`, `fileList`, `file`, `fileLeading`, `fileImage`, `fileContent`, `fileName`, `fileSize`, `fileTrailing`, `fileIcon`, `fileRemove`, `fileRemoveIcon`, `fileProgress`
- **Variants**:
  - `color`: theme colors (`DEFAULT_THEME_COLORS`) and `"neutral"` (focus ring/border colors; compound variants add hover/active border colors when `disabled: false` and `invalid: false`)
  - `variant`: `"outline"`, `"soft"`, `"subtle"`, `"none"`
  - `size`: `"sm"`, `"md"`, `"lg"`, `"xl"`
  - `layout`: `"list"`, `"grid"`
  - `dropzone`: `true`, `false` (compound variant applies inline button styling when `dropzone: false`)
  - `disabled`: `true`
  - `invalid`: `true`
- **Default Variants**:
  - `color`: `"primary"`
  - `variant`: `"outline"`
  - `size`: `"md"`
  - `layout`: `"list"`
  - `disabled`: `false`
  - `invalid`: `false`

## Examples

### Basic Dropzone & Grid Layout (WXML)

```xml
<c-file-upload
  title="Upload images"
  description="PNG, JPG up to 5MB"
  accept="image/*"
  layout="grid"
  maxFiles="{{4}}"
  maxSize="{{5242880}}"
  value="{{files}}"
  uploading="{{isUploading}}"
  bind:change="onFilesChange"
  bind:reject="onFilesReject"
/>
```

### Compact Trigger with Custom Slot (WXML)

```xml
<c-file-upload
  dropzone="{{false}}"
  mode="messageFile"
  value="{{files}}"
  ui="{{ { fileList: 'mt-2' } }}"
  className="my-upload"
  bind:change="onFilesChange"
>
  <c-button variant="soft" size="sm">Choose Document</c-button>
</c-file-upload>
```

### Page Controller (TypeScript)

```ts
Page({
  data: {
    files: [] as Array<{ id: string; name: string; size: number; path?: string }>,
    isUploading: false,
  },

  onFilesChange(e: WechatMiniprogram.CustomEvent<{ value: any[] }>) {
    this.setData({ files: e.detail.value });
  },

  onFilesReject(e: WechatMiniprogram.CustomEvent<{ files: Array<{ reason: string }> }>) {
    const reasons = e.detail.files.map((item) => item.reason).join(", ");
    wx.showToast({ title: `Rejected: ${reasons}`, icon: "none" });
  },
});
```
