---
name: memory-model
description: 'Use when choosing memory orderings for C++ or Rust atomics, reasoning about happens-before, writing lock-free patterns, or diagnosing data races. Not for lock-based design: use kernel-concurrency.'
---

# Memory model

Atomics without a memory ordering argument are guesses. The C++ and Rust models are the same model: pick the weakest ordering that proves the happens-before edge the algorithm needs, and justify it in a comment.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task selects `memory_order` values or Rust `Ordering`s, explains a synchronization edge, writes lock-free code, or reads TSan output on a race. |
| Authority | Read-only. The skill explains and drafts; edits land through the normal coding path. No remote mutation. |
| Side effect | None. |
| Done | Every atomic operation in the reviewed code carries an ordering justified by the synchronization edge it creates, or a race is named with the edge that is missing. |

## Inputs

- The concurrent code or design: required.
- The language: required. The orderings map one to one between C++ and Rust.
- The target architectures: optional, needed only when barrier cost matters.

## Procedure

1. Rank the orderings by strength and pick the weakest one that proves the edge. Weaker ordering costs less on weakly ordered CPUs, and costs nothing on x86 for load and store shapes. Done when: each atomic operation states the edge it creates.

| Ordering | C++ | Rust | Guarantee |
|----------|-----|------|-----------|
| Relaxed | `memory_order_relaxed` | `Ordering::Relaxed` | Atomicity only, no ordering |
| Acquire | `memory_order_acquire` | `Ordering::Acquire` | No later read or write moves before this load |
| Release | `memory_order_release` | `Ordering::Release` | No earlier read or write moves after this store |
| AcqRel | `memory_order_acq_rel` | `Ordering::AcqRel` | Both, RMW operations only |
| SeqCst | `memory_order_seq_cst` | `Ordering::SeqCst` | One total order every thread agrees on |

2. Establish happens-before before trusting any read. A release store that an acquire load reads creates the edge: every write before the store is visible after the load, and edges compose transitively. Done when: the code's correctness argument names its edge, not intuition.

```cpp
std::atomic<int> data_ready{0};
int data = 0;                      // plain, guarded by the edge

void producer() {
    data = 42;                                      // 1) plain write
    data_ready.store(1, std::memory_order_release); // 2) release
}
void consumer() {
    while (!data_ready.load(std::memory_order_acquire)) {}  // 3) acquire
    assert(data == 42);                             // 4) guaranteed by the edge
}
```

3. Match the ordering to the pattern. Done when: each site in the code maps to a row.

| Pattern | Ordering |
|---------|----------|
| Statistics counter | Relaxed everywhere |
| Reference count | Relaxed on increment, AcqRel on the decrement that may free |
| Publish flag and data | Release on the store, Acquire on the load |
| Lock-free queue first cut | SeqCst, then weaken one edge at a time with a re-run of the tests |
| Sequence-number check | Release plus Acquire |
| Mutex internals | AcqRel on the RMW that takes and gives the lock |

4. Use fences only where an atomic operation cannot carry the ordering. A fence orders without touching one variable, typical when several writes must land before one flag flips. Done when: the fence replaces a real edge and the flag still carries its own ordering.

```cpp
// publish several writes, then flip the flag
data1 = 1;
data2 = 2;
std::atomic_thread_fence(std::memory_order_release);
flag.store(true, std::memory_order_relaxed);
// consumer pairs with an acquire fence after reading the flag
```

5. Keep SeqCst for the cases that need a single global order. Two flags each read after waiting on the other is the store-buffering case where weaker orderings allow both readers to miss both writes. Done when: the code either uses SeqCst on the participating operations or carries a written proof that weaker orderings suffice.

6. Map C++ orderings to Rust directly. The names change, the model does not. Done when: the review uses one vocabulary across both.

| C++ | Rust |
|-----|------|
| `memory_order_relaxed` | `Ordering::Relaxed` |
| `memory_order_acquire` | `Ordering::Acquire` |
| `memory_order_release` | `Ordering::Release` |
| `memory_order_acq_rel` | `Ordering::AcqRel`, RMW only |
| `memory_order_seq_cst` | `Ordering::SeqCst` |
| `atomic_thread_fence(order)` | `std::sync::atomic::fence(order)` |

Rust signs the intent in the type: `AtomicBool`, `AtomicUsize`, and friends, with `compare_exchange` returning the previous value and the failure ordering taken explicitly.

7. Respect the CAS rules. The failure ordering of a compare-exchange is a load, so it may not be Release or AcqRel, and it may not be stronger than the success ordering. Use `compare_exchange_weak` in retry loops, where spurious failure costs one iteration. Done when: every CAS call carries a legal ordering pair.

```cpp
int expected = 0;
while (!val.compare_exchange_weak(expected, 42,
                                  std::memory_order_acq_rel,   // success
                                  std::memory_order_acquire)) {
    expected = 0;   // reset when the caller reuses the variable
}
```

8. Fold in the platform facts. x86 is TSO: stores drain in order, so plain Acquire and Release compile to plain loads and stores, and SeqCst needs a full fence or a locked operation. ARMv8 and RISC-V are weakly ordered: acquire and release map to load-acquire and store-release instructions, and a full fence needs an explicit barrier instruction. Done when: performance claims about ordering name the architecture.

9. Audit the classic mistakes. Done when: each row is checked against the code.

| Mistake | Fix |
|---------|-----|
| Relaxed used to publish data | Release on the store, Acquire on the load |
| SeqCst everywhere by fear | Keep SeqCst only where a total order is the argument; justify the rest |
| Plain reads of shared data beside atomics | The edge from the atomic pair must cover them, or the data must be atomic too |
| `volatile` used for threads | `volatile` orders nothing across threads; use atomics |
| Two values assumed consistent with no edge between them | Add one atomic carrying the edge, or SeqCst on both |
| Lock-free pop frees nodes the readers still hold | Add a reclamation scheme; the ABA and reclamation problem is separate from ordering |

## Failure and recovery

| Failure class | Behavior |
|---|---|
| TSan reports a race | One side of the pair is not atomic or the edge is missing. Name the two accesses, then supply the release and acquire pair that orders them. |
| Test passes but the reasoning is unclear | The ordering may be right by luck of the architecture. Write the edge as a comment and re-derive it, or weaken nothing. |
| Weakening SeqCst broke a stress test | Restore SeqCst for the participating operations; the code needed the total order. |
| CAS compile error on the failure ordering | The failure ordering was Release or AcqRel. Use Acquire or Relaxed. |
| Live lock in a CAS loop | The loop loses every race under contention. Add backoff or restructure to fewer writers. |

## Output

A per-site ordering review: each atomic operation, the edge it creates or needs, the chosen ordering, and the platform cost note where relevant. The happens-before diagram, the CAS variants, and the lock-free stack sketch are in `references/cpp-memory-ordering.md`.
