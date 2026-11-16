import { useToast } from "@code-ui/composables";
import { useTheme } from "../../utils/theme";

interface QrCodeRef {
  setValue?: (value: string) => void;
  getDataUrl?: (type?: "svg") => string;
}

Page({
  data: {
    textValue: "https://code-ui.dev",
    ecc: "M" as "L" | "M" | "Q" | "H",
    eccOptions: ["L", "M", "Q", "H"],
    size: "md",
    sizeOptions: ["xs", "sm", "md", "lg", "xl"],
    color: "neutral",
    colorOptions: [
      "neutral",
      "primary",
      "secondary",
      "success",
      "warning",
      "danger",
      "info",
    ],
    border: 2,
    overlayLogo: "https://res.wx.qq.com/a/wx_fed/assets/res/OTE0YTAw.png",
    showCustomOverlay: false,
    dataUrlPreview: "",
    themeKey: 0,
  },

  __unsubTheme: undefined as (() => void) | undefined,

  onLoad() {
    this.__unsubTheme?.();
    this.__unsubTheme = useTheme().subscribe(() => {
      this.setData({ themeKey: this.data.themeKey + 1 });
    });
  },

  onUnload() {
    this.__unsubTheme?.();
    this.__unsubTheme = undefined;
  },

  onInputChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ textValue: e.detail.value });
  },

  selectEcc(e: WechatMiniprogram.CustomEvent) {
    const ecc = e.currentTarget.dataset.ecc;
    if (ecc) this.setData({ ecc });
  },

  selectSize(e: WechatMiniprogram.CustomEvent) {
    const size = e.currentTarget.dataset.size;
    if (size) this.setData({ size });
  },

  selectColor(e: WechatMiniprogram.CustomEvent) {
    const color = e.currentTarget.dataset.color;
    if (color) this.setData({ color });
  },

  toggleBorder() {
    this.setData({ border: this.data.border === 0 ? 2 : 0 });
  },

  toggleCustomOverlay() {
    this.setData({ showCustomOverlay: !this.data.showCustomOverlay });
  },

  setPreset(e: WechatMiniprogram.CustomEvent) {
    const preset = e.currentTarget.dataset.preset;
    if (preset) this.setData({ textValue: preset });
  },

  callSetValueMethod() {
    const qr = this.selectComponent("#demo-qr") as QrCodeRef | null;
    const nextVal = "https://code-ui.dev/theming?mode=runtime";
    qr?.setValue?.(nextVal);
    this.setData({ textValue: nextVal });
  },

  callGetDataUrlMethod() {
    const qr = this.selectComponent("#demo-qr") as QrCodeRef | null;
    const url = qr?.getDataUrl?.("svg") ?? "";
    this.setData({ dataUrlPreview: url ? `${url.slice(0, 72)}... (${url.length} chars)` : "Empty" });
    useToast(this).success("Exported QR Data URL", {
      description: `Generated ${url.length}-char SVG data URI.`,
    });
  },
});
