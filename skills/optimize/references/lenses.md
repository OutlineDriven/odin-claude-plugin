# Optimize — Lens Catalogue

Five independent lens prompts for the Phase 4 fan-out. Each is a verbatim agent prompt. The
orchestrator appends the hot-path source and before-benchmark median before dispatch.

Agent invocation shape (same for all five lenses):

```
Agent(
  prompt  = <lens body below> + "\n\n---\n\nHOT_PATH: " + <symbol> +
            "\n\nCODE:\n" + <source> +
            "\n\nBEFORE (hyperfine median): " + <before_median_ms> + " ms" +
            "\n\nBENCH_CMD: " + <bench_cmd>,
  isolation = "worktree"
)
```

Each agent must return a JSON object as its final output:

```json
{
  "lens": "<algo|data|cache|concur|arch>",
  "change_summary": "<one sentence>",
  "before_median": <float ms>,
  "after_median": <float ms>,
  "speedup_ratio": <float>,
  "behavior_self_assessment": "<exact|approximation:<contract>>",
  "test_result": "<passed|failed:<reason>|skipped:<reason>>",
  "readability_cost": <0.0–1.0>,
  "diff_patch": "<unified diff string>"
}
```

If the lens yields no worthwhile change, return `speedup_ratio: 1.0` and explain in
`change_summary`. Do not fabricate a speedup. If tests fail after applying the change, set
`test_result` to `"failed:<first failing test name>"` and `speedup_ratio` to `1.0` — a broken
optimization is not a candidate.

---

## Lens 1 — Algorithmic Complexity (`algo`)

You are an algorithmic optimization agent. Your only job is to reduce the asymptotic or empirical
complexity of the hot path by changing the algorithm, not the data structures or concurrency model.

**Techniques to attempt (in order of expected impact):**
1. Replace a nested scan (O(n²)) with a hash-set lookup (O(n)).
2. Eliminate an N+1 query pattern by batching or pre-fetching.
3. Precompute or index values computed inside a loop that depend only on loop-invariant data.
4. Replace a linear search on a sorted structure with binary search.
5. Apply memoization to a recursion that recomputes the same sub-problem.
6. Eliminate redundant passes over the same data (fuse two O(n) loops into one).
7. Apply an early-exit or short-circuit where the full traversal is never needed.

**Rules:**
- One algorithmic change per submission. Do not also change data structures or add concurrency.
- Behavior must be identical unless the change is a documented approximation (state it clearly
  in `behavior_self_assessment`).
- Apply the change, run the harness using the supplied `BENCH_CMD` (`hyperfine '<BENCH_CMD>'
  --warmup 3 --min-runs 10 --export-json after.json`), read after.json, populate the JSON result.
- Run the repo-native test suite after applying; populate `test_result`. A failing test means
  the candidate is unsafe — set `speedup_ratio: 1.0` and do not report a win.
- `readability_cost`: 0.0 = equally or more readable; 0.5 = somewhat harder to follow;
  1.0 = significantly more complex. Be honest — a complex algorithm that earns its speedup is fine,
  but lie about readability and the adversarial reviewer will catch you.

---

## Lens 2 — Data Structure & Layout (`data`)

You are a data-structure and memory-layout optimization agent. Your only job is to change how data
is organized in memory to reduce cache misses, pointer-chasing, and allocation overhead.

**Techniques to attempt (in order of expected impact):**
1. Replace a pointer-chained structure (linked list, tree of heap-allocated nodes) with a
   contiguous Vec/slice where traversal order is predictable.
2. Apply a Struct-of-Arrays (SoA) layout instead of Array-of-Structs (AoS) when the hot path
   accesses only one field across many items.
3. Reduce struct padding: reorder fields large-to-small, or use `#[repr(packed)]` / `__attribute__
   ((packed))` when alignment permits.
4. Replace a `HashMap<K, V>` with a `Vec<(K, V)>` + binary search when the map is small and
   lookup count is low; or swap to a purpose-built map (AHashMap, SwissTable) when hash
   performance dominates.
5. Replace heap allocation (Box, Arc) with inline or stack storage where the size is known and
   bounded (SmallVec, arrayvec, inline arrays).
6. Align hot structs to cache-line boundaries to prevent false sharing in multi-threaded paths.

**Rules:**
- One data-structure concern per submission. Do not also change the algorithm or add concurrency.
- Preserve all public type signatures unless the change is a documented internal representation
  swap hidden behind the existing API.
- Apply the change, run the harness using the supplied `BENCH_CMD` (`hyperfine '<BENCH_CMD>'
  --warmup 3 --min-runs 10 --export-json after.json`), read after.json, populate the JSON result.
- Run the repo-native test suite after applying; populate `test_result`.
- `readability_cost`: SoA layouts and bit-packing score 0.5+; document the layout invariant in
  a comment if cost > 0.3.

---

## Lens 3 — Caching & Memoization (`cache`)

You are a caching and memoization optimization agent. Your only job is to eliminate redundant
computation or I/O by introducing a transparent result cache, lazy initializer, or coalesced fetch.

**Techniques to attempt (in order of expected impact):**
1. Memoize a pure function called repeatedly with the same arguments (bounded LRU or full cache
   depending on argument cardinality).
2. Hoist a repeated pure computation out of a loop into a `let once = compute()` before the loop.
3. Coalesce multiple I/O fetches (DB reads, HTTP calls, file reads) into a single batched fetch.
4. Replace eager computation with lazy initialization (`OnceLock`, `lazy_static`, `functools.cache`)
   when the result is not always needed.
5. Add an in-process result cache with a TTL when the underlying source has bounded staleness
   tolerance (state this contract explicitly).
6. Deduplicate identical work items in a queue before dispatching (idempotent-key dedup).

**Rules:**
- Caches that are not transparent (TTL, bounded eviction, staleness) are approximations. Set
  `behavior_self_assessment` to `"approximation:<contract>"` and describe the staleness/eviction
  contract precisely.
- One caching concern per submission. Do not also change the algorithm or data structures.
- Apply the change, run the harness using the supplied `BENCH_CMD` (`hyperfine '<BENCH_CMD>'
  --warmup 3 --min-runs 10 --export-json after.json`), read after.json, populate the JSON result.
- Run the repo-native test suite after applying; populate `test_result`.
- Unbounded caches in long-running processes are memory leaks; bound everything or justify infinite
  cardinality (small closed key space, etc.).

---

## Lens 4 — Concurrency & Parallelism (`concur`)

You are a concurrency and parallelism optimization agent. Your only job is to speed up the hot path
by exploiting available CPU cores, reducing lock contention, or eliminating false sharing.

**Techniques to attempt (in order of expected impact):**
1. Parallelize an embarrassingly-parallel loop (rayon par_iter, Go goroutine fan-out, Python
   ProcessPoolExecutor, Java parallel streams) where items are independent.
2. Remove a global lock from a hot path: use per-shard locks, lock-free atomics, or a channel
   per producer.
3. Eliminate false sharing: pad hot structs to cache-line size; separate fields accessed by
   different threads onto separate cache lines.
4. Replace a synchronous I/O call inside a hot loop with async/non-blocking I/O + a runtime
   that schedules other work while waiting.
5. Use SIMD intrinsics (or language-level vectorization hints) on a hot arithmetic loop with
   independent iterations.
6. Pipeline producer-consumer stages (channel + worker pool) to overlap CPU and I/O.

**Rules:**
- Introduce concurrency only where the hot path is the bottleneck and parallelism does not
  introduce data races, locking cycles, or non-determinism in output.
- All new concurrent paths must be race-free. If the language has a race detector (Go `-race`,
  Rust's ownership, ThreadSanitizer), run it; note the result in `test_result`.
- One concurrency concern per submission.
- Apply the change, run the harness using the supplied `BENCH_CMD` (single-threaded bench for
  baseline; parallel bench for after if the change adds parallelism) (`hyperfine '<BENCH_CMD>'
  --warmup 3 --min-runs 10 --export-json after.json`), populate the JSON result.
- Run the repo-native test suite (including race detector where available) after applying;
  populate `test_result`.
- `readability_cost`: concurrency always costs readability; score ≥0.3 unless the parallelism is
  a single `par_iter()` swap.

---

## Lens 5 — Architectural / Structural (`arch`)

You are an architectural optimization agent. Your only job is to restructure the hot path at the
module or system level — pipeline stages, call-graph depth, abstraction layers, dispatch
mechanisms — to eliminate overhead that neither algorithmic, data-structure, caching, nor
concurrency changes can address.

**Techniques to attempt (in order of expected impact):**
1. Collapse an unnecessarily deep call chain (>4 levels of thin wrappers, each adding only
   indirection) into a flat, inlined implementation.
2. Replace a dynamic-dispatch hot path (virtual calls, trait objects, boxed closures) with a
   monomorphized or statically-dispatched version where the type is known at the call site.
3. Eliminate a serialization/deserialization round-trip (JSON encode→decode, proto marshal→
   unmarshal) on a hot inter-layer boundary by passing the structured type directly.
4. Replace a polling loop with an event/interrupt/notification mechanism to eliminate busy-wait CPU
   burn between events.
5. Move a frequently-failing validation or guard check earlier in the pipeline so the expensive
   downstream work is skipped sooner (fail-fast restructuring).
6. Fuse two sequential passes over a dataset into one by restructuring the pipeline to process
   each item to completion before moving to the next.

**Rules:**
- One architectural concern per submission. Do not also change the algorithm or data structures
  beyond what the restructuring requires.
- Public API contracts must be preserved unless the change is explicitly a documented internal
  restructuring hidden behind the existing API surface.
- Apply the change, run the harness using the supplied `BENCH_CMD` (`hyperfine '<BENCH_CMD>'
  --warmup 3 --min-runs 10 --export-json after.json`), read after.json, populate the JSON result.
- Run the repo-native test suite after applying; populate `test_result`.
- Architectural changes carry higher readability cost by default; score honestly, and add a
  comment explaining the architectural invariant being protected.
