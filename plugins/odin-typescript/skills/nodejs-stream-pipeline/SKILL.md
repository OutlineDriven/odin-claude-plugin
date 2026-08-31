---
name: nodejs-stream-pipeline
description: 'Use when asked to build Node.js stream ETL pipelines with backpressure, typed async-generator transforms, and justified caching for CSV processing and large-file ingestion. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Node.js stream pipeline

## Contract

| Field | Bound contract |
|---|---|
| Trigger | CSV, ETL, ingestion, large-file processing, backpressure, repeated-lookup enrichment, deduplication of concurrent async calls |
| Authority | Reversible local writes: write pipeline/transform code only to the local working tree; make no remote mutations |
| Side effect | Writes pipeline/transform code to the local tree and may execute it on real data |
| Done | Pipeline uses pipeline() with at least one typed async-generator transform, named backpressure handling, and an explicit, justified cache choice; realistic input or a benchmark demonstrates it |

## Inputs

- Source data path or readable stream (required).
- Transform specification: field mapping, filter predicate, or enrichment lookup (required).
- Destination path or writable stream (required).
- Cache strategy hint: TTL, size-bound, or keyed invalidation (optional; default size-bound Map with max 10 000 entries).

## Procedure

1. Confirm the data source is stream-compatible. Reject buffered-into-memory patterns for inputs larger than available heap. For files, use `fs.createReadStream`; for HTTP, use the response body as a `Readable`. Done when: the source is confirmed stream-compatible or rejected with a reason.

2. Implement at least one typed async-generator transform function. The generator yields typed records and respects backpressure. After each `yield`, it must `await` the downstream consumer's readiness before producing the next chunk. In Node 24, an async generator passed to `stream.pipeline()` as a source or transform automatically respects the internal high-water-mark backpressure signal. Done when: at least one typed async-generator transform is implemented with backpressure-aware yields.

3. Compose the full pipeline using `pipeline()` from `node:stream/promises`:
   ```js
   import { pipeline } from 'node:stream/promises';
   import { createReadStream, createWriteStream } from 'node:fs';
   import { Transform } from 'node:stream';

   await pipeline(
     createReadStream(source),
     parseTransform(),      // async generator or Transform
     enrichTransform(cache),
     serializeTransform(),
     createWriteStream(dest),
   );
   ```
   Do not use `.pipe()`: it does not propagate errors or backpressure reliably across the full chain. Done when: the pipeline is composed with `pipeline()` and no `.pipe()` calls remain.

4. Name the backpressure handling explicitly in code comments: describe which stage applies backpressure and how `pipeline()` propagates it. Backpressure in Node streams works through the `highWaterMark` option on each stream: when a writable's internal buffer exceeds its high-water mark, `write()` returns `false`, and the upstream readable pauses until `'drain'` fires. `pipeline()` wires this automatically. Done when: backpressure handling is named in code comments with the stage and propagation mechanism.

5. Choose and justify the cache strategy for repeated-lookup enrichment:
   - **Size-bound Map**: `new Map()` with manual eviction when size exceeds a threshold. Simple, zero dependencies.
   - **TTL Map**: `new Map()` storing `{ value, expiresAt }` entries; evict on read when `Date.now() > expiresAt`.
   - **LRU**: Use a `Map` in insertion-order mode (Node `Map` preserves insertion order); delete and re-insert on access to approximate LRU.
   - **npm `lru-cache`**: For production workloads needing TTL + size bounds + O(1) eviction, use the `lru-cache` package.
   Document the choice inline with a one-line rationale. Done when: the cache strategy is chosen, implemented, and justified inline.

6. Implement deduplication of concurrent async calls: when multiple pipeline chunks request the same enrichment key concurrently, coalesce in-flight requests using a `Map<string, Promise>`:
   ```js
   const inflight = new Map();
   async function enrich(key) {
     if (inflight.has(key)) return inflight.get(key);
     const p = fetchLookup(key).finally(() => inflight.delete(key));
     inflight.set(key, p);
     return p;
   }
   ```
   Use this native `Map` promise-coalescing pattern; do not invent another abstraction. Done when: concurrent async calls are coalesced via the Map promise pattern.

7. Run the pipeline on realistic input or a benchmark fixture. Measure throughput (records/sec) and peak RSS to confirm bounded memory. Done when: throughput and peak RSS are measured and memory is confirmed bounded.

## Failure and recovery

- **Source unreadable**: `pipeline()` rejects with the source error. No partial output is written because `pipeline()` destroys all streams on first error.
- **Transform throws**: `pipeline()` destroys the chain. The destination receives only chunks written before the error. Report the failing record index and error.
- **Destination write fails**: Same as transform failure: `pipeline()` rejects and destroys all streams.
- **Cache overflow**: If using a size-bound `Map` and the eviction strategy is not implemented, memory grows unbounded. Guard with a max-size check; reject the run if the cache exceeds the configured bound.
- **Non-convergent enrichment**: If a lookup returns different results for the same key across calls (flaky upstream), the cache serves stale data. Log a warning; do not retry indefinitely.
- **Partial result**: If the pipeline completes with errors in the error handler but `pipeline()` did not reject, classify as `fail` and name which stage produced the error.

## Output

Pipeline source file with typed transforms, backpressure comments, and justified cache, plus a benchmark or demonstration run showing bounded memory and throughput, plus a pass/fail report against each contract field.
