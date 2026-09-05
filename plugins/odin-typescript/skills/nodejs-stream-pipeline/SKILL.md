---
name: nodejs-stream-pipeline
description: 'Use when asked to build Node.js stream ETL pipelines for large-file or continuous ingestion without exceeding heap memory. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Node.js stream pipeline

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Large-file or continuous stream ETL, CSV processing, ingestion, backpressure, repeated-lookup enrichment, deduplication of concurrent async calls. |
| Authority | Reversible local: writes only pipeline and transform code in the local working tree; rollback is version control. No remote mutation. |
| Side effect | Writes pipeline and transform code to the local tree and may execute it on real data. |
| Done | The pipeline uses `stream.promises.pipeline()` with at least one typed async-generator transform, backpressure coordinated solely through `pipeline()`, caching applied only when the transform performs remote or expensive lookups, and a benchmark or test run demonstrates bounded memory. |

## Inputs

- Source data path or readable stream (required).
- Transform specification: field mapping, filter predicate, or enrichment lookup (required).
- Destination path or writable stream (required).
- Cache strategy hint: TTL, size-bound, or keyed invalidation (optional; applied only when the transform performs remote or expensive lookups).

## Procedure

1. **Validate that the source and destination are stream-compatible.** Reject buffered-into-memory patterns for inputs larger than available heap. For files, use `fs.createReadStream`; for HTTP, use the response body as a `Readable`. Confirm the destination is a writable stream or a file path that `fs.createWriteStream` accepts. Done when: source and destination are confirmed stream-compatible or rejected with a reason.

2. **Implement transforms as async generators, relying solely on pipeline() for backpressure coordination.** Implement at least one typed async-generator transform function. The generator yields typed records. In Node 24, an async generator passed to `stream.pipeline()` as a source or transform automatically respects the internal high-water-mark backpressure signal: when the downstream writable's buffer exceeds its high-water mark, the generator's `yield` awaits the consumer's readiness before producing the next chunk. Do not implement manual backpressure coordination; `pipeline()` wires it. Name the backpressure mechanism in a code comment: which stage applies backpressure and how `pipeline()` propagates it. Done when: at least one typed async-generator transform is implemented with a comment naming the backpressure mechanism, and no manual backpressure code is present.

3. **Apply promise-coalesced caching only if the transform performs remote or expensive lookups.** If the transform performs remote or expensive lookups, choose and justify a cache strategy: size-bound `Map` with manual eviction, TTL `Map` with expiry-on-read, LRU via `Map` insertion-order re-insertion, or the `lru-cache` package for production workloads needing TTL plus size bounds plus O(1) eviction. Document the choice inline with a one-line rationale. Coalesce concurrent async calls for the same key using a `Map<string, Promise>` so multiple chunks requesting the same enrichment key share one in-flight request. If the transform does not perform remote or expensive lookups, skip caching entirely; do not add a cache that serves no purpose. Done when: caching is applied with a justified strategy and concurrent-call coalescing, or explicitly skipped because no expensive lookup exists.

4. **Compose the pipeline using stream.promises.pipeline().** Compose the full pipeline with `pipeline()` from `node:stream/promises`:

   ```js
   import { pipeline } from 'node:stream/promises';
   import { createReadStream, createWriteStream } from 'node:fs';

   await pipeline(
     createReadStream(source),
     parseTransform(),      // async generator or Transform
     enrichTransform(cache),
     serializeTransform(),
     createWriteStream(dest),
   );
   ```

   Do not use `.pipe()`: it does not propagate errors or backpressure reliably across the full chain. `pipeline()` destroys all streams on first error, so no partial output reaches the destination. Done when: the pipeline is composed with `pipeline()` and no `.pipe()` calls remain.

5. **Execute a benchmark or test run to prove bounded memory and measure throughput.** Run the pipeline on realistic input or a benchmark fixture. Measure throughput (records per second) and peak RSS to confirm bounded memory. Done when: throughput and peak RSS are measured and memory is confirmed bounded.

## Failure and recovery

- Stream read error: `pipeline()` rejects with the source error. All streams are destroyed; no partial output is written because `pipeline()` destroys the chain on first error. Report the source error.
- Transform exception: `pipeline()` destroys the chain. The destination receives only chunks written before the error. Report the failing record index and error.
- Destination write failure: `pipeline()` rejects and destroys all streams. Report the write error.
- Out-of-memory boundary breach: peak RSS exceeds the configured bound during the benchmark. The cache may be growing without eviction, or the source is not truly streaming. Guard with a max-size check on the cache; reject the run if the cache exceeds the configured bound. If the source is buffered, switch to a streaming source.
- Non-convergent enrichment: a lookup returns different results for the same key across calls (flaky upstream). The cache serves stale data. Log a warning; do not retry indefinitely.

## Output

Pipeline source file with typed async-generator transforms, backpressure comments, conditional justified caching, and concurrent-call coalescing, plus a benchmark or test run showing bounded memory and measured throughput.
