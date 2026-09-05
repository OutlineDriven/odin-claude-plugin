# Distributed Systems Patterns in Go

Distributed systems fail in ways invisible locally. Almost every bug here is the same bug: confusing *"the message/lock/log arrived"* with *"the effect happened exactly once."* Correctness lives in **determinism, fencing tokens, and idempotent consumers**, never in the coordination primitive itself. gRPC + protobuf are the default RPC substrate; put retries/breakers/timeouts at **boundaries** (see [errors-and-resilience.md](errors-and-resilience.md)); propagate `context` and trace headers across every hop.

> Verified against Go **1.26** (stable) + **1.27 RC** (GA ~Aug 2026), 2026-06. Library versions are pinned where corroborated against pkg.go.dev. None of these patterns require 1.26-only language APIs (they run on the 1.22 baseline); `[verify]` marks claims I could only single-source.

## TL;DR: the deltas that bite (read first)

- **Exactly-once delivery does not exist.** The outbox, Kafka's "EOS," JetStream dedup. All give *at-least-once + idempotent consumer*. Kafka transactions cover only Kafka-internal read-process-write, never your external DB/email.
- **Redlock/redsync has no fencing tokens.** It's an *efficiency* lock (cron dedupe, cache warmup), not a *correctness* lock. Correctness needs etcd/Consul lease **+ a monotonic revision the protected resource enforces.**
- **`grpc.Dial`/`DialContext` are deprecated** [grpc v1.63+]; use `grpc.NewClient` (it performs no I/O at call time). `grpc.WithInsecure()` → `grpc.WithTransportCredentials(insecure.NewCredentials())`.
- **A raft `FSM.Apply` runs on every node and concurrently with `FSMSnapshot.Persist`**: any `time.Now()`/`rand`/map-iteration order diverges replicas; snapshotting a live map races. Side effects belong *outside* the FSM, leader-side, after the future resolves.
- **A gRPC deadline is the *whole-call* budget propagated over the wire** as `grpc-timeout`; the server sees it via `ctx`. Forget to set one and a hung server hangs you forever.
- **Temporal `workflow.SideEffect` is not at-most-once**, and workflow code must be deterministic: no `time.Now`, no `range` over a Go map, no bare goroutines.

## Table of Contents
1. [gRPC: client/server, deadlines, errors](#grpc)
2. [gRPC interceptors & streaming](#grpc-interceptors)
3. [gRPC keepalive & connection management](#grpc-keepalive)
4. [Protobuf: protoc-gen-go & buf](#protobuf)
5. [Idempotency & the exactly-once illusion](#idempotency)
6. [Outbox Pattern](#outbox)
7. [Saga Pattern](#saga)
8. [Retries, budgets & circuit breaking](#retries)
9. [Consensus (Raft)](#raft)
10. [Leader Election](#leader-election)
11. [Distributed Locking & fencing](#distributed-locking)
12. [Service Discovery](#service-discovery)
13. [Message systems: NATS/JetStream & Kafka](#messaging)
14. [Consistent hashing](#consistent-hashing)
15. [Clock skew & logical clocks](#clocks)
16. [Distributed tracing propagation](#tracing)
17. [Event Sourcing](#event-sourcing)
18. [CQRS](#cqrs)
19. [Library landscape & status](#libraries)
20. [What models get wrong](#stale)
21. [See Also](#see-also)
22. [Sources](#sources)

---

## gRPC: client/server, deadlines, errors {#grpc}

`google.golang.org/grpc` is at **v1.81.x** (2026). The two facts models get wrong: **dialing is now lazy**, and **errors are a status code + message, not a Go error string**.

```go
// CORRECT [grpc v1.63+] — NewClient is lazy (no connection until first RPC).
conn, err := grpc.NewClient("dns:///inventory:50051",
    grpc.WithTransportCredentials(insecure.NewCredentials())) // local/dev only; use real TLS in prod
if err != nil { return err }                                  // only fails on bad target/opts, NOT connectivity
defer conn.Close()
client := pb.NewInventoryClient(conn)

// WRONG — Dial is deprecated; WithBlock + WithInsecure are the old idioms.
conn, _ := grpc.Dial("inventory:50051", grpc.WithInsecure(), grpc.WithBlock()) // 3 deprecated calls
```

`grpc.Dial`/`DialContext` carry `// Deprecated: use NewClient instead.` `NewClient` defaults to round-robin-capable name resolution; the legacy `Dial` defaulted to `passthrough`. **`WithBlock()` is an anti-pattern with `NewClient`**: connection is established lazily and recovered automatically; blocking on dial just moves failure earlier and defeats transient-failure recovery.

**Deadlines are the single most important client setting.** A gRPC deadline is the *entire-call* budget; grpc-go serializes it to the `grpc-timeout` header and the server receives it as its incoming `ctx` deadline. No deadline = wait forever on a wedged server.

```go
ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
defer cancel()
resp, err := client.Reserve(ctx, req)           // deadline propagates to the server's ctx
if status.Code(err) == codes.DeadlineExceeded { /* your budget elapsed OR upstream's did */ }
```

Error model: gRPC status codes, not strings. Return `status.Error(code, msg)` from handlers; never a bare `errors.New` (the client receives `codes.Unknown`). The 17 canonical codes: `OK, Canceled, Unknown, InvalidArgument, DeadlineExceeded, NotFound, AlreadyExists, PermissionDenied, ResourceExhausted, FailedPrecondition, Aborted, OutOfRange, Unimplemented, Internal, Unavailable, DataLoss, Unauthenticated`.

```go
// Server: structured status with typed details (proto), inspectable by the client.
st := status.New(codes.NotFound, "sku not found")
st, _ = st.WithDetails(&errdetails.ResourceInfo{ResourceType: "sku", ResourceName: id})
return nil, st.Err()

// Client: extract code + details.
if st, ok := status.FromError(err); ok {
    switch st.Code() {
    case codes.NotFound:      return ErrNotFound
    case codes.Unavailable:   // transient → retryable (see #retries)
    case codes.FailedPrecondition: // NOT retryable; state is wrong
    }
    for _, d := range st.Details() { /* type-switch on *errdetails.* */ }
}
```

Retry classification by code (the contract gRPC intends): `Unavailable`, `ResourceExhausted`, `Aborted` (and sometimes `DeadlineExceeded`) are retryable; `InvalidArgument`, `NotFound`, `FailedPrecondition`, `PermissionDenied`, `Unauthenticated`, `Unimplemented` are **not**; retrying burns budget. **Trap:** `status.Code(ctx.Err())` returns `Unknown` for a context error; use `status.FromContextError(ctx.Err())` to map `context.Canceled`→`Canceled` and `DeadlineExceeded`→`DeadlineExceeded`. A wrapped status is still recoverable: `status.FromError` unwraps via `errors.As`/`GRPCStatus()`. Default max recv message is **4 MB** (`grpc.MaxCallRecvMsgSize`); max send is `math.MaxInt32`.

---

## gRPC interceptors & streaming {#grpc-interceptors}

Interceptors are gRPC's middleware. There are four types (unary/stream × client/server) and chaining is built in (no third-party `go-grpc-middleware` needed for the chain itself).

```go
// Server unary interceptor: signature is exact.
func logging(ctx context.Context, req any, info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler) (any, error) {
    start := time.Now()
    resp, err := handler(ctx, req)
    slog.InfoContext(ctx, "rpc", "method", info.FullMethod,
        "code", status.Code(err), "dur", time.Since(start))
    return resp, err
}

srv := grpc.NewServer(
    grpc.ChainUnaryInterceptor(recovery, logging, auth),   // outer→inner: recovery wraps all
    grpc.ChainStreamInterceptor(streamRecovery, streamLogging),
)
// Client side: grpc.WithChainUnaryInterceptor(...), grpc.WithChainStreamInterceptor(...)
```

**Order is outer→inner on the way in, reverse on the way out.** Put `recovery` first so it catches panics in every later interceptor *and* the handler (grpc-go does **not** recover handler panics for you by default; an unrecovered panic kills the server goroutine, so install a recovery interceptor or use `go-grpc-middleware/recovery`).

Streaming uses `ServerStream`/`ClientStream` (`SendMsg(any)`/`RecvMsg(any)`/`Context()`). Three patterns + their traps:

```go
// Server-streaming: loop SendMsg, honor ctx cancellation every iteration.
func (s *svc) Tail(req *pb.Req, stream pb.Svc_TailServer) error {
    for ev := range s.events {
        if err := stream.Context().Err(); err != nil { return err } // client gone → stop
        if err := stream.Send(ev); err != nil { return err }        // Send wraps SendMsg
    }
    return nil
}
// Client: RecvMsg returns io.EOF at clean end of stream — that's success, not failure.
for {
    ev, err := stream.Recv()
    if errors.Is(err, io.EOF) { break }   // normal termination
    if err != nil { return err }          // real error: check status.Code(err)
    process(ev)
}
```

Stream traps models hit: (1) treating `io.EOF` from `Recv()` as an error, since it's the *normal* end signal; (2) not checking `stream.Context().Err()` in the server loop, so a disconnected client never stops the producer (goroutine leak); (3) calling `SendMsg` and `RecvMsg` on the same stream from two goroutines without coordination: **a single stream is not safe for concurrent `Send` (or concurrent `Recv`)**; one goroutine may send while another receives, but not two senders. (4) For client-streaming, `CloseSend()` then a final `Recv` for the response. Wrap per-message ops in their own deadlines for long-lived streams; the call deadline covers the *whole* stream.

---

## gRPC keepalive & connection management {#grpc-keepalive}

Long-lived gRPC connections silently die behind NAT/LB idle timeouts; HTTP/2 pings detect dead peers. But **mismatched client/server keepalive triggers `GOAWAY` with `ENHANCE_YOUR_CALM`**, the #1 production gRPC outage.

```go
import "google.golang.org/grpc/keepalive"

conn, _ := grpc.NewClient(target,
    grpc.WithKeepaliveParams(keepalive.ClientParameters{
        Time:                30 * time.Second, // ping after 30s idle (min enforced 10s)
        Timeout:             10 * time.Second, // wait this long for ping ack (default 20s)
        PermitWithoutStream: true,             // ping even with no active RPCs
    }))

srv := grpc.NewServer(
    grpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{
        MinTime:             10 * time.Second, // REJECT client pings faster than this (default 5min)
        PermitWithoutStream: true,             // must mirror client or you GOAWAY them
    }),
    grpc.KeepaliveParams(keepalive.ServerParameters{
        MaxConnectionIdle:     5 * time.Minute,
        MaxConnectionAge:      30 * time.Minute, // recycle conns → rebalance across LB backends
        MaxConnectionAgeGrace: 10 * time.Second, // drain in-flight RPCs before close
        Time:                  2 * time.Hour,    // server-initiated ping (min 1s; default 2h)
        Timeout:               20 * time.Second,
    }))
```

**The rule:** client `Time` ≥ server `EnforcementPolicy.MinTime`, and `PermitWithoutStream` must match on both sides, or the server sends `GOAWAY`. Client `Time` < 10s is clamped to 10s; if `Timeout` is unset the default is 20s. `MaxConnectionAge` is the LB-friendliness knob; without it, an L4 load balancer pins each client to one backend forever (gRPC multiplexes over one HTTP/2 conn), and new backends get no traffic.

---

## Protobuf: protoc-gen-go & buf {#protobuf}

The 2020 APIv2 rewrite split codegen: **`google.golang.org/protobuf`** (the runtime + `protoc-gen-go` for messages) and **`google.golang.org/grpc/cmd/protoc-gen-go-grpc`** (a *separate* plugin for service stubs). The old `github.com/golang/protobuf` is the deprecated APIv1. Do not start there.

```bash
# Two plugins; install pinned versions (tool dependencies in go.mod since 1.24).
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

**`buf` is the modern toolchain.** It replaces raw `protoc` + a pile of `-I` flags. `buf.yaml` (module config) + `buf.gen.yaml` (codegen) + `buf lint` + `buf breaking` (detects wire-incompatible changes in CI) + the Buf Schema Registry. Use it over hand-rolled `protoc` scripts.

Wire-compatibility rules models violate (these are how you break consumers silently):
- Never reuse or renumber a field tag. Tags are the wire identity; the field *name* is irrelevant on the wire. Renaming is safe; renumbering corrupts old readers.
- Reserve removed tags/names with `reserved 4, 7; reserved "old_field";` to prevent accidental reuse.
- Adding a field is backward-compatible; readers ignore unknown fields. Changing a field's *type* generally is **not** (only narrow int-family swaps are wire-safe).
- proto3 scalar fields have no presence by default: `0`/`""`/`false` are indistinguishable from unset. Use `optional` (re-added in proto3) or wrapper types when "absent vs zero" matters (e.g. a PATCH that sets a count to 0).
- `oneof` fields and `map` cannot be `repeated`; a `map` is sugar for `repeated` key/value entries and is **unordered on the wire**.

In Go, generated structs carry unexported state: **never copy a proto message by value** (`vet`'s `copylocks` flags it); use `proto.Clone`. Compare with `proto.Equal`, not `==`. Marshal is **not deterministic by default** (map ordering); use `proto.MarshalOptions{Deterministic: true}` if you hash/sign bytes.

---

## Idempotency & the exactly-once illusion {#idempotency}

> Exactly-once *delivery* is impossible; exactly-once *effect* is achievable via idempotent consumers. Every "exactly-once" feature is at-least-once delivery plus dedup.

Consumer-side dedup (inbox pattern): dedup row in the SAME transaction as the effect:

```go
func handle(ctx context.Context, tx *sql.Tx, evt Event) error {
    _, err := tx.ExecContext(ctx,
        `INSERT INTO processed_events(event_id) VALUES($1)`, evt.ID)
    if isUniqueViolation(err) { return nil } // already done → ack, do NOT re-apply
    if err != nil { return err }
    return applyEffect(ctx, tx, evt)         // commits atomically with the dedupe row
}
```

```go
// WRONG — TOCTOU: check-then-act across two statements/txns double-processes under concurrency.
seen, _ := store.IsProcessed(ctx, evt.ID)
if seen { return nil }
applyEffect(ctx, evt)              // ← two consumers both pass the check, both apply
store.MarkProcessed(ctx, evt.ID)  // ← and dedup AFTER the side effect is too late
```

HTTP idempotency keys (Stripe model): client sends `Idempotency-Key`; server persists key → (first status + body) and **replays the stored result on retry, including failures like 500**. The key record must be written atomically with the first side effect (or guarded by a unique constraint), else it's "deduplication theater." `Idempotency-Key` is a live IETF draft for `POST`/`PATCH`.

```go
func (m *Idem) Wrap(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        key := r.Header.Get("Idempotency-Key")
        if key == "" || r.Method == http.MethodGet { next.ServeHTTP(w, r); return }
        if cached, ok, _ := m.store.Get(r.Context(), key); ok {     // replay
            w.Header().Set("Idempotency-Replayed", "true")
            w.WriteHeader(cached.StatusCode); _, _ = w.Write(cached.Body); return
        }
        if ok, _ := m.store.TryLock(r.Context(), key, 24*time.Hour); !ok { // concurrent
            http.Error(w, "duplicate in-flight idempotency key", http.StatusConflict); return
        }
        rec := &responseRecorder{ResponseWriter: w}
        next.ServeHTTP(rec, r)
        _ = m.store.Set(r.Context(), key, &CachedResponse{StatusCode: rec.status, Body: rec.body.Bytes()})
    })
}
```

Producer idempotency: a unique constraint on `(aggregate_id, event_type)` (or a client-supplied message ID) makes *emission* idempotent. For natively non-idempotent effects (charge a card, send email), the *only* compensation is a counter-action: design the workflow to defer irreversible steps to the end ("pivot transaction").

---

## Outbox Pattern {#outbox}

> The dual write ("update DB **and** publish event") has no atomic primitive across two systems. The outbox converts it into a single local-DB commit.

Write the event into an `outbox` table **in the same transaction** as the business change; a relay publishes it asynchronously.

```go
func CreateOrder(ctx context.Context, tx pgx.Tx, o Order) error {
    if _, err := tx.Exec(ctx,
        `INSERT INTO orders (id, customer_id, status) VALUES ($1,$2,'created')`,
        o.ID, o.CustomerID); err != nil { return err }
    payload, _ := json.Marshal(OrderCreated{OrderID: o.ID})
    _, err := tx.Exec(ctx,
        `INSERT INTO outbox (id, aggregate_id, topic, payload) VALUES ($1,$2,$3,$4)`,
        uuid.NewString(), o.ID, "orders.created", payload) // same tx → atomic
    return err // caller commits once
}
```

Relay = polling publisher (multi-instance safe):

```sql
SELECT id, topic, payload FROM outbox
WHERE published_at IS NULL
ORDER BY id LIMIT 100
FOR UPDATE SKIP LOCKED;     -- concurrent relays never fight over the same row
-- publish each; then UPDATE outbox SET published_at = now() WHERE id = ANY($ids)
```

The correctness fact: the outbox is **at-least-once, not exactly-once.** The relay can publish then crash before marking the row, and republish on restart, so **every consumer must be idempotent** ([#idempotency](#idempotency)). Marking the row in a *separate* transaction from publishing loses or duplicates either way; accept at-least-once + dedup instead. Preserve per-aggregate order (`ORDER BY id` and keep one aggregate's events on one partition). CDC/log-tailing (Debezium on the WAL/binlog) gives sub-100ms latency and no table-scan load but adds Kafka Connect operational weight; switch to it only when latency must drop below ~100ms and you already run Kafka.

Watermill (`ThreeDotsLabs/watermill`) ships an outbox `Forwarder`, but its guarantees are narrower than its marketing: SQL Pub/Sub's `ExactlyOnceDelivery`/`GuaranteedOrder` apply to the *local SQL message table*, not end-to-end to your broker/consumer; and `forwarder.NewForwarder` **nacks any message not published through its decorated publisher**: models wire the consumer and forget the publisher side.

---

## Saga Pattern {#saga}

> Multi-service transactions with compensation on failure, the alternative to fragile distributed 2PC/XA.

| Style | Control flow | Best for |
|---|---|---|
| **Orchestration** | Central coordinator drives steps + reverse compensation | Default; flows >3 steps; finance/healthcare/compliance |
| **Choreography** | Services emit/react to events, no coordinator | Simple, high-throughput, loosely-coupled flows (needs a DLQ) |

```go
type Step struct {
    Name       string
    Action     func(ctx context.Context) error
    Compensate func(ctx context.Context) error
}

func RunSaga(ctx context.Context, steps []Step) error {
    var done []int
    for i, s := range steps {
        if err := s.Action(ctx); err != nil {
            for j := len(done) - 1; j >= 0; j-- {        // compensate in REVERSE
                if c := steps[done[j]].Compensate; c != nil {
                    // compensations MUST be idempotent + retryable; log failures, keep going
                    if cerr := c(ctx); cerr != nil {
                        slog.ErrorContext(ctx, "compensation failed",
                            "step", steps[done[j]].Name, "err", cerr) // → alert / DLQ
                    }
                }
            }
            return fmt.Errorf("saga failed at %s: %w", s.Name, err)
        }
        done = append(done, i)
    }
    return nil
}
```

**Compensation rules:** reverse order; each compensation idempotent and retryable (it can re-run); sagas lack ACID isolation (intermediate states are visible; use semantic locks / commutative updates / re-reads); handle **timed-out/orphaned** sagas explicitly (a mid-flight timeout leaves partial state). A compensation for an irreversible action is a counter-action, not an undo.

**Temporal** (`go.temporal.io/sdk`, **v1.45.0** 2026-06) is the dominant durable orchestrator: write saga logic as ordinary Go; it persists workflow history and replays on crash, which mitigates the "coordinator is a SPOF" concern. **Replay imposes hard constraints models violate:** workflow code must be **deterministic** (no `time.Now`; no `range` over a Go map: use `workflow.DeterministicKeys` [SDK v1.26+]; no bare goroutines: use `workflow.Go`); `workflow.SideEffect` is **not at-most-once**; use `workflow.NewDisconnectedContext` for compensation after cancellation (a canceled `ctx` won't run cleanup); and evolve running workflows with `workflow.GetVersion` (keep the first marker even after a branch is gone).

```go
func OrderWorkflow(ctx workflow.Context, req Request) error {
    if err := workflow.ExecuteActivity(ctx, ReserveInventory, req).Get(ctx, nil); err != nil {
        return err
    }
    if err := workflow.ExecuteActivity(ctx, ChargePayment, req).Get(ctx, nil); err != nil {
        disc, _ := workflow.NewDisconnectedContext(ctx) // survives cancellation
        _ = workflow.ExecuteActivity(disc, ReleaseInventory, req).Get(disc, nil)
        return err
    }
    return nil
}
```

---

## Retries, budgets & circuit breaking {#retries}

Mechanics (backoff loop, breaker state machine, code) live in [errors-and-resilience.md](errors-and-resilience.md#retry); the **distributed-specific** deltas:

1. **Classify by gRPC code / HTTP status**: retry only `Unavailable`/`ResourceExhausted`/`Aborted`/`DeadlineExceeded` (gRPC) or `429`/`502`/`503`/`504`; never `4xx`/`InvalidArgument`/`FailedPrecondition`. Honor server `Retry-After` / gRPC `RetryInfo`.
2. **Retry budget, not per-call attempts.** A fixed `maxAttempts` still N×-amplifies fleet load in an outage. Cap retries to a *fraction* of requests (≤10%, the gRPC/Envoy `retryThrottling` model) so a degraded dependency isn't DDoS'd by its own clients.
3. **gRPC retries declaratively** via service config `methodConfig.retryPolicy` (`grpc.WithDefaultServiceConfig`): prefer it for transport-level transient retries over hand-rolled loops.
4. **Breaker open = degradation trigger, not a user error**: exclude caller cancellations from the failure count (`gobreaker` `IsExcluded`). Under partition, serve degraded-but-valid (stale cache/default) on *availability* failures, never on *correctness* ones; log Warn + metric.

---

## Consensus (Raft) {#raft}

> `github.com/hashicorp/raft` **v1.7.3** (Mar 2025) is the dominant embeddable Raft (Consul, Nomad, Vault). Use it when you need a *replicated log + FSM* and will own correctness/snapshots/recovery; if you actually just need an HA coordination store, use **etcd** and its ecosystem instead. Pre-vote is default since v1.7.0; be on **≥1.7.1** (two pre-vote bugs fixed). Storage: `hashicorp/raft-boltdb/v2` **v2.3.1**: **always the `/v2` path** (bbolt, not unmaintained boltdb); migrate with `MigrateToV2`.

```go
type FSM interface {
    Apply(*raft.Log) any                 // runs on EVERY node when an entry commits; MUST be deterministic
    Snapshot() (raft.FSMSnapshot, error) // capture an immutable copy cheaply
    Restore(io.ReadCloser) error         // MUST discard all prior state, then load
}
// Optional BatchingFSM adds ApplyBatch([]*raft.Log) []any for throughput.
```

The two correctness constraints from `fsm.go`: **`Apply` and `Snapshot()` share a thread, but `Apply` runs concurrently with `FSMSnapshot.Persist`**, so `Snapshot()` must clone under lock and `Persist` serializes the clone (never live state). **`Restore` must replace state wholesale**, producing exactly what a log replay would (this invariant is what makes compaction safe).

```go
func (f *FSM) Apply(l *raft.Log) any {
    if l.Type != raft.LogCommand { return nil } // ignore config/noop entries
    var c command
    if err := json.Unmarshal(l.Data, &c); err != nil { return err } // decode failure = your bug
    f.mu.Lock(); defer f.mu.Unlock()
    f.kv[c.Key] = c.Value
    return nil // surfaces as ApplyFuture.Response() on the LEADER only
}
func (f *FSM) Snapshot() (raft.FSMSnapshot, error) {
    f.mu.RLock(); cp := maps.Clone(f.kv); f.mu.RUnlock() // immutable copy; do NOT retain live map
    return &snap{kv: cp}, nil
}
func (s *snap) Persist(sink raft.SnapshotSink) error {
    if err := json.NewEncoder(sink).Encode(s.kv); err != nil {
        _ = sink.Cancel(); return err // MUST Cancel on error, else partial snapshot
    }
    return sink.Close()
}
func (s *snap) Release() {}
func (f *FSM) Restore(rc io.ReadCloser) error {
    defer rc.Close()
    next := make(map[string]string)
    if err := json.NewDecoder(rc).Decode(&next); err != nil { return err }
    f.mu.Lock(); f.kv = next; f.mu.Unlock() // REPLACE, never merge
    return nil
}
```

```go
// WRONG — the version models emit:
func (f *FSM) Apply(l *raft.Log) any {
    var c command
    json.Unmarshal(l.Data, &c)              // ignores l.Type + decode error
    f.kv[c.Key] = c.Value                   // no lock → races Persist
    c.AppliedAt = time.Now()                // non-determinism → replicas DIVERGE
    go notify(c)                            // side effect runs per-replica, per-replay
    return nil
}
func (f *FSM) Snapshot() (raft.FSMSnapshot, error) { return &snap{kv: f.kv}, nil } // live alias!
```

**Apply runs on every node, not just the leader** (the leader is special only in that `ApplyFuture.Response()` returns the value there). So any wall-clock read / `rand` / map-iteration order / float nondeterminism silently diverges replicas, undetectable until a snapshot CRC mismatch or leader change. **Side effects (email, HTTP, metrics-with-timestamps) belong outside the FSM**, leader-side after `ApplyFuture` resolves, guarded by idempotency. **Returning an error from `Apply` does NOT roll back**: the entry is already committed everywhere; validate *before* `r.Apply(cmd, timeout)`. Membership changes are one-at-a-time (`AddVoter`/`RemoveServer`/`DemoteVoter`, each returns an `IndexFuture`); `BootstrapCluster` once on one voter. Watch leadership via `RegisterObserver` (`LeaderCh()` is unreliable, GH-426); confirm before linearizable reads with `VerifyLeader()`; hand off gracefully with `LeadershipTransfer()`. For write-heavy workloads, `hashicorp/raft-wal` outperforms BoltDB's copy-on-write B+tree (Consul's default LogStore since v1.20).

---

## Leader Election {#leader-election}

> Single-active-instance without a full Raft FSM. K8s-native election is in [cloud-native.md](cloud-native.md#leader-election); this is general-purpose. The election only matters if writes are **fenced**: a paused old leader can resume and write after a new one is elected (see [#distributed-locking](#distributed-locking)).

| Backend | Library | Mechanism | Fencing token |
|---|---|---|---|
| **etcd** | `go.etcd.io/etcd/client/v3/concurrency` | Session lease + key revision ordering | `CreateRevision` (monotonic) |
| **PostgreSQL** | `pg_try_advisory_lock` | Session-scoped lock, auto-release on disconnect | none native; add a version column |
| **Redis** | `SET key NX EX` | Key + expiry | none; efficiency only |
| **Kubernetes** | `client-go/tools/leaderelection` | Lease object | `Lease` resourceVersion |

```go
session, _ := concurrency.NewSession(cli, concurrency.WithTTL(15)) // lease auto-keepalive
defer session.Close()
e := concurrency.NewElection(session, "/svc/leader")
if err := e.Campaign(ctx, nodeID); err != nil { return err } // blocks until elected
defer e.Resign(context.Background())
// leader work — but verify lease liveness at each write (session.Done())
```

```go
// PostgreSQL advisory lock — releases automatically when the session/connection drops.
var ok bool
pool.QueryRow(ctx, "SELECT pg_try_advisory_lock($1)", lockID).Scan(&ok)
```

**Split-brain is the failure mode:** never assume "I won the election" stays true. A GC pause or partition can expire your lease while your goroutine still runs as if leader. Re-verify leadership (etcd `session.Done()`, `VerifyLeader()`, lease TTL) at the write boundary, and fence the protected resource.

---

## Distributed Locking & fencing {#distributed-locking}

> Classify every lock: **efficiency** (duplicate work is merely wasteful: cron dedupe, cache stampede) vs **correctness** (two holders corrupt state). The single biggest omission models make is the fencing token.

**Redlock/redsync is for efficiency only: it has no fencing tokens.** Per Kleppmann, Redlock makes unsafe timing assumptions (bounded network/GC/clock) and *"does not have any facility for generating fencing tokens… the unique random value it uses does not provide the required monotonicity."* `go-redsync/redsync/v4`'s own README says the algorithm is an **unanalyzed proposal**; `Valid`/`ValidContext` are deprecated.

```go
// EFFICIENCY lock — redsync/v4. Acceptable for dedupe; NOT a correctness guarantee.
mu := rs.NewMutex("job", redsync.WithExpiry(8*time.Second), redsync.WithTries(32))
if err := mu.LockContext(ctx); err != nil { return err }
defer mu.UnlockContext(ctx)            // value-matched DEL (only unlocks your own)
if ok, err := mu.ExtendContext(ctx); !ok || err != nil { // long work: extend BEFORE expiry, CHECK ok
    return errors.New("lost lock — abort")
}
```

```go
// CORRECTNESS lock — etcd lease + ownership check at the mutation point (the fence).
sess, _ := concurrency.NewSession(cli, concurrency.WithTTL(15)) // default TTL is 60s if non-positive
defer sess.Close()
m := concurrency.NewMutex(sess, "/locks/job-123")
if err := m.Lock(ctx); err != nil { return err }
defer m.Unlock(context.Background())
resp, err := cli.Txn(ctx).
    If(m.IsOwner()).                                   // CAS on the lock key's create-revision
    Then(clientv3.OpPut("/jobs/123/state", "done")).
    Commit()
if err != nil { return err }
if !resp.Succeeded { return errors.New("lost lock ownership before commit") }
```

**An etcd mutex is a lease, not permanent ownership.** `Session.Done()`/`Ctx()` fire when the lease is orphaned/expired; liveness must be re-checked at the write. The **fencing token** is the lock key's `CreateRevision` (etcd revisions are globally monotonic); thread it to the protected resource so a stale writer's lower token is rejected. Consul's `ModifyIndex` plays the same role. **If you cannot enforce a fence at the resource, make the operation idempotent instead of trusting the lock.**

```
acquire → token=33 → client A (GC pause)
          token=34 → client B writes @34
A resumes, writes @33 → RESOURCE REJECTS (33 < 34)
```

**Lock traps:** no TTL → crashed holder deadlocks all waiters; no extension for long jobs → lease expires mid-work, two holders run; unconditional `DEL` instead of value-matched delete → you free *another* client's lock; treating any Redis lock as correctness-grade; ignoring clock drift (redsync applies a drift factor; naive single-node locks don't). `NewSTMSerializable` is **deprecated** in the etcd concurrency package; prefer `NewSTM` with `WithIsolation`.

---

## Service Discovery {#service-discovery}

| Mechanism | When |
|---|---|
| **K8s DNS** | In Kubernetes: zero config, `svc.ns.svc.cluster.local`. With gRPC use the `dns:///` scheme + a `_grpc` headless service for client-side LB. |
| **Consul** (`hashicorp/consul/api`) | Multi-DC, health-check-driven routing outside K8s. |
| **etcd** | Already using etcd for coordination: register under a prefix, watch for changes. |
| **DNS SRV** | Language-agnostic, multi-environment; coarse (no health, TTL-bound). |

**Default:** K8s DNS in Kubernetes, Consul otherwise. **The gRPC-specific trap:** `grpc.NewClient("dns:///svc:port")` re-resolves and balances across all A records (with `round_robin` in the service config); a bare `host:port` pins to one backend. K8s `ClusterIP` L4-balances *connections*, which gRPC's HTTP/2 multiplexing defeats: use a **headless** service for real per-RPC balancing. K8s patterns: [cloud-native.md](cloud-native.md#leader-election).

---

## Message systems: NATS/JetStream & Kafka {#messaging}

Two families: **NATS** (lightweight, low-latency, JetStream for persistence) and **Kafka** (high-throughput durable log). Pick by ops profile, not features alone.

**NATS**: `nats-io/nats.go` **v1.52.0** (2026). Core NATS is fire-and-forget at-most-once; **JetStream** adds persistence + at-least-once. The **modern API is the `github.com/nats-io/nats.go/jetstream` subpackage**. `nc.JetStream()`/`js.Subscribe`/`js.PullSubscribe` (the `JetStreamContext`) is documented as **legacy**.

```go
nc, _ := nats.Connect("nats://localhost:4222")
js, _ := jetstream.New(nc)                                    // modern API entry point
js.CreateStream(ctx, jetstream.StreamConfig{
    Name: "ORDERS", Subjects: []string{"orders.>"},
    Duplicates: 2 * time.Minute,                              // dedup window for Nats-Msg-Id
})
// Publish with a dedup ID → JetStream drops duplicates within the window.
js.Publish(ctx, "orders.created", payload, jetstream.WithMsgID(order.ID))

// Pull consumer (preferred over push): durable, explicit ack.
c, _ := js.CreateOrUpdateConsumer(ctx, "ORDERS", jetstream.ConsumerConfig{
    Durable: "billing", AckPolicy: jetstream.AckExplicitPolicy,
})
cc, _ := c.Consume(func(m jetstream.Msg) {
    if err := process(m); err != nil { m.Nak(); return } // redeliver
    m.Ack()                                              // explicit ack REQUIRED
})
defer cc.Stop()
```

JetStream "exactly-once" = **publisher dedup** (`Nats-Msg-Id` header + the stream `Duplicates` window) **plus** explicit-ack consumers: still at-least-once delivery with dedup, *not* magic. `AckExplicitPolicy` requires ack/nak per message; forget to ack and the message redelivers after `AckWait`. Prefer `Consume`/`Messages` (pre-buffered) over `Fetch` for continuous consumption (`Fetch` skips buffering optimizations).

**Kafka**: two serious clients:

| Library | API style | Notes |
|---|---|---|
| **`twmb/franz-go`** (`pkg/kgo`, 2026) | One `*kgo.Client`, `PollFetches`/`ProduceSync` | Pure Go, fastest, most complete: full transactions/EOS (`TransactionalID`, `GroupTransactSession`), `RequireStableFetchOffsets`, KIP coverage. **Preferred for new code.** |
| **`segmentio/kafka-go`** | `Reader`/`Writer` | Simpler, idiomatic `io`-style API; lighter feature set; widely used. Fine for straightforward produce/consume. |

```go
// franz-go: consumer group with manual commit (the correct at-least-once loop).
cl, _ := kgo.NewClient(
    kgo.SeedBrokers("localhost:9092"),
    kgo.ConsumerGroup("billing"), kgo.ConsumeTopics("orders"),
    kgo.DisableAutoCommit(),                 // commit AFTER processing, not before
)
for {
    fs := cl.PollFetches(ctx)
    if errs := fs.Errors(); len(errs) > 0 { /* handle; some are fatal */ }
    fs.EachRecord(func(r *kgo.Record) { process(r) })
    if err := cl.CommitRecords(ctx, fs.Records()...); err != nil { /* retry */ }
}
```

**Kafka traps:** auto-commit commits *offsets you may not have processed*: disable it and commit after work (at-least-once), or you silently drop messages on crash. Kafka transactions/EOS (`TransactionalID`) cover only Kafka read-process-write; your external DB write is **not** in that transaction. Consumer group rebalances revoke partitions mid-poll; commit before yielding. franz-go vs segmentio: franz-go for transactions, performance, and full protocol coverage; segmentio for a smaller, simpler surface. `IBM/sarama` (formerly Shopify) is the legacy client (still maintained), but franz-go is the modern default.

---

## Consistent hashing {#consistent-hashing}

Spread keys across nodes so adding/removing a node remaps ~1/N of keys, not all of them. The library choice and the *algorithm* choice are both load-bearing.

| Algorithm | Lookup | Balance | Weights | Best for |
|---|---|---|---|---|
| Ring + vnodes | O(log V) | needs ~100-200 vnodes/node | easy (replica count) | general data placement |
| Jump (Lamping-Veach) | O(ln n), O(1) mem | perfect | hard | fixed, sequentially-numbered buckets only |
| Rendezvous/HRW | O(n) | uniform | one-line `-w/ln(h)` | small replica sets; clean churn |
| Bounded-load (CH-BL) | ring + load cap | capped at c·avg | via partitions | **load balancers** (hot keys) |

```go
// github.com/buraksezer/consistent v0.10.0 — bounded-load + fixed partitioning (NOT a plain ring).
type member string
func (m member) String() string { return string(m) }
type hasher struct{}
func (hasher) Sum64(b []byte) uint64 { return xxhash.Sum64(b) } // FIXED-seed hash — critical

c := consistent.New(members, consistent.Config{
    PartitionCount:    271,   // FIXED at creation — cannot change later
    ReplicationFactor: 20,    // vnodes per member
    Load:              1.25,  // cap any node at 1.25× average (bounded load)
    Hasher:            hasher{},
})
owner := c.LocateKey([]byte("customer:42"))
replicas, _ := c.GetClosestN([]byte("customer:42"), 2) // for replication/fallback
```

**The catastrophic, silent bug: a per-process-seeded hash** (Go's `hash/maphash` uses a random per-process seed) → **every node computes a different ring**, sending the same key to different owners. Use a fixed-seed, well-distributed hash (xxhash, murmur3) everywhere. **`buraksezer/consistent` is not a libketama clone:** keys map to partitions via `MOD(hash, PartitionCount)`, partition count is fixed at creation, and adding a member can **panic** if the bounded-load constraint can't be satisfied. Used in Olric, SeaweedFS, the OTel Operator; stale (Nov 2022) but de-facto standard. **Jump hash** (`lithammer/go-jump-consistent-hash`) is O(1)/perfectly balanced but can only add/remove the *last* bucket, wrong for a dynamic named-server set with failures. **Rendezvous/HRW** redistributes only a removed node's keys, evenly; strictly better churn than a naive ring, at O(n)/lookup. `serialx/hashring` is legacy ketama (untagged, no go.mod, 2020), only for wire-compat with existing clients. For *load balancing* (hot keys), bounded-load (CH-BL); for *data placement*, ring/HRW.

---

## Clock skew & logical clocks {#clocks}

> **Never use `time.Now()` to order events across machines.** Wall clocks drift (NTP steps backward), and `time.Now()` mixes wall + monotonic readings. For *durations on one machine* use `time.Since` (monotonic, immune to NTP jumps); for *cross-machine ordering* use logical clocks.

- Lamport timestamps: a single counter, incremented on each local event and bumped to `max(local, received)+1` on receive. Gives a total order consistent with causality (`a → b ⇒ L(a) < L(b)`), but *not* the converse: equal/ordered timestamps don't prove concurrency. Cheap; good for tie-breaking.
- Vector clocks: one counter per node; compare element-wise to detect *concurrent* vs *causally-ordered* events (the thing Lamport can't). Cost is O(nodes) per message, bounded only with node-set churn management. This is what CRDT merges and conflict detection need.
- Hybrid Logical Clocks (HLC): combine a physical timestamp with a logical counter: human-readable, close to wall time, but monotonic and causality-respecting. The practical choice for distributed databases (CockroachDB uses HLC).

```go
// Lamport clock — the minimal correct primitive. Mutate under a lock.
type Lamport struct{ mu sync.Mutex; t uint64 }
func (c *Lamport) Tick() uint64 { c.mu.Lock(); defer c.mu.Unlock(); c.t++; return c.t }
func (c *Lamport) Witness(remote uint64) uint64 {
    c.mu.Lock(); defer c.mu.Unlock()
    if remote > c.t { c.t = remote }
    c.t++
    return c.t
}
```

**LWW (last-write-wins) without a logical clock silently loses writes** under skew: a documented Go failure mode reported ~12% inconsistent merges from clock-skew reordering during partitions `[verify: practitioner case study, illustrative not benchmarked]`. If you must LWW, pair the timestamp with a deterministic tiebreak (replica ID) and prefer HLC over wall time. **Trap:** comparing two machines' `time.Now()` to decide a winner; storing a `time.Time` from one host and treating it as authoritative ordering on another.

---

## Distributed tracing propagation {#tracing}

A trace connects across services only if **context propagates over the wire**: W3C `traceparent`/`tracestate` headers in gRPC metadata / HTTP headers, threaded through `context.Context`.

- gRPC: `otelgrpc` *stats handlers* (`grpc.WithStatsHandler(otelgrpc.NewClientHandler())` / `otelgrpc.NewServerHandler()`). The old unary/stream *interceptor* path is deprecated; handlers also cover streaming correctly.
- HTTP: `otelhttp.NewHandler` (server) + `otelhttp.NewTransport` (client).
- The trap: a downstream call or goroutine **without `ctx`** severs the trace (orphan span). Thread `ctx` into every call and worker.

```go
// Manual propagation when no instrumentation wrapper exists (e.g. a custom message bus).
prop := otel.GetTextMapPropagator() // set once: propagation.NewCompositeTextMapPropagator(TraceContext{}, Baggage{})
// Producer: inject ctx → carrier (a map[string]string put on the message).
prop.Inject(ctx, propagation.MapCarrier(headers))
// Consumer: extract carrier → ctx, then start the child span under it.
ctx = prop.Extract(ctx, propagation.MapCarrier(headers))
ctx, span := tracer.Start(ctx, "consume orders.created")
defer span.End()
```

Set the propagator globally or cross-vendor traces break at the boundary (the #1 "my traces are disconnected" cause). Sampling decisions ride in `traceparent`'s sampled flag; propagate it so a sampled trace stays sampled end-to-end. Full tracing/metrics setup: [observability.md](observability.md#tracing).

---

## Event Sourcing {#event-sourcing}

> Store every state change as an immutable event; derive current state by replay. **Not** event-driven architecture (publishing to a bus); pre-training conflates them.

```go
type Event struct {
    AggregateID string          `json:"aggregate_id"`
    Version     int             `json:"version"`     // optimistic-concurrency guard
    EventType   string          `json:"event_type"`
    Data        json.RawMessage `json:"data"`
    Timestamp   time.Time       `json:"timestamp"`
}
type EventStore interface {
    Save(ctx context.Context, expectedVersion int, events []Event) error // reject on version conflict
    Load(ctx context.Context, aggregateID string, afterVersion int) ([]Event, error)
}
```

**Append uses optimistic concurrency:** a unique constraint on `(aggregate_id, version)` makes concurrent writers collide instead of corrupting the stream: catch the conflict, reload, retry. **Snapshot every N events** or replay gets linearly slower (load snapshot + events since). **Projections** (read models built from the stream) must be **idempotent** (`ON CONFLICT DO NOTHING` / upsert) because the stream is replayed and events can redeliver; track a per-projection checkpoint to resume. `ThreeDotsLabs/watermill` (v1.5+) routes events over Kafka/NATS/AMQP with `Publisher`/`Subscriber` interfaces and ack handling.

---

## CQRS {#cqrs}

Separate the write model (command handlers returning only `error`) from the read model (query handlers returning data). **Independent of event sourcing**: works over a plain database. Group handlers in an `Application{ Commands, Queries }` struct.

| Use CQRS | Skip it |
|---|---|
| Different read/write scaling | Simple CRUD |
| Complex read models spanning aggregates | Read and write models are identical |

An asynchronously-fed read side is eventually consistent, so surface that staleness (don't let a client read-after-write expect its own change). For most apps one model is correct; reach for CQRS only when read/write shapes or scale genuinely diverge.

---

## Library landscape & status {#libraries}

| Concern | Library | Version (2026) | Status / note |
|---|---|---|---|
| gRPC | `google.golang.org/grpc` | **v1.81.x** | `Dial`→`NewClient`; status codes; keepalive |
| Protobuf runtime + codegen | `google.golang.org/protobuf` (+`protoc-gen-go-grpc`) | current | APIv2; old `golang/protobuf` deprecated |
| Proto toolchain | `buf` | current | Lint + breaking-change detection + BSR |
| Raft | `github.com/hashicorp/raft` | **v1.7.3** | Pre-vote default ≥1.7.0; use ≥1.7.1 |
| Raft store | `github.com/hashicorp/raft-boltdb/v2` | **v2.3.1** | Use **/v2** (bbolt); `MigrateToV2` |
| Raft WAL store | `github.com/hashicorp/raft-wal` | n/a | Faster than BoltDB write-heavy |
| Saga / workflow | `go.temporal.io/sdk` | **v1.45.0** | Durable orchestration; determinism rules |
| Outbox / messaging toolkit | `github.com/ThreeDotsLabs/watermill` | v1.5+ | Forwarder nacks non-decorated msgs |
| etcd lock/election | `go.etcd.io/etcd/client/v3` (`/concurrency`) | **v3.6.x** | Correctness-grade; revision=fence; `NewSTMSerializable` deprecated |
| Redis lock | `github.com/go-redsync/redsync/v4` | **v4.16.x** | **Efficiency only**; no fencing; `Valid` deprecated |
| NATS / JetStream | `github.com/nats-io/nats.go` (`/jetstream`) | **v1.52.0** | Use the `jetstream` subpkg; legacy `JetStreamContext` |
| Kafka | `github.com/twmb/franz-go` | current (Feb 2026) | Pure Go, fastest, full EOS, **default** |
| Kafka (simple) | `github.com/segmentio/kafka-go` | current | Smaller surface; `Reader`/`Writer` |
| Kafka (legacy) | `github.com/IBM/sarama` | maintained | Older; franz-go preferred for new code |
| Consistent hash (bounded load) | `github.com/buraksezer/consistent` | **v0.10.0** | Fixed partitions; can panic on add; de-facto standard |
| Jump hash | `github.com/lithammer/go-jump-consistent-hash` | current | Sequential buckets only |
| Ketama ring (legacy) | `github.com/serialx/hashring` | untagged (2020) | Wire-compat only |
| Circuit breaker | `github.com/sony/gobreaker/v2` | current | See errors-and-resilience.md |
| CRDTs | `automerge/automerge-go` (cgo); `ipfs/go-ds-crdt` | n/a | **No mature general native-Go CRDT lib** |

---

## What models get wrong {#stale}

1. **`grpc.Dial`/`WithInsecure()`/`WithBlock()`**: deprecated; use `grpc.NewClient` + `WithTransportCredentials(insecure.NewCredentials())`; don't block on dial (it's lazy).
2. **Returning bare errors from gRPC handlers** → client gets `codes.Unknown`. Use `status.Error(code, msg)`; map context errors with `status.FromContextError`.
3. **No deadline on the client call**: a gRPC deadline is the whole-call budget propagated over the wire; without it a wedged server hangs you forever.
4. **Mismatched keepalive** → `GOAWAY ENHANCE_YOUR_CALM`; client `Time` must be ≥ server `EnforcementPolicy.MinTime` and `PermitWithoutStream` must match.
5. **Treating `io.EOF` from a stream `Recv()` as an error**: it's the normal end-of-stream; concurrent `Send` on one stream is unsafe.
6. **Reusing/renumbering a protobuf field tag**; relying on proto3 zero-value as "unset" without `optional`; copying a proto message by value (use `proto.Clone`).
7. **Assuming exactly-once delivery** (outbox, Kafka EOS, JetStream) removes the need for idempotent consumers; it never does.
8. **Check-then-act dedup across two transactions** (TOCTOU) / deduping *after* the side effect; idempotency-key record not written atomically with the effect.
9. **Outbox without `FOR UPDATE SKIP LOCKED`** (multi-relay contention); marking published in a separate transaction.
10. **Raft `Apply` with `time.Now()`/`rand`/map-iteration/floats** → silent replica divergence; side effects inside `Apply` (run per-replica, per-replay); snapshotting a live map (races `Persist`); `Restore` merging instead of replacing; expecting `Apply` errors to roll back.
11. **Treating any Redis/redsync lock as correctness-grade**: no fencing tokens; for correctness use etcd/Consul lease + a monotonic revision the resource enforces.
12. **Lock without TTL** (deadlocks waiters), **without extension** for long jobs, or unconditional `DEL` (frees another holder's lock).
13. **etcd mutex assumed permanent**: it's a lease; re-check `session.Done()`/`IsOwner()` at the mutation; `NewSTMSerializable` is deprecated.
14. **Per-process-seeded hash in a consistent-hash ring** → every node computes a different ring (silent, catastrophic). Use a fixed-seed hash. Jump hash for a dynamic named set; assuming `buraksezer/consistent` partition count is mutable.
15. **`time.Now()` to order events across machines**: wall clocks drift; use Lamport/vector/HLC; LWW without a logical clock loses writes.
16. **Severing the trace by not passing `ctx`** to a downstream call or goroutine; not setting a global propagator (cross-vendor traces break).
17. **Temporal `SideEffect` assumed at-most-once** (it isn't); native nondeterminism (`time.Now`, map range, bare goroutines) in workflow code; cleanup on a canceled `ctx` (use `NewDisconnectedContext`); changing workflow code without `GetVersion`.
18. **Retries without a budget** (fixed per-call attempts still N×-amplify load); retrying non-retryable codes (`InvalidArgument`/`FailedPrecondition`); no jitter → retry storm.
19. **Confusing event sourcing with event-driven**; event store without snapshots (replay slows linearly); non-idempotent projections.
20. **Claiming a mature general native-Go CRDT library exists**: it doesn't; prefer δ-state designs with explicit logical clocks + tombstone GC, or Rust bindings for text.

---

## See Also {#see-also}

- [errors-and-resilience.md](errors-and-resilience.md): circuit breaker, retry+jitter, timeouts, graceful degradation, context cancellation
- [observability.md](observability.md): distributed tracing setup, span propagation, error-rate metrics
- [concurrency.md](concurrency.md): goroutine lifecycle, errgroup, context propagation, channels
- [http-and-apis.md](http-and-apis.md): HTTP client timeouts, server shutdown, SSE
- [event-driven.md](event-driven.md): Kafka/RabbitMQ/NATS/Redis Streams consumer patterns, Watermill
- [cloud-native.md](cloud-native.md): K8s leader election, service discovery, operators
- [database.md](database.md): transaction patterns, connection pooling, optimistic concurrency

## Sources {#sources}

- pkg.go.dev: `google.golang.org/grpc{,/status,/codes,/keepalive,/metadata}` (v1.81.x); `google.golang.org/protobuf`; `go.etcd.io/etcd/client/v3/concurrency` (v3.6.x); `github.com/hashicorp/raft` (v1.7.3); `github.com/hashicorp/raft-boltdb/v2` (v2.3.1); `github.com/nats-io/nats.go{,/jetstream}` (v1.52.0); `github.com/twmb/franz-go/pkg/kgo`; `github.com/go-redsync/redsync/v4`; `github.com/buraksezer/consistent` (v0.10.0); `go.temporal.io/sdk` (v1.45.0)
- grpc.io docs (status codes, deadlines, keepalive, name resolution); developers.google.com/protocol-buffers (wire format, field rules); buf.build docs
- Kleppmann, "How to do distributed locking" (2016-02-08); antirez, "Is Redlock safe?"; etcd `concurrency.Mutex.IsOwner` source
- microservices.io transactional outbox; Stripe API idempotency docs; IETF `Idempotency-Key` draft; Temporal workflow determinism docs (`SideEffect`, `NewDisconnectedContext`, `GetVersion`, `DeterministicKeys`)
- Gryski, "Consistent Hashing: Algorithmic Tradeoffs"; Lamping-Veach jump hash; Mirrokni et al., "Consistent Hashing with Bounded Loads" (2016)
- W3C Trace Context; OpenTelemetry Go (`otelgrpc`/`otelhttp` propagation)
