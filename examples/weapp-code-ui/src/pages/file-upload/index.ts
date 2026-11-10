import type { FileUploadFile } from "@code-ui/file-upload";

interface FormRef {
  submit?: () => Promise<any>;
  reset?: (name?: string | string[]) => void;
  resetValidation?: (name?: string | string[]) => void;
  setErrors?: (errors: Record<string, string | string[]>) => void;
}

let mockIdCounter = 100;

Page({
  data: {
    // 1. Controlled Files
    controlledFiles: [
      {
        id: "file-1",
        name: "sunset-horizon.jpg",
        size: 1542890,
        progress: 40,

        type: "image",
        path: "https://picsum.photos/id/10/400/300",
        thumb: "https://picsum.photos/id/10/400/300",
        status: "success",
      },
      {
        id: "file-2",
        name: "product-specification.pdf",
        size: 3450000,
        type: "file",
        status: "success",
      },
      {
        id: "file-3",
        name: "intro-video.mp4",
        size: 8920000,
        type: "video",
        path: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        thumb: "https://picsum.photos/id/11/400/300",
        status: "success",
      },
      {
        id: "file-4",
        name: "podcast-episode.mp3",
        size: 3200000,
        type: "audio",
        path: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        status: "success",
      },
      {
        id: "file-5",
        name: "corrupted-file.zip",
        size: 512000,
        type: "file",
        status: "error",
        error: "Server timeout during upload",
      },
    ] as FileUploadFile[],

    // 2. Grid Files Demo
    sampleGridFiles: [
      {
        id: "grid-1",
        name: "mountain-view.jpg",
        size: 2450000,
        progress: 40,
        type: "image",
        path: "https://picsum.photos/id/29/400/300",
        thumb: "https://picsum.photos/id/29/400/300",
        status: "success",
      },
      {
        id: "grid-2",
        name: "forest-trees.jpg",
        size: 1820000,
        type: "image",
        path: "https://picsum.photos/id/28/400/300",
        thumb: "https://picsum.photos/id/28/400/300",
        status: "success",
      },
      {
        id: "grid-3",
        name: "calm-lake.jpg",
        size: 3120000,
        type: "image",
        path: "https://picsum.photos/id/16/400/300",
        thumb: "https://picsum.photos/id/16/400/300",
        status: "success",
      },
      {
        id: "grid-4",
        name: "ocean-breeze.jpg",
        size: 980000,
        type: "image",
        path: "https://picsum.photos/id/15/400/300",
        thumb: "https://picsum.photos/id/15/400/300",
        status: "success",
      },
    ] as FileUploadFile[],

    // 3. Max Files Demo (Pre-filled with 2 files to illustrate max reached state)
    sampleMaxFiles: [
      {
        id: "max-1",
        name: "expense-receipt-01.jpg",
        size: 420000,
        type: "image",
        path: "https://picsum.photos/id/30/400/300",
        thumb: "https://picsum.photos/id/30/400/300",
        status: "success",
      },
      {
        id: "max-2",
        name: "expense-receipt-02.jpg",
        size: 580000,
        type: "image",
        path: "https://picsum.photos/id/31/400/300",
        thumb: "https://picsum.photos/id/31/400/300",
        status: "success",
      },
    ] as FileUploadFile[],

    // 4. Disabled & ReadOnly Demo
    sampleDisabledFiles: [
      {
        id: "dis-1",
        name: "locked-document.pdf",
        size: 1200000,
        type: "file",
        status: "idle",
      },
    ] as FileUploadFile[],

    sampleReadOnlyFiles: [
      {
        id: "ro-1",
        name: "system-audit.log",
        size: 240000,
        type: "file",
        status: "success",
      },
      {
        id: "ro-2",
        name: "signed-contract.png",
        size: 1840000,
        type: "image",
        path: "https://picsum.photos/id/42/400/300",
        thumb: "https://picsum.photos/id/42/400/300",
        status: "success",
      },
    ] as FileUploadFile[],

    // 5. Form Validation
    fileRules: [
      { required: true, message: "Please upload at least one document" },
    ],
    formStatus: "",
    formMessage: "",

    // Event Feedback
    lastEvent: "(none)",
    isUploadingMock: false,
  },

  // Event Handlers
  onControlledChange(e: WechatMiniprogram.CustomEvent) {
    const nextFiles = e.detail?.value ?? [];
    this.setData({
      controlledFiles: nextFiles,
      lastEvent: `change: ${nextFiles.length} file(s)`,
    });
  },

  onFileAccept(e: WechatMiniprogram.CustomEvent) {
    const accepted = e.detail?.files ?? [];
    wx.showToast({
      title: `Accepted ${accepted.length} file(s)`,
      icon: "success",
      duration: 1500,
    });
    this.setData({
      lastEvent: `accept: +${accepted.length} file(s)`,
    });
  },

  onFileReject(e: WechatMiniprogram.CustomEvent) {
    const rejected = e.detail?.files ?? [];
    const firstReason = rejected[0]?.reason ?? "Invalid file";
    wx.showToast({
      title: `Rejected: ${firstReason}`,
      icon: "none",
      duration: 2000,
    });
    this.setData({
      lastEvent: `reject: ${rejected.length} file(s) (${firstReason})`,
    });
  },

  onFileRemove(e: WechatMiniprogram.CustomEvent) {
    const { file, index } = e.detail ?? {};
    this.setData({
      lastEvent: `remove: "${file?.name ?? index}"`,
    });
  },

  onFilePreview(e: WechatMiniprogram.CustomEvent) {
    const { file } = e.detail ?? {};
    this.setData({
      lastEvent: `preview: "${file?.name}"`,
    });
  },

  onFileClick(e: WechatMiniprogram.CustomEvent) {
    const { file } = e.detail ?? {};
    this.setData({
      lastEvent: `click: "${file?.name}"`,
    });
  },

  // Interactive helper actions
  addMockImage() {
    mockIdCounter += 1;
    const randomPicId = 40 + (mockIdCounter % 20);
    const newImage: FileUploadFile = {
      id: `mock-${mockIdCounter}`,
      name: `mock-photo-${mockIdCounter}.jpg`,
      size: 1024 * 1024 * (1 + Math.round(Math.random() * 3)),
      type: "image",
      path: `https://picsum.photos/id/${randomPicId}/400/300`,
      thumb: `https://picsum.photos/id/${randomPicId}/400/300`,
      status: "success",
    };

    const nextFiles = [...this.data.controlledFiles, newImage];
    this.setData({
      controlledFiles: nextFiles,
      lastEvent: `Added mock image: "${newImage.name}"`,
    });
  },

  addMockVideo() {
    mockIdCounter += 1;
    const newVideo: FileUploadFile = {
      id: `mock-${mockIdCounter}`,
      name: `video-clip-${mockIdCounter}.mp4`,
      size: 1024 * 1024 * 7,
      type: "video",
      path: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumb: "https://picsum.photos/id/11/400/300",
      status: "success",
    };

    const nextFiles = [...this.data.controlledFiles, newVideo];
    this.setData({
      controlledFiles: nextFiles,
      lastEvent: `Added mock video: "${newVideo.name}"`,
    });
  },

  addMockAudio() {
    mockIdCounter += 1;
    const newAudio: FileUploadFile = {
      id: `mock-${mockIdCounter}`,
      name: `audio-track-${mockIdCounter}.mp3`,
      size: 1024 * 1024 * 3,
      type: "audio",
      path: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      status: "success",
    };

    const nextFiles = [...this.data.controlledFiles, newAudio];
    this.setData({
      controlledFiles: nextFiles,
      lastEvent: `Added mock audio: "${newAudio.name}"`,
    });
  },

  addMockDoc() {
    mockIdCounter += 1;
    const newDoc: FileUploadFile = {
      id: `mock-${mockIdCounter}`,
      name: `report-quarterly-q${(mockIdCounter % 4) + 1}.pdf`,
      size: 512 * 1024 * (1 + (mockIdCounter % 5)),
      type: "file",
      status: "success",
    };

    const nextFiles = [...this.data.controlledFiles, newDoc];
    this.setData({
      controlledFiles: nextFiles,
      lastEvent: `Added mock document: "${newDoc.name}"`,
    });
  },

  toggleUploadSimulation() {
    const uploading = !this.data.isUploadingMock;
    const nextFiles = this.data.controlledFiles.map((file, idx) => {
      if (idx === 0) {
        return {
          ...file,
          status: uploading ? ("uploading" as const) : ("success" as const),
          progress: uploading ? 45 : undefined,
        };
      }
      return file;
    });

    this.setData({
      isUploadingMock: uploading,
      controlledFiles: nextFiles,
      lastEvent: uploading
        ? "Simulating active upload on first file (45%)"
        : "Upload complete on first file",
    });
  },

  clearControlledFiles() {
    this.setData({
      controlledFiles: [],
      lastEvent: "Cleared all controlled files",
    });
  },

  // Form helpers
  getUploadForm(): FormRef | null {
    return this.selectComponent("#upload-form") as FormRef | null;
  },

  handleFormSubmit(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      formStatus: "success",
      formMessage: `Form submitted successfully with data: ${JSON.stringify(e.detail ?? {})}`,
    });
    wx.showToast({
      title: "Submitted!",
      icon: "success",
    });
  },

  handleFormError(e: WechatMiniprogram.CustomEvent) {
    const errors = e.detail?.errors ?? [];
    this.setData({
      formStatus: "error",
      formMessage: `Validation failed: ${errors[0]?.message ?? "Please check form fields"}`,
    });
  },

  submitForm() {
    this.getUploadForm()?.submit?.();
  },

  onHandleReject(e: WechatMiniprogram.CustomEvent) {
    console.log("[bind:reject] onHandleReject received detail:", e.detail);
    this.onFileReject(e);
  },

  triggerRejectSize() {
    const comp = this.selectComponent("#reject-demo") as any;
    comp?.addFiles?.([
      { name: "giant-presentation.pdf", size: 50 * 1024 * 1024, type: "file" },
    ]);
  },

  triggerRejectType() {
    const comp = this.selectComponent("#reject-demo") as any;
    comp?.addFiles?.([
      { name: "unsupported-audio.mp3", size: 1024, type: "audio" },
    ]);
  },

  triggerRejectMaxFiles() {
    const comp = this.selectComponent("#reject-demo") as any;
    comp?.addFiles?.([
      { name: "doc1.pdf", size: 500, type: "file" },
      { name: "doc2.pdf", size: 500, type: "file" },
      { name: "doc3-overflow.pdf", size: 500, type: "file" },
    ]);
  },

  resetForm() {
    this.getUploadForm()?.reset?.();
    this.setData({
      formStatus: "",
      formMessage: "",
    });
  },
});
