# Event-Driven Architecture in Go

Most teams reach for a broker before they need one. If your write fits in one Postgres transaction, stop. You don't have an event-driven problem yet. Eventing earns its complexity only when producers and consumers must evolve and scale independently. The load-bearing decisions are *delivery semantics* (at-least-once is the only honest default), *ordering vs. parallelism* (you get one, keyed by partition), and *idempotency* (what makes redelivery safe). Brokers are interchangeable; those three are not.

> Verified against Go **1.26.x** (stable) + **1.27 RC** notes, 2026-06. Library versions checked against pkg.go.dev. Baseline **1.22**. This file is the event-driven *delta*: channel mechanics, goroutine lifecycle, and errgroup live in [concurrency.md](concurrency.md); outbox, sagas, and event sourcing live in [distributed-systems.md](distributed-systems.md).

## TL;DR: the deltas that matter (read first)

- **Exactly-once delivery across a network is a marketing term.** What Kafka transactions and JetStream dedup give you is *exactly-once **processing** within a closed system*, never end-to-end through your side effects. Design for at-least-once + **idempotent consumers** and stop fighting physics.
- **Ordering is per-partition, not per-topic.** A global order requires a single partition, which caps throughput at one consumer. Key by entity (`order-123`) to get per-entity order *and* parallelism across entities. This is the central trade-off of every log broker.
- **An in-process channel bus is not a message queue.** A buffered channel drops everything on crash, applies backpressure by blocking the producer, and has no persistence, replay, or cross-process reach. Use it for intra-service decoupling; do not reinvent durability on top of it.
- **`segmentio/kafka-go` has no cooperative-sticky rebalancing.** Its balancers are Range, RoundRobin, RackAffinity, all *eager* (stop-the-world); it does not implement incremental cooperative rebalancing (KIP-429) `[verify]`. For that in pure Go, use `twmb/franz-go`. The common claim "use cooperative-sticky with segmentio" is **wrong**: that balancer doesn't exist there.
- **At-least-once means ack *after* the side effect commits, not after you receive.** Auto-commit / auto-ack is at-*most*-once in disguise: a crash between receive and processing loses the message silently.
- **A DLQ without an alert is a black hole.** Poison messages land there and nobody looks. Alert on depth, inflow rate, and oldest-message age, and write the redrive path *before* you ship.

## Table of Contents
1. [In-process event bus (and its limits)](#in-process-bus)
2. [Delivery semantics: the only honest model](#delivery-guarantees)
3. [Ordering, partitioning, and parallelism](#ordering)
4. [Broker comparison](#broker-comparison)
5. [Kafka](#kafka)
6. [RabbitMQ](#rabbitmq)
7. [Redis Streams](#redis-streams)
8. [NATS JetStream](#nats-jetstream)
9. [Watermill](#watermill)
10. [CloudEvents & schema discipline](#cloudevents)
11. [Producer patterns](#producer-patterns)
12. [Consumer patterns & rebalancing](#consumer-patterns)
13. [Backpressure & flow control](#backpressure)
14. [Dead letter queues](#dead-letter-queues)
15. [Library landscape & status](#libraries)
16. [Anti-patterns / what models get wrong](#anti-patterns)
17. [See Also](#see-also)
18. [Sources](#sources)

---

## In-process event bus (and its limits) {#in-process-bus}

Before a broker, the idiomatic decoupling primitive is a channel. A typed in-process bus fans one event out to N subscribers without the publisher knowing who they are (useful for cache invalidation, metrics, or audit hooks within *one* process).

```go
type Bus[T any] struct {
    mu   sync.RWMutex
    subs []chan T
}

func (b *Bus[T]) Subscribe(buf int) <-chan T {
    if buf <= 0 {
        buf = 64 // sane default: absorb normal bursts. A buffer of 0 or 1 drops
                 // ordinary traffic (the publisher can't block), not just overflow.
    }
    ch := make(chan T, buf)
    b.mu.Lock(); b.subs = append(b.subs, ch); b.mu.Unlock()
    return ch
}

// Publish never blocks the caller. The default branch is an OVERFLOW valve for a
// genuinely stalled subscriber — NOT normal-case loss: size the buffer to your
// expected burst and ordinary traffic is delivered in full. If the contract is
// "every subscriber receives every event," buffer for the burst (or block
// deliberately) — honor the delivery contract; don't let a tiny buffer silently drop.
func (b *Bus[T]) Publish(ev T) {
    b.mu.RLock(); defer b.mu.RUnlock()
    for _, ch := range b.subs {
        select {
        case ch <- ev:
        default: // buffer full = a stalled consumer; drop (or count a metric, or block)
        }
    }
}
```

**Where this breaks, and why a channel is not a queue:**

| Property | In-process channel | Real broker |
|---|---|---|
| Survives crash/restart | No, buffered events vanish | Yes (persisted) |
| Cross-process / cross-host | No | Yes |
| Replay / late subscriber | No | Yes (log brokers) |
| Backpressure | Block the producer, or drop | Consumer lag + flow control |
| Delivery guarantee | Best-effort, in-memory | At-least-once with ack |

The trap is *durability theater*: wrapping a channel in retries and a "DLQ slice" to fake a broker. You can't: a process crash takes the whole in-memory state with it. The moment you need any row of the right column, adopt a broker; don't grow one. (Goroutine lifecycle, `context` cancellation of subscribers, and `errgroup` for the consumer pool: [concurrency.md](concurrency.md).)

---

## Delivery semantics: the only honest model {#delivery-guarantees}

Three models exist; the difference is *when you acknowledge relative to the side effect*.

| Model | Ack timing | Failure outcome | Honest use |
|---|---|---|---|
| **At-most-once** | Ack **before** processing | Message lost on crash | Metrics, fire-and-forget telemetry where loss is fine |
| **At-least-once** | Ack **after** the effect commits | Duplicates on redelivery | **The default.** Pair with idempotency |
| **Exactly-once** | n/a | *Does not exist end-to-end* | A closed-system illusion (see below) |

```go
// WRONG — "auto-commit" / autoAck is at-MOST-once wearing an at-least-once costume.
// A crash between receive and the DB write loses the message with no trace.
msg := <-deliveries          // broker considers it delivered & acked immediately
process(msg)                 // crash here → gone forever

// RIGHT — at-least-once: the broker keeps the message until YOU ack, after commit.
msg, _ := r.FetchMessage(ctx)        // received, NOT acked
if err := process(ctx, msg); err != nil {
    return err                       // no ack → broker redelivers
}
r.CommitMessages(ctx, msg)           // ack only after the effect is durable
```

**Why "exactly-once" is an illusion.** Kafka's transactional producer and JetStream's `WithMsgID` dedup are real, but they guarantee exactly-once *processing within the broker's own state*: the read-process-write loop where both the write and the offset commit land in one Kafka transaction. The instant your consumer calls an external API, charges a card, or writes to a second datastore, the broker can't make that effect atomic with the ack. A crash after the effect but before the ack *will* redeliver. So:

> The realistic target is **at-least-once delivery + idempotent processing**. Idempotency (dedup keys, `INSERT ... ON CONFLICT DO NOTHING`, conditional writes, a processed-message table) is what makes "deliver twice" equal "happen once." Build it; don't chase exactly-once.

Idempotency-key patterns and the inbox/outbox tables live in [distributed-systems.md](distributed-systems.md#idempotency).

---

## Ordering, partitioning, and parallelism {#ordering}

The single most misunderstood property of log brokers: **order is guaranteed only within a partition.** A topic with 12 partitions has 12 independent ordered logs, interleaved arbitrarily across each other.

- **Global total order** ⇒ one partition ⇒ one active consumer in the group ⇒ throughput ceiling. Almost never what you want.
- **Per-entity order + horizontal scale** ⇒ partition by a stable key (`customerID`, `orderID`). All events for one entity hash to one partition (ordered); different entities spread across partitions (parallel). This is the correct default.

```go
// segmentio: same Key → same partition → per-key ordering preserved.
w := &kafka.Writer{
    Addr:     kafka.TCP("localhost:9092"),
    Topic:    "orders",
    Balancer: &kafka.Hash{}, // hash(Key) → partition. Murmur2 variant: &kafka.Murmur2Balancer{} for cross-language parity with the JVM client
}
w.WriteMessages(ctx,
    kafka.Message{Key: []byte("order-123"), Value: created},
    kafka.Message{Key: []byte("order-123"), Value: shipped}, // same partition, ordered after created
)
```

**Traps:** (1) `nil`/empty key with a hash balancer scatters an entity's events: order lost. (2) **Changing partition count rehashes keys**: an entity's history splits across old and new partitions; size partitions for peak up front. (3) Within a partition, multi-threaded consumers reorder unless you serialize per key. (4) RabbitMQ preserves order only on a *single* queue with a *single* consumer; `Nack(requeue=true)` reorders. Ordering is paid for in parallelism: spend it only where the domain demands it.

---

## Broker comparison {#broker-comparison}

| Broker | Recommended Go client | Pure Go | Model | Best for |
|---|---|---|---|---|
| **Kafka** | `twmb/franz-go` | Yes | Partitioned log, replay | Full Kafka (txns, cooperative rebalance) without CGo |
| **Kafka** | `segmentio/kafka-go` | Yes | Partitioned log | Simple produce/consume; no txns, no cooperative rebalance |
| **Kafka** | `confluent-kafka-go/v2` | No (CGo) | Partitioned log | Exactly-once-processing txns, librdkafka parity |
| **RabbitMQ** | `rabbitmq/amqp091-go` | Yes | Broker w/ exchanges & routing | Complex routing, work queues, native DLX |
| **Redis Streams** | `redis/go-redis/v9` | Yes | Lightweight log | Redis already deployed; modest throughput |
| **NATS JetStream** | `nats-io/nats.go/jetstream` | Yes | Streams + consumers | Cloud-native, low-latency, simple ops |
| **Any of the above** | `ThreeDotsLabs/watermill` | Yes | Abstraction layer | Swap backends; uniform handler/router |

**Heuristic:** Redis already in the stack → Redis Streams. Rich routing (topic/headers/fanout) → RabbitMQ. Replay + high throughput + ecosystem → Kafka (`franz-go` unless CGo/txn parity forces confluent). Lightweight cloud-native with minimal ops → NATS JetStream. Need to defer the choice or stay portable → Watermill.

---

## Kafka {#kafka}

|  | segmentio/kafka-go | franz-go | confluent-kafka-go/v2 |
|---|---|---|---|
| Dependency | Pure Go | Pure Go | CGo (librdkafka) |
| Cross-compile | Easy | Easy | Needs C toolchain |
| Transactions (EOS) | **No** | Yes | Yes |
| Cooperative rebalance | **No** (eager only) | Yes | Yes |
| Idempotent producer | No | Yes (default) | Yes (`enable.idempotence`) |
| API style | Writer/Reader | Client + records | Poll/Produce |

`franz-go` is feature-complete against Kafka 0.8.0-4.2+, pure Go, and the recommendation for serious Kafka work; `segmentio/kafka-go` is fine for straightforward pipelines but lacks transactions and incremental rebalancing.

### segmentio/kafka-go (`github.com/segmentio/kafka-go`)

```go
// Consumer group, manual commit = at-least-once. FetchMessage does NOT auto-commit.
r := kafka.NewReader(kafka.ReaderConfig{
    Brokers: []string{"localhost:9092"}, GroupID: "order-processor", Topic: "orders",
    // GroupBalancers default to Range + RoundRobin; no cooperative option exists here.
})
defer r.Close()
for {
    m, err := r.FetchMessage(ctx)
    if err != nil { return err }            // ctx cancel or fatal
    if err := process(ctx, m); err != nil { continue } // no commit → redelivery
    if err := r.CommitMessages(ctx, m); err != nil { return err } // ack after work
}
```

### franz-go (`github.com/twmb/franz-go/pkg/kgo`)

```go
cl, _ := kgo.NewClient(
    kgo.SeedBrokers("localhost:9092"),
    kgo.ConsumerGroup("order-processor"),
    kgo.ConsumeTopics("orders"),
    kgo.Balancers(kgo.CooperativeStickyBalancer()), // incremental rebalance (no stop-the-world)
    kgo.DisableAutoCommit(),                          // commit explicitly for at-least-once
)
defer cl.Close()
for {
    fs := cl.PollFetches(ctx)
    if errs := fs.Errors(); len(errs) > 0 { /* handle/log */ }
    fs.EachRecord(func(rec *kgo.Record) { process(ctx, rec) })
    if err := cl.CommitUncommittedOffsets(ctx); err != nil { return err }
}
```

`confluent-kafka-go/v2` adds exactly-once-*processing* via `InitTransactions → BeginTransaction → Produce → SendOffsetsToTransaction → CommitTransaction`, which commits the produced records *and* the input offsets atomically: the genuine read-process-write EOS loop, but only inside Kafka.

---

## RabbitMQ {#rabbitmq}

> `github.com/rabbitmq/amqp091-go`: the maintained successor to the archived `streadway/amqp`.

### Exchange types

| Type | Routing | Use case |
|---|---|---|
| **direct** | Exact routing-key match | Point-to-point |
| **fanout** | Broadcast to all bound queues | Notifications, cache invalidation |
| **topic** | Pattern (`*`=one word, `#`=zero+) | Hierarchical events (`orders.us.*`) |
| **headers** | Match header key/values | Attribute-based routing |

```go
ch.Confirm(false)                                    // publisher confirms = ack from broker
confirms := ch.NotifyPublish(make(chan amqp.Confirmation, 1))
ch.PublishWithContext(ctx, "events", "orders.created", false, false, amqp.Publishing{
    DeliveryMode: amqp.Persistent,                   // survive broker restart (with a durable queue)
    ContentType:  "application/json", Body: orderJSON,
})
if c := <-confirms; !c.Ack { /* not persisted — retry or fail loudly */ }

// Manual-ack consumer (autoAck=false) = at-least-once.
msgs, _ := ch.Consume(q.Name, "", false, false, false, false, nil)
for d := range msgs {
    if err := process(d.Body); err != nil {
        d.Nack(false, false)                         // requeue=false → route to DLX (below)
        continue
    }
    d.Ack(false)
}
```

**Expert points:** durability needs **both** a durable queue **and** persistent messages: one without the other still loses data on restart. Set a **prefetch limit** (`ch.Qos(prefetch, 0, false)`), RabbitMQ's primary backpressure lever, or one consumer grabs the whole queue and starves its peers. `Nack(requeue=true)` on a poison message creates an infinite redelivery loop; requeue=false routes to the dead-letter exchange instead.

---

## Redis Streams {#redis-streams}

> `github.com/redis/go-redis/v9`. A lightweight log, good when Redis is already deployed and throughput is modest.

```go
rdb.XGroupCreateMkStream(ctx, "orders", "processors", "$") // idempotent — ignore BUSYGROUP error

streams, _ := rdb.XReadGroup(ctx, &redis.XReadGroupArgs{
    Group: "processors", Consumer: "worker-1",
    Streams: []string{"orders", ">"}, Count: 10, Block: 5 * time.Second,
}).Result()
for _, s := range streams {
    for _, msg := range s.Messages {
        if err := process(msg.Values); err != nil { continue } // no ack → stays pending
        rdb.XAck(ctx, "orders", "processors", msg.ID)          // explicit ack
    }
}
// Reclaim a dead consumer's un-acked messages (the Pending Entries List):
rdb.XAutoClaim(ctx, &redis.XAutoClaimArgs{
    Stream: "orders", Group: "processors", Consumer: "worker-1",
    MinIdle: 60 * time.Second, Start: "0",
})
```

The **PEL (Pending Entries List)** is the at-least-once mechanism: a message read by a consumer stays pending until `XAck`. If that consumer dies, `XAutoClaim`/`XClaim` lets a sibling take over un-acked work after `MinIdle`. Forgetting to reclaim = silently orphaned messages. Trim with `MAXLEN`/`MINID` (`XADD ... MAXLEN ~ N`) or the stream grows unbounded.

---

## NATS JetStream {#nats-jetstream}

> `github.com/nats-io/nats.go/jetstream`: the current API (prefer over the legacy `nc.JetStream()`). At-least-once by default.

```go
js, _ := jetstream.New(nc)
js.CreateStream(ctx, jetstream.StreamConfig{
    Name: "ORDERS", Subjects: []string{"ORDERS.*"},
    Retention: jetstream.LimitsPolicy, Storage: jetstream.FileStorage,
})

// Publish with dedup: same MsgID within the stream's dedup window is ignored.
js.Publish(ctx, "ORDERS.new", orderJSON, jetstream.WithMsgID("order-123-v1"))

// Durable pull consumer with server-side redelivery backoff.
cons, _ := js.CreateOrUpdateConsumer(ctx, "ORDERS", jetstream.ConsumerConfig{
    Durable: "order-processor", AckPolicy: jetstream.AckExplicitPolicy,
    MaxDeliver: 5, AckWait: 30 * time.Second,
    BackOff: []time.Duration{time.Second, 5 * time.Second, 30 * time.Second},
})
cc, _ := cons.Consume(func(msg jetstream.Msg) {
    switch err := process(msg.Data()); {
    case err == nil:
        msg.Ack()
    case isTransient(err):
        msg.NakWithDelay(5 * time.Second)            // redeliver later (or rely on BackOff)
    default:
        msg.Term()                                   // permanent: stop redelivery, send to DLQ
    }
})
defer cc.Stop()
```

`jetstream.Msg` ack flavors: `Ack()`, `Nak()`/`NakWithDelay(d)` (redeliver), `Term()` (give up; do not redeliver regardless of `MaxDeliver`), `InProgress()` (extend `AckWait` for slow work), `DoubleAck(ctx)` (wait for the server to confirm the ack). **Retention dictates semantics:** `LimitsPolicy` = retained event log (replayable), `WorkQueuePolicy` = removed on ack (task queue, one consumer per subject), `InterestPolicy` = removed once all bound consumers ack.

---

## Watermill {#watermill}

> `github.com/ThreeDotsLabs/watermill` (1.5+). Abstracts Kafka, RabbitMQ, Redis Streams, NATS, GCP Pub/Sub, SQL, and an in-memory Go channel behind one `Publisher`/`Subscriber` pair. Swap backends without touching handler logic.

```go
router, _ := message.NewRouter(message.RouterConfig{}, logger)
router.AddPlugin(plugin.SignalsHandler)              // graceful shutdown on SIGINT/SIGTERM
router.AddMiddleware(
    middleware.CorrelationID,                        // propagate a trace/correlation id
    middleware.Recoverer,                            // recover handler panics → Nack, not crash
    middleware.Retry{MaxRetries: 3, InitialInterval: 100 * time.Millisecond}.Middleware,
)

// HandlerFunc: consume from one topic, publish to another. Returns ([]*Message, error).
router.AddHandler("order_to_notif", "order-events", sub, "notification-events", pub,
    func(msg *message.Message) ([]*message.Message, error) {
        out := message.NewMessage(watermill.NewUUID(), []byte("notify"))
        return []*message.Message{out}, nil          // error → Nack (redelivery)
    },
)

// NoPublishHandlerFunc: consume only. nil = Ack, error = Nack.
router.AddNoPublisherHandler("audit", "order-events", sub,
    func(msg *message.Message) error { return process(msg.Payload) },
)
router.Run(ctx)                                       // blocks until ctx is cancelled
```

`AddHandler` returns a `*message.Handler` (attach per-handler middleware); `AddHandler` takes a `HandlerFunc` (publishes), `AddNoPublisherHandler` takes a `NoPublishHandlerFunc` (consume-only). **Backends:** `watermill-kafka/v3`, `watermill-amqp/v3`, `watermill-nats/v2`, `watermill-redisstream`, `watermill-sql/v4` (Postgres/MySQL/SQLite; the SQL backend is also the Watermill-native **outbox** implementation), `watermill-googlecloud/v2`, `watermill-aws`, plus the built-in `gochannel`. The trade-off: a lowest-common-denominator API: broker-specific tuning (Kafka transactions, JetStream ack policies) lives in the backend config, not the portable handler.

---

## CloudEvents & schema discipline {#cloudevents}

The event payload *is* your cross-service contract: version it as deliberately as a REST API. CloudEvents (`github.com/cloudevents/sdk-go/v2`) is a CNCF spec standardizing envelope metadata (`id`, `source`, `type`, `time`, `datacontenttype`, `subject`) so producers and consumers agree on structure across brokers and languages.

```go
e := cloudevents.NewEvent()
e.SetID(uuid.NewString())
e.SetSource("/orders/api")
e.SetType("com.acme.order.created.v1")               // version in the type → additive evolution
e.SetData(cloudevents.ApplicationJSON, OrderCreated{ID: "123"})
```

**Discipline that prevents broken consumers:** version the event *type* (`.v1`, `.v2`) and evolve **additively**: never repurpose or delete a field a consumer reads. Consumers must **ignore unknown fields** (forward compatibility). For stronger guarantees use a schema registry (Avro/Protobuf) with compatibility checks in CI. The CloudEvents envelope is optional (a hand-rolled struct with the same fields works), but the *contract discipline* is not.

---

## Producer patterns {#producer-patterns}

**Batching & compression:** `BatchSize`/`BatchTimeout` (segmentio) or `linger.ms`/`batch.size` (confluent/librdkafka) trade latency for throughput. Snappy/LZ4 for low latency; Zstd for best ratio. **Acks govern durability:** `RequireAll` (Kafka `acks=all`) waits for in-sync replicas, the only safe setting for data you can't lose; `RequireOne`/`RequireNone` trade durability for speed.

| Partitioning | When |
|---|---|
| **Key-based** (hash → partition) | Per-entity ordering (all `order-123` events together) |
| **Round-robin** (nil key) | Maximum spread, ordering irrelevant |
| **Custom** (`kafka.Balancer`) | Tenant isolation, priority routing, cross-language hash parity |

**Idempotent producer** (dedups broker-side retries within a session): franz-go on by default, confluent `enable.idempotence=true`, JetStream `WithMsgID`. **segmentio does not have one.** For the cross-service **dual-write** problem (write DB *and* publish atomically), no producer flag helps; use the [outbox pattern](distributed-systems.md#outbox): write the event to an outbox table in the same transaction, relay it to the broker separately.

---

## Consumer patterns & rebalancing {#consumer-patterns}

**Consumer groups** distribute partitions across instances so each message goes to exactly one member; adding instances scales out (up to the partition count; surplus consumers idle).

| Broker | Group mechanism |
|---|---|
| Kafka | `GroupID` (segmentio) / `group.id` / `kgo.ConsumerGroup` |
| RabbitMQ | Multiple consumers on one queue (+ prefetch) |
| Redis Streams | `XReadGroup` with group + consumer id |
| NATS JetStream | Multiple instances of one durable consumer |

Rebalancing pitfalls (Kafka). When membership changes, partitions are reassigned:

- Eager (Range, RoundRobin) = *stop-the-world*: every consumer revokes all partitions, then reassigns. A rolling deploy triggers a pause on each restart. This is **all `segmentio/kafka-go` offers**: no cooperative protocol.
- Cooperative-sticky (franz-go `CooperativeStickyBalancer()`, confluent, sarama) = *incremental*: only the moving partitions are revoked; the rest keep flowing. Strongly preferred at scale.
- Commit before you lose a partition. On revocation, in-flight uncommitted offsets are reprocessed by the new owner: fine if idempotent, a duplicate storm if not.
- Long processing trips the poll timeout. Exceed `max.poll.interval.ms` (or JetStream `AckWait` without `InProgress()`) and the broker assumes you're dead and rebalances, splitting work. Offload slow jobs or extend the deadline explicitly.

Offset/ack management: default to **manual commit after processing** (at-least-once). Auto-commit is at-most-once. Bound consumer concurrency (see backpressure) so a burst doesn't OOM you.

---

## Backpressure & flow control {#backpressure}

Producers outrun consumers; the question is what absorbs the slack. With a durable broker the buffer is the log itself: **consumer lag** (unprocessed offset distance) is the health metric. Stable or shrinking = healthy; monotonically growing = under-provisioned, and the fix is *more/faster consumers*, never a bigger in-memory buffer (that moves the cliff and loses data on crash).

```go
// Bound consumer concurrency so a burst can't spawn unbounded goroutines (OOM).
sem := make(chan struct{}, 64)                       // max 64 in-flight
for {
    m, err := r.FetchMessage(ctx)
    if err != nil { return err }
    sem <- struct{}{}                                // blocks when full → natural backpressure
    go func(m kafka.Message) {
        defer func() { <-sem }()
        if err := process(ctx, m); err == nil { r.CommitMessages(ctx, m) }
    }(m)
}
```

**Trap:** concurrent processing **breaks per-partition ordering**: only safe when events are independent or you shard the semaphore by key. Broker-native limits: Kafka `max.poll.records`, RabbitMQ prefetch (`Qos`), JetStream `MaxAckPending`, Redis `XREADGROUP COUNT`. The unbounded-`go func()`-per-message loop is the classic OOM bug: always cap it. (Worker-pool and `errgroup` patterns: [concurrency.md](concurrency.md).)

---

## Dead letter queues {#dead-letter-queues}

> A DLQ quarantines messages that repeatedly fail so a poison message can't head-of-line-block the partition/queue. **Classify before routing:** *transient* (timeout, 5xx, lock contention) → retry with backoff; *permanent* (schema mismatch, validation, unknown type) → DLQ on the first failure: retrying a malformed message just burns cycles.

| Broker | DLQ mechanism |
|---|---|
| **RabbitMQ** | Native **DLX**: set `x-dead-letter-exchange` on the queue; auto-routes on `Nack(requeue=false)`, TTL expiry, or queue overflow |
| **Kafka** | Application-level: after max retries, produce to a `<topic>.dlq` with original-topic/partition/offset/error headers |
| **NATS JetStream** | `MaxDeliver` exhausted (or `Term()`) → publish to a DLQ stream yourself; subscribe `$JS.EVENT.ADVISORY.CONSUMER.MAX_DELIVERIES.>` to detect it |
| **Redis Streams** | `XPENDING`/`XAutoClaim` to find high-`delivery-count` entries → `XADD` to `stream:dlq` + `XAck` the original |

**Operate it like a queue, not a graveyard:** alert on **depth**, **inflow rate**, and **oldest-message age**; record enough headers (original location + error) to debug; write the **redrive** path up front (fix bug → republish DLQ → main topic). A DLQ nobody monitors is just silent data loss with extra steps.

---

## Library landscape & status {#libraries}

| Library | Status [2026] | Use when |
|---|---|---|
| `twmb/franz-go` | **Active, recommended** | Kafka in pure Go: txns, cooperative rebalance, perf |
| `segmentio/kafka-go` | Active, simpler | Straightforward Kafka; no txns/cooperative rebalance |
| `confluent-kafka-go/v2` | Active (CGo) | librdkafka parity, EOS-processing, accept the C toolchain |
| `IBM/sarama` | Active (was `Shopify/sarama`) | Legacy Kafka codebases; verbose API |
| `rabbitmq/amqp091-go` | **Active, official** | RabbitMQ (replaces archived `streadway/amqp`) |
| `redis/go-redis/v9` | Active | Redis Streams + general Redis |
| `nats-io/nats.go` (`/jetstream`) | **Active** | NATS/JetStream; use the `jetstream` subpkg, not legacy `nc.JetStream()` |
| `ThreeDotsLabs/watermill` | **Active** (1.5+) | Backend-agnostic eventing, router/middleware, outbox via SQL |
| `cloudevents/sdk-go/v2` | Active (CNCF) | Standard event envelope across brokers/languages |
| `streadway/amqp` | **Archived** | Never; migrate to `amqp091-go` |

(Resilience around consumers (retry, backoff, circuit breakers, `context` deadlines) lives in [errors-and-resilience.md](errors-and-resilience.md).)

---

## Anti-patterns / what models get wrong {#anti-patterns}

| Anti-pattern | Problem | Fix |
|---|---|---|
| **Chasing exactly-once delivery** | Impossible end-to-end across side effects | At-least-once + idempotent consumers ([distributed-systems.md](distributed-systems.md#idempotency)) |
| **Auto-commit / autoAck** | At-most-once in disguise; silent loss on crash | Manual commit/ack **after** the effect commits |
| **`segmentio` + "cooperative-sticky"** | That balancer doesn't exist there: stop-the-world only | `franz-go CooperativeStickyBalancer()`, or accept eager rebalance |
| **Global ordering via one partition** | Caps throughput at one consumer | Partition by entity key: order per entity, parallel across |
| **Changing partition count casually** | Rehashes keys, splits entity history | Size partitions for peak up front |
| **Unbounded `go func()` per message** | OOM under burst | Semaphore / `MaxAckPending` / prefetch / `COUNT` |
| **Concurrent consume on an ordered topic** | Reorders within a partition | Serialize per key, or only when events are independent |
| **In-memory channel as a "queue"** | No persistence/replay; lost on crash | Use a broker once you need durability |
| **`Nack(requeue=true)` on poison msgs** | Infinite redelivery loop | Classify; permanent → DLQ (`requeue=false`/`Term()`) |
| **DLQ with no alerting** | Silent data loss with extra steps | Alert depth/inflow/age; build the redrive path |
| **Long processing in the poll loop** | Trips `max.poll.interval`/`AckWait` → rebalance | Offload, or `InProgress()`/extend the deadline |
| **Unversioned event payloads** | One producer change breaks every consumer | Version the type, evolve additively, ignore unknown fields |
| **Dual-write: DB then publish** | Crash between them = inconsistency | [Outbox pattern](distributed-systems.md#outbox) |
| **Fire-and-forget producer** | Silent message loss | `RequireAll`/publisher confirms; check the result |

---

## See Also {#see-also}

- [distributed-systems.md](distributed-systems.md): outbox, idempotency keys, event sourcing, sagas, replay
- [concurrency.md](concurrency.md): channel mechanics, goroutine lifecycle, worker pools, `errgroup`
- [errors-and-resilience.md](errors-and-resilience.md): retry/backoff, circuit breakers, timeouts, panic recovery in consumers
- [observability.md](observability.md): consumer-lag metrics, distributed tracing across event hops
- [cloud-native.md](cloud-native.md): deploying consumers, health probes, graceful drain on rebalance

---

## Sources {#sources}

- pkg.go.dev: [twmb/franz-go](https://pkg.go.dev/github.com/twmb/franz-go) ([kgo](https://pkg.go.dev/github.com/twmb/franz-go/pkg/kgo)) | [segmentio/kafka-go](https://pkg.go.dev/github.com/segmentio/kafka-go) | [nats-io/nats.go/jetstream](https://pkg.go.dev/github.com/nats-io/nats.go/jetstream) | [rabbitmq/amqp091-go](https://pkg.go.dev/github.com/rabbitmq/amqp091-go) | [redis/go-redis/v9](https://pkg.go.dev/github.com/redis/go-redis/v9) | [ThreeDotsLabs/watermill](https://pkg.go.dev/github.com/ThreeDotsLabs/watermill) ([message](https://pkg.go.dev/github.com/ThreeDotsLabs/watermill/message)) | [cloudevents/sdk-go/v2](https://pkg.go.dev/github.com/cloudevents/sdk-go/v2)
- [Watermill 1.5 release](https://threedots.tech/post/watermill-1-5/); backends `watermill-kafka/v3`, `watermill-nats/v2`, `watermill-amqp/v3`, `watermill-sql/v4`
- [Kafka delivery semantics](https://docs.confluent.io/kafka/design/delivery-semantics.html); KIP-429 (incremental cooperative rebalancing) | [RabbitMQ DLX](https://www.rabbitmq.com/docs/dlx) | [NATS JetStream model](https://docs.nats.io/using-nats/developer/develop_jetstream/model_deep_dive)
- segmentio group balancers (Range/RoundRobin/RackAffinity, no cooperative): [groupbalancer.go](https://github.com/segmentio/kafka-go/blob/main/groupbalancer.go)
