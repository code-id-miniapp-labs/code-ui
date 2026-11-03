import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  registerToastHost,
  unregisterToastHost,
  __resetToastRegistry,
} from "@code-ui/miniapp/behaviors/toast";
import { useToast } from "../src/use-toast";

describe("useToast Composable", () => {
  let mockHost: any;
  let hostToasts: any[] = [];

  beforeEach(() => {
    __resetToastRegistry();
    hostToasts = [];
    mockHost = {
      getPageId: () => "page-1",
      setData: vi.fn(),
    };
    registerToastHost(mockHost, (toasts) => {
      hostToasts = toasts;
    });
  });

  afterEach(() => {
    unregisterToastHost(mockHost);
    __resetToastRegistry();
  });

  it("adds toast via useToast().add and notifies active host", () => {
    const toast = useToast();
    const id = toast.add({
      title: "Notice",
      description: "Operation successful",
      color: "primary",
      mode: "default",
    });

    expect(id).toBeDefined();
    expect(hostToasts).toHaveLength(1);
    expect(hostToasts[0]).toMatchObject({
      id,
      title: "Notice",
      description: "Operation successful",
      color: "primary",
      mode: "default",
      open: true,
      placement: "top",
    });
  });

  it("supports native mode defaults", () => {
    const toast = useToast();
    const id = toast.add({
      title: "Saved",
      mode: "native",
    });

    expect(hostToasts).toHaveLength(1);
    expect(hostToasts[0]).toMatchObject({
      id,
      title: "Saved",
      mode: "native",
      placement: "center",
    });
  });

  it("supports shorthand helpers (success, error, warning, info, loading)", () => {
    const toast = useToast({ max: 5 });

    const id1 = toast.success("Saved", { placement: "top" });
    const id2 = toast.error("Failed", { placement: "center" });
    const id3 = toast.warning("Caution", { placement: "bottom" });

    expect(hostToasts).toHaveLength(3);
    expect(hostToasts[0]?.color).toBe("success");
    expect(hostToasts[0]?.id).toBe(id1);
    expect(hostToasts[1]?.color).toBe("danger");
    expect(hostToasts[1]?.id).toBe(id2);
    expect(hostToasts[2]?.color).toBe("warning");
    expect(hostToasts[2]?.id).toBe(id3);
  });

  it("removes and clears toasts", () => {
    const toast = useToast();
    const id1 = toast.success("One", { placement: "top" });
    const id2 = toast.success("Two", { placement: "bottom" });

    expect(hostToasts).toHaveLength(2);

    toast.remove(id1);
    expect(hostToasts).toHaveLength(1);
    expect(hostToasts[0]?.id).toBe(id2);

    toast.clear();
    expect(hostToasts).toHaveLength(0);
  });

  it("dismisses toast by marking open as false", () => {
    const toast = useToast();
    const id = toast.success("Closing soon");

    expect(hostToasts[0]?.open).toBe(true);
    toast.dismiss(id);
    expect(hostToasts[0]?.open).toBe(false);
  });

  it("updates existing toast", () => {
    const toast = useToast();
    const id = toast.loading("Uploading...");

    expect(hostToasts[0]?.title).toBe("Uploading...");
    toast.update(id, {
      title: "Uploaded!",
      color: "success",
    });

    expect(hostToasts[0]?.title).toBe("Uploaded!");
    expect(hostToasts[0]?.color).toBe("success");
  });

  it("supports passing anatomy ui object in options and shorthands", () => {
    const toast = useToast();

    // Via shorthand with options object
    toast.success({
      title: "Custom Success",
      ui: {
        icon: "text-emerald-400",
        root: "shadow-2xl border-emerald-500",
      },
    });

    expect(hostToasts[0]?.title).toBe("Custom Success");
    expect(hostToasts[0]?.ui).toEqual({
      icon: "text-emerald-400",
      root: "shadow-2xl border-emerald-500",
    });

    // Via toast.loading() with automatic animate-spin icon
    toast.loading({
      title: "Spinning...",
      ui: {
        root: "backdrop-blur-md",
      },
    });

    const loadingToast = hostToasts.find((t) => t.color === "loading");
    expect(loadingToast?.title).toBe("Spinning...");
    expect(loadingToast?.ui).toEqual({
      icon: "animate-spin",
      root: "backdrop-blur-md",
    });
  });
});
