import { describe, it, expect, vi, afterEach } from "vitest";
import { signal } from "alien-signals";
import { createMachine, MachineStatus } from "@code-ui/core";
import { MiniappMachine } from "../src/machine";

/** Events are drained in a single microtask, so one tick flushes everything. */
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

/** Builds an action/effect implementation map that records calls into `log`. */
function recorder(log: string[], names: string[]) {
  return Object.fromEntries(names.map((n) => [n, () => void log.push(n)]));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MiniappMachine › lifecycle", () => {
  it("enters the initial state and runs root + state entry on start", () => {
    const log: string[] = [];
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "idle",
        entry: ["rootEntry"],
        states: { idle: { entry: ["idleEntry"] } },
        implementations: { actions: recorder(log, ["rootEntry", "idleEntry"]) },
      }),
    );

    expect(log).toEqual([]);
    m.start();
    expect(m.state.get()).toBe("idle");
    expect(log).toEqual(["rootEntry", "idleEntry"]);
    m.stop();
  });

  it("resolves the initial state from props", () => {
    const m = new MiniappMachine(
      createMachine({
        initialState: ({ prop }) => (prop("open") ? "open" : "closed"),
        states: { open: {}, closed: {} },
      }),
      { open: true },
    );
    expect(m.state.get()).toBe("open");
  });

  it("start() is idempotent", () => {
    const entry = vi.fn();
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "idle",
        states: { idle: { entry: ["entry"] } },
        implementations: { actions: { entry } },
      }),
    );
    m.start();
    m.start();
    expect(entry).toHaveBeenCalledTimes(1);
    m.stop();
  });

  it("stop() disposes active effects, runs root exit once and is idempotent", () => {
    const log: string[] = [];
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "idle",
        exit: ["rootExit"],
        effects: ["rootFx"],
        states: { idle: { effects: ["idleFx"] } },
        implementations: {
          actions: recorder(log, ["rootExit"]),
          effects: {
            rootFx: () => () => void log.push("rootFx:cleanup"),
            idleFx: () => () => void log.push("idleFx:cleanup"),
          },
        },
      }),
    );
    m.start();
    m.stop();
    m.stop();

    expect(log).toEqual(["idleFx:cleanup", "rootFx:cleanup", "rootExit"]);
    expect(m.service.getStatus()).toBe(MachineStatus.Stopped);
  });

  it("stop() on a never-started machine does not run exit actions", () => {
    const rootExit = vi.fn();
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "idle",
        exit: ["rootExit"],
        states: { idle: {} },
        implementations: { actions: { rootExit } },
      }),
    );
    m.stop();
    expect(rootExit).not.toHaveBeenCalled();
  });
});

describe("MiniappMachine › transitions", () => {
  it("follows SCXML ordering: exit fx → exit → transition → entry fx → entry", async () => {
    const log: string[] = [];
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "a",
        states: {
          a: {
            effects: ["aFx"],
            exit: ["aExit"],
            on: { GO: { target: "b", actions: ["onGo"] } },
          },
          b: { effects: ["bFx"], entry: ["bEntry"] },
        },
        implementations: {
          actions: recorder(log, ["aExit", "onGo", "bEntry"]),
          effects: {
            aFx: () => () => void log.push("aFx:cleanup"),
            bFx: () => void log.push("bFx"),
          },
        },
      }),
    );
    m.start();
    m.send({ type: "GO" });
    await flush();

    expect(m.state.get()).toBe("b");
    expect(log).toEqual(["aFx:cleanup", "aExit", "onGo", "bFx", "bEntry"]);
    m.stop();
  });

  it("targetless transitions run actions only (no exit/entry)", async () => {
    const log: string[] = [];
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "idle",
        states: {
          idle: {
            entry: ["entry"],
            exit: ["exit"],
            on: { PING: { actions: ["pong"] } },
          },
        },
        implementations: { actions: recorder(log, ["entry", "exit", "pong"]) },
      }),
    );
    m.start();
    log.length = 0;

    m.send({ type: "PING" });
    await flush();
    expect(log).toEqual(["pong"]);
    m.stop();
  });

  it("reenter: true re-runs exit and entry of the same state", async () => {
    const log: string[] = [];
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "idle",
        states: {
          idle: {
            entry: ["entry"],
            exit: ["exit"],
            on: { RESET: { reenter: true, actions: ["reset"] } },
          },
        },
        implementations: { actions: recorder(log, ["entry", "exit", "reset"]) },
      }),
    );
    m.start();
    log.length = 0;

    m.send({ type: "RESET" });
    await flush();
    expect(log).toEqual(["exit", "reset", "entry"]);
    m.stop();
  });

  it("handles nested states: compound initial, bubbling and exit order", async () => {
    const log: string[] = [];
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "open",
        on: { RESET: { target: "closed" } },
        states: {
          open: {
            initial: "idle",
            exit: ["openExit"],
            on: { CLOSE: { target: "closed" } },
            states: {
              idle: { exit: ["idleExit"], on: { DRAG: { target: "dragging" } } },
              dragging: { exit: ["draggingExit"] },
            },
          },
          closed: { on: { OPEN: { target: "open" } } },
        },
        implementations: {
          actions: recorder(log, ["openExit", "idleExit", "draggingExit"]),
        },
      }),
    );
    m.start();
    expect(m.state.get()).toBe("open.idle");

    m.send({ type: "DRAG" });
    await flush();
    expect(m.state.get()).toBe("open.dragging");
    expect(m.service.state.matches("open")).toBe(true);

    m.send({ type: "CLOSE" });
    await flush();
    expect(m.state.get()).toBe("closed");
    expect(log).toEqual(["idleExit", "draggingExit", "openExit"]);

    m.send({ type: "OPEN" });
    await flush();
    expect(m.state.get()).toBe("open.idle");

    m.send({ type: "RESET" });
    await flush();
    expect(m.state.get()).toBe("closed");
    m.stop();
  });

  it("supports hasTag on the active state chain", () => {
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "open",
        states: {
          open: {
            tags: ["visible"],
            initial: "idle",
            states: { idle: { tags: ["interactive"] } },
          },
        },
      }),
    );
    m.start();
    expect(m.service.state.hasTag("visible")).toBe(true);
    expect(m.service.state.hasTag("interactive")).toBe(true);
    expect(m.service.state.hasTag("hidden")).toBe(false);
    m.stop();
  });

  it("an action calling state.set() directly does not replay the transition", async () => {
    const onGo = vi.fn(({ state }: any) => state.set("c"));
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "a",
        states: {
          a: { on: { GO: { target: "b", actions: ["onGo"] } } },
          b: {},
          c: {},
        },
        implementations: { actions: { onGo } },
      }),
    );
    m.start();
    m.send({ type: "GO" });
    await flush();

    expect(onGo).toHaveBeenCalledTimes(1);
    expect(m.state.get()).toBe("c");
    m.stop();
  });
});

describe("MiniappMachine › guards", () => {
  const build = (allowed: { value: boolean }) =>
    new MiniappMachine(
      createMachine({
        initialState: () => "idle",
        states: {
          idle: {
            on: {
              GO: [
                { guard: "isAllowed", target: "allowed" },
                { guard: () => false, target: "never" },
                { target: "fallback" },
              ],
            },
          },
          allowed: {},
          never: {},
          fallback: {},
        },
        implementations: { guards: { isAllowed: () => allowed.value } },
      }),
    );

  it("picks the first enabled transition", async () => {
    const m = build({ value: true });
    m.start();
    m.send({ type: "GO" });
    await flush();
    expect(m.state.get()).toBe("allowed");
    m.stop();
  });

  it("falls through to the unguarded transition", async () => {
    const m = build({ value: false });
    m.start();
    m.send({ type: "GO" });
    await flush();
    expect(m.state.get()).toBe("fallback");
    m.stop();
  });

  it("treats a missing guard implementation as disabled and warns", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "idle",
        states: {
          idle: { on: { GO: { guard: "missing", target: "next" } } },
          next: {},
        },
      }),
    );
    m.start();
    m.send({ type: "GO" });
    await flush();

    expect(m.state.get()).toBe("idle");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/No implementation found for guard .*missing/),
    );
    m.stop();
  });
});

describe("MiniappMachine › event queue", () => {
  const counterMachine = (extra: Record<string, any> = {}) =>
    createMachine({
      initialState: () => "idle",
      context: ({ bindable }) => ({
        trail: bindable<string[]>(() => ({ defaultValue: [] })),
      }),
      states: {
        idle: {
          on: {
            A: { actions: ["recordA", "sendB"] },
            B: { actions: ["recordB"] },
            C: { actions: ["recordC"] },
          },
        },
      },
      implementations: {
        actions: {
          recordA: ({ context }: any) => context.set("trail", (t: string[]) => [...t, "A"]),
          recordB: ({ context }: any) => context.set("trail", (t: string[]) => [...t, "B"]),
          recordC: ({ context }: any) => context.set("trail", (t: string[]) => [...t, "C"]),
          sendB: ({ send }: any) => send({ type: "B" }),
          ...extra,
        },
      },
    });

  it("processes events asynchronously in FIFO order", async () => {
    const m = new MiniappMachine(counterMachine());
    m.start();
    m.send({ type: "C" });
    m.send({ type: "C" });
    expect(m.context.get("trail")).toEqual([]);

    await flush();
    expect(m.context.get("trail")).toEqual(["C", "C"]);
    m.stop();
  });

  it("is run-to-completion: events raised in actions run after the current one, in the same drain", async () => {
    const m = new MiniappMachine(counterMachine());
    m.start();
    m.send({ type: "A" });
    m.send({ type: "C" });

    await flush();
    expect(m.context.get("trail")).toEqual(["A", "C", "B"]);
    m.stop();
  });

  it("schedules a single microtask for a burst of events", async () => {
    const spy = vi.spyOn(globalThis, "queueMicrotask");
    const m = new MiniappMachine(counterMachine());
    m.start();
    spy.mockClear();

    for (let i = 0; i < 50; i++) m.send({ type: "C" });
    expect(spy).toHaveBeenCalledTimes(1);

    await flush();
    expect(m.context.get("trail")).toHaveLength(50);
    m.stop();
  });

  it("ignores events before start and after stop", async () => {
    const m = new MiniappMachine(counterMachine());
    m.send({ type: "C" });
    m.start();
    await flush();
    expect(m.context.get("trail")).toEqual([]);

    m.stop();
    m.send({ type: "C" });
    await flush();
    expect(m.context.get("trail")).toEqual([]);
  });

  it("drops queued events if the machine is stopped before they are processed", async () => {
    const m = new MiniappMachine(counterMachine());
    m.start();
    m.send({ type: "C" });
    m.stop();
    await flush();
    expect(m.context.get("trail")).toEqual([]);
  });

  it("exposes current and previous events", async () => {
    const seen: Array<[string, string]> = [];
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "idle",
        states: { idle: { on: { X: { actions: ["log"] }, Y: { actions: ["log"] } } } },
        implementations: {
          actions: {
            log: ({ event }: any) => seen.push([event.type, event.previous().type]),
          },
        },
      }),
    );
    m.start();
    m.send({ type: "X" });
    m.send({ type: "Y", payload: 1 });
    await flush();

    expect(seen).toEqual([
      ["X", ""],
      ["Y", "X"],
    ]);
    expect(m.service.event.current()).toEqual({ type: "Y", payload: 1 });
    m.stop();
  });
});

describe("MiniappMachine › effects & track", () => {
  it("cleans up state effects on exit and supports multiple effects", async () => {
    const log: string[] = [];
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "on",
        states: {
          on: { effects: ["fx1", "fx2"], on: { TOGGLE: { target: "off" } } },
          off: { on: { TOGGLE: { target: "on" } } },
        },
        implementations: {
          effects: {
            fx1: () => () => void log.push("fx1:cleanup"),
            fx2: () => () => void log.push("fx2:cleanup"),
          },
        },
      }),
    );
    m.start();
    m.send({ type: "TOGGLE" });
    await flush();
    expect(log).toEqual(["fx1:cleanup", "fx2:cleanup"]);

    m.send({ type: "TOGGLE" });
    m.send({ type: "TOGGLE" });
    await flush();
    expect(log).toHaveLength(4);
    m.stop();
  });

  it("track re-runs on dep changes only and is disposed when its state exits", async () => {
    const dep = signal(0);
    const other = signal(0);
    const runs: number[] = [];

    const m = new MiniappMachine(
      createMachine({
        initialState: () => "watching",
        states: {
          watching: { effects: ["watchDep"], on: { LEAVE: { target: "idle" } } },
          idle: {},
        },
        implementations: {
          effects: {
            watchDep: ({ track }: any) => {
              track([() => dep()], () => {
                other();
                runs.push(dep());
              });
            },
          },
        },
      }),
    );
    m.start();
    expect(runs).toEqual([0]);

    dep(1);
    expect(runs).toEqual([0, 1]);

    other(1);
    expect(runs).toEqual([0, 1]);

    m.send({ type: "LEAVE" });
    await flush();
    dep(2);
    expect(runs).toEqual([0, 1]);
    m.stop();
  });

  it("warns on missing action/effect implementations without throwing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "idle",
        states: { idle: { entry: ["nope"], effects: ["nada"] } },
      }),
    );
    expect(() => m.start()).not.toThrow();
    expect(warnSpy).toHaveBeenCalledTimes(2);
    m.stop();
  });
});

describe("MiniappMachine › props", () => {
  it("applies machine.props defaults when user props are undefined", () => {
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "idle",
        props: ({ props }) => ({ size: "md", ...props }),
        states: { idle: {} },
      }),
      { size: undefined, variant: "solid" },
    );
    expect(m.prop("size")).toBe("md");
    expect(m.prop("variant")).toBe("solid");
  });

  it("merges updates and reflects them in prop()", () => {
    const m = new MiniappMachine(
      createMachine({ initialState: () => "idle", states: { idle: {} } }),
      { a: 1, b: 1 },
    );
    m.updateProps({ b: 2 });
    m.updateProps(() => ({ c: 3 }));
    expect([m.prop("a"), m.prop("b"), m.prop("c")]).toEqual([1, 2, 3]);
  });

  it("updateProps notifies subscribers, but skips no-op updates", () => {
    const m = new MiniappMachine(
      createMachine({ initialState: () => "idle", states: { idle: {} } }),
      { a: 1 },
    );
    m.start();
    const sub = vi.fn();
    m.subscribe(sub);

    m.updateProps({ a: 1 });
    expect(sub).not.toHaveBeenCalled();

    m.updateProps({ a: 2 });
    expect(sub).toHaveBeenCalledTimes(1);
    m.stop();
  });

  it("re-runs watch when props change", () => {
    const watch = vi.fn();
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "idle",
        watch: ({ prop }) => watch(prop("open")),
        states: { idle: {} },
      }),
      { open: false },
    );
    m.start();
    m.updateProps({ open: true });
    expect(watch.mock.calls.map((c) => c[0])).toEqual([false, true]);
    m.stop();
  });

  describe("onXxx event bridge", () => {
    const schema = createMachine({ initialState: () => "idle", states: { idle: {} } });

    it("forwards to component.triggerEvent with a lower-cased event name", () => {
      const component = { triggerEvent: vi.fn() };
      const m = new MiniappMachine(schema, { component });
      const detail = { x: 1 };
      m.prop("onValueChange")(detail);
      expect(component.triggerEvent).toHaveBeenCalledWith("valueChange", detail);
    });

    it("returns a stable function identity across reads", () => {
      const m = new MiniappMachine(schema, { component: { triggerEvent: vi.fn() } });
      expect(m.prop("onTap")).toBe(m.prop("onTap"));
    });

    it("prefers a user-provided handler", () => {
      const onTap = vi.fn();
      const m = new MiniappMachine(schema, {
        component: { triggerEvent: vi.fn() },
        onTap,
      });
      expect(m.prop("onTap")).toBe(onTap);
    });

    it("returns undefined without a component", () => {
      const m = new MiniappMachine(schema, {});
      expect(m.prop("onTap")).toBeUndefined();
      expect(m.prop("other")).toBeUndefined();
    });

    it("captures a promise via detail.setPromise and restores owner methods", async () => {
      const owner = { handler: () => 1 };
      const original = owner.handler;
      const promise = Promise.resolve("done");
      const component = {
        selectOwnerComponent: () => owner,
        triggerEvent: (_: string, detail: any) => {
          owner.handler();
          detail.setPromise(promise);
        },
      };
      const m = new MiniappMachine(schema, { component });

      const ret = m.prop("onTap")({});
      expect(ret).toBe(promise);
      expect(owner.handler).toBe(original);
      await expect(ret).resolves.toBe("done");
    });
  });
});

describe("MiniappMachine › context, computed & notifications", () => {
  const schema = () =>
    createMachine({
      initialState: () => "idle",
      context: ({ bindable }) => ({
        count: bindable<number>(() => ({ defaultValue: 0 })),
        label: bindable<string>(() => ({ defaultValue: "" })),
      }),
      computed: {
        double: ({ context }) => context.get("count") * 2,
      },
      states: {
        idle: { on: { BUMP: { target: "busy", actions: ["bump"] } } },
        busy: {},
      },
      implementations: {
        actions: {
          bump: ({ context }: any) => {
            context.set("count", 1);
            context.set("label", "bumped");
          },
        },
      },
    });

  it("exposes context get/set/initial/hash", () => {
    const m = new MiniappMachine(schema());
    m.context.set("count", 5);
    expect(m.context.get("count")).toBe(5);
    expect(m.context.initial("count")).toBe(0);
    expect(m.context.hash("count")).toBe("5");
  });

  it("memoizes computed values and recomputes on dependency change", () => {
    const double = vi.fn(({ context }: any) => context.get("count") * 2);
    const base = schema();
    const m = new MiniappMachine({ ...base, computed: { double } });

    expect(m.computed("double")).toBe(0);
    expect(m.computed("double")).toBe(0);
    expect(double).toHaveBeenCalledTimes(1);

    m.context.set("count", 4);
    expect(m.computed("double")).toBe(8);
    expect(double).toHaveBeenCalledTimes(2);
  });

  it("throws when computed is used without definitions", () => {
    const m = new MiniappMachine(
      createMachine({ initialState: () => "idle", states: { idle: {} } }),
    );
    expect(() => m.computed("x" as never)).toThrow(/No computed/);
  });

  it("emits exactly one notification per transition touching state + context", async () => {
    const m = new MiniappMachine(schema());
    m.start();
    const sub = vi.fn();
    m.subscribe(sub);

    m.send({ type: "BUMP" });
    await flush();

    expect(sub).toHaveBeenCalledTimes(1);
    expect(sub.mock.calls[0]?.[0].state.get()).toBe("busy");
    m.stop();
  });

  it("unsubscribing during notify does not skip other subscribers", () => {
    const m = new MiniappMachine(schema());
    m.start();
    const calls: string[] = [];
    const unsubA = m.subscribe(() => {
      calls.push("a");
      unsubA();
    });
    m.subscribe(() => calls.push("b"));

    m.context.set("count", 1);
    m.context.set("count", 2);
    expect(calls).toEqual(["a", "b", "b"]);
    m.stop();
  });

  it("subscriber reads do not become dependencies of the notifier", () => {
    const m = new MiniappMachine(schema(), { size: "sm" });
    m.start();
    const sub = vi.fn((service: any) => service.prop("size"));
    m.subscribe(sub);

    m.context.set("count", 1);
    m.updateProps({ size: "lg" });
    expect(sub).toHaveBeenCalledTimes(2);
    m.stop();
  });

  it("stop() clears subscriptions", () => {
    const m = new MiniappMachine(schema());
    m.start();
    const sub = vi.fn();
    m.subscribe(sub);
    m.stop();
    m.context.set("count", 1);
    expect(sub).not.toHaveBeenCalled();
  });
});

describe("MiniappMachine › performance", () => {
  it("memoizes machine.props across repeated prop() reads", () => {
    const propsFn = vi.fn(({ props: p }: any) => ({ size: "md", ...p }));
    const m = new MiniappMachine(
      createMachine({ initialState: () => "idle", props: propsFn, states: { idle: {} } }),
      { variant: "solid" },
    );
    propsFn.mockClear();

    for (let i = 0; i < 1000; i++) {
      m.prop("size");
      m.prop("variant");
    }
    expect(propsFn).toHaveBeenCalledTimes(1);

    m.updateProps({ variant: "ghost" });
    expect(m.prop("variant")).toBe("ghost");
    expect(propsFn).toHaveBeenCalledTimes(2);
  });

  it("does not re-resolve initialState on state reads", () => {
    const initialState = vi.fn(() => "idle");
    const m = new MiniappMachine(createMachine({ initialState, states: { idle: {} } }));
    m.start();
    for (let i = 0; i < 1000; i++) m.state.get();
    expect(initialState).toHaveBeenCalledTimes(1);
    m.stop();
  });

  it("reuses params/service objects until the event changes", async () => {
    const m = new MiniappMachine(
      createMachine({
        initialState: () => "idle",
        states: { idle: { on: { PING: {} } } },
      }),
    );
    m.start();
    const p1 = m.getParams();
    const s1 = m.service;
    expect(m.getParams()).toBe(p1);
    expect(m.service).toBe(s1);
    expect(p1.state).toBe(s1.state);

    m.send({ type: "PING" });
    await flush();
    expect(m.getParams()).not.toBe(p1);
    expect(m.getParams().event.type).toBe("PING");
    expect(m.service).not.toBe(s1);
    m.stop();
  });

  it("does not grow work with repeated updateProps calls", () => {
    const propsFn = vi.fn(({ props: p }: any) => p);
    const m = new MiniappMachine(
      createMachine({ initialState: () => "idle", props: propsFn, states: { idle: {} } }),
    );
    for (let i = 0; i < 500; i++) m.updateProps({ n: i });
    propsFn.mockClear();

    expect(m.prop("n")).toBe(499);
    expect(propsFn).toHaveBeenCalledTimes(1);
  });
});
