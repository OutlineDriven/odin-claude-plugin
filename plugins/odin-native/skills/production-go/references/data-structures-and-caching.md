# Data Structures and Caching Patterns

The post-1.22 story for this topic is **not new containers**: it's GC-integrated primitives that change how you build caches and canonical maps: `unique` interning [1.23], `weak.Pointer` + `runtime.AddCleanup` + `maphash.Comparable` [1.24], and the `sync.Map` HashTrieMap rewrite [1.24]. `container/list`/`ring`/`heap` stayed non-generic; the center of gravity for new generic code is `slices`/`maps`/`iter`/`cmp` + plain `map`/`[]T`. Pick eviction by **admission policy**, not just recency.

> Source horizon: verified against Go **1.26.4** (stable) + **1.27 RC** notes, 2026-06; library versions as of 2026-06, before general availability. Go 1.27 has since gone GA (2026-08-19, current pin in SKILL.md) and the 1.27 row was checked against the final notes. Version tags `[1.N]` mark the release a claim applies to. Triangulated from two deep-research reports + primary `pkg.go.dev`/`go.dev` sources.

## TL;DR: the modern deltas (read first)

- `weak.Make[T any](*T) weak.Pointer[T]` / `(p) Value() *T` [1.24]: NOT the early-proposal `weak.New`/`.Get()` many models still emit. `weak.Pointer` is **comparable** with a **stable identity that survives reclamation**, which is exactly what makes `sync.Map.CompareAndDelete(key, wp)` safe in a cleanup callback.
- `runtime.AddCleanup[T,S any](ptr *T, cleanup func(S), arg S) Cleanup` [1.24] supersedes `SetFinalizer` (stdlib migrated off it in [1.25]; release notes: "New code should prefer AddCleanup"). Cleanups **run concurrently with each other**: the "single sequential goroutine" rule is `SetFinalizer`'s, not AddCleanup's. It **panics if `arg == ptr`**; if `ptr` is otherwise reachable from `arg`/`cleanup`, it silently never runs.
- `sync.Map` was rewritten on a HashTrieMap [1.24] (faster misses/deletes, prompter shrink; load-hit ~slightly slower). Still `any`-typed, still specialized for (1) grow-only caches or (2) disjoint key sets, *not* a default concurrent map.
- `container/heap`/`list`/`ring` are still non-generic through 1.26. Generic-heap proposals are open/on-hold/declined; do not represent any as accepted.
- `singleflight` is duplicate suppression, not a cache: it retains nothing after the call returns, and the shared return value must be treated **read-only**.
- Eviction moved past LRU: adaptive **W-TinyLFU** (otter v2) and TinyLFU-admission (ristretto v2) win hit ratio; **S3-FIFO** is lock-friendly and scan-resistant. otter **v1 was S3-FIFO; v2 is W-TinyLFU**. Claiming otter is S3-FIFO is stale.

## Table of Contents
1. [Quick Decision Table](#decision-table)
2. [map & slice internals: growth, preallocation, aliasing](#map-slice-internals)
3. [Generic data structures: slices/maps/cmp](#generic-structures)
4. [container/heap: Priority Queue](#container-heap)
5. [container/list: Doubly-Linked List](#container-list)
6. [container/ring: Circular Buffer](#container-ring)
7. [LRU Cache Implementation](#lru-cache)
8. [Cache Stampede Prevention: singleflight](#singleflight)
9. [Concurrent Map Patterns](#concurrent-maps)
10. [unique interning & weak-pointer caches](#weak-unique)
11. [Bloom Filters](#bloom-filters)
12. [Cache eviction libraries & algorithms](#eviction-libraries)
13. [Caching Strategy Patterns](#caching-strategies)
14. [Library landscape & status](#libraries)
15. [Version map 1.20→1.27](#versions)
16. [What models get wrong](#stale)

---

## Quick Decision Table {#decision-table}

| I need... | Use | Notes |
|---|---|---|
| Priority queue / scheduler | `container/heap` behind a typed wrapper | O(log n); call `heap.Push`/`heap.Pop`, never the receiver methods |
| Simple bounded LRU / 2Q / ARC | `hashicorp/golang-lru/v2` | thread-safe, generic; `expirable` subpkg for TTL |
| Highest hit ratio + throughput | `maypok86/otter` v2 (adaptive W-TinyLFU) | `Options` API, loaders/refresh, HashDoS protection |
| Cost/size-based eviction, freq-skewed | `dgraph-io/ristretto` v2 | may drop `Set`s under contention (eventual consistency) |
| Per-item TTL, loaders, event hooks | `jellydator/ttlcache/v3` | must run `go cache.Start()` for auto-eviction |
| Millions of entries, GC pause dominates | `allegro/bigcache`/`coocood/freecache` | off-GC byte arenas; you (de)serialize. Re-bench on 1.26 GC |
| High-contention concurrent map | `puzpuzpuz/xsync` v4 `MapOf`, or sharded map | measure RWMutex contention first |
| Grow-only cache / disjoint key sets | `sync.Map` | specialized; `any`-typed |
| Interning of comparable values | `unique` [1.23] | dedup + cheap pointer-compare; GC-reclaimed |
| Self-evicting cache (drop when unreferenced) | `weak.Pointer` + `runtime.AddCleanup` [1.24] | canonicalization maps not covered by `unique` |
| Cache stampede prevention | `golang.org/x/sync/singleflight` | + TTL jitter + probabilistic early refresh |
| Set membership (probabilistic) | `bits-and-blooms/bloom/v3` | false positives, never false negatives |
| Round-robin / sliding window | `container/ring` (or `[]T` with `i=(i+1)%n`) | `ring.Len()` is O(n) |
| FIFO queue (bounded) | `chan T` | idiomatic producer-consumer |

---

## map & slice internals: growth, preallocation, aliasing {#map-slice-internals}

**Maps [1.24] use Swiss Tables** internally (faster, lower overhead). Growth is still amortized; preallocate when size is predictable: `make(map[K]V, n)` sizes the table to hold `n` without rehash. Iteration order is **deliberately randomized** (don't depend on it; sort keys or use an ordered structure). `clear(m)` [1.21] empties without realloc.

**Slices grow by reallocation when `len == cap`.** The growth factor is an implementation detail (roughly 2× for small, ~1.25× past ~256 elems) and **changed in [1.18]**: never hard-code it. Preallocate with `make([]T, 0, n)` when you know the count; this is the single highest-leverage allocation win.

```go
ids := make([]int64, 0, len(rows)) // one alloc; append never reallocs
for _, r := range rows { ids = append(ids, r.ID) }
```

**The aliasing trap: `append` may or may not share backing storage.** A sub-slice shares the parent's array until a growth reallocates; an `append` that fits in spare capacity **mutates the parent**:

```go
// WRONG — full-slice of a larger array; append clobbers the next element in place.
buf := make([]int, 3, 10)
view := buf[:2]
view = append(view, 99) // writes buf[2], NOT a copy — surprises the owner of buf

// RIGHT — slices.Clip [1.21] forces the next append to allocate (returns s[:len(s):len(s)]).
view = slices.Clip(buf[:2])
view = append(view, 99) // now reallocs; buf untouched
```

`slices.Clip` is the canonical "hand this slice out safely / cap it before append" tool. Use a **3-index slice** `s[a:b:c]` to bound capacity explicitly when returning a window you don't want callers to grow into the parent. The mirror trap: returning `s[:0]` to "reuse" a buffer keeps the full backing array alive: fine for pooling, a **leak** if `s` was huge and you only needed a prefix (`slices.Clip` or copy to right-size).

Deletion that leaks pointers: `s = append(s[:i], s[i+1:]...)` leaves a stale copy of the last element in the freed tail; for pointer-element slices, nil it or use `slices.Delete` [1.21], which zeroes the vacated tail for you. Don't store huge structs by value in a slice you reslice often; store `*T` or indices.

---

## Generic data structures: slices/maps/cmp {#generic-structures}

For most "I need a data structure" needs, reach for `slices`/`maps` [1.21] + `cmp` [1.21] before `container/*` or a hand-rolled tree. A **sorted slice + `slices.BinarySearch`** beats a hand-built balanced tree for the common "ordered map / range queries" case (better locality, less GC scan).

```go
slices.SortFunc(items, func(a, b Item) int { return cmp.Compare(a.Score, b.Score) })
i, found := slices.BinarySearchFunc(items, target, func(a Item, t int) int { return cmp.Compare(a.Score, t) })
// cmp.Or [1.22] — first non-zero; perfect for multi-key/tie-broken comparators:
slices.SortFunc(rows, func(a, b Row) int { return cmp.Or(cmp.Compare(a.Last, b.Last), cmp.Compare(a.First, b.First)) })
```

`maps.Keys`/`maps.Values` return `iter.Seq` [1.23] (lazy), not slices; wrap in `slices.Sorted(maps.Keys(m))` for deterministic order; `maps.Collect`/`maps.All`/`maps.Insert` [1.23] complete the set. Idiomatic generic containers expose `All() iter.Seq2[K,V]` rather than a `Range(func(...)bool)` callback.

Generics-perf trap: Go does **not** monomorphize fully; it uses **GC-shape stenciling + dictionaries**, and **all pointer types share one shape**, so a generic function over `*T` dispatches its methods **indirectly through a runtime dictionary** (interface-call-like, no inlining/devirtualization). Generics win for **value-type** params and for de-duplicating `string`/`[]byte` code; converting a pure `func(SomeInterface)` to generics over a pointer constraint can be *slower*. Pointer-method-heavy hot paths may be faster as concrete types.

---

## container/heap: Priority Queue {#container-heap}

`heap.Interface` embeds `sort.Interface` (Len, Less, Swap) and adds `Push`/`Pop`: 5 methods. **Call `heap.Push(h, x)` / `heap.Pop(h)`, never the receiver methods** (`h.Push(x)` bypasses sift-up and corrupts the invariant). `Push`/`Pop` need **pointer receivers** (they change slice length). Still non-generic; hide the `any` behind a typed wrapper.

```go
type Item[T any] struct {
    Value    T
    Priority int
    index    int // maintained by heap; needed for Fix/Remove
}
type pq[T any] []*Item[T]

func (h pq[T]) Len() int           { return len(h) }
func (h pq[T]) Less(i, j int) bool { return h[i].Priority > h[j].Priority } // max-heap; invert for min
func (h pq[T]) Swap(i, j int)      { h[i], h[j] = h[j], h[i]; h[i].index, h[j].index = i, j }
func (h *pq[T]) Push(x any)        { it := x.(*Item[T]); it.index = len(*h); *h = append(*h, it) }
func (h *pq[T]) Pop() any {
    old := *h
    n := len(old)
    it := old[n-1]
    old[n-1] = nil // avoid leaking the pointer
    it.index = -1
    *h = old[:n-1]
    return it
}

// Typed facade so callers never touch the any-typed interface:
type PQ[T any] struct{ h pq[T] }
func (p *PQ[T]) Push(it *Item[T])     { heap.Push(&p.h, it) }
func (p *PQ[T]) Pop() (*Item[T], bool) {
    if len(p.h) == 0 { return nil, false }
    return heap.Pop(&p.h).(*Item[T]), true
}

// Update priority in place — O(log n), cheaper than Remove+Push:
it.Priority = 10
heap.Fix(&p.h, it.index)
```

| Op | `Init` | `Push` | `Pop` | `Fix` | `Remove` |
|---|---|---|---|---|---|
| Cost | O(n) | O(log n) | O(log n) | O(log n) | O(log n) |

Always `heap.Init` after bulk-loading a slice. The `index` field is essential for `Fix`/`Remove`; update it in `Swap`.

---

## container/list: Doubly-Linked List {#container-list}

Not generic: `Element.Value any`, type-assert on read. Zero value is a usable empty list. **Cache-hostile**: each node is a separate heap allocation, pointer-chasing kills locality, and it adds GC scan load. Reach for it **only** when you need O(1) splice/move of interior elements with stable element identity (the classic LRU recency list). For queues/stacks/general collections, use a `[]T` ring buffer or `append`/reslice, measurably faster and GC-friendlier.

The 5 methods that matter for LRU: `PushFront(v) *Element`, `PushBack(v) *Element`, `MoveToFront(e)`, `Remove(e) any` (O(1)), `Front()`/`Back() *Element`.

---

## container/ring: Circular Buffer {#container-ring}

Fixed-size cyclic iteration (round-robin, sliding windows). **Two easy-to-forget traps:** the **zero value is a one-element ring** (not empty), and **`Len()` is O(n)**. Each `*Ring` *is* the ring: no separate container type. `ring.New(n)`, traverse with `.Next()`/`.Prev()`, mutate with `.Do(func(any))`. For dynamic sizing, prefer a slice with modular indexing (`i = (i + 1) % len(s)`).

---

## LRU Cache Implementation {#lru-cache}

Canonical Go LRU = `map[K]*list.Element` (O(1) lookup) + `container/list` (O(1) recency reorder + eviction).

```go
type LRU[K comparable, V any] struct { // [1.18]
    cap   int
    items map[K]*list.Element
    order *list.List
}
type entry[K comparable, V any] struct{ key K; val V }

func NewLRU[K comparable, V any](capacity int) *LRU[K, V] {
    return &LRU[K, V]{cap: capacity, items: make(map[K]*list.Element, capacity), order: list.New()}
}
func (c *LRU[K, V]) Get(key K) (V, bool) {
    if e, ok := c.items[key]; ok {
        c.order.MoveToFront(e)
        return e.Value.(*entry[K, V]).val, true
    }
    var zero V
    return zero, false
}
func (c *LRU[K, V]) Put(key K, val V) {
    if e, ok := c.items[key]; ok {
        c.order.MoveToFront(e)
        e.Value.(*entry[K, V]).val = val
        return
    }
    if c.order.Len() >= c.cap {
        oldest := c.order.Back()
        c.order.Remove(oldest)
        delete(c.items, oldest.Value.(*entry[K, V]).key)
    }
    c.items[key] = c.order.PushFront(&entry[K, V]{key, val})
}
```

This is NOT thread-safe. For production use `hashicorp/golang-lru/v2` (thread-safe, generic; v1 is frozen):

```go
import lru "github.com/hashicorp/golang-lru/v2"
cache, _ := lru.New[string, User](1000)
cache.Add("user:123", u)
// TTL variant:
import "github.com/hashicorp/golang-lru/v2/expirable"
tc := expirable.NewLRU[string, User](1000, nil, 5*time.Minute)
```

Build your own only for a custom eviction policy or zero dependencies. **Plain LRU is scan-vulnerable** (a one-shot bulk scan evicts your hot set); that's the motivation for admission-policy caches ([§12](#eviction-libraries)).

---

## Cache Stampede Prevention: singleflight {#singleflight}

`singleflight.Group.Do` collapses concurrent calls for the same key: one goroutine computes, the rest block and **share the result**. It prevents the thundering herd on a cache miss. The zero `Group` is ready to use.

```go
import "golang.org/x/sync/singleflight"

func (s *Service) GetUser(ctx context.Context, id string) (*User, error) {
    if u, ok := s.cache.Get(id); ok { return u, nil }
    v, err, _ := s.sf.Do("user:"+id, func() (any, error) {
        u, err := s.db.FindUser(ctx, id)
        if err != nil { return nil, err }
        s.cache.Set(id, u, 5*time.Minute)
        return u, nil
    })
    if err != nil { return nil, err }
    u := v.(*User)
    return u, nil // see caveat: if callers MUTATE, return a copy
}
```

Key facts & traps:
- `Do` returns `(v any, err error, shared bool)`; `shared` reports the value went to >1 caller. **`Forget(key)`** forces the next call to re-execute (invalidation hook).
- **The shared value is read-only.** All duplicate callers receive the *same* `v`; returning a `*T`/slice/map they then mutate is a data race. Return a copy if mutation is possible.
- **It is not a cache**: it retains nothing after the call completes. Always pair with a real cache layer.
- **One slow origin call blocks every waiter.** For per-caller timeouts use **`DoChan`** with `select { case r := <-ch: case <-ctx.Done(): }`. **`DoChan`'s channel is never closed**; do **not** `range` over it.
- If `fn` panics, x/sync recovers and **re-panics in the waiters**; a `runtime.Goexit` is converted to an error. `ForgetUnshared` exists but has a documented key-reuse subtlety; prefer `Forget`.

---

## Concurrent Map Patterns {#concurrent-maps}

| Strategy | Best for | Trade-off |
|---|---|---|
| `map` + `sync.RWMutex` | **Default**; general read-write, need invariants/type-safety | single lock; contends at high core counts |
| `sync.Map` | grow-only caches, disjoint key sets | `any`-typed (boxing); specialized, not general |
| `puzpuzpuz/xsync` v4 `MapOf` | measured RWMutex contention across many cores | external dep; generic |
| Sharded map | hot keys, many goroutines | more memory + complexity |

Start with `map` + `RWMutex`. Move only when a mutex profile (`go tool pprof`) shows contention. `sync.Map`'s own docs are blunt: *"The Map type is specialized. Most code should use a plain Go map instead, with separate locking."*

`sync.Map` install protocol: use `LoadOrStore`, not Load-then-Store (the latter races and double-constructs):

```go
var m sync.Map // key -> *Client
// WRONG — Load, then create, then Store: two goroutines both miss and both construct.
// RIGHT — LoadOrStore picks one winner atomically; the loser's value is GC'd.
func clientFor(key string) *Client {
    if v, ok := m.Load(key); ok { return v.(*Client) } // fast path
    actual, _ := m.LoadOrStore(key, newClient(key))
    return actual.(*Client)
}
```

Modern `sync.Map` API (more than older tutorials remember): `Load`, `Store`, `Delete`, `LoadOrStore`, `LoadAndDelete` [1.15], `Swap`/`CompareAndSwap`/`CompareAndDelete` [1.20], `Clear` [1.23]. `CompareAndDelete` requires the old value be **comparable**, which is why `weak.Pointer` (comparable) plugs into it ([§10](#weak-unique)). The [1.24] HashTrieMap rewrite improved misses/deletes and shrinks promptly; pre-1.24 "sync.Map is always bloated" folklore is stale. Disable the new impl with `GOEXPERIMENT=nosynchashtriemap` if you must. There is **no generic stdlib `sync.Map`** (a `sync/v2` proposal exists); `sync/v2.Map[K,V]` in model output is fantasy.

### Sharded Map

Splits keys across N independently-locked maps, cutting contention ~N×. Hash with seeded `maphash` for DDoS resistance:

```go
const numShards = 64
type ShardedMap[K comparable, V any] struct { // [1.18]
    shards [numShards]shard[K, V]
    seed   maphash.Seed
}
type shard[K comparable, V any] struct {
    mu sync.RWMutex
    m  map[K]V
}
func NewShardedMap[K comparable, V any]() *ShardedMap[K, V] {
    sm := &ShardedMap[K, V]{seed: maphash.MakeSeed()}
    for i := range sm.shards { sm.shards[i].m = make(map[K]V) }
    return sm
}
func (sm *ShardedMap[K, V]) idx(key K) uint64 {
    return maphash.Comparable(sm.seed, key) % numShards // [1.24] — no fmt.Sprint, no reflection
}
func (sm *ShardedMap[K, V]) Get(key K) (V, bool) {
    s := &sm.shards[sm.idx(key)]
    s.mu.RLock(); defer s.mu.RUnlock()
    v, ok := s.m[key]
    return v, ok
}
```

`maphash.Comparable[T comparable](seed, v) uint64` [1.24] (with `WriteComparable`) finally hashes arbitrary comparable keys without unsafe tricks or `fmt.Sprint(key)` (which the old version of this pattern used, slow and lossy). For a turnkey generic concurrent map, `xsync` v4 `MapOf` (SwissTable meta-bytes + obstruction-free reads, per-instance `maphash` seed) generally outscales `sync.Map`; `orcaman/concurrent-map/v2` is the older sharded pattern.

---

## unique interning & weak-pointer caches {#weak-unique}

The highest-value delta. Three GC-integrated primitives replace `SetFinalizer` and `unsafe`/`go4.org/intern` hacks.

`unique` [1.23]: canonicalize ("intern") comparable values. `unique.Make[T comparable](v T) Handle[T]`; `(Handle[T]) Value() T` returns a shallow copy. Handles compare equal iff the source values did, and the comparison is a cheap pointer-compare. Entries are GC-reclaimed (via weak pointers) once no `Handle` references them. Use for deduping immutable comparable values: interned strings/labels, parsed schemas, IP addresses (`net/netip` uses it internally).

```go
type Label struct{ Key, Value string }
h1 := unique.Make(Label{"env", "prod"})
h2 := unique.Make(Label{"env", "prod"})
_ = h1 == h2 // true — and the comparison is O(1) pointer-equal, not field-by-field
```

Defensive `strings.Clone` before interning substrings: `unique.Make` of a substring can retain the (possibly huge) parent backing string until reclamation; clone first to break the share. `[verify]`: a specific 1.24.0/1.24.1 substring-retention *bug* was reported in one source but I could not corroborate the exact version/fix against primary docs; the `strings.Clone` defensive pattern is sound regardless.

`weak.Pointer` + `runtime.AddCleanup` [1.24]: self-evicting caches & canonical maps not covered by `unique` (non-comparable or large objects). `weak.Make[T any](*T) weak.Pointer[T]`; `(p) Value() *T` returns the strong pointer or `nil` after reclamation. The weak pointer is **comparable** and keeps a **stable identity even after the pointee is gone**: the property that makes the cleanup-CAS pattern correct.

```go
// Canonicalization cache — the Go-team pattern (sync.Map + weak value + AddCleanup CAS):
type Cache[K comparable, V any] struct {
    create func(K) (*V, error)
    m      sync.Map // K -> weak.Pointer[V]
}
func (c *Cache[K, V]) Get(key K) (*V, error) {
    var fresh *V
    for {
        if v, ok := c.m.Load(key); ok {
            if p := v.(weak.Pointer[V]).Value(); p != nil { return p, nil }
            c.m.CompareAndDelete(key, v) // dead entry — drop the exact weak ptr we saw
            continue
        }
        if fresh == nil {
            var err error
            if fresh, err = c.create(key); err != nil { return nil, err }
        }
        wp := weak.Make(fresh)
        actual, loaded := c.m.LoadOrStore(key, wp)
        if !loaded {
            runtime.AddCleanup(fresh, func(k K) { c.m.CompareAndDelete(k, wp) }, key) // arg=key, NOT fresh
            return fresh, nil
        }
        if p := actual.(weak.Pointer[V]).Value(); p != nil { return p, nil }
        c.m.CompareAndDelete(key, actual)
    }
}
```

Correctness rules (primary-source verified):
- `AddCleanup` cleanups run concurrently with each other and with user goroutines; synchronize shared state in the cleanup. (This corrects the "single sequential goroutine" claim in both source reports, which describes `SetFinalizer`.)
- `AddCleanup` panics if `arg == ptr`. More generally, if `ptr` is reachable from `cleanup` or `arg`, **`ptr` is never collected and the cleanup never runs**, so pass the *key* as `arg`, never the object being cleaned. (`GODEBUG=checkfinalizers=1` [1.26] flags such paths.)
- Reclamation timing is non-deterministic: `Value()` may return `nil` "as soon as" the object is unreachable, and is *not* guaranteed to ever return `nil` (a tiny/pointer-free object batched with a live one may stay pinned). Never rely on prompt cleanup for *correctness*, only for memory hygiene. Use `runtime.KeepAlive` to extend reachability across a critical section.
- Don't store `*V` directly in such a map: the map becomes the strong owner and nothing is ever reclaimed.

Common WRONG versions: `weak.New(v)`/`.Get()` (names don't exist); forgetting the `nil` check on `Value()`; `runtime.AddCleanup(p, fn, p)` (panics/leaks); reaching for `SetFinalizer` (one finalizer/object, resurrects the object, 2 GC cycles, leaks on cycles).

---

## Bloom Filters {#bloom-filters}

Probabilistic set membership: false positives possible, false negatives never. Use for dedup, cache-prefetch filtering, "definitely-not-present" fast paths.

```go
import "github.com/bits-and-blooms/bloom/v3"
f := bloom.NewWithEstimates(1_000_000, 0.01) // 1M items, 1% FP rate
f.AddString("apple")
f.TestString("apple")  // true
f.TestString("cherry") // false (probably)
```

`NewWithEstimates(n, fp)` computes optimal bit-array size and hash count. Sizing is fixed at construction; over-fill and the FP rate degrades sharply. For deletions or counting, use a counting/cuckoo variant (separate libs); a standard Bloom filter cannot remove elements.

---

## Cache eviction libraries & algorithms {#eviction-libraries}

The algorithm story moved past "LRU or Ristretto." Three policies matter:

- LRU / 2Q / ARC: predictable, small surface, no probabilistic admission. Scan-vulnerable (LRU); 2Q/ARC mitigate. `hashicorp/golang-lru/v2`.
- Adaptive W-TinyLFU (Caffeine-derived): window-LRU + main SLRU gated by a TinyLFU admission filter (Count-Min Sketch + doorkeeper), window size adapted at runtime. **Best general-purpose hit ratios.** `maypok86/otter` v2 ("a Go adaptation of Caffeine"), `Yiling-J/theine-go`.
- S3-FIFO (SOSP'23): three FIFO queues: small `S` (~10%, filters one-hit-wonders), main `M` (~90%, lazy promotion via reinsertion), ghost `G` (metadata-only, readmits recently-evicted). 1-2 bits/object, **lock-friendly** (no per-hit global update) and **scan-resistant**; ~6× LRU throughput at 16 threads in the paper. `scalalang2/golang-fifo/v2`. (otter **v1** used S3-FIFO; **v2 switched to W-TinyLFU**.)

```go
// otter v2 — Options API, MaximumSize/MaximumWeight, GetIfPresent is the present-only lookup:
cache := otter.Must(&otter.Options[string, []byte]{MaximumSize: 10_000})
cache.Set("k", v)
if got, ok := cache.GetIfPresent("k"); ok { _ = got }

// ristretto v2 — generic; Set is ADVISORY (admission policy may reject even on Set==true):
c, err := ristretto.NewCache(&ristretto.Config[string, []byte]{
    NumCounters: 1e6, MaxCost: 1 << 28, BufferItems: 64,
})
if err != nil { panic(err) }
defer c.Close()
c.Set("k", v, 1)        // may be dropped under contention — not a write-through guarantee
got, ok := c.Get("k")
_ = got; _ = ok
```

Picks (see [decision table](#decision-table) for the full grid): hit ratio + throughput → **otter v2**; cost/size-based, freq-skewed → **ristretto v2**; simple bounded LRU/ARC/2Q → **golang-lru v2**; per-item TTL + loaders → **ttlcache v3**; GBs where GC pause dominates → **bigcache**/**freecache** (off-GC byte arenas; re-benchmark on the [1.26] Green Tea GC, which weakened "byte arenas always win"). **Avoid `patrickmn/go-cache`** (no release since 2017).

---

## Caching Strategy Patterns {#caching-strategies}

For library picks and Redis examples see [performance.md#caching](performance.md#caching). Architectural patterns:

| Pattern | Consistency | Write | Read | Best for |
|---|---|---|---|---|
| **Cache-aside** (lazy) | Eventual | normal | fast on hit | general, read-heavy (most common in Go) |
| **Read-through** | Eventual | normal | fast on hit | cache library loads on miss (otter/ttlcache loaders, groupcache) |
| **Write-through** | Strong | slower (both) | fast on hit | must read fresh immediately after write |
| **Write-behind** | Eventual | fast (async) | fast on hit | write-heavy, tolerates loss/staleness |

```go
// Cache-aside + singleflight (the default):
func (s *Service) GetProduct(ctx context.Context, id string) (*Product, error) {
    if p, ok := s.cache.Get(id); ok { return p, nil }
    v, err, _ := s.sf.Do("product:"+id, func() (any, error) {
        p, err := s.db.GetProduct(ctx, id)
        if err != nil { return nil, err }
        s.cache.Set(id, p, jitter(5*time.Minute)) // jitter TTL — see below
        return p, nil
    })
    if err != nil { return nil, err }
    return v.(*Product), nil
}
```

Stampede defense is three layers, not one: (1) **`singleflight`** collapses concurrent loads of the *same* key; (2) **TTL jitter** (randomize expiry ±X%) so many keys don't expire at the same instant; `singleflight` alone does not solve correlated expiry across *different* keys; (3) **probabilistic early recomputation / XFetch** (recompute before expiry with rising probability scaled by the recompute cost, Vattani et al.) for hot keys. **Negative caching:** cache "not found" with a short TTL to stop repeated origin hits for missing keys.

**`weak`/`unique` change the calculus** for *canonicalization* caches: the GC reclaims entries when the last strong reference drops, making "unbounded but self-trimming" safe without `SetFinalizer` hacks ([§10](#weak-unique)). **Write-behind** risks loss on crash before flush; use only for losable data (counters, sessions). **Invalidation:** TTL is a *safety net*, not a strategy; anything with a write path must delete/update the key in that path (or fan out via pub/sub for distributed L1/L2; watch TTL skew).

---

## Library landscape & status {#libraries}

| Library | Status [2026] | Use when |
|---|---|---|
| stdlib `slices`/`maps`/`cmp`/`unique`/`weak`/`container/*` | **Default** | Almost always; `unique`/`weak` for interning & self-evicting caches |
| `hashicorp/golang-lru/v2` (`v2.0.7`) | Active; v1 frozen | Simple bounded LRU / 2Q / ARC; `expirable` for TTL |
| `maypok86/otter` v2 | Active, best-in-class | High hit ratio + throughput (adaptive W-TinyLFU), loaders/refresh |
| `dgraph-io/ristretto` v2 (`v2.x`) | Active | Cost/size-based eviction, freq-skewed; tolerate dropped Sets |
| `jellydator/ttlcache/v3` | Active | Per-item TTL, loaders, event hooks (run `go Start()`) |
| `allegro/bigcache/v3`, `coocood/freecache` | Active | Off-GC byte arenas; millions of entries, GC pause dominates |
| `puzpuzpuz/xsync` v4 | Active | Generic high-contention concurrent map (`MapOf`); requires [1.24] |
| `orcaman/concurrent-map/v2` | Active | Older sharded-map pattern; generic |
| `groupcache/groupcache-go/v3` | Active fork | Peer-aware read-through cache filling (prefer over the pseudo-versioned original) |
| `eko/gocache` `lib/v4` | Active | Meta-layer over ristretto/bigcache/redis + tag invalidation (not a cache itself) |
| `bits-and-blooms/bloom/v3` | Active | Probabilistic set membership |
| `patrickmn/go-cache` | **Unmaintained** (no release since 2017) | Avoid for new code: use `ttlcache` v3 / `otter` v2 |

> Migrate stale imports to generic majors: `dgraph-io/ristretto/v2`, `hashicorp/golang-lru/v2`, `puzpuzpuz/xsync` v4, `maypok86/otter/v2`. Bare v1 paths are stale. `[verify]` exact latest tags on `?tab=versions` before pinning: several were not directly confirmable from primary pages (otter v2.x, bigcache v3.x, x/sync, freecache/eko date stamps).

---

## Version map 1.20→1.27 {#versions}

| Ver | Data-structures / caching-relevant |
|---|---|
| **1.20** | `sync.Map` gains `Swap`/`CompareAndSwap`/`CompareAndDelete` |
| **1.21** | `slices`, `maps`, `cmp` (`Ordered`/`Compare`); `clear`/`min`/`max` builtins; `slices.Clip`/`Delete`/`BinarySearch`; `sync.OnceFunc`/`OnceValue` |
| **1.22** | `cmp.Or`; range-over-int; `math/rand/v2` |
| **1.23** | **`unique`** (interning); `iter` + range-over-func; `maps.Keys`/`Values`/`All`/`Collect`, `slices.Sorted`/`Collect`; `sync.Map.Clear` |
| **1.24** | **`weak.Pointer`**; **`runtime.AddCleanup`**; **`maphash.Comparable`/`WriteComparable`**; `sync.Map` HashTrieMap rewrite; maps use Swiss Tables; `GOEXPERIMENT=nosynchashtriemap` |
| **1.25** | `sync.WaitGroup.Go` (f must not panic); stdlib migrated `SetFinalizer`→`AddCleanup`; `maphash.Hash.Clone` |
| **1.26** | Green Tea GC default (re-benchmark byte-arena vs pointer caches); `GODEBUG=checkfinalizers=1` diagnoses cleanup/finalizer reachability bugs; enhanced `new(expr)` |
| **1.27** | Generic methods (enables generic container methods); `hash/maphash` gained `Hasher`/`ComparableHasher` (contracts for future hash-based structures, no shipped container); no other new container/cache stdlib APIs. GA 2026-08-19; maphash additions read from the final release notes. |

Generic stdlib containers: **none shipped through 1.27.** Heap/list/ring generic proposals are open / on-hold / declined (Go team is waiting on an iterator design for generic containers); `container/heap/v2` is **not** accepted; do not represent it as scheduled. `[verify]`.

---

## What models get wrong {#stale}

1. **`weak.New`/`.Get()`**: wrong names; the API is `weak.Make(*T)` / `(p) Value() *T` [1.24].
2. **Recommending `runtime.SetFinalizer`** for cleanup: superseded by `runtime.AddCleanup` [1.24]; stdlib migrated off it [1.25].
3. **"AddCleanup runs in one sequential goroutine"**: wrong (that's SetFinalizer); AddCleanup cleanups **run concurrently**. And it **panics if `arg == ptr`**.
4. **`sync.Map` is fast/generic/default**: it's `any`-typed, specialized (grow-only / disjoint keys), and was rewritten on a HashTrieMap [1.24]; default is `map`+`RWMutex`. No generic stdlib `sync.Map`.
5. **Load-then-Store install on `sync.Map`**: races; use `LoadOrStore`.
6. **`container/list` for queues/stacks**: cache-hostile; use a slice ring buffer. All `container/*` are still non-generic.
7. **Assuming `container/heap/v2` / generic list/ring exist or are accepted**: they don't / aren't.
8. **Calling the heap receiver `Push`/`Pop` directly** or with value receivers: corrupts the invariant; call `heap.Push`/`heap.Pop`, use pointer receivers, `heap.Fix` after mutating priority.
9. **`singleflight` as a cache**: retains nothing post-call. **Mutating the shared result**: data race. **`range` over `DoChan`**: its channel is never closed.
10. **"Generics are always faster than interfaces"**: GC-shape stenciling + dictionary indirection means pointer-type generics don't devirtualize/inline and can be slower.
11. **`append` aliasing**: a sub-slice append can clobber the parent; `slices.Clip` / 3-index slices before handing out a window.
12. **Hard-coding slice growth factor** or the map load factor: implementation details that changed.
13. **`fmt.Sprint(key)` to hash a map key**: use `maphash.Comparable(seed, key)` [1.24] (no reflection, DDoS-seeded).
14. **otter is "S3-FIFO"**: that was v1; v2 is adaptive W-TinyLFU.
15. **`ristretto.Set==true` means installed/visible**: Set is advisory; admission policy may reject; may drop under contention.
16. **Recommending `patrickmn/go-cache`** (unmaintained) or bare `ristretto`/`golang-lru` v1 import paths (stale, use `/v2`).
17. **Interning substrings without `strings.Clone`**: can retain the parent backing string.
18. **Relying on TTL as the invalidation strategy**: it's a safety net; delete/update on the write path.

---

## See Also {#see-also}

- [performance.md#caching](performance.md#caching): cache library picks, invalidation, Redis cache-aside
- [performance.md#sync-pool](performance.md#sync-pool): `sync.Pool` object reuse
- [concurrency.md#sync-primitives](concurrency.md#sync-primitives): `sync.Map`, `RWMutex`, `WaitGroup.Go`
- [errors-and-resilience.md#graceful-degradation](errors-and-resilience.md#graceful-degradation): serving stale cache on transient failure
- [modern-go.md](modern-go.md): `unique`/`weak` overview, generics in the version matrix
- [advanced-patterns.md#generics](advanced-patterns.md#generics): generic constraints, `iter.Seq` containers

## Sources {#sources}

- pkg.go.dev: `weak`, `unique`, `hash/maphash`, `sync` (Map/WaitGroup), `runtime` (AddCleanup/SetFinalizer), `slices` (Clip), `container/{heap,list,ring}` @ go1.26.4
- go.dev/doc/go1.20-go1.27 release notes; go.dev blog "weak pointers" + canonicalization-cache example; go.dev/doc/gc-guide#Finalizers_cleanups_and_weak_pointers
- Yang et al., "FIFO queues are all you need for cache eviction" (SOSP'23, S3-FIFO); Caffeine/W-TinyLFU; Vattani et al. (XFetch); PlanetScale "Generics can make your Go code slower"
- Library repos: hashicorp/golang-lru, dgraph-io/ristretto, maypok86/otter, jellydator/ttlcache, allegro/bigcache, coocood/freecache, puzpuzpuz/xsync, bits-and-blooms/bloom, groupcache/groupcache-go, eko/gocache; golang.org/x/sync/singleflight
