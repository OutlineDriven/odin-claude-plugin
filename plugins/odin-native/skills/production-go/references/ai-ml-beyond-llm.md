# AI/ML Beyond LLMs in Go

Go does not train models: it **serves** them. The 2026 stack is inference-first: run ONNX graphs in-process over CGO, do classical numerics in `gonum`, tokenize with Rust-FFI bindings, and talk to vector DBs over gRPC. The native-Go training frameworks (Gorgonia, tensorflow/go) are dead or unmaintained. The single biggest trap is **stale import paths and major versions**: every vector client moved, and models still emit the dead ones.

> Verified against Go **1.26.x** (stable; cgo overhead −~30%) + **1.27 RC** notes, 2026-06. Library versions checked against pkg.go.dev on 2026-06. Version tags `[1.N]` mark the Go release a claim applies to. Triangulated from two deep-research corpora + primary-source verification.

## TL;DR: the deltas models get wrong (read first)

- `onnxruntime_go` is at v1.31.0 (pkg.go.dev, 2026-06-04), *not* the v1.21.0 some sources cite, but it still wraps **ORT C API 1.26.0** and "will probably only work with version 1.26.0 of the onnxruntime shared libraries." Binding version ≠ runtime version; **pin the shared lib to 1.26.0**.
- `NewSession`/`DynamicSession` are deprecated. Use `NewAdvancedSession`/`DynamicAdvancedSession`: explicit caller-owned tensors, no per-run realloc.
- Every C-allocated handle (`Tensor`, `Session`, `*ProviderOptions`, `ArenaCfg`) must `Destroy()`: it lives outside the Go GC. Forgetting this is a C-heap leak, not a Go leak.
- Vector clients all moved: Milvus → `milvus-io/milvus/client/v2/milvusclient` (old `milvus-sdk-go/v2` archived 2025-03-21), Weaviate → `/v5` (v6 alpha), Pinecone → `/v5`, Qdrant flattened to `qdrant.NewClient` with a unified `Query` API (not `Search`).
- gonum's default BLAS/LAPACK is pure Go: it does *not* need OpenBLAS/cgo to run. cgo (`gonum.org/v1/netlib`) is opt-in for large dense algebra only.
- "cgo is too slow for per-request local inference" is stale [1.26]: baseline cgo overhead dropped ~30%, shifting the threshold for in-process ONNX.
- `daulet/tokenizers` is CGO/Rust, not pure Go: it links `libtokenizers.a`. The pure-Go option is `sugarme/tokenizer` (different API).

## Table of Contents
1. [Go vs Python for ML](#go-vs-python)
2. [Numerical Computing (Gonum)](#gonum)
3. [Deep Learning (Gorgonia), and why not](#gorgonia)
4. [ONNX Runtime: pre-trained model inference](#onnx)
5. [The CGO boundary & deployment](#cgo-boundary)
6. [Tensors, memory & zero-copy](#tensors)
7. [Concurrency for batch inference](#concurrency-inference)
8. [Data Pipelines](#data-pipelines)
9. [Vector Database Clients](#vector-dbs)
10. [Embedding Workflows](#embeddings)
11. [Library landscape & status](#libraries)
12. [Version & maturity map](#versions)
13. [What models get wrong](#stale)
14. [Anti-Patterns](#anti-patterns)
15. [See Also](#see-also)
16. [Sources](#sources)

---

## Go vs Python for ML {#go-vs-python}

| Dimension | Go | Python |
|---|---|---|
| **Training / fine-tuning** | Impractical: no ecosystem (GoMLX is the only real attempt) | PyTorch, TensorFlow, JAX |
| **Inference (pre-trained)** | Strong via ONNX Runtime (CGO) | Native framework support |
| **Data pipelines / ETL** | Excellent: goroutines, channels, single binary | pandas, Spark, Airflow |
| **Numerical computing** | gonum covers linear algebra, stats, optimize | NumPy/SciPy dominate |
| **Production inference services** | Ideal: low latency, small image, one binary + one `.so` | FastAPI/Triton adequate |

Rule of thumb: train in Python, export to **ONNX**, serve from Go. The bridge is the file format, not a shared runtime.

When to call out to Python/C instead of forcing it into Go: bleeding-edge architectures with custom ops, anything needing a training loop, dynamic-shape models that change graph topology per request, or a team that already operates a Triton/FastAPI fleet. The cost of a polyglot service (a network hop, a second deploy artifact, ops complexity) is real, but so is the cost of fighting a half-supported binding. Reach for ONNX-in-Go when the model is **frozen** and latency/footprint/single-binary deployment matter.

---

## Numerical Computing (Gonum) {#gonum}

> `gonum.org/v1/gonum`: **v0.17.0** (2025-12-29). The canonical scientific stack, but **still pre-v1** despite years of maturity: no SemVer stability guarantee, and the README states it supports/tests only the **two most recent Go releases**. "Pure Go so it works on old Go" ≠ "officially supported on old Go." Six-month cadence aligned to Go releases. BSD-3.

Subpackages: `mat` (matrices/linear algebra), `stat` + `stat/distuv` (statistics, distributions), `floats` (vector ops): note non-vector scalar helpers split into **`floats/scalar`** (and `cmplxs/cscalar`); old code importing them from `floats` won't compile: `optimize` (BFGS, Nelder-Mead), `integrate`, `graph`, `blas/blas64`, `lapack/lapack64`, `spatial`, `num/quat`. `gonum.org/v1/plot` is a separate module.

The memory model is the expert-level detail (every model knows `mat.Dense` exists; few know this). The zero value is a usable destination and auto-sizes from empty on an operation. But `Reset` is documented as **unsafe when matrices share a backing slice**: resizing after reset can silently corrupt the other view. This is where raw-view/performance code breaks.

```go
// RIGHT — zero-value destination, auto-sized; receiver holds the result.
a := mat.NewDense(2, 2, []float64{1, 0, 1, 0}) // row-major
b := mat.NewDense(2, 2, []float64{0, 1, 0, 1})
var c mat.Dense
c.Mul(a, b) // c sized automatically; reuses backing data when it can

// WRONG — Reset on a matrix that shares backing with another view, then reuse:
sub := a.Slice(0, 1, 0, 2).(*mat.Dense)
sub.Reset() // unsafe: a later resize can modify a's backing slice unexpectedly
```

BLAS/LAPACK backend (a key stale claim). `blas64`/`lapack64` default to the **pure-Go** implementations: gonum runs with zero C dependency. To swap in a cgo BLAS (OpenBLAS/MKL) for large dense algebra, register it once at startup via the separate `gonum.org/v1/netlib` module. Because LAPACK dispatches through `blas64`, this also accelerates LAPACK paths.

```go
import (
    "gonum.org/v1/gonum/blas/blas64"
    "gonum.org/v1/netlib/blas/netlib" // module: gonum.org/v1/netlib (cgo)
)
func init() { blas64.Use(netlib.Implementation{}) } // opt-in cgo BLAS
```

Pass concrete types implementing `RawMatrixer` so gonum dispatches to `blas64.Gemm` instead of the generic path. **Sparse:** gonum is dense-first; for TF-IDF/BM25 term matrices use `james-bowman/sparse`, which interoperates with the `mat.Matrix` interface: construct in a creation format (DOK/COO), then convert to CSR/CSC **before** arithmetic. Wire `gonum.Version()` into startup logs: many "wrong numbers" disputes in scientific code are actually dependency-drift disputes.

Start pure-Go; switch to netlib only when profiling shows a BLAS-bound hotspot. Pure Go is 2-4× slower than NumPy on heavy dense algebra but needs no C toolchain.

---

## Deep Learning (Gorgonia), and why not {#gorgonia}

> `gorgonia.org/gorgonia` + `gorgonia.org/tensor`: **effectively abandoned.** Last meaningful commit ~Aug 2024; pre-v1.0; no model zoo; finicky GPU. Define-then-run graph (TF1/Theano style): `G.NewGraph()`, `G.NewMatrix`, `G.Must(G.Mul(...))`, execute via `G.NewTapeMachine(g)`.

Verdict: do not start new work here. For inference, use ONNX Runtime. If you genuinely need in-process *training/fine-tuning in Go*, the live option is **GoMLX** (`github.com/gomlx/gomlx`, v0.26.0, XLA-backed via `gopjrt`): real and improving but niche, with few ready models (it can import ONNX via `onnx-gomlx`). `tensorflow/go` is **officially unsupported by the TF team** ("not covered by the TensorFlow API stability guarantees"); the only working TF path is the community `wamuir/graft` binding (libtensorflow 2.18.0): prefer converting SavedModels to ONNX. `onnx-go` (now `oramasearch/onnx-go`) was archived then revived but is partial/experimental: not production. (Forbidding these as *defaults*, not as libraries: if you must, `graft` and GoMLX are the live ones.)

---

## ONNX Runtime: pre-trained model inference {#onnx}

> `github.com/yalue/onnxruntime_go`: **the de-facto binding.** v1.31.0 (pkg.go.dev 2026-06-04), MIT, ~142 importers, actively maintained. Loads the ORT shared library at runtime via `dlopen` (so it links no MSVC and works on Windows under MinGW). **Uses ORT C API headers 1.26.0**: match your shared lib to 1.26.0 or it won't load.

Train in Python → export ONNX → infer in Go. The lifecycle is explicit and non-optional in production:

```go
import ort "github.com/yalue/onnxruntime_go"

// 1. Point at the shared lib BEFORE init. Even if implicit resolution might work,
//    set it explicitly — this is where container images fail (model present, .so absent).
ort.SetSharedLibraryPath("/opt/onnxruntime/libonnxruntime.so.1.26.0") // .dll / .dylib
if err := ort.InitializeEnvironment(); err != nil { /* ... */ }       // process-global
defer ort.DestroyEnvironment()

// 2. Caller-owned tensors (generics). Each is C-allocated → must Destroy().
in, _ := ort.NewTensor(ort.NewShape(1, 3, 224, 224), inputData) // []float32
defer in.Destroy()
out, _ := ort.NewEmptyTensor[float32](ort.NewShape(1, 1000))
defer out.Destroy()

// 3. NewAdvancedSession — NOT the deprecated NewSession.
session, _ := ort.NewAdvancedSession("model.onnx",
    []string{"input"}, []string{"output"},
    []ort.Value{in}, []ort.Value{out}, nil) // last arg: *SessionOptions
defer session.Destroy()

_ = session.Run()
predictions := out.GetData() // []float32, reads the bound output buffer
```

```go
// WRONG / STALE — deprecated constructor, no shared-lib path (segfault at load),
// non-generic tensors, and no Destroy() (leaks the C heap):
sess, _ := ort.NewSession("model.onnx", inNames, outNames, inputs, outputs)
out, _ := sess.Run(inputs)
```

`AdvancedSession` vs `DynamicAdvancedSession`: use `AdvancedSession` when shapes/buffers are **stable** across calls (lowest allocation pressure: buffers bound once). Use `DynamicAdvancedSession` when shapes **vary per request** or you want outputs allocated on the `Run` path; it lets you pass inputs/outputs per call, which is also what makes safe concurrency possible ([below](#concurrency-inference)).

GPU / execution providers (CUDA, TensorRT, CoreML, DirectML) require an ORT shared lib *built with* that provider and a matching toolkit (e.g. a given ORT only supports specific CUDA 12.x). The setup is ownership-heavy and mirrors the C API exactly:

```go
opts, _ := ort.NewSessionOptions()
defer opts.Destroy()
cuda, _ := ort.NewCUDAProviderOptions()
defer cuda.Destroy()                                  // destroy provider opts too
_ = cuda.Update(map[string]string{"device_id": "0"})
_ = opts.AppendExecutionProviderCUDA(cuda)
session, _ := ort.NewAdvancedSession("model.onnx", in, out, ins, outs, opts)
```

Introspection: `ort.GetInputOutputInfo("model.onnx")` returns names/shapes/dtypes: use it instead of hard-coding I/O names. **Training is not supported:** `IsTrainingSupported()` always returns `false`; the ORT training API was deprecated in ORT 1.20 and the wrappers are stubs that return errors. Train in Python.

Higher-level path: `github.com/knights-analytics/hugot` (v0.7.5, 2026-06-05) runs Hugging Face pipelines (feature-extraction, NER, classification, cross-encoders, image classification) from ONNX, giving Python-identical predictions. Backends are build-tag selected: `-tags ORT` (fastest CPU), `-tags XLA` (TPU + the only fine-tuning path), or a **pure-Go backend** (`NewGoSession()`) for cgo-free environments. The docs are blunt that pure-Go is "for simpler workloads… smaller models such as all-MiniLM-L6-v2… best with small batches of roughly 32 inputs per call" and to "move to a C backend such as XLA or ORT" for performance: exactly the nuance summaries miss. **Computer vision:** `gocv.io/x/gocv` (OpenCV 4.12) does `ReadNetFromONNX` with CUDA/OpenVINO: use only if you already need OpenCV; it's a heavy CGO dependency.

---

## The CGO boundary & deployment {#cgo-boundary}

Every serious inference path here (`onnxruntime_go`, `daulet/tokenizers`, `gocv`, `usearch`, netlib BLAS) crosses CGO. The trade-offs you must price in:

- Build & portability: CGO disables pure cross-compilation. `CGO_ENABLED=1` ties the build to a C toolchain and target libc: a `scratch`/`distroless` image needs the `.so` and a compatible glibc/musl. Cross-compiling needs `zig cc` or a sysroot. (See `cgo-and-interop.md#cross-compile`.)
- Runtime cost [1.26]: baseline cgo call overhead is down ~30%: meaningful because ORT crosses C on every `Run`, allocator setup, and provider call. The old "cgo is too slow for per-request local inference" heuristic needs re-evaluation; it doesn't make bad call patterns good (a per-element cgo loop is still a disaster), but a per-request `Run` is now firmly viable.
- Memory ownership: C-allocated handles bypass the Go GC. Every `Destroy()` you skip is a leak `pprof` won't show you (it's not Go heap). Treat `defer x.Destroy()` as mandatory, and audit constructors that hide allocation.
- Deployment recipe: static Go binary + the ORT shared library in the image; **pin the ORT version to the binding's C-header expectation (1.26.0)**; set `SetSharedLibraryPath` to the versioned SONAME (`libonnxruntime.so.1.26.0`, not the bare symlink). `ONNXRUNTIME_SHARED_LIBRARY_PATH` is honored in CI/tests.

`onnxruntime_go` notably does NOT use cgo at the Go-compile level: it dlopens the library, so the *binding* is portable; the cost is shipping and version-matching the `.so` at runtime. The genuinely cgo-at-compile-time deps are `daulet/tokenizers`, `gocv`, `usearch`, and netlib.

---

## Tensors, memory & zero-copy {#tensors}

Large tensors are the allocation hot spot. Keep buffers off the per-request path:

- Preallocate & reuse input/output tensors with `AdvancedSession` when shapes are fixed; the binding exposes the user-created-tensor model precisely so you can reuse buffers and avoid per-`Run` realloc churn.
- `NewTensor(shape, data)` wraps your existing `[]float32`: the slice is the backing store, so reshaping a pooled buffer avoids a copy. Mutating that slice after binding mutates the tensor; don't share it across concurrent `Run`s.
- `sync.Pool` the big slices, not the tensors, when shapes vary: rent a `[]float32`, build a `DynamicAdvancedSession` input around it, return it after. Pre-size to your max batch × max sequence.
- Quantize at the source. pgvector supports half-precision (`HalfVectorCodec`) and sparse (`SparseVectorCodec`) vectors: storing `float16`/sparse halves bandwidth and index size before Go ever sees the bytes. ONNX models exported with int8/fp16 quantization shrink the C-side working set too.
- Go 1.26 runtime helps: Green Tea GC (default) and size-specialized small-object allocation reduce GC pressure from the many small Go-side slices an embedding pipeline churns; experimental `simd/archsimd` (amd64, behind GOEXPERIMENT) is available for hand-rolled vector math but is not a substitute for a tuned BLAS.

---

## Concurrency for batch inference {#concurrency-inference}

A single ORT `AdvancedSession` binds fixed input/output tensors: **sharing one across goroutines and mutating those bound tensors is a data race.** Three correct shapes:

1. `DynamicAdvancedSession` + per-call I/O, guarded by a small pool. Each goroutine passes its own inputs/outputs to `Run`; no shared mutable binding.
2. One session, serialized calls behind a mutex, and let ORT's *intra-op* threads parallelize the math. Fine when the model is large and requests are coarse.
3. A pool of sessions (or hugot's "shared pipeline + one goroutine per core, fed by a channel") for throughput-bound serving.

```go
// Session pool: bounded concurrency, each worker owns its DynamicAdvancedSession.
sem := make(chan *ort.DynamicAdvancedSession, runtime.NumCPU())
for range cap(sem) { s, _ := ort.NewDynamicAdvancedSession("m.onnx", in, out, nil); sem <- s }

func infer(ctx context.Context, x []float32) ([]float32, error) {
    select {
    case s := <-sem:
        defer func() { sem <- s }()
        // build per-call tensors from x, Run, read output, Destroy the call tensors
        return run(s, x)
    case <-ctx.Done():
        return nil, ctx.Err() // honor cancellation under load
    }
}
```

Batching at the boundary, not in handlers: accumulate requests up to a max batch (~32 is hugot's sweet spot) or a short max-delay (whichever fires first) with a `time.Timer` + channel-receive select loop; **pad to the batch's longest sequence**; flush remaining items when the input channel closes. Initialize the ORT environment and sessions **once at startup** and run a dummy inference to warm caches before marking the service ready. Use the [1.26] `goroutineleak` pprof profile (experiment) in staging to catch stuck inference workers.

---

## Data Pipelines {#data-pipelines}

Go excels at concurrent ETL: the embedding/feature side of an ML system, not the model. See `concurrency.md` for fan-out/fan-in and errgroup fundamentals.

ML pipeline recipe: wire extract → transform → load as `errgroup` goroutines connected by **buffered** channels. Each stage does `defer close(out)` and selects on `ctx.Done()`. Use `errgroup.WithContext` so the first error cancels all stages, and `g.SetLimit(n)` to bound concurrency (unbounded fan-out into an embedding API is a self-inflicted rate-limit/OOM).

Iterators [1.23] over channel plumbing: for dataset streaming and chunking, `for range` over iterator functions plus `slices.Chunk`/`slices.Collect` replaces bespoke channel scaffolding for the non-concurrent stages: cleaner for "stream rows → batch into chunks of N → embed." Reserve channels for the genuinely concurrent fan-out.

Batching pattern: for bulk vector upserts or embedding-API calls, collect items into batches by **size or timeout** (whichever triggers first) via a `time.Timer` + channel receive in a select loop; flush the remainder on input-channel close. **Pin build tools** (protoc-gen-go, mockgen) with `go.mod` `tool` directives [1.24], not the legacy `tools.go` blank-import pattern.

---

## Vector Database Clients {#vector-dbs}

Every client moved major versions or import paths: this is the densest stale-knowledge zone.

| Database | Current import path | Version (2026-06) | Protocol | Note |
|---|---|---|---|---|
| **Qdrant** | `github.com/qdrant/go-client/qdrant` | v1.18.2 | gRPC :6334 | Package flattened to `qdrant`; unified `Query` API |
| **Weaviate** | `github.com/weaviate/weaviate-go-client/v5/weaviate` | v5.7.x | HTTP+gRPC | v4 superseded; **v5.0.0 retracted → use ≥5.0.1**; v6 alpha |
| **Milvus** | `github.com/milvus-io/milvus/client/v2/milvusclient` | client/v2.6.x | gRPC | Old `milvus-sdk-go/v2` **archived 2025-03-21** |
| **Pinecone** | `github.com/pinecone-io/go-pinecone/v5/pinecone` | v5 | gRPC/HTTP | Managed-only; v3/v4 superseded |
| **pgvector** | `github.com/pgvector/pgvector-go` + `pgx` | v0.4.0 | SQL | Use if Postgres is already in your stack |
| **chromem-go** | `github.com/philippgille/chromem-go` | v0.7.0 (2024-09) | in-proc | **Pure Go, zero deps**, embeddable (SQLite-like) |
| **usearch** | `github.com/unum-cloud/usearch/golang` | untagged `v0.0.0-…` | in-proc | **CGO** (links a C lib); HNSW; niche (~2 importers) `[verify]` |

### Qdrant: query-first (the API model changed)

```go
import "github.com/qdrant/go-client/qdrant"

client, _ := qdrant.NewClient(&qdrant.Config{Host: "localhost", Port: 6334}) // Cloud: UseTLS, Cloud, APIKey
client.CreateCollection(ctx, &qdrant.CreateCollection{
    CollectionName: "docs",
    VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
        Size: 1536, Distance: qdrant.Distance_Cosine,
    }),
})
client.Upsert(ctx, &qdrant.UpsertPoints{
    CollectionName: "docs",
    Points: []*qdrant.PointStruct{{
        Id: qdrant.NewIDNum(1), Vectors: qdrant.NewVectors(0.05, 0.61, 0.76),
        Payload: qdrant.NewValueMap(map[string]any{"title": "Go Concurrency"}),
    }},
})
// Unified Query API (since Qdrant 1.10) — supersedes the old Search/Recommend split.
res, _ := client.Query(ctx, &qdrant.QueryPoints{
    CollectionName: "docs",
    Query:          qdrant.NewQuery(0.2, 0.1, 0.9),
    Filter:         &qdrant.Filter{Must: []*qdrant.Condition{qdrant.NewMatch("tenant_id", "t1")}},
    WithPayload:    qdrant.NewWithPayload(true),
})
```

```go
// STALE — hand-built gRPC ClientConn + low-level NewQdrantClient(conn), or client.Search(...).
// The high-level NewClient + Query API replaces both. henomis/qdrant-go is unofficial.
```

`QueryGroups` does first-class group-by-document retrieval; multi-stage / late-interaction (multivector) and the ACORN filtered-search algorithm are server-side features the Query family exposes.

### Milvus: the most dangerous stale path

The new client is **builder/option-based**, not the old positional `Search`. `milvusclient.New(ctx, &milvusclient.ClientConfig{Address: "host:19530"})`; schema via `entity.NewSchema().WithField(...)`; `cli.Search(ctx, milvusclient.NewSearchOption(coll, topK, []entity.Vector{entity.FloatVector(v)}).WithANNSField("emb").WithFilter("color like 'red%'").WithOutputFields("color"))`; read results via `ResultSet.Scores` / `.IDs` / `.GetColumn(name)`. `entity.Schema.Validate()` (added v2.6.4) is called automatically during `CreateCollection`. The old `milvus-sdk-go/v2/client` (`NewGrpcClient`, positional `Search(ctx, coll, partitions, expr, …)`) is archived/read-only.

### pgvector: if you already run Postgres

```go
import (
    "github.com/pgvector/pgvector-go"
    pgxvec "github.com/pgvector/pgvector-go/pgx"
)
// MUST register types per-connection or encode/scan fails — the #1 pgvector trap.
config.AfterConnect = func(ctx context.Context, c *pgx.Conn) error { return pgxvec.RegisterTypes(ctx, c) }
conn.Exec(ctx, "INSERT INTO items (embedding) VALUES ($1)", pgvector.NewVector([]float32{1, 2, 3}))
conn.Query(ctx, "SELECT id FROM items ORDER BY embedding <=> $1 LIMIT 5", pgvector.NewVector(q))
conn.Exec(ctx, "CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops)")
```

Operators: `<->` L2, `<#>` inner product, `<=>` cosine (must match the index op class: `vector_l2_ops` / `vector_ip_ops` / `vector_cosine_ops`).

### chromem-go: pure-Go, no separate DB

For RAG without running a vector server: `chromem.NewDB()` (in-memory, optional persistence), Chroma-like API, **zero third-party dependencies**: the SQLite of vector DBs. Stable but **quiet** (latest v0.7.0 is Sep 2024); excellent for prototyping, embedded apps, and small/medium corpora where you don't want infra. For ANN at scale or CGO-accelerated HNSW in-process, `usearch` (CGO, links a C library) is the option, but it's untagged and barely adopted, so treat as experimental `[verify]`.

Choosing: already on Postgres → **pgvector**; embedded/no-infra → **chromem-go**; dedicated self-hosted with rich retrieval (hybrid, grouping, multivector) → **Qdrant**; massive scale / GPU indexing / server-side BM25 → **Milvus**; fully managed → **Pinecone**.

---

## Embedding Workflows {#embeddings}

Two viable paths: **remote API** (simplest to ship, per-call cost + latency + data egress) or **local ONNX + tokenizer** (lowest latency, no per-call cost, data stays in-process; needs CGO + model/shared-lib management). Decide by volume: >~1M embeddings/day or latency-sensitive/private → local; otherwise remote.

Own this interface regardless of backend: it makes local/remote swappable and bakes in `[]float32` + batching:

```go
type Embedder interface {
    EmbedDocuments(ctx context.Context, texts []string) ([][]float32, error)
    EmbedQuery(ctx context.Context, text string) ([]float32, error)
}
// WRONG: func Embed(ctx, text string) ([]float64, error) — wrong element type, no batching, no swap.
```

### Remote (OpenAI / Ollama)

```go
import openai "github.com/sashabaranov/go-openai"
resp, _ := openai.NewClient("key").CreateEmbeddings(ctx, openai.EmbeddingRequest{
    Input: []string{"Go concurrency patterns"}, Model: openai.SmallEmbedding3, // 1536 dims
})
vec := resp.Data[0].Embedding // []float32
```

Or local-server via Ollama: `api.ClientFromEnvironment()` → `client.Embed(ctx, &api.EmbedRequest{Model: "nomic-embed-text", Input: ...})`. `tmc/langchaingo/embeddings` adds a provider-agnostic `Embedder` with `BatchedEmbed`, `WithBatchSize`, `WithStripNewLines` (pre-v1, pin carefully).

### Local (tokenizer → ONNX → pool → normalize)

```go
import "github.com/daulet/tokenizers" // CGO: links libtokenizers.a (Rust); needs CGO_LDFLAGS=-L/path
tk, _ := tokenizers.FromPretrained("google-bert/bert-base-uncased")
defer tk.Close() // native resource → Close, like a C handle
ids, _ := tk.Encode("brown fox", true) // true = add special tokens
```

Pipeline: tokenize → build `input_ids`/`attention_mask`/`token_type_ids` **int64** tensors → ORT `Run` → **mean-pool** the last hidden state with the attention mask → **L2-normalize**. Pure-Go tokenizer alternative: `sugarme/tokenizer` (different API, slower-moving). `gomlx/tokenizers` is a daulet fork aligned to GoMLX. The simplest local path is hugot, which packages tokenizer + ORT into one `FeatureExtractionPipeline.RunPipeline([]string)`.

### Cosine similarity

For pre-normalized vectors (most embedding APIs return these), cosine = **dot product**: just `sum(a[i]*b[i])`. For non-normalized, divide the dot product by the product of magnitudes. **Always L2-normalize before cosine search** and keep dimensionality consistent with your index. For millions of comparisons, unroll or use SIMD (`simd/archsimd` [1.26], amd64).

---

## Library landscape & status {#libraries}

| Library | Import path | Status [2026] | CGO? | Use when |
|---|---|---|---|---|
| onnxruntime_go | `github.com/yalue/onnxruntime_go` | **Current** (v1.31.0; ORT C API 1.26.0) | dlopen (no cgo at compile; ships `.so`) | Default neural-net inference |
| hugot | `github.com/knights-analytics/hugot` | **Current** (v0.7.5) | ORT/XLA backends cgo; pure-Go backend opt | HF pipelines from ONNX |
| gocv | `gocv.io/x/gocv` | **Current** (OpenCV 4.12) | **Yes, heavy** | CV/DNN if already on OpenCV |
| gonum | `gonum.org/v1/gonum` | **Current/stable** (v0.17.0, pre-v1) | No (pure Go default) | Linear algebra, stats, optimize |
| gonum netlib | `gonum.org/v1/netlib` | Current | **Yes** | cgo BLAS/LAPACK for large dense |
| GoMLX | `github.com/gomlx/gomlx` | **Current, niche** (v0.26.0) | XLA via gopjrt | Pure-Go/XLA training in-process |
| daulet/tokenizers | `github.com/daulet/tokenizers` | **Current** | **Yes (Rust FFI)** | HF tokenization (fast) |
| sugarme/tokenizer | `github.com/sugarme/tokenizer` | Current (alt) | No | Pure-Go tokenization |
| Qdrant | `github.com/qdrant/go-client/qdrant` | **Current** (v1.18.2) | No | Self-hosted, rich retrieval |
| Weaviate | `…/weaviate-go-client/v5/weaviate` | **Current** (v5.7.x; v6 alpha) | No | Hybrid search / managed |
| Milvus (new) | `…/milvus/client/v2/milvusclient` | **Current** (v2.6.x) | No | Massive scale / BM25 |
| pgvector-go | `github.com/pgvector/pgvector-go` | **Current** (v0.4.0) | No | Already on Postgres |
| chromem-go | `github.com/philippgille/chromem-go` | **Stable but quiet** (v0.7.0, 2024-09) | No | Embedded RAG, no infra |
| usearch (Go) | `github.com/unum-cloud/usearch/golang` | **Experimental** (untagged) `[verify]` | **Yes** | In-proc HNSW, niche |
| Gorgonia | `gorgonia.org/gorgonia` | **Abandoned/stale** | - | Avoid for new work |
| tensorflow/go | `github.com/tensorflow/tensorflow/go` | **Unsupported by TF team** | Yes | Use `wamuir/graft` or ONNX instead |
| onnx-go | `github.com/oramasearch/onnx-go` | **Experimental/partial** | - | Not production |
| milvus-sdk-go/v2 | `github.com/milvus-io/milvus-sdk-go/v2` | **Archived 2025-03-21** | - | Migrate to `milvus/client/v2` |

---

## Version & maturity map {#versions}

| Item | Maturity (2026-06) | Notes |
|---|---|---|
| **Go 1.26** | Stable | cgo overhead −~30%; Green Tea GC default; `goroutineleak` pprof (exp); `simd/archsimd` (exp, amd64) |
| **Go 1.27 (RC)** | Pre-GA (~Aug 2026) | `goroutineleak` GA; `encoding/json/v2` GA (stricter defaults, error text differs: affects JSON-heavy ML APIs); macOS 13+ |
| onnxruntime_go | v1.31.0 binding / **ORT 1.26.0** runtime | Pin shared lib to 1.26.0; `NewAdvancedSession` only |
| gonum | v0.17.0 (pre-v1) | No SemVer stability promise; supports 2 latest Go |
| hugot | v0.7.5 | Pure-Go backend = convenience, not throughput |
| GoMLX | v0.26.0 | Only live in-process training path |
| Qdrant client | v1.18.2 | Query API since Qdrant 1.10 |
| Weaviate client | v5.7.x (v6 alpha) | `models.Vector` is now `interface{}` (ColBERT), not `[]float32` |
| Milvus client | client/v2.6.x | Pin a tested tag; compat table drifts `[verify]` exact patch |
| Pinecone client | v5 | API-version-pinned; v3/v4 each broke |
| pgvector-go | v0.4.0 | half-precision + sparse codecs available |
| chromem-go | v0.7.0 (2024-09) | Quiet but functional; pure Go |

---

## What models get wrong {#stale}

1. Emitting `onnxruntime_go` v1.21.0 / assuming binding version == runtime version. It's **v1.31.0**, but pins to **ORT shared lib 1.26.0** regardless.
2. Using deprecated `NewSession`/`DynamicSession` instead of `NewAdvancedSession`/`DynamicAdvancedSession`.
3. Skipping `SetSharedLibraryPath` (load-time segfault) or shipping the bare `libonnxruntime.so` symlink instead of the versioned SONAME.
4. Forgetting `Destroy()` on tensors/sessions/provider-options: a **C-heap** leak invisible to Go `pprof`.
5. Treating `onnxruntime_go` as a training binding: `IsTrainingSupported()` is always `false`.
6. Sharing one `AdvancedSession` with fixed bound tensors across goroutines → data race. Use `DynamicAdvancedSession` + pool, or serialize.
7. Claiming gonum needs OpenBLAS/cgo to run: its default BLAS/LAPACK are **pure Go**; netlib is opt-in.
8. Importing gonum `floats` scalar helpers that moved to `floats/scalar`; calling `mat.Reset` on a shared-backing view.
9. Milvus: emitting the archived `milvus-sdk-go/v2/client` + positional `Search`. Current is `milvus/client/v2/milvusclient` with option builders.
10. Weaviate: `/v4` import and `models.Vector` as `[]float32`: it's now `interface{}`; use `NewClient` (not deprecated `New`) on the `/v5` path.
11. Pinecone: `/v2`:`/v4` or unofficial `nekomeowww/go-pinecone`. Current is `/v5`.
12. Qdrant: hand-built gRPC conn + `client.Search`. Use `qdrant.NewClient` + the unified `Query` API.
13. Forgetting pgvector `RegisterTypes`/`AfterConnect`; confusing the `<->`/`<#>`/`<=>` operators with their index op classes.
14. Assuming `daulet/tokenizers` is pure Go: it's **CGO/Rust** (`libtokenizers.a`). Pure-Go option is `sugarme/tokenizer`.
15. Recommending Gorgonia / `tensorflow/go` for new work: abandoned / unsupported. ONNX for inference, GoMLX for in-process training.
16. "cgo is too slow for local inference": stale [1.26] (−~30% overhead).
17. Believing hugot's pure-Go backend is production-fast: its docs say small models / ~32 batch only; use ORT/XLA for throughput.
18. Single-text `[]float64` embedding signatures: current helpers use `[]float32` with separate document-batch and query-single methods.

---

## Anti-Patterns {#anti-patterns}

| Anti-Pattern | Do This Instead |
|---|---|
| Training models in Go | Train in Python, export ONNX, infer in Go |
| Gorgonia / tensorflow/go in production | ONNX Runtime (inference) or GoMLX (in-process training) |
| Assuming binding version == ORT runtime version | Pin shared lib to the binding's C-header (1.26.0) |
| Deprecated `NewSession` | `NewAdvancedSession` / `DynamicAdvancedSession` |
| Skipping `Destroy()` on C handles | `defer x.Destroy()` on every tensor/session/options |
| One bound session shared across goroutines | `DynamicAdvancedSession` + pool, or serialize |
| Archived `milvus-sdk-go/v2` | `milvus/client/v2/milvusclient` |
| Per-element cgo loops (e.g. tokenize char-by-char) | Batch the cgo crossing (one `Run`, one `Encode` per batch) |
| Unbounded pipeline goroutines into an embedding API | Buffered channels + `errgroup.SetLimit` |
| Forcing GPU ORT without lib/toolkit guarantees | CPU + preallocated tensors as the default |

---

## See Also {#see-also}

- `concurrency.md`: goroutine lifecycle, fan-out/fan-in, errgroup, `WaitGroup.Go`
- `cgo-and-interop.md`: type mapping, cross-compilation (zig cc), CGO costs
- `performance.md`: profiling, allocation reduction, `sync.Pool`, SIMD for inference
- `modern-go.md`: iterators [1.23], `tool` directives [1.24], Green Tea GC, `go fix`
- `mcp-and-agents.md`: LLM tool integration, agent frameworks
- `database.md`: pgx pools, transactions (for pgvector)

---

## Sources {#sources}

- pkg.go.dev: `yalue/onnxruntime_go` (v1.31.0; ORT C API 1.26.0; deprecated `NewSession`; `IsTrainingSupported`), `knights-analytics/hugot` (v0.7.5; pure-Go backend caveat), `philippgille/chromem-go` (v0.7.0; "zero third-party dependencies"), `unum-cloud/usearch/golang` (untagged, CGO), `gonum.org/v1/gonum` (v0.17.0)
- Repos/docs: yalue/onnxruntime_go README (shared-lib version match; training-API stubs), Qdrant Go client + Query API docs, Weaviate v5/v6 docs, milvus-io/milvus client/v2 docs, pgvector-go, daulet/tokenizers, james-bowman/sparse
- go.dev/doc/go1.23 to go1.27 release notes (cgo −~30% [1.26]; iterators [1.23]; `tool` directives [1.24]; `testing/synctest` [1.25]; `encoding/json/v2`, `goroutineleak` [1.27])
- Official deprecation notices: `tensorflow/go` ("no longer supported by the TensorFlow team"), `milvus-sdk-go` (archived 2025-03-21)