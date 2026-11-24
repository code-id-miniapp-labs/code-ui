const HEAVY_PAYLOAD_BYTES = 64 * 1024;
const SLOW_SETDATA_MS = 50;

export interface PerfEntryRecord {
  entryType: string;
  name: string;
  duration: number;
  startTime: number;
  path: string;
}

export interface SetDataOwnerStats {
  calls: number;
  totalBytes: number;
  maxBytes: number;
  maxKeys: string[];
  totalLatencyMs: number;
  maxLatencyMs: number;
  latencySamples: number;
}

export interface PerfReport {
  label: string;
  coldStartEntries: PerfEntryRecord[];
  wallSinceBootMs: number;
  memoryWarnings: Array<{ level: number; atMs: number }>;
  setData: {
    totalCalls: number;
    totalKB: number;
    maxKB: number;
    avgLatencyMs: number;
    maxLatencyMs: number;
    byOwner: Record<
      string,
      {
        calls: number;
        totalKB: number;
        maxKB: number;
        maxKeys: string[];
        avgLatencyMs: number;
        maxLatencyMs: number;
      }
    >;
  };
}

export interface PerfLoggerOptions {
  label?: string;
  enabled?: boolean;
}

export interface PerfLoggerHandle {
  getReport: () => PerfReport;
  printReport: () => PerfReport;
  reset: () => void;
}

declare const wx: any;

let initialized = false;

function estimatePayloadBytes(data: unknown): number {
  if (!data || typeof data !== "object") return 0;
  try {
    return JSON.stringify(data).length;
  } catch {
    return 0;
  }
}

function toKB(bytes: number): number {
  return Math.round((bytes / 1024) * 100) / 100;
}

export function initPerfLogger(
  options: string | PerfLoggerOptions = {},
): PerfLoggerHandle | null {
  const opts = typeof options === "string" ? { label: options } : options;
  const label = opts.label || "miniapp";
  const enabled = opts.enabled ?? true;

  if (!enabled) return null;
  if (initialized) {
    return (
      ((globalThis as any).__PERF__ as PerfLoggerHandle | undefined) ?? null
    );
  }
  initialized = true;

  const bootAt = Date.now();
  const coldStartEntries: PerfEntryRecord[] = [];
  const memoryWarnings: Array<{ level: number; atMs: number }> = [];
  let ownerStats = new Map<string, SetDataOwnerStats>();

  const recordSetData = (
    owner: string,
    bytes: number,
    keys: string[],
    latencyMs: number | null,
  ) => {
    let stat = ownerStats.get(owner);
    if (!stat) {
      stat = {
        calls: 0,
        totalBytes: 0,
        maxBytes: 0,
        maxKeys: [],
        totalLatencyMs: 0,
        maxLatencyMs: 0,
        latencySamples: 0,
      };
      ownerStats.set(owner, stat);
    }
    stat.calls += 1;
    stat.totalBytes += bytes;
    if (bytes > stat.maxBytes) {
      stat.maxBytes = bytes;
      stat.maxKeys = keys.slice(0, 8);
    }
    if (latencyMs !== null) {
      stat.totalLatencyMs += latencyMs;
      stat.latencySamples += 1;
      if (latencyMs > stat.maxLatencyMs) {
        stat.maxLatencyMs = latencyMs;
      }
    }

    if (
      bytes >= HEAVY_PAYLOAD_BYTES ||
      (latencyMs !== null && latencyMs >= SLOW_SETDATA_MS)
    ) {
      console.warn(
        `[Perf:${label}][setData:heavy] ${owner} | ${toKB(bytes)} KB | ${latencyMs ?? "-"} ms | keys: ${keys.slice(0, 6).join(", ")}`,
      );
    }
  };

  const patchInstanceSetData = (instance: any, fallbackOwner: string) => {
    if (
      !instance ||
      typeof instance.setData !== "function" ||
      instance.__perfSetDataPatched
    )
      return;
    instance.__perfSetDataPatched = true;
    const origSetData = instance.setData;
    instance.setData = function patchedSetData(
      data: Record<string, any>,
      callback?: () => void,
    ) {
      const owner = String(
        this?.route || this?.is || fallbackOwner || "unknown",
      );
      const bytes = estimatePayloadBytes(data);
      const keys = data && typeof data === "object" ? Object.keys(data) : [];
      const t0 = Date.now();
      return origSetData.call(this, data, () => {
        const latencyMs = Date.now() - t0;
        recordSetData(owner, bytes, keys, latencyMs);
        callback?.();
      });
    };
  };

  // 1. Observe cold-start & route timings via wx.getPerformance()
  try {
    if (typeof wx !== "undefined" && typeof wx.getPerformance === "function") {
      const perf = wx.getPerformance();
      const observer = perf?.createObserver?.((entryList: any) => {
        const entries = entryList?.getEntries?.() || [];
        for (const entry of entries) {
          const rec: PerfEntryRecord = {
            entryType: String(entry.entryType || ""),
            name: String(entry.name || ""),
            duration: Math.round(Number(entry.duration || 0) * 100) / 100,
            startTime: Math.round(Number(entry.startTime || 0) * 100) / 100,
            path: String(entry.path || ""),
          };
          coldStartEntries.push(rec);
          console.info(
            `[Perf:${label}][${rec.entryType}] ${rec.name}: ${rec.duration}ms${rec.path ? ` (${rec.path})` : ""}`,
          );
        }
      });
      observer?.observe?.({ entryTypes: ["navigation", "render", "script"] });
    }
  } catch {
    // ignore if platform does not support PerformanceObserver
  }

  // 2. Track memory warnings
  try {
    if (typeof wx !== "undefined" && typeof wx.onMemoryWarning === "function") {
      wx.onMemoryWarning((res: any) => {
        const level = Number(res?.level ?? -1);
        memoryWarnings.push({ level, atMs: Date.now() - bootAt });
        console.warn(`[Perf:${label}][memoryWarning] level=${level}`);
      });
    }
  } catch {
    // ignore
  }

  // 3. Wrap Page() & Component() to track every setData payload & latency
  try {
    const g = globalThis as any;
    if (typeof g.Page === "function" && !g.Page.__perfWrapped) {
      const OrigPage = g.Page;
      const WrappedPage = function (pageOptions: Record<string, any>) {
        if (pageOptions && typeof pageOptions === "object") {
          const origOnLoad = pageOptions.onLoad;
          pageOptions.onLoad = function (this: any, ...args: any[]) {
            patchInstanceSetData(this, "page");
            return origOnLoad?.apply(this, args);
          };
        }
        return OrigPage(pageOptions);
      };
      (WrappedPage as any).__perfWrapped = true;
      g.Page = WrappedPage;
    }

    if (typeof g.Component === "function" && !g.Component.__perfWrapped) {
      const OrigComponent = g.Component;
      const WrappedComponent = function (compOptions: Record<string, any>) {
        if (compOptions && typeof compOptions === "object") {
          const target =
            compOptions.lifetimes && typeof compOptions.lifetimes === "object"
              ? compOptions.lifetimes
              : compOptions;
          const origCreated = target.created;
          target.created = function (this: any, ...args: any[]) {
            patchInstanceSetData(this, "component");
            return origCreated?.apply(this, args);
          };
        }
        return OrigComponent(compOptions);
      };
      (WrappedComponent as any).__perfWrapped = true;
      g.Component = WrappedComponent;
    }
  } catch {
    // ignore if global Page/Component is non-writable
  }

  const getReport = (): PerfReport => {
    let totalCalls = 0;
    let totalBytes = 0;
    let maxBytes = 0;
    let totalLatencyMs = 0;
    let latencySamples = 0;
    let maxLatencyMs = 0;

    const byOwner: PerfReport["setData"]["byOwner"] = {};
    const sorted = Array.from(ownerStats.entries()).sort(
      (a, b) => b[1].totalBytes - a[1].totalBytes,
    );

    for (const [owner, s] of sorted) {
      totalCalls += s.calls;
      totalBytes += s.totalBytes;
      if (s.maxBytes > maxBytes) maxBytes = s.maxBytes;
      totalLatencyMs += s.totalLatencyMs;
      latencySamples += s.latencySamples;
      if (s.maxLatencyMs > maxLatencyMs) maxLatencyMs = s.maxLatencyMs;

      byOwner[owner] = {
        calls: s.calls,
        totalKB: toKB(s.totalBytes),
        maxKB: toKB(s.maxBytes),
        maxKeys: s.maxKeys,
        avgLatencyMs:
          s.latencySamples > 0
            ? Math.round((s.totalLatencyMs / s.latencySamples) * 10) / 10
            : 0,
        maxLatencyMs: s.maxLatencyMs,
      };
    }

    return {
      label,
      coldStartEntries: [...coldStartEntries],
      wallSinceBootMs: Date.now() - bootAt,
      memoryWarnings: [...memoryWarnings],
      setData: {
        totalCalls,
        totalKB: toKB(totalBytes),
        maxKB: toKB(maxBytes),
        avgLatencyMs:
          latencySamples > 0
            ? Math.round((totalLatencyMs / latencySamples) * 10) / 10
            : 0,
        maxLatencyMs,
        byOwner,
      },
    };
  };

  const handle: PerfLoggerHandle = {
    getReport,
    printReport: () => {
      const report = getReport();
      console.info(
        `[Perf:${label}] Summary:\n${JSON.stringify(report, null, 2)}`,
      );
      return report;
    },
    reset: () => {
      ownerStats = new Map<string, SetDataOwnerStats>();
      console.info(`[Perf:${label}] setData counters reset`);
    },
  };

  try {
    (globalThis as any).__PERF__ = handle;
  } catch {
    // ignore
  }

  return handle;
}
