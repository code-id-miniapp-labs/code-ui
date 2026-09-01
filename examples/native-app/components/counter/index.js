"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("@code-ui/components");
// Helper: generate mock items for heavy list processing
function generateItems(count) {
    const list = [];
    for (let i = 0; i < count; i++) {
        list.push({
            id: i,
            value: (i * 17 + 31) % 1000,
            category: i % 5 === 0 ? "finance" : i % 3 === 0 ? "tech" : "retail",
        });
    }
    return list;
}
// Global evaluation counters to verify fine-grained dependency isolation
let evalCountA = 0;
let evalCountB = 0;
let evalCountHeavy = 0;
Component((0, components_1.createComponentOptions)({
    behaviors: [components_1.computedBehavior],
    data: {
        a: 10,
        b: 5,
        items: generateItems(2000),
        filterCategory: "all",
        benchmarkDuration: 0,
        rapidRunProgress: "",
    },
    computed: {
        // ── Group A: 10 Computeds depending ONLY on `this.data.a` ───────────────
        evalA_summary() {
            evalCountA++;
            const a = this.data.a;
            return `Eval count: ${evalCountA}, val: ${a}`;
        },
        a_sq() {
            return Math.pow(this.data.a, 2);
        },
        a_cube() {
            return Math.pow(this.data.a, 3);
        },
        a_sqrt() {
            return Math.sqrt(Math.max(0, this.data.a)).toFixed(4);
        },
        a_sin() {
            return Math.sin(this.data.a).toFixed(4);
        },
        a_cos() {
            return Math.cos(this.data.a).toFixed(4);
        },
        a_binary() {
            return (this.data.a >>> 0).toString(2);
        },
        a_hex() {
            return "0x" + (this.data.a >>> 0).toString(16).toUpperCase();
        },
        a_isEven() {
            return this.data.a % 2 === 0 ? "Even" : "Odd";
        },
        a_label() {
            return `[A = ${this.data.a}] ${this.data.a > 50 ? "High" : "Normal"}`;
        },
        // ── Group B: 10 Computeds depending ONLY on `this.data.b` ───────────────
        evalB_summary() {
            evalCountB++;
            const b = this.data.b;
            return `Eval count: ${evalCountB}, val: ${b}`;
        },
        b_sq() {
            return Math.pow(this.data.b, 2);
        },
        b_cube() {
            return Math.pow(this.data.b, 3);
        },
        b_sqrt() {
            return Math.sqrt(Math.max(0, this.data.b)).toFixed(4);
        },
        b_sin() {
            return Math.sin(this.data.b).toFixed(4);
        },
        b_cos() {
            return Math.cos(this.data.b).toFixed(4);
        },
        b_binary() {
            return (this.data.b >>> 0).toString(2);
        },
        b_hex() {
            return "0x" + (this.data.b >>> 0).toString(16).toUpperCase();
        },
        b_isEven() {
            return this.data.b % 2 === 0 ? "Even" : "Odd";
        },
        b_label() {
            return `[B = ${this.data.b}] ${this.data.b > 50 ? "High" : "Normal"}`;
        },
        // ── Group C: Computeds depending on BOTH `a` and `b` ────────────────────
        combined_sum() {
            return this.data.a + this.data.b;
        },
        combined_product() {
            return this.data.a * this.data.b;
        },
        combined_ratio() {
            return this.data.b !== 0
                ? (this.data.a / this.data.b).toFixed(3)
                : "N/A";
        },
        // ── Group D: Heavy Computations (Array filtering & aggregation) ────────
        heavyListStats() {
            evalCountHeavy++;
            const startTime = Date.now();
            const items = this.data.items || [];
            const cat = this.data.filterCategory;
            const filtered = cat === "all" ? items : items.filter((x) => x.category === cat);
            let sum = 0;
            let max = -Infinity;
            let min = Infinity;
            for (let i = 0; i < filtered.length; i++) {
                const v = filtered[i].value;
                sum += v;
                if (v > max)
                    max = v;
                if (v < min)
                    min = v;
            }
            const avg = filtered.length ? (sum / filtered.length).toFixed(1) : 0;
            const duration = Date.now() - startTime;
            return {
                total: filtered.length,
                sum,
                avg,
                max: max === -Infinity ? 0 : max,
                min: min === Infinity ? 0 : min,
                computeMs: duration,
                evalCount: evalCountHeavy,
            };
        },
    },
    methods: {
        handleIncrementA() {
            this.setData({
                a: this.data.a + 1,
            });
        },
        handleIncrementB() {
            this.setData({
                b: this.data.b + 1,
            });
        },
        handleFilterCategory(e) {
            const cat = e.currentTarget.dataset.cat || "all";
            this.setData({
                filterCategory: cat,
            });
        },
        handleRegenerateItems() {
            this.setData({
                items: generateItems(3000),
            });
        },
        // Rapid mutation stress test: 50 back-to-back synchronous setData calls
        handleStressTest() {
            const start = Date.now();
            for (let i = 1; i <= 50; i++) {
                this.setData({
                    a: this.data.a + 1,
                });
            }
            const elapsed = Date.now() - start;
            this.setData({
                benchmarkDuration: elapsed,
                rapidRunProgress: `50 rapid setData calls completed in ${elapsed}ms`,
            });
        },
    },
}));
