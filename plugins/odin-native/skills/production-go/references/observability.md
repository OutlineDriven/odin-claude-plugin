# Observability in Go

Logging is not observability. Traces, metrics, and structured logs (**correlated by `trace_id`**) are the minimum to diagnose production failures. The whole point is jumping from an alert to the exact request: span carries the work, metrics aggregate it, logs explain it, all sharing one ID. In Go the hard parts are *lifecycle* (flush exporters before exit), *propagation* (the default propagator is a **no-op**), and *cardinality* (one unbounded label OOMs your TSDB).

> Verified against Go **1.26.4** (stable) + **1.27 RC** notes; OpenTelemetry-Go **v1.44.0** (stable signals) / **v0.20.0** (logs), contrib `otelhttp`/`otelgrpc` **v0.69.0**, `prometheus/client_golang` **v1.23.2**, semconv **v1.41.0**, 2026-06. Version tags `[1.N]` mark the Go release a claim applies to; OTel maturity is noted by module/signal, not Go version.

## TL;DR: the modern deltas (read first)

- OTel-Go traces & metrics are STABLE (v1.x); logs is BETA (`otel/log`, `otel/sdk/log` at v0.x). Code claiming "OTel Go logs are GA," or emitting the removed `exporters/jaeger`, or `otelgrpc` *interceptors*, is stale. There is **no `otel.SetLoggerProvider`** on the stable root: logs globals live in the experimental `otel/log/global`.
- The default `TextMapPropagator` is a no-op. Without `otel.SetTextMapPropagator(...)`, every cross-service span becomes a root and distributed traces silently break. Set the W3C composite (or `autoprop`).
- Default metric cardinality limit = 2000 per instrument per cycle [OTel SDK]. New attribute sets past the cap are dropped into `attribute.Bool("otel.metric.overflow", true)`; dashboards flatline silently. It's a guardrail, not a license; Prometheus still charges every labelset.
- `otelgrpc` interceptors are deprecated/removed: use `stats.Handler`. The stats handler sees connection/payload events and processes trace context *before* user interceptors, killing the "OTel ordered too late, auth/log interceptors get no trace ID" bug.
- `slog.NewMultiHandler` is stdlib [1.26]: native fan-out (stdout JSON + OTel bridge) with zero deps. Stop reaching for `samber/slog-multi` for simple composition.
- `RecordError` does NOT set span status. Always pair with `SetStatus(codes.Error, ...)` or the span shows green.
- Tail sampling is impossible in the SDK: it lives in the Collector. The SDK only does head sampling.

## Table of Contents
1. [Three Pillars: Correlated](#three-pillars)
2. [OpenTelemetry Setup & Lifecycle](#otel-setup)
3. [Tracing, Sampling & Propagation](#tracing)
4. [Metrics, Cardinality & Exemplars](#metrics)
5. [Structured Logging with Trace Correlation](#logging)
6. [Health Checks & Graceful Shutdown](#health-checks)
7. [Runtime Diagnostics: pprof, runtime/metrics, flight recorder](#runtime-diagnostics)
8. [Library status & maturity](#libraries)
9. [Version / maturity map](#versions)
10. [Production Checklist](#production-checklist)
11. [What models get wrong](#anti-patterns)
12. [See Also](#see-also)
13. [Sources](#sources)

---

## Three Pillars: Correlated {#three-pillars}

| Signal | Carries | OTel-Go module | Maturity | Key type |
|---|---|---|---|---|
| **Traces** | Request flow across services | `go.opentelemetry.io/otel/trace` | **Stable** (v1.44) | `Span` |
| **Metrics** | Aggregated numbers over time | `go.opentelemetry.io/otel/metric` | **Stable** (v1.44) | `Counter`, `Histogram`, `Observable*` |
| **Logs** | Structured event records | `log/slog` [1.21] + OTel bridge | **slog stable; OTel logs BETA** | `slog.Record` → `log.Record` |

The objective: every log line carries `trace_id`/`span_id`, every span shares the same `Resource` attributes as metrics, and high-cardinality detail (user/request IDs) lives in **traces and logs, never metrics**. Correlation flows through one thing (`context.Context`), so the cardinal sin below is logging without it.

---

## OpenTelemetry Setup & Lifecycle {#otel-setup}

A central init returns one consolidated, context-bounded shutdown closure. Three failure modes dominate AI-generated setups: no `Resource` (inconsistent service identity), no propagator (broken distributed traces), no flush (the `BatchSpanProcessor`/`PeriodicReader` drop their buffers on exit).

```go
import (
    "context"
    "errors"
    "time"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
    "go.opentelemetry.io/otel/propagation"
    sdkmetric "go.opentelemetry.io/otel/sdk/metric"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.41.0" // versioned path — pin ONE per binary
)

func setupOTel(ctx context.Context, service, version string) (shutdown func(context.Context) error, err error) {
    var fns []func(context.Context) error
    shutdown = func(ctx context.Context) error {
        var e error
        for _, fn := range fns {
            e = errors.Join(e, fn(ctx))
        }
        fns = nil
        return e
    }

    // Merge with Default() so telemetry.sdk.* (and detector attrs) survive.
    // Merge ERRORS if the two carry different schema URLs — hence one semconv version.
    res, err := resource.Merge(resource.Default(),
        resource.NewWithAttributes(semconv.SchemaURL,
            semconv.ServiceName(service),
            semconv.ServiceVersion(version),
        ))
    if err != nil {
        return nil, errors.Join(err, shutdown(ctx))
    }

    // The default propagator is a no-op — this line is mandatory.
    otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
        propagation.TraceContext{}, propagation.Baggage{},
    ))

    tExp, err := otlptracehttp.New(ctx) // defaults to https://localhost:4318/v1/traces
    if err != nil {
        return nil, errors.Join(err, shutdown(ctx))
    }
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(tExp), // async batcher; WithSyncer is TEST-ONLY
        sdktrace.WithResource(res),
        sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(0.1))),
    )
    fns = append(fns, tp.Shutdown)
    otel.SetTracerProvider(tp)

    mExp, err := otlpmetrichttp.New(ctx) // .../v1/metrics; PeriodicReader exports every 60s
    if err != nil {
        return nil, errors.Join(err, shutdown(ctx))
    }
    mp := sdkmetric.NewMeterProvider(
        sdkmetric.WithResource(res),
        sdkmetric.WithReader(sdkmetric.NewPeriodicReader(mExp)),
    )
    fns = append(fns, mp.Shutdown)
    otel.SetMeterProvider(mp)

    return shutdown, nil
}
```

Wire shutdown with a **bounded** context: `context.Background()` lets a slow OTLP backend hang the container until SIGKILL:

```go
defer func() {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    _ = shutdown(ctx) // flush AFTER the HTTP server has drained
}()
```

Traps & deltas:
- OTLP defaults: gRPC `localhost:4317`, HTTP `localhost:4318`, and the HTTP path is required (`/v1/traces`, `/v1/metrics`). Swap `otlptracegrpc`/`otlpmetricgrpc` for gRPC. `grpc.WithInsecure()` is deprecated → `insecure.NewCredentials()`.
- `exporters/jaeger` was removed (2023): Jaeger ingests OTLP natively. Emitting it won't compile.
- `semconv` is a versioned import path. v1.39.0 carried breaking RPC renames (`rpc.system`→`rpc.system.name`, merged `rpc.method`, `rpc.*.duration`→`rpc.*.call.duration`). Mixing `ServiceNameKey.String("x")` (older) with `ServiceName("x")` (helper) across versions is a frequent compile error.
- `OTEL_SDK_DISABLED` is not supported by the Go SDK (despite many "12-factor OTel" snippets). `contrib/exporters/autoexport` honors `OTEL_{TRACES,METRICS,LOGS}_EXPORTER`; `contrib/propagators/autoprop` honors `OTEL_PROPAGATORS` and defaults to TraceContext+Baggage.
- Security floor: advisory GHSA-w8rr-5gcm-pp58: OTLP/HTTP trace+metric exporters are fixed in **v1.43.0+**, OTLP/HTTP logs in **v0.19.0+**. Treat those as minimum versions.

---

## Tracing, Sampling & Propagation {#tracing}

**Auto-instrumentation** covers transport; **manual spans** cover domain operations.

```go
import (
    "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
    "go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
    "google.golang.org/grpc"
)

// HTTP: wrap handler (server) and transport (client)
handler := otelhttp.NewHandler(mux, "server")
client := &http.Client{Transport: otelhttp.NewTransport(http.DefaultTransport)}

// gRPC: stats handler, NOT interceptors
srv := grpc.NewServer(grpc.StatsHandler(otelgrpc.NewServerHandler()))
conn, _ := grpc.NewClient(target, grpc.WithStatsHandler(otelgrpc.NewClientHandler()))
```

Stale `otelhttp`/`otelgrpc` APIs models still emit: `otelhttp.WithRouteTag` (route auto-added now; for metric attrs use `WithMetricAttributesFn`), `WithPublicEndpoint`→`WithPublicEndpointFn`, the `otelhttp.DefaultClient/Get/Post` conveniences (use `NewTransport`); `otelgrpc.UnaryServerInterceptor`/`Stream*Interceptor` (deprecated/removed) and `otelgrpc.Extract`/`Inject` (removed). Exclude `/healthz`,`/readyz` from tracing with `otelhttp.WithFilter` to cut noise.

### Manual spans: lifecycle & status

```go
var tracer = otel.Tracer("myapp/orders") // one per package

func ProcessOrder(ctx context.Context, orderID string) error {
    ctx, span := tracer.Start(ctx, "ProcessOrder")
    defer span.End() // defer IMMEDIATELY after Start

    span.SetAttributes(attribute.String("order.id", orderID))

    if err := insertOrder(ctx, orderID); err != nil { // pass the span-bearing ctx down
        span.RecordError(err)                    // adds an exception event...
        span.SetStatus(codes.Error, err.Error()) // ...but this is what marks the span failed
        return fmt.Errorf("insert order: %w", err)
    }
    return nil
}
```

`RecordError` alone leaves the span status `Unset` (shows as success). Pass `ctx` everywhere: it carries the active span; a child created from `context.Background()` orphans the trace.

### Sampling: head vs tail

| Strategy | Where | Mechanism | Trade-off |
|---|---|---|---|
| **Head** | Go SDK | Decide at span **start**; flag propagates via W3C `traceparent` | Cheap, uniform; **cannot** sample on status/latency (not known yet) |
| **Tail** | **Collector only** | Buffers whole traces, then keeps e.g. all errors + 5% success | Memory-heavy; needs a `tailsamplingprocessor`: **never an SDK API** |

```go
sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(0.1)))
```

`ParentBased` honors the upstream sampled flag so a trace stays whole across services; bare `TraceIDRatioBased` is only correct at the **root**; placed on a downstream service it independently drops ~90% even when the parent decided to sample. `AlwaysRecord(root)` [OTel v1.40] turns root `Drop` into `RecordOnly` so processors (e.g. span-to-metrics) still see spans without exporting them; `RecordOnly` ≠ exported. Custom samplers **must** return `psc.TraceState()` or they silently strip upstream vendor routing. The spec is moving to W3C Trace Context **Level 2** consistent-probability sampling (threshold/randomness in `tracestate`); the SDK warns when it assumes TraceID randomness without the Level-2 flag.

### Manual propagation (queues, custom transports)

```go
// producer: inject into a carrier
otel.GetTextMapPropagator().Inject(ctx, propagation.MapCarrier(headers))
// consumer: extract back into ctx
ctx = otel.GetTextMapPropagator().Extract(ctx, propagation.MapCarrier(headers))
```

**Baggage** rides the wire (W3C `baggage` header) but is **not** auto-attached to spans; copy values explicitly if you want them as attributes. Never put secrets in baggage; it crosses trust boundaries in plaintext.

---

## Metrics, Cardinality & Exemplars {#metrics}

### Instrument choice

| Instrument | Model | Method | Use for |
|---|---|---|---|
| `Counter` | sync, monotonic | `Add(ctx, n, …)` | request/error/byte totals |
| `UpDownCounter` | sync | `Add(ctx, ±n, …)` | queue depth, active connections |
| `Histogram` | sync | `Record(ctx, v, …)` | latency, payload sizes |
| `ObservableGauge` | **async** (callback) | register callback | CPU, heap, cache-hit ratio: pulled at export |
| `Int64Gauge`/`Float64Gauge` | sync [OTel v1.27] | `Record(ctx, v, …)` | last-value you set inline |

```go
meter := otel.Meter("myapp/http")
reqs, _    := meter.Int64Counter("http.server.requests", metric.WithUnit("{request}"))
latency, _ := meter.Float64Histogram("http.server.duration", metric.WithUnit("s"))

reqs.Add(ctx, 1, metric.WithAttributes(semconv.HTTPRoute(routeTemplate))) // template, NOT raw path
latency.Record(ctx, elapsed.Seconds())
```

A common anti-pattern is simulating a gauge by `Add`-ing inside a background loop; use `ObservableGauge` with a callback so the SDK pulls only at export. Synchronous instruments now expose `Enabled(ctx)` [OTel v1.40] to skip expensive attribute construction when a view/exporter would drop the measurement.

### Cardinality discipline (the #1 cost bug)

Total series ≈ Π(label cardinalities). **Never** label with user/request/trace IDs, emails, raw URLs+query, error strings, or timestamps: one unbounded label produces millions of series and OOMs the TSDB. Prometheus' own docs suggest keeping per-metric cardinality under ~10. Use **route templates** (`/users/{id}`), strip offenders at the SDK with a **View**, and lean on the OTel **2000-series cap** only as a backstop:

```go
view := sdkmetric.NewView(
    sdkmetric.Instrument{Name: "http.server.requests"},
    sdkmetric.Stream{AttributeFilter: func(kv attribute.KeyValue) bool {
        return kv.Key != "client_ip" // drop before aggregation
    }},
)
mp := sdkmetric.NewMeterProvider(sdkmetric.WithView(view))
// Disable the cap (rarely wise): WithCardinalityLimit(0) or OTEL_GO_X_CARDINALITY_LIMIT=0
```

### Direct Prometheus + exemplars

Use `client_golang` directly for service/business metrics when Prometheus is the system of record; reserve the OTel metrics SDK for OTLP-first fleets. Inject a `Registerer` rather than binding to the global default; `promauto` auto-registers with `DefaultRegisterer` and **panics** on duplicate registration (an attractive nuisance in libraries/tests):

```go
func newMetrics(reg prometheus.Registerer) *prometheus.HistogramVec {
    h := prometheus.NewHistogramVec(prometheus.HistogramOpts{
        Name:    "http_request_duration_seconds",
        Buckets: prometheus.DefBuckets,
    }, []string{"route", "method"}) // bounded labels only
    reg.MustRegister(h)
    return h
}
```

Histograms, not summaries for latency: `histogram_quantile()` aggregates across instances; summary quantiles do not. **Native (sparse) histograms** [client_golang ≥1.14] via `NativeHistogramBucketFactor: 1.1` are far cheaper (a populated bucket meters at ~0.25 of a sample), but they're marked **experimental in the client**, require Prometheus server **v3.8.0+** with `scrape_native_histograms: true` (the `--enable-feature=native-histograms` flag is a no-op from v3.9), and switch exposition to protobuf. Default to classic buckets unless you own the whole pipeline.

**Exemplars** bridge a metric point to the exact trace. Pass `trace_id` *only* via the exemplar API, never as a label (that's the cardinality bomb). In `client_golang`, attach from request context:

```go
handler := promhttp.InstrumentHandlerDuration(duration, next,
    promhttp.WithExemplarFromContext(func(ctx context.Context) prometheus.Labels {
        sc := trace.SpanContextFromContext(ctx)
        if !sc.IsValid() {
            return nil // no-op exemplar
        }
        return prometheus.Labels{"trace_id": sc.TraceID().String()}
    }),
)
// Exemplars need OpenMetrics exposition: promhttp.HandlerOpts{EnableOpenMetrics: true}
```

Exemplar label sets are capped at **128 runes total**; the remote-write spec mandates the label name `trace_id`. In the **OTel** SDK the default filter is `exemplar.TraceBasedFilter` [WithExemplarFilter, v1.32]; exemplars are only recorded under a *sampled* span, and trace/span IDs are captured from `ctx` automatically at `Record`. Gotcha: attributes a View *drops* can still reappear on exemplars (they carry the dropped measurement's attributes); set `AlwaysOffFilter` if that leaks sensitive data.

---

## Structured Logging with Trace Correlation {#logging}

`slog` [1.21] is the baseline (slog fundamentals live in [SKILL.md](../SKILL.md); this covers correlation + the OTel bridge). **Context-aware logging is mandatory**: only the `…Context` methods (or `LogAttrs(ctx, …)`) can see the active span:

```go
slog.InfoContext(ctx, "handled request", "route", route, "status", code) // correlatable
slog.Info("handled request", "route", route)                              // ORPHANED — no trace_id
```

`LogAttrs(ctx, level, msg, attrs...)` is the lowest-allocation API: it skips the alternating `...any` key/value path; prefer typed constructors (`slog.String`, `slog.Int`) over loose pairs on hot paths. Levels: DEBUG -4, INFO 0, WARN 4, ERROR 8 (the gap of 4 aligns with OTel severity ranges). There is **no `slog.Err` helper** (the proposal was rejected); the convention is `slog.Any("err", err)`; never pre-stringify (`err.Error()`); that drops `LogValuer` and wrapped/structured data.

Two correlation strategies: pick by cost vs. feature parity:

(a) **otelslog bridge**: emit slog records as OTel log records (needs the **beta** Logs SDK + a global `LoggerProvider`). It stamps `trace_id`/`span_id`/flags automatically from `ctx`:

```go
import "go.opentelemetry.io/contrib/bridges/otelslog"
slog.SetDefault(otelslog.NewLogger("my/pkg", otelslog.WithLoggerProvider(lp)))
```

(b) **Custom handler** that injects IDs and writes JSON to stdout, letting the Collector convert: lower in-process cost, recommended when log throughput is a measured bottleneck:

```go
type traceHandler struct{ slog.Handler }

func (h traceHandler) Handle(ctx context.Context, r slog.Record) error {
    if sc := trace.SpanContextFromContext(ctx); sc.IsValid() {
        r.AddAttrs(
            slog.String("trace_id", sc.TraceID().String()),
            slog.String("span_id", sc.SpanID().String()),
        )
    }
    return h.Handler.Handle(ctx, r)
}
// slog.SetDefault(slog.New(traceHandler{slog.NewJSONHandler(os.Stdout, nil)}))
```

Fan-out to both with stdlib `slog.NewMultiHandler` [1.26]: no `samber/slog-multi` needed:

```go
h := slog.NewMultiHandler(
    slog.NewJSONHandler(os.Stdout, nil),  // local debugging
    otelslog.NewHandler("my-service"),    // OTel pipeline
)
slog.SetDefault(slog.New(h))
```

**Redaction = `LogValuer` on the type** (O(1), no reflection), not a global `ReplaceAttr` deny-list (O(N) string-match per line). Use `WithGroup`/`slog.Group` to avoid key collisions across subsystems; `slog.DiscardHandler` [1.24] replaces hand-rolled no-op handlers. Newer bridges map an `error` value to the record's native exception field rather than a plain string attribute; keep passing the `error`, not its text. **Status note:** the slog↔OTel logs bridge and the Logs SDK it depends on are **v0.x / beta**; adopt consciously, and re-check the OTel status page before assuming GA.

---

## Health Checks & Graceful Shutdown {#health-checks}

Partition the probes by concern: the cardinal sin is checking dependencies in **liveness**, which turns a DB blip into a fleet-wide restart storm.

| Probe | Question | Checks | On failure |
|---|---|---|---|
| **Liveness** `/healthz` | Is the process unrecoverably broken? | cheap self-check (deadlock); **never** external deps | orchestrator **restarts** the pod |
| **Readiness** `/readyz` | Can it serve traffic *now*? | DB/cache/downstream reachability | **removed from LB**, not restarted |
| **Startup** | Has init finished? | migrations done, caches warm | suspends other probes until it passes |

```go
mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK) // always 200 — no external deps
})
```

Run readiness off a **background ticker**, not a per-request DB ping (probes fire every few seconds; synchronous pings can DDoS your own infra). `time.NewTicker` channels are strictly synchronous on modern Go (the `asynctimerchan` GODEBUG is removed in **[1.27]**), so the loop must `select` the tick without relying on legacy buffering:

```go
type health struct {
    mu    sync.RWMutex
    ready bool
}

func (h *health) run(ctx context.Context, db *sql.DB) {
    t := time.NewTicker(5 * time.Second)
    defer t.Stop()
    for {
        select {
        case <-ctx.Done():
            return
        case <-t.C:
            c, cancel := context.WithTimeout(ctx, 2*time.Second)
            err := db.PingContext(c)
            cancel()
            h.mu.Lock()
            h.ready = err == nil
            h.mu.Unlock()
        }
    }
}
```

**Graceful shutdown**: flip readiness to 503 *first* so the LB drains, then `Shutdown`, then flush telemetry last:

```go
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM) // [1.26] cancels with a signal-named cause
defer stop()
srv := &http.Server{Addr: ":8080", Handler: mux}
go func() { srvErr <- srv.ListenAndServe() }()

select {
case err := <-srvErr:
    log.Fatal(err)
case <-ctx.Done():
    ready.Store(false) // /readyz → 503; LB stops sending new traffic
    sctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    _ = srv.Shutdown(sctx)             // stop accepting, drain in-flight
    _ = otelShutdown(context.Background()) // flush spans/metrics AFTER drain
}
```

`srv.Shutdown` makes `ListenAndServe` return `http.ErrServerClosed`; don't treat it as fatal. For gRPC use the standard `grpc.health.v1.Health` service: `health.NewServer()` + `SetServingStatus("", SERVING)`, flip to `NOT_SERVING` and call `Shutdown()` on drain. Returning `SERVING` forever (the bare `RegisterHealthServer(s, health.NewServer())`) defeats client-side load-balancer draining via the `Watch` RPC.

---

## Runtime Diagnostics: pprof, runtime/metrics, flight recorder {#runtime-diagnostics}

### pprof in production: never the public mux

`import _ "net/http/pprof"` registers `/debug/pprof/*` on `http.DefaultServeMux` at init. If your server uses `DefaultServeMux`, you've exposed memory dumps and a DoS/info-leak surface to the internet (a documented real-world problem: hundreds of thousands of instances found exposed). Since **[1.22]** the handlers are **GET-only**. Mount them explicitly on a localhost/admin listener:

```go
debugMux := http.NewServeMux()
debugMux.HandleFunc("GET /debug/pprof/", pprof.Index)
debugMux.HandleFunc("GET /debug/pprof/cmdline", pprof.Cmdline)
debugMux.HandleFunc("GET /debug/pprof/profile", pprof.Profile)
debugMux.HandleFunc("GET /debug/pprof/symbol", pprof.Symbol)
debugMux.HandleFunc("GET /debug/pprof/trace", pprof.Trace)
go http.ListenAndServe("127.0.0.1:6060", debugMux) // admin-only; SSH-tunnel for ad-hoc
```

There is still no stdlib helper to register pprof on an arbitrary mux (open proposals); enumerate the handlers. Block/mutex profiles are off by default: `runtime.SetBlockProfileRate(n)` / `runtime.SetMutexProfileFraction(n)` (sample, don't set rate 1; both add overhead). **pprof labels** (`pprof.Do`/`pprof.Labels`) tag goroutines so a profile can be sliced by request/tenant; apply at boundaries, keep label values bounded. PGO simply expects a CPU profile named `default.pgo` in `main`'s directory, no special format. Go **[1.26]** adds an experimental `goroutineleak` profile (uses the GC reachability graph to flag goroutines blocked on unreachable primitives; targeted for GA in 1.27 [verify]).

### runtime/metrics & expvar

Prefer `runtime/metrics` over `runtime.ReadMemStats` (which forces a full STW and exposes a frozen struct) and over `expvar` for business metrics. Iterate `metrics.All()` for forward-compatibility; `metrics.Read` **reuses backing storage**: deep-copy histogram data before sharing across goroutines:

```go
descs := metrics.All()
samples := make([]metrics.Sample, len(descs))
for i := range descs {
    samples[i].Name = descs[i].Name
}
metrics.Read(samples) // dispatch on Value.Kind(): KindUint64, KindFloat64, KindFloat64Histogram
```

Go **[1.26]** added scheduler metrics: `/sched/goroutines/{running,runnable,waiting,not-in-go}:goroutines`, `/sched/threads:threads`, superseding guesses from `runtime.NumGoroutine()`. **Caveat [verify]:** a reported 1.26 change to the `/sched/latencies:seconds` sampling population (excluding fast syscall fast-paths) can make mean/P99 *appear* to spike on upgrade without real regression; single-source (issue #79391), so confirm before alerting on it. For Prometheus, register the modern collectors, not the obsolete top-level constructors:

```go
reg.MustRegister(
    collectors.NewGoCollector(collectors.WithGoCollectorRuntimeMetrics(
        collectors.MetricsScheduler, collectors.MetricsGC, collectors.MetricsMemory)),
    collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}), // not prometheus.NewProcessCollector (deprecated)
)
```

The OTel path is `contrib/instrumentation/runtime` (`runtime.Start(...)`), which now emits the `go.*` semconv names (`go.memory.used`, `go.goroutine.count`, …); the old `runtime.go.*` names are deprecated and gated behind `OTEL_GO_X_DEPRECATED_RUNTIME_METRICS=true`.

### Flight Recorder [Go 1.25+] {#flight-recorder}

An always-on execution-trace ring buffer with negligible overhead: a black box you snapshot only when something breaks. The integrated `runtime/trace` API takes a **config struct** (not the old `x/exp/trace` int size), and only one recorder (or one `trace.Start`) may be active at a time:

```go
import "runtime/trace"

fr := trace.NewFlightRecorder(trace.FlightRecorderConfig{
    MinAge:   5 * time.Second, // keep ~2× the window you debug
    MaxBytes: 3 << 20,         // size hint (defaults ~10 MiB / 10 s)
})
if err := fr.Start(); err != nil {
    panic(err)
}
defer fr.Stop()

// On a significant event, dump the ring buffer:
func snapshot(fr *trace.FlightRecorder) {
    f, _ := os.Create(fmt.Sprintf("trace-%d.out", time.Now().Unix()))
    defer f.Close()
    if _, err := fr.WriteTo(f); err != nil {
        slog.Error("flight snapshot failed", slog.Any("err", err))
    }
    // analyze: go tool trace trace-*.out
}
```

Continuous profiling: Pyroscope (`grafana/pyroscope-go`, push) or Parca (pull/eBPF, K8s DaemonSet, Linux-only).

---

## Library status & maturity {#libraries}

| Library / module | Current (mid-2026) | Status | Note |
|---|---|---|---|
| `go.opentelemetry.io/otel` (+ `sdk`, `trace`, `metric`, `sdk/metric`) | v1.44.0 | **Stable** | Traces + metrics GA |
| `otel/log`, `otel/sdk/log`, `otel/log/global` | v0.20.0 | **Beta** | Logs signal experimental: adopt consciously |
| OTLP exporters `otlp{trace,metric}{http,grpc}` | v1.44.0 | Stable | HTTP fixed ≥ v1.43.0 (GHSA advisory) |
| `otel/exporters/prometheus` | v0.66.0 | **Experimental** | OTel→Prometheus bridge; older `exporters/metric/prometheus` is frozen |
| `otel/semconv/v1.41.0` | versioned path | Stable | Pin **one** version per binary; v1.39.0 RPC renames |
| contrib `otelhttp`, `otelgrpc`, `propagators/autoprop` | v0.69.0 | Stable instrumentation | Use `stats.Handler`; avoid interceptors / `WithRouteTag` |
| contrib `bridges/otelslog` | v0.x | Beta (needs Logs SDK) | Or custom handler + Collector |
| contrib `instrumentation/runtime` | current | Stable | New `go.*` metric names; old `runtime.go.*` gated by env |
| `log/slog` (stdlib) | [1.21] | **Default** | `NewMultiHandler` [1.26], `DiscardHandler` [1.24] |
| `prometheus/client_golang` | v1.23.2 | **Stable** | Native histograms ≥1.14 (client-experimental) |
| `samber/slog-multi`, `samber/slog-*` | active | Optional | Superseded by `slog.NewMultiHandler` for simple fan-out |
| `uber/zap`, `rs/zerolog`, `sirupsen/logrus` | maintained | Legacy for new code | `slog` is the default; bridge old loggers via contrib |

---

## Version / maturity map {#versions}

| Ver | Observability-relevant |
|---|---|
| **1.21** | `log/slog` lands (handlers, `LogValuer`, `…Context` methods); no `slog.Err` helper |
| **1.22** | `go vet` checks slog key/value args; `net/http/pprof` handlers become **GET-only** |
| **1.24** | `slog.DiscardHandler`; `testing/synctest` (experiment): deterministic time for batch/sampler tests |
| **1.25** | **Flight recorder** (`runtime/trace`, config-struct API); `testing/synctest` GA |
| **1.26** | **`slog.NewMultiHandler`**; scheduler `runtime/metrics` (`/sched/goroutines/*`); experimental `goroutineleak` profile; `NotifyContext` cancels with signal cause; Green Tea GC default |
| **1.27 (RC)** | `asynctimerchan` GODEBUG **removed** (ticker channels always synchronous); `goroutineleak` GA target [verify]. RC-stage: confirm before GA (~Aug 2026) |
| **OTel-Go** | Traces/metrics **Stable** (v1.x); **logs Beta** (v0.x); default metric cardinality cap **2000**; `Int64Gauge` v1.27; `Enabled(ctx)` v1.40; `AlwaysRecord` v1.40 |

---

## Production Checklist {#production-checklist}

Day 1: slog JSON handler with `trace_id`/`span_id` injection (via `…Context`), `/healthz` + `/readyz`, `otelhttp.NewHandler`/`NewTransport`, composite propagator set, **bounded** `defer shutdown(ctx)`.

Week 1: RED metrics (rate/errors/duration) with **bounded** labels + route templates, `otelgrpc` stats handlers, pprof on localhost, manual spans (with `SetStatus`) on key business ops, exemplars (`trace_id`) on latency histograms.

Month 1: SLIs (p50/p99, error rate) on **histograms**, alerts on burn rate, Views to cap cardinality, flight recorder [1.25], continuous profiling, tail sampling in the Collector if you must keep all errors.

---

## What models get wrong {#anti-patterns}

1. Claiming **OTel-Go logs are GA**: they're Beta (`otel/log`/`sdk/log` v0.x); there is no `otel.SetLoggerProvider` on the stable root.
2. Forgetting the **propagator** (or setting only `TraceContext{}`): the default is a no-op; cross-service spans become roots, baggage is dropped.
3. **No flush on exit** / using `context.Background()` for shutdown: drops the last batch, or hangs the container on a slow backend.
4. `otelgrpc` **interceptors** instead of `stats.Handler`; `otelhttp.WithRouteTag`/`WithPublicEndpoint`/`DefaultClient`; the removed `exporters/jaeger`; `grpc.WithInsecure()`.
5. **Unversioned/mismatched `semconv`**, or mixing `ServiceNameKey.String()` with `ServiceName()`; `resource.New` without `Merge(resource.Default(), …)` (loses `telemetry.sdk.*`); merging mismatched schema URLs (errors out).
6. `RecordError` **without** `SetStatus(codes.Error, …)`: span shows green.
7. Bare `TraceIDRatioBased` on a downstream service (drops 90% even when the parent sampled); **expecting tail sampling in the SDK**; custom samplers that drop `TraceState`.
8. **High-cardinality labels/attributes** (user/request/trace IDs, emails, raw paths, error strings): OOMs the TSDB; now also silently collapses into `otel.metric.overflow=true`.
9. `trace_id` as a **metric label** instead of an **exemplar**; missing `EnableOpenMetrics: true` so exemplars never export; `user_id`/`request_id` as exemplar labels (capped at 128 runes).
10. **Summaries** for fleet latency (quantiles don't aggregate): use histograms; native histograms only with a controlled pipeline.
11. `slog.Info(...)` (no ctx) in request paths: orphaned logs; pre-stringifying `err.Error()` (drops `LogValuer`); inventing `slog.Err`; hand-rolled no-op handlers instead of `slog.DiscardHandler` [1.24].
12. **Liveness checking dependencies** (DB ping): restart storms; readiness must gate traffic and drive graceful drain (flip 503 before `Shutdown`).
13. `import _ "net/http/pprof"` on the public mux; non-GET pprof requests [1.22]; old flight-recorder `int` signature instead of `FlightRecorderConfig`.
14. `runtime.ReadMemStats`/`expvar` for runtime telemetry: use `runtime/metrics`; deprecated `prometheus.NewProcessCollector` and `runtime.go.*` OTel names.
15. `promauto` + default registry in libraries (panics on duplicate registration): inject a `Registerer`.
16. Relying on the `asynctimerchan` GODEBUG to restore buffered ticker channels: removed in [1.27].

---

## See Also {#see-also}
- [errors-and-resilience.md](errors-and-resilience.md#slog-errors): `slog` error attrs, `LogValuer` redaction, no `slog.Err`
- [debugging-and-diagnostics.md](debugging-and-diagnostics.md#go-tool-trace): flight recorder analysis, `go tool trace`, GODEBUG
- [performance.md](performance.md): pprof deep dive, PGO, GC tuning, block/mutex profiles
- [distributed-systems.md](distributed-systems.md): trace propagation across service boundaries, idempotency
- [http-and-apis.md](http-and-apis.md#http-client): middleware, client timeouts, graceful shutdown

---

## Sources {#sources}
- opentelemetry.io/docs/languages/go (instrumentation, sampling, getting-started); OTel Go status page (Traces/Metrics Stable, **Logs Beta**)
- pkg.go.dev/go.opentelemetry.io/otel/{trace,metric,sdk/trace,sdk/metric,sdk/log,semconv/v1.41.0}; contrib `otelhttp`/`otelgrpc`/`bridges/otelslog`/`propagators/autoprop`/`exporters/autoexport`
- open-telemetry/opentelemetry-go CHANGELOG (cardinality cap #8247; `Enabled`/`AlwaysRecord` v1.40; exemplar filter v1.32); advisory GHSA-w8rr-5gcm-pp58
- pkg.go.dev/{log/slog,runtime/metrics,runtime/trace,net/http/pprof}; go.dev/doc/go1.{21..27} release notes; go.dev/blog/{flight-recorder,testing-time}
- github.com/prometheus/client_golang (exemplars, collectors, native histograms); Prometheus docs (cardinality, histogram vs summary, native histograms v3.8/v3.9); Kubernetes probe docs
- golang/go issue #79391 (`/sched/latencies` sampling change) [single-source, verify]
