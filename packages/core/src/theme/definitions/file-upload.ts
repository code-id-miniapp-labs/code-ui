import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function fileUploadTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
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
      color: Object.assign(
        Object.fromEntries(
          colors.map((color) => [
            color,
            {
              dropzone: `focus:border-${color} focus:ring-2 focus:ring-${color}/20`,
            },
          ]),
        ),
        {
          neutral: {
            dropzone:
              "focus:border-inverted focus:ring-2 focus:ring-inverted/20",
          },
        },
      ),
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
          dropzone: `border-${errorColor} bg-${errorColor}/5 text-${errorColor}`,
        },
      },
    },
    compoundVariants: [
      ...colors.map((color) => ({
        color,
        disabled: false as const,
        invalid: false as const,
        class: {
          dropzone: `hover:border-${color} active:border-${color}`,
        },
      })),
      {
        color: "neutral" as const,
        disabled: false as const,
        invalid: false as const,
        class: {
          dropzone: "hover:border-inverted active:border-inverted",
        },
      },
      {
        dropzone: false as const,
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
  });
}
