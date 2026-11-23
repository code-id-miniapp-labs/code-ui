import { afterEach, describe, expect, it } from "vitest";
import { buttonTheme, drawerTheme, toastTheme } from "@code-id-labs/core";
import { ToastManager } from "@code-id-labs/miniapp/behaviors/toast";
import { tv } from "../src/utils/variants";
import { resolveSlots } from "../src/utils/ui";

const globalHost = globalThis as Record<string, any>;

describe("global cui.config.ts overrides in tv() and ToastManager", () => {
  afterEach(() => {
    delete globalHost.__CODE_UI_GLOBAL_CONFIG__;
  });

  it("applies components.toast.slots overrides over toast variants & compoundVariants", () => {
    const compiled = tv({ name: "toast", ...toastTheme() });

    globalHost.__CODE_UI_GLOBAL_CONFIG__ = {
      prefix: "c",
      components: {
        toast: {
          slots: {
            root: "rounded-full p-2 z-50",
            title: "text-lg text-primary",
            icon: "w-6 h-6",
          },
        },
      },
    };

    const fns = compiled({
      mode: "default",
      color: "success",
      variant: "soft",
      orientation: "vertical",
      placement: "top",
      progressPosition: "bottom",
    });
    const slots = resolveSlots(fns);

    expect(slots.root).toContain("rounded-full");
    expect(slots.root).not.toContain("rounded-xl");
    expect(slots.root).toContain("p-2");
    expect(slots.root).not.toContain("p-4");
    expect(slots.root).toContain("z-50");
    expect(slots.root).not.toContain("z-toast");
    expect(slots.title).toContain("text-lg");
    expect(slots.title).not.toContain("text-sm");
    expect(slots.title).toContain("text-primary");
    expect(slots.title).not.toContain("text-success");
    expect(slots.icon).toContain("w-6");
    expect(slots.icon).toContain("h-6");
    expect(slots.icon).not.toContain("w-5");

    // Per-instance `ui` prop still wins over global overrides
    const localSlots = resolveSlots(fns, { root: "rounded-none", title: "text-xs" });
    expect(localSlots.root).toContain("rounded-none");
    expect(localSlots.root).not.toContain("rounded-full");
    expect(localSlots.title).toContain("text-xs");
    expect(localSlots.title).not.toContain("text-lg");
  });

  it("applies global variants over global slots and supports function replacers", () => {
    const compiled = tv({ name: "button", ...buttonTheme() });

    globalHost.__CODE_UI_GLOBAL_CONFIG__ = {
      components: {
        button: {
          slots: {
            root: (prev: string) => `${prev.replace("rounded-md", "")} rounded-full`,
          },
          variants: {
            size: {
              md: {
                root: "px-6",
              },
            },
          },
        },
      },
    };

    const slots = resolveSlots(
      compiled({ variant: "solid", color: "primary", size: "md" }),
    );
    expect(slots.root).toContain("rounded-full");
    expect(slots.root).not.toContain("rounded-md");
    expect(slots.root).toContain("px-6");
    expect(slots.root).not.toContain("px-2_d5");
  });

  it("picks up config updates cleanly without stacking previous overrides", () => {
    const compiled = tv({ name: "drawer", ...drawerTheme() });

    // Initial call before config is populated
    const before = resolveSlots(compiled({ placement: "bottom", open: true }));
    expect(before.headerContent).not.toContain("text-primary");

    // Populate global config (as virtual:cui/config does)
    globalHost.__CODE_UI_GLOBAL_CONFIG__ = {
      components: {
        drawer: {
          slots: {
            headerContent: "font-semibold text-base text-primary",
          },
        },
      },
    };

    const first = resolveSlots(compiled({ placement: "bottom", open: true }));
    expect(first.headerContent).toContain("text-primary");
    expect(first.headerContent).toContain("font-semibold");

    // Replace global config (simulating HMR or setConfig)
    globalHost.__CODE_UI_GLOBAL_CONFIG__ = {
      components: {
        drawer: {
          slots: {
            headerContent: "text-danger",
          },
        },
      },
    };

    const second = resolveSlots(compiled({ placement: "bottom", open: true }));
    expect(second.headerContent).toContain("text-danger");
    expect(second.headerContent).not.toContain("font-semibold");
    expect(second.headerContent).not.toContain("text-primary");
  });

  it("applies components.toast defaultVariants & defaultProps in ToastManager.add()", () => {
    globalHost.__CODE_UI_GLOBAL_CONFIG__ = {
      components: {
        toast: {
          defaultVariants: {
            placement: "bottom",
            variant: "solid",
            mode: "native",
          },
          defaultProps: {
            duration: 2000,
            close: false,
            progress: false,
          },
        },
      },
    };

    const manager = new ToastManager();
    manager.add({ id: "t1", title: "Saved" });
    manager.add({ id: "t2", title: "Override", placement: "top", variant: "soft", duration: 5000 });

    const list = manager.toasts();
    const t1 = list.find((t) => t.id === "t1");
    const t2 = list.find((t) => t.id === "t2");

    expect(t1?.placement).toBe("bottom");
    expect(t1?.variant).toBe("solid");
    expect(t1?.mode).toBe("native");
    expect(t1?.duration).toBe(2000);
    expect(t1?.close).toBe(false);
    expect(t1?.progress).toBe(false);

    expect(t2?.placement).toBe("top");
    expect(t2?.variant).toBe("soft");
    expect(t2?.duration).toBe(5000);
    expect(t2?.mode).toBe("native");
  });

  it("applies build-time pre-merged overrides (`pm: 1`) without reading global config at runtime", () => {
    const compiled = tv({
      name: "drawer",
      pm: 1,
      ...drawerTheme(),
      overrides: [
        {
          slots: {
            headerContent: "font-semibold text-base text-dark",
            closeTrigger:
              "size-8 rounded-full bg-light-gray flex justify-center items-center",
            content: "rounded-t-[40rpx]",
            header: "border-b-0 px-5 pt-5 pb-2",
            grabber: "hidden",
            footer:
              "border-t-0 px-5 pt-2 pb-[calc(32rpx+env(safe-area-inset-bottom))]",
          },
        },
      ],
    });

    // Even if runtime global config has conflicting values, `pm: 1` skips runtime lookup
    globalHost.__CODE_UI_GLOBAL_CONFIG__ = {
      components: {
        drawer: {
          slots: {
            closeTrigger: "bg-danger",
          },
        },
      },
    };

    const slots = resolveSlots(compiled({ placement: "bottom", open: true }));
    expect(slots.closeTrigger).toContain("bg-light-gray");
    expect(slots.closeTrigger).toContain("size-8");
    expect(slots.closeTrigger).not.toContain("bg-danger");
    expect(slots.content).toContain("rounded-t-_b40rpx_B");
    expect(slots.content).not.toContain("rounded-t-xl");
    expect(slots.grabber).toContain("hidden");
  });
});
