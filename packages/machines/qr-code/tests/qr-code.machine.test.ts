import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { qrCodeMachine } from "../src/qr-code.machine";
import { connectQrCode } from "../src/qr-code.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("QR Code Machine", () => {
  describe("Initialization & Default Props", () => {
    it("initializes in idle state with default props", () => {
      const machine = new MiniappMachine(qrCodeMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("idle");

      const api = connectQrCode(machine.service);
      expect(api.state).toBe("idle");
      expect(api.value).toBe("");
      expect(api.ecc).toBe("M");
      expect(api.border).toBe(0);
      expect(api.pixelSize).toBe(10);
      expect(api.size).toBe("md");
      expect(api.color).toBe("neutral");
      expect(api.overlaySrc).toBe("");
      expect(api.showOverlay).toBe(false);
      expect(api.matrixSize).toBe(21);
      expect(api.viewBoxSize).toBe(210);
      expect(api.path.length).toBeGreaterThan(0);

      machine.stop();
    });

    it("encodes value using uqr and computes SVG path and viewBoxSize", () => {
      const machine = new MiniappMachine(qrCodeMachine, {
        value: "https://code-ui.dev",
        pixelSize: 8,
      });
      machine.start();

      const api = connectQrCode(machine.service);
      expect(api.value).toBe("https://code-ui.dev");
      expect(api.encoded.size).toBeGreaterThanOrEqual(21);
      expect(api.viewBoxSize).toBe(api.encoded.size * 8);
      expect(api.path).toContain("h8v8h-8z");
      expect(api.frameProps.viewBox).toBe(
        `0 0 ${api.viewBoxSize} ${api.viewBoxSize}`,
      );
      expect(api.patternProps.d).toBe(api.path);

      machine.stop();
    });

    it("supports quiet zone border and error correction level via flat props or encoding object", () => {
      const baseMachine = new MiniappMachine(qrCodeMachine, {
        value: "hello",
        ecc: "L",
        border: 0,
      });
      baseMachine.start();
      const baseApi = connectQrCode(baseMachine.service);

      const borderedMachine = new MiniappMachine(qrCodeMachine, {
        value: "hello",
        encoding: {
          ecc: "H",
          border: 2,
        },
      });
      borderedMachine.start();
      const borderedApi = connectQrCode(borderedMachine.service);

      expect(baseApi.ecc).toBe("L");
      expect(borderedApi.ecc).toBe("H");
      expect(borderedApi.border).toBe(2);
      expect(borderedApi.matrixSize).toBe(baseApi.matrixSize + 4);
      expect(borderedApi.viewBoxSize).toBe((baseApi.matrixSize + 4) * 10);

      baseMachine.stop();
      borderedMachine.stop();
    });
  });

  describe("Events & Dynamic Updates", () => {
    it("updates encoded value via setValue / VALUE.SET and fires callbacks", async () => {
      const onValueChange = vi.fn();
      const triggerEvent = vi.fn();
      const setData = vi.fn();

      const machine = new MiniappMachine(qrCodeMachine, {
        value: "initial",
        onValueChange,
        component: { triggerEvent, setData } as any,
      });
      machine.start();

      const initialApi = connectQrCode(machine.service);
      const initialPath = initialApi.path;

      initialApi.setValue("https://updated.example.com");
      await flush();

      const updatedApi = connectQrCode(machine.service);
      expect(updatedApi.value).toBe("https://updated.example.com");
      expect(updatedApi.path).not.toBe(initialPath);
      expect(onValueChange).toHaveBeenCalledWith({
        value: "https://updated.example.com",
      });
      expect(triggerEvent).toHaveBeenCalledWith("change", {
        value: "https://updated.example.com",
      });
      expect(setData).toHaveBeenCalledWith({
        value: "https://updated.example.com",
      });

      machine.stop();
    });

    it("updates encoding options via setEncoding / ENCODING.SET", async () => {
      const machine = new MiniappMachine(qrCodeMachine, {
        value: "code-ui",
        ecc: "L",
        border: 0,
      });
      machine.start();

      const api1 = connectQrCode(machine.service);
      expect(api1.ecc).toBe("L");
      expect(api1.border).toBe(0);
      const sizeWithoutBorder = api1.matrixSize;

      api1.setEncoding({ ecc: "Q", border: 3 });
      await flush();

      const api2 = connectQrCode(machine.service);
      expect(api2.ecc).toBe("Q");
      expect(api2.border).toBe(3);
      expect(api2.matrixSize).toBe(sizeWithoutBorder + 6);

      machine.stop();
    });

    it("reacts to machine.updateProps for value, ecc, border, size, color, and overlaySrc", () => {
      const machine = new MiniappMachine(qrCodeMachine, {
        value: "v1",
        size: "sm",
        color: "neutral",
      });
      machine.start();

      const api1 = connectQrCode(machine.service);
      expect(api1.value).toBe("v1");
      expect(api1.size).toBe("sm");
      expect(api1.showOverlay).toBe(false);

      machine.updateProps({
        value: "v2-updated",
        ecc: "H",
        border: 1,
        size: "xl",
        color: "primary",
        overlaySrc: "https://code-ui.dev/logo.png",
      });

      const api2 = connectQrCode(machine.service);
      expect(api2.value).toBe("v2-updated");
      expect(api2.ecc).toBe("H");
      expect(api2.border).toBe(1);
      expect(api2.size).toBe("xl");
      expect(api2.color).toBe("primary");
      expect(api2.overlaySrc).toBe("https://code-ui.dev/logo.png");
      expect(api2.showOverlay).toBe(true);

      machine.stop();
    });
  });

  describe("Data URL & Prop Getters", () => {
    it("generates valid SVG data URL via dataUrl and getDataUrl()", () => {
      const machine = new MiniappMachine(qrCodeMachine, {
        id: "test-qr",
        value: "https://example.com",
        color: "primary",
      });
      machine.start();

      const api = connectQrCode(machine.service);
      expect(api.dataUrl).toMatch(/^data:image\/svg\+xml,/);
      expect(api.getDataUrl("svg")).toBe(api.dataUrl);

      const decodedSvg = decodeURIComponent(
        api.dataUrl.replace("data:image/svg+xml,", ""),
      );
      expect(decodedSvg).toContain("<svg");
      expect(decodedSvg).toContain(api.path);
      expect(decodedSvg).toContain('fill="#10b981"');

      expect(api.frameProps.src).toBe(api.dataUrl);
      expect(api.getRootProps()).toEqual(api.rootProps);
      expect(api.getFrameProps()).toEqual(api.frameProps);
      expect(api.getPatternProps()).toEqual(api.patternProps);
      expect(api.getOverlayProps()).toEqual(api.overlayProps);
      expect(api.rootProps.id).toBe("qr-code:test-qr:root");
      expect(api.rootProps["data-scope"]).toBe("qr-code");
      expect(api.rootProps["data-part"]).toBe("root");
      expect(api.rootProps["aria-label"]).toBe(
        "QR code for https://example.com",
      );

      machine.stop();
    });
  });
});
