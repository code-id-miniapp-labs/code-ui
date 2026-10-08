import { describe, it } from "vitest";
import { effect, signal, computed, effectScope, pauseTracking, resumeTracking, startBatch, endBatch } from "alien-signals";
import { diffSnapshot } from "@code-ui/utils";

function untracked(fn: any) {
  pauseTracking();
  try { return fn(); } finally { resumeTracking(); }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

describe("Alien Signals repro", () => {
  it("reproduces machine connect", async () => {
    const _signal = signal("idle");
    const state = {
      get() { return _signal(); },
      set(val: string) { _signal(val); }
    };
    
    let cache = new Map();
    const createComputed = () => {
      return (key: string) => {
        let getter = cache.get(key);
        if (!getter) {
          getter = computed(() => state.get() === "loading");
          cache.set(key, getter);
        }
        return getter();
      };
    };

    const computedFn = createComputed();

    const service = {
      state,
      computed: computedFn
    };

    const connectButton = (srv: any) => {
      return {
        state: srv.state.get(),
        loading: srv.computed("isLoading"),
        setLoading: () => {}
      };
    };

    const subscribe = (fn: any) => {
      untracked(() => { fn(service); });
    };

    const scope1 = effectScope(() => {
      effect(() => {
        // notify effect
        state.get();
        subscribe((s: any) => {
          console.log("SUBSCRIBE:", connectButton(s).loading);
        });
      });
    });

    let prevSnapshot: any;
    const scope2 = effectScope(() => {
      effect(() => {
        // connect effect
        const snap = connectButton(service);
        console.log("CONNECT EVAL:", snap.loading);
        const delta = diffSnapshot(prevSnapshot, snap, "button");
        prevSnapshot = snap;
      });
    });

    console.log("Setting loading");
    startBatch();
    state.set("loading");
    endBatch();
    
    await sleep(10);
  });
});
