import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { fileUploadMachine } from "../src/file-upload.machine";
import {
  cleanExtensions,
  connectFileUpload,
  createFileTypeValidator,
  formatBytes,
  getFileExtension,
  getFileMimeType,
  getFileType,
  getTotalFileSize,
  isAudioFile,
  isDocumentFile,
  isImageFile,
  isValidFileSize,
  isValidFileType,
  isVideoFile,
  stopActiveAudio,
  validateFiles,
} from "../src";
import { defaultFileUploadProps } from "../src/file-upload.props";
import type { FileUploadFile } from "../src/file-upload.types";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("FileUpload Machine", () => {
  beforeEach(() => {
    (globalThis as any).wx = undefined;
  });

  afterEach(() => {
    (globalThis as any).wx = undefined;
  });

  describe("Initialization & Default Props", () => {
    it("initializes with default props (empty files, idle state)", () => {
      const machine = new MiniappMachine(fileUploadMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("idle");
      expect(machine.context.get("files")).toEqual([]);
      expect(machine.computed("hasFiles")).toBe(false);
      expect(machine.computed("fileCount")).toBe(0);
      expect(machine.computed("isMaxFiles")).toBe(false);
      expect(machine.computed("isUploading")).toBe(false);
      expect(machine.computed("isInteractive")).toBe(true);

      const api = connectFileUpload(machine.service);
      expect(api.state).toBe("idle");
      expect(api.files).toEqual([]);
      expect(api.fileCount).toBe(0);
      expect(api.hasFiles).toBe(false);
      expect(api.isMaxFiles).toBe(false);
      expect(api.isUploading).toBe(false);
      expect(api.progress).toBe(null);
      expect(api.disabled).toBe(false);
      expect(api.readOnly).toBe(false);
      expect(api.invalid).toBe(false);

      // ARIA compliance
      expect(api.rootProps["aria-role"]).toBe("group");
      expect(api.rootProps["aria-disabled"]).toBe(false);
      expect(api.rootProps["aria-invalid"]).toBe(false);
      expect(api.dropzoneProps["aria-role"]).toBe("button");
      expect(api.dropzoneProps["aria-disabled"]).toBe(false);
      expect(api.dropzoneProps["aria-busy"]).toBe(false);
      expect(api.dropzoneProps["aria-label"]).toContain("Upload files");
      expect(api.fileListProps["aria-role"]).toBe("list");

      machine.stop();
    });

    it("initializes with defaultValue", () => {
      const defaultFiles: FileUploadFile[] = [
        {
          id: "1",
          name: "test.png",
          size: 1024,
          path: "tmp/test.png",
          type: "image",
        },
      ];
      const machine = new MiniappMachine(fileUploadMachine, {
        defaultValue: defaultFiles,
      });
      machine.start();

      expect(machine.context.get("files").length).toBe(1);
      expect(machine.computed("hasFiles")).toBe(true);
      expect(machine.computed("fileCount")).toBe(1);

      const api = connectFileUpload(machine.service);
      expect(api.files.length).toBe(1);
      expect(api.files[0]?.name).toBe("test.png");
      expect(api.files[0]?.formattedSize).toBe("1 KB");
      expect(api.files[0]?.fileType).toBe("image");
      expect(api.files[0]?.itemProps["aria-role"]).toBe("listitem");
      expect(api.files[0]?.removeProps["aria-role"]).toBe("button");
      expect(api.files[0]?.removeProps["aria-label"]).toBe("Remove test.png");

      machine.stop();
    });

    it("handles progress prop and cascades to files without explicit progress", () => {
      const machine = new MiniappMachine(fileUploadMachine, {
        progress: 75,
        defaultValue: [
          {
            id: "1",
            name: "test1.png",
            size: 1024,
            type: "image",
          },
          {
            id: "2",
            name: "test2.png",
            size: 2048,
            type: "image",
            progress: 30,
          },
        ],
      });
      machine.start();

      const api = connectFileUpload(machine.service);
      expect(api.progress).toBe(75);
      expect(api.files[0]?.progress).toBe(75);
      expect(api.files[1]?.progress).toBe(30);

      machine.stop();
    });

    it("initializes in uploading state if uploading prop is true", () => {
      const machine = new MiniappMachine(fileUploadMachine, {
        uploading: true,
      });
      machine.start();

      expect(machine.state.get()).toBe("uploading");
      expect(machine.computed("isUploading")).toBe(true);

      const api = connectFileUpload(machine.service);
      expect(api.state).toBe("uploading");
      expect(api.isUploading).toBe(true);
      expect(api.dropzoneProps["aria-busy"]).toBe(true);

      machine.stop();
    });
  });

  describe("Controlled Value & Props", () => {
    it("syncs controlled value updates", async () => {
      const initial: FileUploadFile[] = [
        { id: "1", name: "doc1.pdf", size: 2048 },
      ];
      const machine = new MiniappMachine(fileUploadMachine, {
        value: initial,
      });
      machine.start();

      let api = connectFileUpload(machine.service);
      expect(api.fileCount).toBe(1);

      const next: FileUploadFile[] = [
        { id: "1", name: "doc1.pdf", size: 2048 },
        { id: "2", name: "doc2.pdf", size: 4096 },
      ];
      machine.updateProps({ value: next });
      await flush();

      api = connectFileUpload(machine.service);
      expect(api.fileCount).toBe(2);
      expect(api.files[1]?.name).toBe("doc2.pdf");

      machine.stop();
    });

    it("syncs uploading prop into state", async () => {
      const machine = new MiniappMachine(fileUploadMachine, {
        uploading: false,
      });
      machine.start();

      expect(machine.state.get()).toBe("idle");

      machine.updateProps({ uploading: true });
      await flush();
      expect(machine.state.get()).toBe("uploading");

      machine.updateProps({ uploading: false });
      await flush();
      expect(machine.state.get()).toBe("idle");

      machine.stop();
    });
  });

  describe("File Operations", () => {
    it("adds files and enforces maxFiles limit", async () => {
      const onChange = vi.fn();
      const machine = new MiniappMachine(fileUploadMachine, {
        maxFiles: 2,
        onChange,
      });
      machine.start();

      const api = connectFileUpload(machine.service);
      api.setFiles([
        { id: "1", name: "1.png", size: 100 },
        { id: "2", name: "2.png", size: 200 },
      ]);
      await flush();

      expect(machine.context.get("files").length).toBe(2);
      expect(machine.computed("isMaxFiles")).toBe(true);

      const updatedApi = connectFileUpload(machine.service);
      expect(updatedApi.isMaxFiles).toBe(true);
      expect(updatedApi.dropzoneProps["aria-disabled"]).toBe(true);
      expect(updatedApi.dropzoneProps["aria-label"]).toContain(
        "Maximum 2 files uploaded",
      );

      // Adding more when max reached should be blocked by guard
      machine.send({
        type: "ADD_FILES",
        files: [{ id: "3", name: "3.png", size: 300 }],
      });
      await flush();
      expect(machine.context.get("files").length).toBe(2);

      machine.stop();
    });

    it("replaces files in single file mode (multiple: false)", async () => {
      const machine = new MiniappMachine(fileUploadMachine, {
        multiple: false,
      });
      machine.start();

      machine.send({
        type: "ADD_FILES",
        files: [{ id: "1", name: "first.png", size: 100 }],
      });
      await flush();
      expect(machine.context.get("files").length).toBe(1);
      expect(machine.context.get("files")[0]?.name).toBe("first.png");

      machine.send({
        type: "ADD_FILES",
        files: [{ id: "2", name: "second.png", size: 200 }],
      });
      await flush();
      expect(machine.context.get("files").length).toBe(1);
      expect(machine.context.get("files")[0]?.name).toBe("second.png");

      machine.stop();
    });

    it("removes a file and triggers onRemove callback", async () => {
      const onRemove = vi.fn();
      const onChange = vi.fn();
      const machine = new MiniappMachine(fileUploadMachine, {
        defaultValue: [
          { id: "1", name: "a.png", size: 100 },
          { id: "2", name: "b.png", size: 200 },
        ],
        onRemove,
        onChange,
      });
      machine.start();

      const api = connectFileUpload(machine.service);
      api.removeFile(0);
      await flush();

      expect(machine.context.get("files").length).toBe(1);
      expect(machine.context.get("files")[0]?.name).toBe("b.png");
      expect(onRemove).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 0,
          file: expect.objectContaining({ name: "a.png" }),
        }),
      );
      expect(onChange).toHaveBeenCalled();

      machine.stop();
    });

    it("clears all files", async () => {
      const machine = new MiniappMachine(fileUploadMachine, {
        defaultValue: [
          { id: "1", name: "a.png", size: 100 },
          { id: "2", name: "b.png", size: 200 },
        ],
      });
      machine.start();

      const api = connectFileUpload(machine.service);
      api.clearFiles();
      await flush();

      expect(machine.context.get("files")).toEqual([]);
      expect(machine.computed("hasFiles")).toBe(false);

      machine.stop();
    });

    it("handles preview callback and wx API preview", () => {
      const previewImage = vi.fn();
      (globalThis as any).wx = { previewImage };

      const onPreview = vi.fn();
      const machine = new MiniappMachine(fileUploadMachine, {
        defaultValue: [
          {
            id: "1",
            name: "pic.jpg",
            path: "wxfile://tmp/pic.jpg",
            type: "image",
            size: 500,
          },
        ],
        onPreview,
      });
      machine.start();

      const api = connectFileUpload(machine.service);
      api.previewFile(0);

      expect(onPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 0,
          file: expect.objectContaining({ name: "pic.jpg" }),
        }),
      );
      expect(previewImage).toHaveBeenCalledWith({
        current: "wxfile://tmp/pic.jpg",
        urls: ["wxfile://tmp/pic.jpg"],
      });

      machine.stop();
    });

    it("handles video preview via wx.previewMedia", () => {
      const previewMedia = vi.fn();
      (globalThis as any).wx = { previewMedia };

      const onPreview = vi.fn();
      const machine = new MiniappMachine(fileUploadMachine, {
        defaultValue: [
          {
            id: "1",
            name: "clip.mp4",
            path: "wxfile://tmp/clip.mp4",
            thumb: "wxfile://tmp/clip_thumb.jpg",
            type: "video",
            size: 5000000,
          },
        ],
        onPreview,
      });
      machine.start();

      const api = connectFileUpload(machine.service);
      api.previewFile(0);

      expect(onPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 0,
          file: expect.objectContaining({ name: "clip.mp4" }),
        }),
      );
      expect(previewMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          current: 0,
          sources: [
            {
              url: "wxfile://tmp/clip.mp4",
              type: "video",
              poster: "wxfile://tmp/clip_thumb.jpg",
            },
          ],
        }),
      );

      machine.stop();
    });

    it("handles audio preview via wx.createInnerAudioContext and toggles playback", () => {
      const play = vi.fn();
      const pause = vi.fn();
      const stop = vi.fn();
      const destroy = vi.fn();
      let onPlayCb: () => void = () => {};

      const mockAudioCtx = {
        play,
        pause,
        stop,
        destroy,
        paused: false,
        src: "",
        autoplay: false,
        onPlay: vi.fn((cb) => {
          onPlayCb = cb;
        }),
        onEnded: vi.fn(),
        onError: vi.fn(),
      };

      const createInnerAudioContext = vi.fn(() => mockAudioCtx);
      const showToast = vi.fn();
      (globalThis as any).wx = { createInnerAudioContext, showToast };

      const machine = new MiniappMachine(fileUploadMachine, {
        defaultValue: [
          {
            id: "1",
            name: "song.mp3",
            path: "wxfile://tmp/song.mp3",
            type: "audio",
            size: 3000000,
          },
        ],
      });
      machine.start();

      const api = connectFileUpload(machine.service);
      api.previewFile(0);

      expect(createInnerAudioContext).toHaveBeenCalled();
      expect(mockAudioCtx.src).toBe("wxfile://tmp/song.mp3");
      expect(play).toHaveBeenCalled();

      // Trigger onPlay
      onPlayCb();
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Playing song.mp3" }),
      );

      // Click again while playing -> pause
      api.previewFile(0);
      expect(pause).toHaveBeenCalled();
      expect(showToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Paused song.mp3" }),
      );

      // Click again while paused -> play
      mockAudioCtx.paused = true;
      api.previewFile(0);
      expect(play).toHaveBeenCalledTimes(2);

      // stopActiveAudio cleans up
      stopActiveAudio();
      expect(stop).toHaveBeenCalled();
      expect(destroy).toHaveBeenCalled();

      machine.stop();
    });
  });

  describe("WeChat Native Picker & Validation", () => {
    it("calls wx.chooseMedia and validates size limits", async () => {
      const onAccept = vi.fn();
      const onReject = vi.fn();

      const chooseMedia = vi.fn(({ success, complete }) => {
        success({
          tempFiles: [
            { tempFilePath: "tmp/small.png", size: 1024, fileType: "image" },
            {
              tempFilePath: "tmp/large.png",
              size: 10000000,
              fileType: "image",
            },
          ],
        });
        complete();
      });

      (globalThis as any).wx = { chooseMedia };

      const machine = new MiniappMachine(fileUploadMachine, {
        maxSize: 5000, // 5KB max
        onAccept,
        onReject,
      });
      machine.start();

      const api = connectFileUpload(machine.service);
      await api.chooseFiles();

      expect(chooseMedia).toHaveBeenCalled();
      expect(onReject).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.arrayContaining([
            expect.objectContaining({ reason: "size-too-large" }),
          ]),
        }),
      );
      expect(onAccept).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.arrayContaining([
            expect.objectContaining({ size: 1024 }),
          ]),
        }),
      );

      expect(machine.context.get("files").length).toBe(1);
      expect(machine.context.get("files")[0]?.size).toBe(1024);

      machine.stop();
    });

    it("calls wx.chooseMessageFile for document extensions", async () => {
      const chooseMessageFile = vi.fn(({ success, complete }) => {
        success({
          tempFiles: [
            {
              path: "tmp/contract.pdf",
              name: "contract.pdf",
              size: 5000,
              type: "file",
            },
          ],
        });
        complete();
      });

      (globalThis as any).wx = { chooseMessageFile };

      const machine = new MiniappMachine(fileUploadMachine, {
        accept: ".pdf,.doc",
      });
      machine.start();

      const api = connectFileUpload(machine.service);
      await api.chooseFiles();

      expect(chooseMessageFile).toHaveBeenCalled();
      expect(machine.context.get("files").length).toBe(1);
      expect(machine.context.get("files")[0]?.name).toBe("contract.pdf");

      machine.stop();
    });

    it("rejects files not matching accept pattern", async () => {
      const onReject = vi.fn();
      const onAccept = vi.fn();

      const chooseMedia = vi.fn(({ success, complete }) => {
        success({
          tempFiles: [
            { tempFilePath: "tmp/file.mov", size: 2000, fileType: "video" },
          ],
        });
        complete();
      });

      (globalThis as any).wx = { chooseMedia };

      const machine = new MiniappMachine(fileUploadMachine, {
        accept: "image/*",
        onReject,
        onAccept,
      });
      machine.start();

      const api = connectFileUpload(machine.service);
      await api.chooseFiles();

      expect(onReject).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.arrayContaining([
            expect.objectContaining({ reason: "type-not-allowed" }),
          ]),
        }),
      );
      expect(onAccept).not.toHaveBeenCalled();
      expect(machine.context.get("files").length).toBe(0);

      machine.stop();
    });

    it("triggers component triggerEvent('reject') when file is rejected", async () => {
      const triggerEvent = vi.fn();
      const mockComponent = {
        triggerEvent,
        selectOwnerComponent: () => null,
      };

      const chooseMedia = vi.fn(({ success, complete }) => {
        success({
          tempFiles: [
            { tempFilePath: "tmp/file.mov", size: 2000, fileType: "video" },
          ],
        });
        complete();
      });

      (globalThis as any).wx = { chooseMedia };

      const machine = new MiniappMachine(fileUploadMachine, {
        component: mockComponent,
        accept: "image/*",
      });
      machine.start();

      const api = connectFileUpload(machine.service);
      await api.chooseFiles();

      expect(triggerEvent).toHaveBeenCalledWith(
        "reject",
        expect.objectContaining({
          files: expect.arrayContaining([
            expect.objectContaining({ reason: "type-not-allowed" }),
          ]),
        }),
      );

      machine.stop();
    });

    it("rejects files exceeding maxFiles limit via handlePickedFiles", async () => {
      const onReject = vi.fn();
      const onAccept = vi.fn();

      const chooseMedia = vi.fn(({ success, complete }) => {
        success({
          tempFiles: [
            { tempFilePath: "tmp/file1.png", size: 1000, fileType: "image" },
            { tempFilePath: "tmp/file2.png", size: 1000, fileType: "image" },
            { tempFilePath: "tmp/file3.png", size: 1000, fileType: "image" },
          ],
        });
        complete();
      });

      (globalThis as any).wx = { chooseMedia };

      const machine = new MiniappMachine(fileUploadMachine, {
        maxFiles: 2,
        onReject,
        onAccept,
      });
      machine.start();

      const api = connectFileUpload(machine.service);
      await api.chooseFiles();

      expect(onReject).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.arrayContaining([
            expect.objectContaining({ reason: "max-files-exceeded" }),
          ]),
        }),
      );
      expect(onAccept).toHaveBeenCalledWith(
        expect.objectContaining({
          files: [
            expect.objectContaining({ name: "file1.png" }),
            expect.objectContaining({ name: "file2.png" }),
          ],
        }),
      );
      expect(machine.context.get("files").length).toBe(2);

      machine.stop();
    });

    it("validates and rejects files programmatically via api.addFiles", async () => {
      const onReject = vi.fn();
      const onAccept = vi.fn();

      const machine = new MiniappMachine(fileUploadMachine, {
        maxSize: 5000,
        accept: ".pdf",
        onReject,
        onAccept,
      });
      machine.start();

      const api = connectFileUpload(machine.service);
      api.addFiles([
        { path: "tmp/valid.pdf", name: "valid.pdf", size: 2000 },
        { path: "tmp/oversized.pdf", name: "oversized.pdf", size: 10000 },
        { path: "tmp/image.png", name: "image.png", size: 1000 },
      ]);
      await flush();

      expect(onReject).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.arrayContaining([
            expect.objectContaining({
              file: expect.objectContaining({ name: "oversized.pdf" }),
              reason: "size-too-large",
            }),
            expect.objectContaining({
              file: expect.objectContaining({ name: "image.png" }),
              reason: "type-not-allowed",
            }),
          ]),
        }),
      );
      expect(onAccept).toHaveBeenCalledWith(
        expect.objectContaining({
          files: [expect.objectContaining({ name: "valid.pdf" })],
        }),
      );
      expect(machine.context.get("files").length).toBe(1);

      machine.stop();
    });
  });

  describe("Utility Helpers", () => {
    it("formatBytes correctly formats sizes", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(-10)).toBe("0 B");
      expect(formatBytes(500)).toBe("500 B");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1536)).toBe("1.5 KB");
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(10485760)).toBe("10 MB");
      expect(formatBytes(1073741824)).toBe("1 GB");
    });

    it("identifies image and video file extensions", () => {
      expect(isImageFile(undefined, "foo/bar.PNG")).toBe(true);
      expect(isImageFile(undefined, "image.jpg")).toBe(true);
      expect(isImageFile("image/png")).toBe(true);
      expect(isImageFile(undefined, "document.pdf")).toBe(false);

      expect(isVideoFile(undefined, "video.mp4")).toBe(true);
      expect(isVideoFile("video/quicktime")).toBe(true);
      expect(isVideoFile(undefined, "image.jpg")).toBe(false);
    });

    it("has configurable icon props in defaultFileUploadProps", () => {
      expect(defaultFileUploadProps.icon).toBe("upload");
      expect(defaultFileUploadProps.loadingIcon).toBe("loading");
      expect(defaultFileUploadProps.deleteIcon).toBe("close");
      expect(defaultFileUploadProps.fileIcon).toBe("file");
      expect(defaultFileUploadProps.imageIcon).toBe("image");
      expect(defaultFileUploadProps.videoIcon).toBe("video");
      expect(defaultFileUploadProps.audioIcon).toBe("audio");
    });

    it("extracts file extensions correctly", () => {
      expect(getFileExtension("photo.jpg")).toBe(".jpg");
      expect(getFileExtension("archive.tar.gz")).toBe(".gz");
      expect(getFileExtension("path/to/song.mp3?token=123#frag")).toBe(".mp3");
      expect(getFileExtension("noextension")).toBe("");
      expect(getFileExtension("")).toBe("");
      expect(getFileExtension(undefined)).toBe("");
    });

    it("identifies audio and document files", () => {
      expect(isAudioFile(undefined, "song.mp3")).toBe(true);
      expect(isAudioFile(undefined, "podcast.wav")).toBe(true);
      expect(isAudioFile("audio/mpeg")).toBe(true);
      expect(isAudioFile(undefined, "video.mp4")).toBe(false);

      expect(isDocumentFile(undefined, "manual.pdf")).toBe(true);
      expect(isDocumentFile(undefined, "sheet.xlsx")).toBe(true);
      expect(isDocumentFile("application/pdf")).toBe(true);
      expect(isDocumentFile(undefined, "photo.png")).toBe(false);
    });

    it("determines fileType category via getFileType", () => {
      expect(getFileType({ name: "photo.jpg" })).toBe("image");
      expect(getFileType({ type: "image/png" })).toBe("image");
      expect(getFileType({ name: "movie.mp4" })).toBe("video");
      expect(getFileType({ type: "video/quicktime" })).toBe("video");
      expect(getFileType({ name: "track.mp3" })).toBe("audio");
      expect(getFileType({ type: "audio/wav" })).toBe("audio");
      expect(getFileType({ name: "document.pdf" })).toBe("file");
      expect(getFileType({ type: "application/zip" })).toBe("file");
      expect(getFileType({})).toBe("file");
    });

    it("infers MIME type from file extension", () => {
      expect(getFileMimeType("pic.png")).toBe("image/png");
      expect(getFileMimeType("clip.mp4")).toBe("video/mp4");
      expect(getFileMimeType("song.mp3")).toBe("audio/mpeg");
      expect(getFileMimeType("doc.pdf")).toBe("application/pdf");
      expect(getFileMimeType("unknown.xyz")).toBe("application/octet-stream");
    });

    it("calculates total file size and validates file size", () => {
      const files = [{ size: 100 }, { size: 200 }, { size: 300 }];
      expect(getTotalFileSize(files)).toBe(600);

      expect(isValidFileSize({ size: 50 }, { minSize: 10, maxSize: 100 })).toBe(
        true,
      );
      expect(isValidFileSize({ size: 5 }, { minSize: 10 })).toBe(false);
      expect(isValidFileSize({ size: 150 }, { maxSize: 100 })).toBe(false);
    });

    it("cleans extensions list for WeChat chooseMessageFile", () => {
      expect(cleanExtensions(".pdf, .doc, .xlsx")).toEqual([
        "pdf",
        "doc",
        "xlsx",
      ]);
      expect(cleanExtensions([".mp3", "wav"])).toEqual(["mp3", "wav"]);
      expect(cleanExtensions(undefined)).toEqual([]);
    });

    it("validates file types against accept patterns and creates validator", () => {
      const isImg = createFileTypeValidator("image/*");
      expect(isImg({ id: "1", name: "a.jpg", type: "image" })).toBe(true);
      expect(isImg({ id: "2", name: "b.pdf", type: "file" })).toBe(false);

      expect(
        isValidFileType(
          { id: "3", name: "sheet.xlsx", type: "file" },
          ".pdf,.xlsx",
        ),
      ).toBe(true);
      expect(
        isValidFileType(
          { id: "4", name: "video.mp4", type: "video" },
          "video/*",
        ),
      ).toBe(true);
      expect(
        isValidFileType(
          { id: "5", name: "track.mp3", type: "audio" },
          "audio/*",
        ),
      ).toBe(true);
    });

    it("validates files batch with Zag-inspired validateFiles", () => {
      const files: FileUploadFile[] = [
        { id: "1", name: "ok.pdf", size: 500, type: "file" },
        { id: "2", name: "too-large.pdf", size: 15000, type: "file" },
        { id: "3", name: "too-small.pdf", size: 5, type: "file" },
        { id: "4", name: "wrong-type.png", size: 500, type: "image" },
      ];

      const res = validateFiles(files, {
        minSize: 100,
        maxSize: 10000,
        accept: ".pdf",
        maxFiles: 5,
        multiple: true,
      });

      expect(res.accepted.length).toBe(1);
      expect(res.accepted[0]?.name).toBe("ok.pdf");
      expect(res.rejected).toEqual([
        { file: files[1], reason: "size-too-large" },
        { file: files[2], reason: "size-too-small" },
        { file: files[3], reason: "type-not-allowed" },
      ]);
    });

    it("enforces single file mode in validateFiles when multiple is false", () => {
      const files: FileUploadFile[] = [
        { id: "1", name: "first.pdf", size: 500, type: "file" },
        { id: "2", name: "second.pdf", size: 600, type: "file" },
      ];

      const res = validateFiles(files, {
        multiple: false,
      });

      expect(res.accepted.length).toBe(1);
      expect(res.accepted[0]?.name).toBe("first.pdf");
      expect(res.rejected.length).toBe(1);
      expect(res.rejected[0]?.reason).toBe("max-files-exceeded");
    });

    it("accepts custom icon configurations", () => {
      const machine = new MiniappMachine(fileUploadMachine, {
        icon: "cloud-upload",
        loadingIcon: "custom-loading",
        deleteIcon: "trash",
        fileIcon: "doc",
        imageIcon: "photo",
        videoIcon: "film",
      });
      machine.start();
      expect(machine.prop("icon")).toBe("cloud-upload");
      expect(machine.prop("loadingIcon")).toBe("custom-loading");
      expect(machine.prop("deleteIcon")).toBe("trash");
      expect(machine.prop("fileIcon")).toBe("doc");
      expect(machine.prop("imageIcon")).toBe("photo");
      expect(machine.prop("videoIcon")).toBe("film");
      machine.stop();
    });
  });
});
