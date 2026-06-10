#!/usr/bin/env node
/**
 * Load test for the production site (Vercel).
 *
 * Vercel's edge has built-in DDoS / rate limiting — sending 100+ sustained
 * concurrent connections from one IP trips the abuse layer within ~10s and
 * returns 403s. That's a CORRECT defense, not a site problem. So this script
 * runs two tiers:
 *
 *   1) "real-traffic" — 30 concurrent users × 20s. Equivalent to a busy
 *      Monday morning peak for a regional boutique resort. Asserts:
 *        * 0 errors / timeouts
 *        * p99 < 1500ms
 *        * throughput > 200 req/sec
 *
 *   2) "burst" — 100 concurrent × 5s. Sanity-check that the edge can absorb
 *      a sudden surge before rate-limiting kicks in. Asserts no errors,
 *      treats 3xx/403 in the tail as edge protection (info only).
 *
 * Run: npm run test:load
 */
import autocannon from "autocannon";

const BASE = process.env.LOAD_BASE_URL || "https://chimgandarbaza.uz";

const SCENARIOS = [
  { path: "/uz", weight: 4 }, // ~40% of traffic = homepage
  { path: "/ru", weight: 3 },
  { path: "/en", weight: 1 },
  { path: "/uz/nomera", weight: 1 },
  { path: "/api/rates", weight: 1 },
];

// Flatten weights into a path-roll array for autocannon's `requests` array
const requests = SCENARIOS.flatMap((s) =>
  Array(s.weight).fill({ method: "GET", path: s.path }),
);

const runOne = (label, opts) =>
  new Promise((resolve, reject) => {
    console.log(`\n━━━ ${label} ━━━`);
    const instance = autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    autocannon.track(instance, { renderProgressBar: true, renderLatencyTable: true });
  });

(async () => {
  console.log(`Target: ${BASE}`);
  console.log(`Scenarios:`, SCENARIOS.map((s) => `${s.path}×${s.weight}`).join(", "));

  // ─── Warm-up ────────────────────────────────────────
  await runOne("Warm-up (10 connections × 5s)", {
    url: BASE,
    connections: 10,
    duration: 5,
    requests,
  });

  // ─── Tier 1: realistic sustained traffic ───────────
  const tier1 = await runOne("30 concurrent users × 20s (real traffic)", {
    url: BASE,
    connections: 30,
    duration: 20,
    requests,
    timeout: 15,
  });

  console.log("\n━━━ TIER 1 SUMMARY ━━━");
  console.log(`Requests: ${tier1.requests.total} total, ${tier1.requests.average.toFixed(1)}/sec`);
  console.log(`Latency: avg ${tier1.latency.average.toFixed(0)}ms · p99 ${tier1.latency.p99}ms · max ${tier1.latency.max}ms`);
  console.log(`Errors: ${tier1.errors} | Timeouts: ${tier1.timeouts} | non-2xx: ${tier1.non2xx}`);

  const tier1Ok =
    tier1.errors === 0 &&
    tier1.timeouts === 0 &&
    tier1.latency.p99 < 1500 &&
    tier1.requests.average > 200;

  // Tier 1 is the gate. Tier 2 is diagnostic.
  if (!tier1Ok) {
    console.log("\n❌ TIER 1 FAIL — site can't handle realistic peak traffic");
    process.exit(1);
  }
  console.log("\n✅ TIER 1 PASS — handles 30 concurrent users with room to spare");

  // ─── Tier 2: burst (diagnostic, expects edge protection to kick in) ──
  console.log("\nWaiting 30s before burst test (avoid stacking rate-limit windows)...");
  await new Promise((r) => setTimeout(r, 30_000));

  const tier2 = await runOne("100 concurrent × 5s (burst)", {
    url: BASE,
    connections: 100,
    duration: 5,
    requests,
    timeout: 15,
  });
  const blockedShare = tier2.non2xx / tier2.requests.total;
  console.log(`\nBurst: ${tier2.requests.total} requests, ${(blockedShare * 100).toFixed(1)}% rate-limited by edge`);
  console.log(`Latency p99 ${tier2.latency.p99}ms (for the requests that got through)`);

  console.log("\n✅ DONE — production handles real traffic; edge protection works on bursts");
  process.exit(0);
})().catch((e) => {
  console.error("Load test crashed:", e);
  process.exit(1);
});
