---
title: FileUpload
description: File upload component supporting a configurable dropzone or compact trigger button, native WeChat file and media selection, validation, list or grid previews, upload progress bars, file removal, and form field integration.
---

## Overview

`c-file-upload` is a file upload component supporting a configurable dropzone or compact trigger button, native WeChat file/media selection (`auto`, `media`, `messageFile`), validation (`maxFiles`, `maxSize`, `minSize`, `accept`), list or grid previews, upload progress bars, file removal, and `<c-form>` / `<c-form-field>` integration. It renders internal `<c-icon>` and `<c-progress>` components.

::callout{type="info"}
`c-file-upload` uses `className` (rather than `class`) as its root CSS class override prop.
::

## Usage

### Basic

Use `c-file-upload` with `title` and `description` to render a standard file dropzone.

```html [index.wxml]
<c-file-upload
  title="Drop your files here"
  description="SVG, PNG, JPG or GIF (max. 2MB)"
/>
```

### Label & Description

Use `title` (or `label` as a fallback when `title` is empty) and `description` to customize the text displayed inside the dropzone.

```html [index.wxml]
<c-file-upload
  title="Upload documents"
  description="PDF or DOCX files up to 10MB"
/>

<c-file-upload
  label="Fallback label heading"
  description="Displayed when title is empty"
/>
```

### Dropzone

Set `dropzone="{{false}}"` to render a compact button-like trigger instead of a full dropzone area.

```html [index.wxml]
<c-file-upload
  dropzone="{{false}}"
  title="Upload file"
  icon="upload"
/>
```

### Layout

Use the `layout` prop to switch between `"list"` (default) and `"grid"` for displaying selected files.

```html [index.wxml]
<c-file-upload
  title="List layout"
  layout="list"
  defaultValue="{{files}}"
/>

<c-file-upload
  title="Grid layout"
  layout="grid"
  defaultValue="{{files}}"
/>
```

### Color

Use the `color` prop to change the focus ring, active border, and progress bar accent color (`"primary"`, `"neutral"`, `"danger"`, `"success"`, `"warning"`, or `"info"`).

```html [index.wxml]
<c-file-upload title="Primary" color="primary" />
<c-file-upload title="Neutral" color="neutral" />
<c-file-upload title="Success" color="success" />
<c-file-upload title="Warning" color="warning" />
<c-file-upload title="Danger" color="danger" />
<c-file-upload title="Info" color="info" />
```

### Variant

Use the `variant` prop to change the visual style of the dropzone and file items (`"outline"`, `"soft"`, `"subtle"`, or `"none"`).

```html [index.wxml]
<c-file-upload title="Outline" variant="outline" />
<c-file-upload title="Soft" variant="soft" />
<c-file-upload title="Subtle" variant="subtle" />
<c-file-upload title="None" variant="none" />
```

### Size

Use the `size` prop to adjust the padding, typography, icon sizing, and file item dimensions (`"sm"`, `"md"`, `"lg"`, or `"xl"`). When omitted (`""`), it inherits the parent form's `fieldSize` or falls back to `"md"`.

```html [index.wxml]
<c-file-upload title="Small" size="sm" />
<c-file-upload title="Medium" size="md" />
<c-file-upload title="Large" size="lg" />
<c-file-upload title="Extra Large" size="xl" />
```

### Icons

Customize the dropzone leading icon (`icon`), uploading spinner icon (`loadingIcon`), per-file remove icon (`deleteIcon`, set to `""` to hide), and fallback file-type icons (`fileIcon`, `imageIcon`, `videoIcon`, `audioIcon`).

```html [index.wxml]
<c-file-upload
  title="Upload media"
  icon="cloud-upload"
  loadingIcon="spinner"
  deleteIcon="trash"
  fileIcon="file-text"
  imageIcon="image"
  videoIcon="video"
  audioIcon="music"
/>
```

### Multiple & Validation

Control selection limits and file validation using `multiple`, `maxFiles`, `maxSize` (bytes), `minSize` (bytes), and `accept` (MIME type string or array of extensions/types). When `maxFiles` is reached, the dropzone/trigger hides automatically.

::code-group

```html [index.wxml]
<c-file-upload
  title="Upload images"
  description="Up to 4 images, 10KB – 5MB each"
  accept="{{ ['.jpg', '.jpeg', '.png'] }}"
  multiple="{{true}}"
  maxFiles="{{4}}"
  minSize="{{10240}}"
  maxSize="{{5242880}}"
  bind:reject="onFilesReject"
/>
```

```ts [index.ts]
Page({
  onFilesReject(
    e: WechatMiniprogram.CustomEvent<{
      files: Array<{
        file: { name?: string };
        reason: "size-too-large" | "size-too-small" | "type-not-allowed" | "max-files-exceeded";
      }>;
    }>,
  ) {
    const reasons = e.detail.files.map((item) => item.reason).join(", ");
    wx.showToast({ title: `Rejected: ${reasons}`, icon: "none" });
  },
});
```

::

### Selection Mode & Media Options

Configure native WeChat file picking with `mode` (`"auto"`, `"media"`, or `"messageFile"`). For media selection, refine behavior with `sourceType`, `mediaType`, `sizeType`, `camera`, and `maxDuration`.

```html [index.wxml]
<!-- Pick compressed photos from camera or album -->
<c-file-upload
  title="Take or choose a photo"
  mode="media"
  sourceType="{{ ['album', 'camera'] }}"
  mediaType="{{ ['image'] }}"
  sizeType="{{ ['compressed'] }}"
  camera="back"
/>

<!-- Record video up to 30 seconds -->
<c-file-upload
  title="Record a short video"
  mode="media"
  mediaType="{{ ['video'] }}"
  maxDuration="{{30}}"
/>

<!-- Pick documents from WeChat chat history -->
<c-file-upload
  title="Choose from WeChat files"
  mode="messageFile"
/>
```

### Preview Mode & Fullscreen Lightbox

By default (`previewMode="overlay"`), tapping an uploaded image opens a built-in fullscreen swipeable `<root-portal>` lightbox overlay with image counter, filename/size footer, and pinch-to-zoom / swipe navigation. Local temporary paths (`wxfile://`, `http://tmp/`) are automatically hydrated into base64 data URIs for cross-container preview rendering while keeping `file.path` intact for `wx.uploadFile`.

Set `previewMode="native"` to delegate image and video previews to WeChat's native `wx.previewMedia` / `wx.previewImage` instead, or `portal="{{false}}"` to render the built-in overlay inline without `<root-portal>`. Non-image documents (`pdf`, `doc`, `xls`, `ppt`, etc.) open via `wx.openDocument`.

```html [index.wxml]
<!-- Built-in fullscreen <root-portal> lightbox (default) -->
<c-file-upload
  title="Built-in overlay preview"
  previewMode="overlay"
  portal="{{true}}"
  accept="image/*"
/>

<!-- Native WeChat wx.previewMedia / wx.previewImage -->
<c-file-upload
  title="Native WeChat preview"
  previewMode="native"
  accept="image/*"
/>
```

### Uploading & Progress

Set `uploading="{{true}}"` to show the loading indicator and progress bars. Use `progress` for an overall percentage (`0`–`100`), or set `progress` per file item in `value` (which overrides the overall `progress`).

::code-group

```html [index.wxml]
<c-file-upload
  title="Uploading files..."
  value="{{files}}"
  uploading="{{isUploading}}"
  progress="{{overallProgress}}"
  bind:change="onFilesChange"
/>
```

```ts [index.ts]
Page({
  data: {
    isUploading: true,
    overallProgress: 45,
    files: [
      { id: "1", name: "report.pdf", size: 245760, progress: 80 },
      { id: "2", name: "cover.png", size: 102400 },
    ],
  },

  onFilesChange(e: WechatMiniprogram.CustomEvent<{ value: any[] }>) {
    this.setData({ files: e.detail.value });
  },
});
```

::

### Disabled, Read-Only & Interactive

- Use `disabled="{{true}}"` to disable file selection, previewing, and removal.
- Use `readOnly="{{true}}"` to prevent adding or removing files while keeping previews clickable.
- Use `interactive="{{false}}"` to prevent tapping the dropzone from opening the file picker.

```html [index.wxml]
<c-file-upload title="Disabled" disabled="{{true}}" />

<c-file-upload
  title="Read-only"
  readOnly="{{true}}"
  defaultValue="{{files}}"
/>

<c-file-upload title="Non-interactive dropzone" interactive="{{false}}" />
```

### Invalid

Use `invalid="{{true}}"` to apply error styling to the dropzone. Leave it as `null` (default) to defer to the parent `<c-form>` validation state.

```html [index.wxml]
<c-file-upload
  title="Upload ID card"
  description="A valid image file is required"
  invalid="{{true}}"
/>
```

### Controlled & Uncontrolled

Use `defaultValue` for uncontrolled state, or bind `value` with `bind:change` for controlled state.

::code-group

```html [index.wxml]
<!-- Uncontrolled -->
<c-file-upload
  title="Attachments"
  defaultValue="{{initialFiles}}"
/>

<!-- Controlled -->
<c-file-upload
  title="Controlled attachments"
  value="{{files}}"
  bind:change="onFilesChange"
/>
```

```ts [index.ts]
Page({
  data: {
    initialFiles: [{ id: "init-1", name: "notes.txt", size: 1024 }],
    files: [] as Array<{ id: string; name: string; size: number; path?: string }>,
  },

  onFilesChange(e: WechatMiniprogram.CustomEvent<{ value: any[] }>) {
    this.setData({ files: e.detail.value });
  },
});
```

::

### Form Integration

Wrap `<c-file-upload>` inside `<c-form-field>` within `<c-form>` to integrate with form state and validation. Configure `name`, `label`, `required`, and `rules` on `<c-form-field>`, and `validate-on` and `bind:submit` on `<c-form>`.

```html [index.wxml]
<c-form
  id="profile-form"
  validate-on="{{ validateOn }}"
  bind:submit="onSubmit"
>
  <c-form-field
    name="resume"
    label="Resume"
    required="{{true}}"
    rules="{{ resumeRules }}"
  >
    <c-file-upload
      accept=".pdf"
      maxFiles="{{1}}"
      title="Upload your resume"
      description="PDF up to 5MB"
    />
  </c-form-field>
</c-form>
```

### Slots

Customize parts of the dropzone using named slots (`icon`, `loadingIcon`, `title`, `description`) or replace the entire dropzone inner content with the default slot. `title` and `description` slots render only when their corresponding props are empty, and named slots are ignored when the default slot is used.

```html [index.wxml]
<!-- Named slots -->
<c-file-upload uploading="{{isUploading}}">
  <c-icon slot="icon" name="folder-plus" class="text-primary" />
  <c-icon slot="loadingIcon" name="loader" class="animate-spin text-primary" />
  <text slot="title" class="font-semibold">Custom title slot</text>
  <text slot="description" class="text-xs text-muted">Custom helper description</text>
</c-file-upload>

<!-- Default slot with compact trigger -->
<c-file-upload dropzone="{{false}}" mode="messageFile">
  <c-button variant="soft" size="sm">Choose Document</c-button>
</c-file-upload>
```

### Events

Listen to `bind:change`, `bind:accept`, `bind:reject`, `bind:remove`, `bind:preview`, and `bind:fileClick` to react to user interactions and validation results.

::code-group

```html [index.wxml]
<c-file-upload
  title="Upload files"
  value="{{files}}"
  bind:change="onChange"
  bind:accept="onAccept"
  bind:reject="onReject"
  bind:remove="onRemove"
  bind:preview="onPreview"
  bind:fileClick="onFileClick"
/>
```

```ts [index.ts]
Page({
  data: {
    files: [] as Array<{ id: string; name: string; size: number; path?: string }>,
  },

  onChange(e: WechatMiniprogram.CustomEvent<{ value: any[] }>) {
    this.setData({ files: e.detail.value });
  },

  onAccept(e: WechatMiniprogram.CustomEvent<{ files: any[] }>) {
    console.log("Accepted:", e.detail.files);
  },

  onReject(e: WechatMiniprogram.CustomEvent<{ files: Array<{ file: any; reason: string }> }>) {
    console.warn("Rejected:", e.detail.files);
  },

  onRemove(e: WechatMiniprogram.CustomEvent<{ file: any; index: number }>) {
    console.log("Removed:", e.detail.file, e.detail.index);
  },

  onPreview(e: WechatMiniprogram.CustomEvent<{ file: any; index: number }>) {
    console.log("Previewed:", e.detail.file, e.detail.index);
  },

  onFileClick(e: WechatMiniprogram.CustomEvent<{ file: any; index: number }>) {
    console.log("Clicked:", e.detail.file, e.detail.index);
  },
});
```

::

### Custom Styling

Override individual theme slots via `ui` or add root classes via `className`.

```html [index.wxml]
<c-file-upload
  title="Custom styled upload"
  className="mt-4"
  ui="{{ { dropzone: 'rounded-xl border-primary/50', fileList: 'mt-3', file: 'rounded-xl' } }}"
/>
```

### Instance API Methods

Callers accessing the component instance API have access to the following methods:

```ts
chooseFiles(): Promise<void>
addFiles(files: unknown[]): void
removeFile(idOrIndex: string | number): void
previewFile(idOrIndex: string | number): void
closePreview(): void
clearFiles(): void
setFiles(files: FileUploadFile[]): void
```

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `FileUploadFile[] \| null` | `null` | Controlled list of uploaded/selected files. |
| `defaultValue` | `FileUploadFile[]` | `[]` | Initial uncontrolled list of files. |
| `name` | `string` | `""` | Form field name for registration with `<c-form>`. |
| `form` | `string` | `""` | Target `<c-form>` id or name. |
| `formContext` | `FormHostContext \| null` | `undefined` | Explicit reactive form host context. |
| `invalid` | `boolean \| null` | `null` | Marks the component as invalid (`null` defers to form validation state). |
| `disabled` | `boolean` | `false` | Disables file selection, previewing, and removal. |
| `readOnly` | `boolean` | `false` | Prevents adding or removing files while keeping previews clickable. |
| `multiple` | `boolean` | `true` | Allows selecting multiple files in a single pick. |
| `maxFiles` | `number` | `10` | Maximum number of files allowed; hides the dropzone/trigger when reached. |
| `maxSize` | `number` | `Infinity` | Maximum allowed file size in bytes. |
| `minSize` | `number` | `0` | Minimum allowed file size in bytes. |
| `accept` | `string \| string[]` | `""` | Accepted MIME types or file extensions (e.g. `"image/*"`, `[".jpg", ".png"]`). |
| `mode` | `"auto" \| "media" \| "messageFile"` | `"auto"` | WeChat file selection mode. |
| `previewMode` | `"overlay" \| "native"` | `"overlay"` | Image preview behavior: `"overlay"` opens the built-in fullscreen swipeable `<root-portal>` lightbox; `"native"` delegates to `wx.previewMedia` / `wx.previewImage`. |
| `portal` | `boolean` | `true` | Renders the built-in fullscreen preview overlay inside WeChat `<root-portal>`. |
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

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Replaces the entire inner content of the dropzone. When `dropzone` is `false`, wraps the slot content in a minimal clickable trigger. Hidden automatically once `maxFiles` is reached. |
| `icon` | Custom leading icon rendered in place of the default `icon` when not in the uploading state. Ignored when the default slot is used. |
| `loadingIcon` | Custom loading indicator rendered in place of `loadingIcon` while `uploading` is `true`. Ignored when the default slot is used. |
| `title` | Custom heading content rendered when both `title` and `label` props are empty. Ignored when the default slot is used. |
| `description` | Custom helper text rendered when the `description` prop is empty. Ignored when the default slot is used. |

File items in `fileList` are rendered internally and do not expose custom item slots.

## Events

| Event | `detail` Payload | Description |
| --- | --- | --- |
| `bind:change` | `{ value: FileUploadFile[] }` | Fired when the file list changes (files added, removed, cleared, or updated). |
| `bind:accept` | `{ files: FileUploadFile[] }` | Fired with newly accepted files after validation passes. |
| `bind:reject` | `{ files: Array<{ file: Partial<FileUploadFile>; reason: "size-too-large" \| "size-too-small" \| "type-not-allowed" \| "max-files-exceeded" }> }` | Fired when one or more picked files fail validation. |
| `bind:remove` | `{ file: FileUploadFile; index: number }` | Fired when a file is removed. |
| `bind:preview` | `{ file: FileUploadFile; index: number }` | Fired when a file leading thumbnail or content area is tapped to preview. |
| `bind:fileClick` | `{ file: FileUploadFile; index: number }` | Fired when a file item container is tapped. |

## Theme

Customize the `file-upload` theme globally in your config or per instance via the `ui` prop.

```ts [cui.config.ts]
export default defineConfig({
  ui: {
    fileUpload: {
      slots: {
        root: "relative flex flex-col gap-3 w-full",
        dropzone:
          "relative flex flex-col items-center justify-center text-center border-2 border-dashed rounded-md transition-colors cursor-pointer select-none",
        icon: "text-dimmed mb-2 shrink-0 flex items-center justify-center",
        iconInner: "w-full h-full",
        loadingIcon: "w-full h-full animate-spin",
        content: "flex flex-col items-center justify-center gap-1",
        title: "font-medium text-highlighted",
        description: "text-muted",
        fileList: "flex flex-col gap-2 w-full",
        file: "relative flex items-center gap-3 p-3 rounded-md border border-default bg-default shadow-xs transition-colors",
        fileLeading:
          "relative flex items-center justify-center shrink-0 rounded-lg overflow-hidden bg-elevated",
        fileImage: "absolute inset-0 w-full h-full rounded-lg object-cover block",
        fileContent: "flex flex-col min-w-0 flex-1 text-left",
        fileName: "font-medium text-highlighted truncate",
        fileSize: "text-muted shrink-0",
        fileTrailing: "flex items-center shrink-0 ml-auto gap-1",
        fileIcon: "w-5 h-5 text-dimmed",
        fileRemove:
          "flex items-center justify-center rounded-lg text-dimmed hover:text-default transition-colors p-1",
        fileRemoveIcon: "w-4 h-4",
        fileProgress: "w-full mt-1.5",
        previewOverlay:
          "fixed inset-0 z-modal bg-black/95 flex flex-col select-none",
        previewHeader:
          "relative z-10 flex items-center justify-between px-4 pb-3 pt-[calc(var(--spacing)_*_3_+_env(safe-area-inset-top))] text-white shrink-0",
        previewCounter:
          "text-sm font-medium text-white/90 tabular-nums px-2.5 py-1 rounded-full bg-white/15",
        previewClose:
          "flex items-center justify-center w-9 h-9 rounded-full bg-white/15 text-white active:bg-white/25 transition-colors",
        previewCloseIcon: "w-5 h-5 text-white",
        previewSwiper: "flex-1 w-full h-0 min-h-0",
        previewSlide:
          "w-full h-full flex items-center justify-center px-3 box-border",
        previewImage: "w-full h-full block",
        previewFooter:
          "relative z-10 flex flex-col gap-0.5 px-4 pt-3 pb-[calc(var(--spacing)_*_4_+_env(safe-area-inset-bottom))] text-center shrink-0 bg-black/60",
        previewName: "text-sm font-medium text-white truncate",
        previewMeta: "text-xs text-white/70",
      },
      variants: {
        color: {
          primary: {
            dropzone: "focus:border-primary focus:ring-2 focus:ring-primary/20",
          },
          secondary: {
            dropzone: "focus:border-secondary focus:ring-2 focus:ring-secondary/20",
          },
          danger: {
            dropzone: "focus:border-danger focus:ring-2 focus:ring-danger/20",
          },
          success: {
            dropzone: "focus:border-success focus:ring-2 focus:ring-success/20",
          },
          warning: {
            dropzone: "focus:border-warning focus:ring-2 focus:ring-warning/20",
          },
          info: {
            dropzone: "focus:border-info focus:ring-2 focus:ring-info/20",
          },
          neutral: {
            dropzone:
              "focus:border-inverted focus:ring-2 focus:ring-inverted/20",
          },
        },
        variant: {
          outline: {
            dropzone: "border-default bg-muted hover:border-accented",
            file: "bg-default border-default",
          },
          soft: {
            dropzone: "border-transparent bg-elevated hover:bg-accented",
            file: "bg-elevated border-transparent",
          },
          subtle: {
            dropzone: "border-default bg-muted hover:bg-elevated",
            file: "bg-muted border-default",
          },
          none: {
            dropzone: "border-transparent bg-transparent",
            file: "bg-transparent border-transparent",
          },
        },
        size: {
          sm: {
            dropzone: "p-4 text-xs",
            icon: "w-6 h-6 text-xl",
            title: "text-xs font-medium",
            description: "text-2xs",
            file: "p-2 gap-2 text-xs",
            fileLeading: "w-8 h-8 text-xs",
            fileName: "text-xs",
            fileSize: "text-2xs",
            fileRemove: "w-5 h-5 text-xs",
          },
          md: {
            dropzone: "p-6 text-sm",
            icon: "w-8 h-8 text-2xl",
            title: "text-sm font-medium",
            description: "text-xs",
            file: "p-3 gap-3 text-sm",
            fileLeading: "w-10 h-10 text-sm",
            fileName: "text-sm",
            fileSize: "text-xs",
            fileRemove: "w-6 h-6 text-sm",
          },
          lg: {
            dropzone: "p-8 text-base",
            icon: "w-10 h-10 text-3xl",
            title: "text-base font-medium",
            description: "text-sm",
            file: "p-4 gap-3 text-base",
            fileLeading: "w-12 h-12 text-base",
            fileName: "text-base",
            fileSize: "text-xs",
            fileRemove: "w-7 h-7 text-base",
          },
          xl: {
            dropzone: "p-10 text-lg",
            icon: "w-12 h-12 text-4xl",
            title: "text-lg font-medium",
            description: "text-base",
            file: "p-5 gap-4 text-lg",
            fileLeading: "w-14 h-14 text-lg",
            fileName: "text-lg",
            fileSize: "text-sm",
            fileRemove: "w-8 h-8 text-lg",
          },
        },
        layout: {
          list: {
            fileList: "flex flex-col gap-2 w-full",
          },
          grid: {
            fileList: "grid grid-cols-2 gap-3 w-full",
            file: "relative flex flex-col p-2.5 rounded-md border border-default bg-default shadow-xs transition-colors overflow-hidden",
            fileLeading:
              "w-full h-24 aspect-video rounded-lg overflow-hidden bg-elevated shrink-0 relative flex items-center justify-center",
            fileTrailing:
              "absolute top-3.5 right-3.5 z-10 flex items-center gap-1",
            fileRemove:
              "flex items-center justify-center w-5 h-5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-xs",
            fileContent: "w-full pt-1.5 flex flex-col items-center min-w-0",
            fileName:
              "w-full text-center font-medium text-highlighted truncate text-xs",
            fileSize: "hidden",
            fileProgress: "w-full mt-1",
          },
        },
        dropzone: {
          true: {},
          false: {},
        },
        disabled: {
          true: {
            root: "opacity-60 pointer-events-none cursor-not-allowed",
            dropzone: "cursor-not-allowed bg-elevated border-default",
          },
        },
        invalid: {
          true: {
            dropzone: "border-danger bg-danger/5 text-danger",
          },
        },
      },
      compoundVariants: [
        {
          color: "primary",
          disabled: false,
          invalid: false,
          class: {
            dropzone: "hover:border-primary active:border-primary",
          },
        },
        {
          color: "secondary",
          disabled: false,
          invalid: false,
          class: {
            dropzone: "hover:border-secondary active:border-secondary",
          },
        },
        {
          color: "danger",
          disabled: false,
          invalid: false,
          class: {
            dropzone: "hover:border-danger active:border-danger",
          },
        },
        {
          color: "success",
          disabled: false,
          invalid: false,
          class: {
            dropzone: "hover:border-success active:border-success",
          },
        },
        {
          color: "warning",
          disabled: false,
          invalid: false,
          class: {
            dropzone: "hover:border-warning active:border-warning",
          },
        },
        {
          color: "info",
          disabled: false,
          invalid: false,
          class: {
            dropzone: "hover:border-info active:border-info",
          },
        },
        {
          color: "neutral",
          disabled: false,
          invalid: false,
          class: {
            dropzone: "hover:border-inverted active:border-inverted",
          },
        },
        {
          dropzone: false,
          class: {
            dropzone:
              "inline-flex flex-row items-center justify-center gap-2 border border-solid rounded-lg w-fit py-1.5 px-3",
            icon: "mb-0 w-4 h-4 text-base",
            content: "flex-row items-center gap-1.5",
          },
        },
      ],
      defaultVariants: {
        color: "primary",
        variant: "outline",
        size: "md",
        layout: "list",
        disabled: false,
        invalid: false,
      },
    },
  },
})
```
