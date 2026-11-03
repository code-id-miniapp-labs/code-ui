import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetToastRegistry,
  addToast,
  clearToasts,
  dismissToast,
  findActiveToastHost,
  getToasts,
  registerToastHost,
  removeToast,
  unregisterToastHost,
  updateToast,
} from "../src/behaviors/toast";

describe("toast behavior", () => {
  beforeEach(() => {
    __resetToastRegistry();
    (globalThis as any).getCurrentPages = undefined;
  });

  it("registers and unregisters toast hosts", () => {
    const host = { __wxWebviewId__: "page-1" };
    registerToastHost(host);

    expect(findActiveToastHost(host)?.instance).toBe(host);

    unregisterToastHost(host);
    expect(findActiveToastHost(host)).toBeUndefined();
  });

  it("finds host via owner.__cuiApp", () => {
    const appHost = { __wxWebviewId__: "app-host-1" };
    const page = { __cuiApp: appHost, __wxWebviewId__: "page-1" };
    registerToastHost(appHost);

    expect(findActiveToastHost(page)?.instance).toBe(appHost);
  });

  it("finds host via owner.__cuiAppParent", () => {
    const appHost = { __wxWebviewId__: "app-host-1" };
    const childComponent = { __cuiAppParent: appHost };
    registerToastHost(appHost);

    expect(findActiveToastHost(childComponent)?.instance).toBe(appHost);
  });

  it("finds host via active page in getCurrentPages", () => {
    const appHost = { __wxWebviewId__: "app-host-top" };
    const topPage = { __cuiApp: appHost, getPageId: () => "top-page-id" };
    (globalThis as any).getCurrentPages = () => [topPage];
    registerToastHost(appHost);

    expect(findActiveToastHost()?.instance).toBe(appHost);
  });

  it("adds, updates, dismisses, and removes toasts", () => {
    const onChange = vi.fn();
    const host = { __wxWebviewId__: "page-main" };
    registerToastHost(host, onChange);

    const id = addToast({ title: "Hello", description: "World" }, host);
    expect(id).toBeDefined();
    expect(onChange).toHaveBeenCalledTimes(1);

    const list = getToasts(host);
    expect(list).toHaveLength(1);
    expect(list[0]?.title).toBe("Hello");
    expect(list[0]?.open).toBe(true);

    updateToast(id, { title: "Updated Hello" }, host);
    expect(getToasts(host)[0]?.title).toBe("Updated Hello");

    dismissToast(id, host);
    expect(getToasts(host)[0]?.open).toBe(false);

    removeToast(id, host);
    expect(getToasts(host)).toHaveLength(0);
  });

  it("flushes pending operations when host registers later", () => {
    const owner = { getPageId: () => "deferred-page" };
    const id = addToast({ title: "Queued Toast" }, owner);

    expect(id).toBeDefined();

    const onChange = vi.fn();
    const host = { getPageId: () => "deferred-page" };
    registerToastHost(host, onChange);

    expect(onChange).toHaveBeenCalled();
    expect(getToasts(host)).toHaveLength(1);
    expect(getToasts(host)[0]?.title).toBe("Queued Toast");
  });

  it("clears all toasts", () => {
    const host = { __wxWebviewId__: "p1" };
    registerToastHost(host);
    addToast({ title: "Toast 1", placement: "top" }, host);
    addToast({ title: "Toast 2", placement: "bottom" }, host);
    expect(getToasts(host)).toHaveLength(2);

    clearToasts(host);
    expect(getToasts(host)).toHaveLength(0);
  });

  it("replaces existing toast when added at the same placement", () => {
    const host = { __wxWebviewId__: "replace-host" };
    registerToastHost(host);

    addToast({ title: "Top 1", placement: "top" }, host);
    expect(getToasts(host)).toHaveLength(1);
    expect(getToasts(host)[0]?.title).toBe("Top 1");

    // Second toast at same placement should replace the first
    addToast({ title: "Top 2", placement: "top" }, host);
    expect(getToasts(host)).toHaveLength(1);
    expect(getToasts(host)[0]?.title).toBe("Top 2");

    // Same for center HUDs
    addToast({ title: "Loading...", mode: "native", placement: "center" }, host);
    expect(getToasts(host)).toHaveLength(2); // Top 2 + Center Loading

    addToast({ title: "Success!", mode: "native", placement: "center" }, host);
    expect(getToasts(host)).toHaveLength(2); // Top 2 + Center Success (replaced Loading)
    const centerToast = getToasts(host).find((t) => t.placement === "center");
    expect(centerToast?.title).toBe("Success!");
  });

  it("limits max toasts across placements and evicts oldest (default max = 2)", () => {
    const host = { __wxWebviewId__: "max-host" };
    registerToastHost(host);

    addToast({ title: "First at Center", placement: "center" }, host);
    addToast({ title: "Second at Bottom", placement: "bottom" }, host);
    expect(getToasts(host)).toHaveLength(2);

    // Adding third at different placement ("top") should evict oldest ("First at Center")
    addToast({ title: "Third at Top", placement: "top" }, host);
    expect(getToasts(host)).toHaveLength(2);
    expect(getToasts(host).map((t) => t.title)).toEqual([
      "Second at Bottom",
      "Third at Top",
    ]);
  });
});

