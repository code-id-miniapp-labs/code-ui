import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function fileUploadTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "relative flex flex-col gap-3 w-full",
      dropzone:
        "relative flex flex-col items-center justify-center text-center border-2 border-dashed rounded-xl transition-colors cursor-pointer select-none",
      icon: "text-neutral-400 mb-2 shrink-0 flex items-center justify-center",
      content: "flex flex-col items-center justify-center gap-1",
      title: "font-medium text-neutral-900",
      description: "text-neutral-500",
      fileList: "flex flex-col gap-2 w-full",
      file: "relative flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-white shadow-xs transition-colors",
      fileLeading:
        "flex items-center justify-center shrink-0 rounded-lg overflow-hidden bg-neutral-100",
      fileContent: "flex flex-col min-w-0 flex-1 text-left",
      fileName: "font-medium text-neutral-900 truncate",
      fileSize: "text-neutral-500 shrink-0",
      fileTrailing: "flex items-center shrink-0 ml-auto gap-1",
      fileIcon: "w-5 h-5 text-neutral-400",
      fileRemove:
        "flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors p-1",
      fileProgress: "w-full mt-1.5",
    },
    variants: {
      color: Object.fromEntries(
        (colors as readonly string[]).map((color) => [
          color,
          {
            dropzone: `focus:border-${color} focus:ring-2 focus:ring-${color}/20`,
          },
        ]),
      ),
      variant: {
        outline: {
          dropzone:
            "border-neutral-300 bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-400",
          file: "bg-white border-neutral-200",
        },
        soft: {
          dropzone: "border-transparent bg-neutral-100/70 hover:bg-neutral-100",
          file: "bg-neutral-100/70 border-transparent",
        },
        subtle: {
          dropzone: "border-neutral-200 bg-neutral-100/50 hover:bg-neutral-100",
          file: "bg-neutral-50 border-neutral-200",
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
          description: "text-[11px]",
          file: "p-2 gap-2 text-xs",
          fileLeading: "w-8 h-8 text-xs",
          fileName: "text-xs",
          fileSize: "text-[10px]",
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
          file: "relative flex flex-col p-2.5 rounded-xl border border-neutral-200 bg-white shadow-xs transition-colors overflow-hidden",
          fileLeading:
            "w-full h-24 aspect-video rounded-lg overflow-hidden bg-neutral-100 shrink-0 relative flex items-center justify-center",
          fileTrailing:
            "absolute top-3.5 right-3.5 z-10 flex items-center gap-1",
          fileRemove:
            "flex items-center justify-center w-5 h-5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-xs",
          fileContent: "w-full pt-1.5 flex flex-col items-center min-w-0",
          fileName:
            "w-full text-center font-medium text-neutral-900 truncate text-xs",
          fileSize: "hidden",
          fileProgress: "w-full mt-1",
        },
      },
      disabled: {
        true: {
          root: "opacity-60 pointer-events-none cursor-not-allowed",
          dropzone: "cursor-not-allowed bg-neutral-100/50 border-neutral-200",
        },
      },
      invalid: {
        true: {
          dropzone: `border-${errorColor} bg-${errorColor}/5 text-${errorColor}`,
        },
      },
    },
    compoundVariants: (colors as readonly string[]).map((color) => ({
      color: color as (typeof colors)[number],
      disabled: false as const,
      invalid: false as const,
      class: {
        dropzone: `hover:border-${color} active:border-${color}`,
      },
    })),
    defaultVariants: {
      color: "primary",
      variant: "outline",
      size: "md",
      layout: "list",
      disabled: false,
      invalid: false,
    },
  });
}
