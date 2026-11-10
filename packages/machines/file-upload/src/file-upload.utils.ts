import type {
  FileUploadFile,
  FileUploadItemType,
  FileUploadRejectedFile,
} from "./file-upload.types";

export interface FileSizeOptions {
  minSize?: number | undefined;
  maxSize?: number | undefined;
}

export interface ValidateFilesOptions extends FileSizeOptions {
  accept?: string | string[] | undefined;
  maxFiles?: number | undefined;
  multiple?: boolean | undefined;
  currentCount?: number | undefined;
}

export interface ValidateFilesResult {
  accepted: FileUploadFile[];
  rejected: FileUploadRejectedFile[];
}

const IMAGE_EXT_RE = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff|avif)$/i;
const VIDEO_EXT_RE = /\.(mp4|mov|m4v|avi|mkv|webm|flv|wmv|3gp|ts)$/i;
const AUDIO_EXT_RE =
  /\.(mp3|wav|m4a|aac|ogg|flac|wma|aiff|alac|amr|mid|midi|opus)$/i;
const DOC_EXT_RE =
  /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|md|zip|rar|7z)$/i;

export function getFileExtension(fileNameOrPath?: string): string {
  if (!fileNameOrPath) return "";
  const clean = fileNameOrPath.split("?")[0]?.split("#")[0] ?? "";
  const lastDot = clean.lastIndexOf(".");
  if (lastDot === -1) return "";
  return clean.slice(lastDot).toLowerCase();
}

export function isImageFile(
  type?: string,
  path?: string,
  name?: string,
): boolean {
  if (type === "image" || type?.startsWith("image/")) return true;
  const check = path || name || "";
  return IMAGE_EXT_RE.test(check.split("?")[0] || "");
}

export function isVideoFile(
  type?: string,
  path?: string,
  name?: string,
): boolean {
  if (type === "video" || type?.startsWith("video/")) return true;
  const check = path || name || "";
  return VIDEO_EXT_RE.test(check.split("?")[0] || "");
}

export function isAudioFile(
  type?: string,
  path?: string,
  name?: string,
): boolean {
  if (type === "audio" || type?.startsWith("audio/")) return true;
  const check = path || name || "";
  return AUDIO_EXT_RE.test(check.split("?")[0] || "");
}

export function isDocumentFile(
  type?: string,
  path?: string,
  name?: string,
): boolean {
  if (
    type === "file" ||
    type?.startsWith("application/") ||
    type?.startsWith("text/")
  ) {
    return true;
  }
  const check = path || name || "";
  return DOC_EXT_RE.test(check.split("?")[0] || "");
}

export function hasDocumentExtension(acceptStr?: string): boolean {
  if (!acceptStr) return false;
  return (
    DOC_EXT_RE.test(acceptStr) ||
    /(^|,)\s*(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|csv)\s*(,|$)/i.test(
      acceptStr,
    )
  );
}

export function getFileType(file: {
  type?: string | undefined;
  path?: string | undefined;
  name?: string | undefined;
}): FileUploadItemType {
  if (isImageFile(file.type, file.path, file.name)) return "image";
  if (isVideoFile(file.type, file.path, file.name)) return "video";
  if (isAudioFile(file.type, file.path, file.name)) return "audio";
  return "file";
}

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/aac",
  aac: "audio/aac",
  ogg: "audio/ogg",
  flac: "audio/flac",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/msword",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.ms-excel",
  zip: "application/zip",
  txt: "text/plain",
};

export function getFileMimeType(
  fileNameOrPath?: string,
  fallback = "application/octet-stream",
): string {
  const ext = getFileExtension(fileNameOrPath).slice(1);
  return (ext && MIME_MAP[ext]) || fallback;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

export function getTotalFileSize(files: Array<{ size?: number }>): number {
  return files.reduce((acc, f) => acc + (f.size ?? 0), 0);
}

export function isValidFileSize(
  file: { size?: number },
  options: FileSizeOptions = {},
): boolean {
  const size = file.size ?? 0;
  const { minSize = 0, maxSize = Infinity } = options;
  return size >= minSize && size <= maxSize;
}

export function cleanExtensions(accept?: string | string[]): string[] {
  if (!accept) return [];
  const list = Array.isArray(accept)
    ? accept
    : accept.split(",").map((s) => s.trim());
  return list
    .map((ext) => ext.replace(/^\./, "").trim().toLowerCase())
    .filter(Boolean);
}

export function isValidFileType(
  file: FileUploadFile,
  accept?: string | string[],
): boolean {
  if (!accept) return true;
  const acceptList = Array.isArray(accept)
    ? accept
    : accept.split(",").map((s) => s.trim().toLowerCase());

  if (acceptList.length === 0) return true;

  const fileName = (file.name || "").toLowerCase();
  const filePath = (file.path || "").toLowerCase();
  const fileType = (file.type || "").toLowerCase();
  const inferredMime = getFileMimeType(fileName || filePath, "").toLowerCase();

  return acceptList.some((rawPattern) => {
    if (!rawPattern) return true;
    const pattern = rawPattern.trim().toLowerCase();
    if (pattern === "*" || pattern === "*/*") return true;

    // Wildcard category, e.g. "image/*", "video/*", "audio/*"
    if (pattern.endsWith("/*")) {
      const category = pattern.slice(0, -2);
      return (
        fileType.startsWith(category) ||
        inferredMime.startsWith(category) ||
        (category === "image" && isImageFile(fileType, filePath, fileName)) ||
        (category === "video" && isVideoFile(fileType, filePath, fileName)) ||
        (category === "audio" && isAudioFile(fileType, filePath, fileName))
      );
    }

    // Specific MIME type check, e.g. "image/png", "application/pdf"
    if (pattern.includes("/")) {
      if (fileType === pattern || inferredMime === pattern) return true;
      const subType = pattern.split("/")[1];
      if (subType) {
        if (
          fileName.endsWith(`.${subType}`) ||
          filePath.endsWith(`.${subType}`)
        ) {
          return true;
        }
        if (
          subType === "jpeg" &&
          (fileName.endsWith(".jpg") || filePath.endsWith(".jpg"))
        ) {
          return true;
        }
      }
      return false;
    }

    // Extension pattern (with or without leading dot, e.g. ".pdf" or "pdf")
    const ext = pattern.startsWith(".") ? pattern : `.${pattern}`;
    return fileName.endsWith(ext) || filePath.endsWith(ext);
  });
}

export function createFileTypeValidator(accept?: string | string[]) {
  return (file: FileUploadFile) => isValidFileType(file, accept);
}

export function validateFiles(
  files: FileUploadFile[],
  options: ValidateFilesOptions = {},
): ValidateFilesResult {
  const {
    maxSize = Infinity,
    minSize = 0,
    accept,
    maxFiles = 10,
    multiple = true,
    currentCount = 0,
  } = options;

  const accepted: FileUploadFile[] = [];
  const rejected: FileUploadRejectedFile[] = [];

  for (const file of files) {
    const size = file.size ?? 0;
    if (size > maxSize) {
      rejected.push({ file, reason: "size-too-large" });
    } else if (size < minSize) {
      rejected.push({ file, reason: "size-too-small" });
    } else if (accept && !isValidFileType(file, accept)) {
      rejected.push({ file, reason: "type-not-allowed" });
    } else if (multiple && currentCount + accepted.length >= maxFiles) {
      rejected.push({ file, reason: "max-files-exceeded" });
    } else {
      accepted.push(file);
    }
  }

  // If single file mode, only keep the first accepted file and reject the others
  if (!multiple && accepted.length > 1) {
    const [first, ...rest] = accepted;
    accepted.length = 0;
    if (first) accepted.push(first);
    for (const excess of rest) {
      rejected.push({ file: excess, reason: "max-files-exceeded" });
    }
  }

  return { accepted, rejected };
}
