import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { fileUploadMachine } from "../src/file-upload.machine";
import {
  connectFileUpload,
  formatBytes,
  isImageFile,
  isVideoFile,
} from "../src/file-upload.connect";
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
      expect(api.files[0]?.isImage).toBe(true);
      expect(api.files[0]?.itemProps["aria-role"]).toBe("listitem");
      expect(api.files[0]?.removeProps["aria-role"]).toBe("button");
      expect(api.files[0]?.removeProps["aria-label"]).toBe("Remove test.png");

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
      expect(updatedApi.dropzoneProps["aria-label"]).toContain("Maximum 2 files uploaded");

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
  });

  describe("WeChat Native Picker & Validation", () => {
    it("calls wx.chooseMedia and validates size limits", async () => {
      const onAccept = vi.fn();
      const onReject = vi.fn();

      const chooseMedia = vi.fn(({ success, complete }) => {
        success({
          tempFiles: [
            { tempFilePath: "tmp/small.png", size: 1024, fileType: "image" },
            { tempFilePath: "tmp/large.png", size: 10000000, fileType: "image" },
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
      expect(defaultFileUploadProps.successIcon).toBe("check");
      expect(defaultFileUploadProps.errorIcon).toBe("");
    });

    it("accepts custom icon configurations", () => {
      const machine = new MiniappMachine(fileUploadMachine, {
        icon: "cloud-upload",
        loadingIcon: "custom-loading",
        deleteIcon: "trash",
        fileIcon: "doc",
        imageIcon: "photo",
        videoIcon: "film",
        successIcon: "badge-check",
        errorIcon: "alert-triangle",
      });
      machine.start();
      expect(machine.prop("icon")).toBe("cloud-upload");
      expect(machine.prop("loadingIcon")).toBe("custom-loading");
      expect(machine.prop("deleteIcon")).toBe("trash");
      expect(machine.prop("fileIcon")).toBe("doc");
      expect(machine.prop("imageIcon")).toBe("photo");
      expect(machine.prop("videoIcon")).toBe("film");
      expect(machine.prop("successIcon")).toBe("badge-check");
      expect(machine.prop("errorIcon")).toBe("alert-triangle");
      machine.stop();
    });
  });
});
