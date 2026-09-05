# C++ memory ordering reference

## Happens-before

A happens-before edge between operations A and B means the effects of A are visible when B runs. Three rules build edges:

1. Sequenced-before: program order within one thread.
2. Synchronizes-with: a release store that an acquire load reads.
3. Transitivity: A before B and B before C gives A before C.

```text
Thread 1                 Thread 2
x = 42;
flag.store(true, release)  ──sync──▶  flag.load(acquire)
                                      assert(x == 42);   // holds
```

## Legal orderings per operation

| Operation | Valid orderings |
|-----------|-----------------|
| Load | Relaxed, Acquire, SeqCst |
| Store | Relaxed, Release, SeqCst |
| RMW (`fetch_add`, CAS) | All |
| Fence | Relaxed, Acquire, Release, AcqRel, SeqCst |

`memory_order_consume` exists but compilers promote it to Acquire; write Acquire.

## SeqCst total order

All SeqCst operations across all threads observe one total order. The store-buffering case is where weaker orderings fail:

```cpp
std::atomic<bool> x{false}, y{false};
std::atomic<int> z{0};

void write_x() { x.store(true, std::memory_order_seq_cst); }
void write_y() { y.store(true, std::memory_order_seq_cst); }

void read_x_then_y() {
    while (!x.load(std::memory_order_seq_cst)) {}
    if (y.load(std::memory_order_seq_cst)) ++z;
}
void read_y_then_x() {
    while (!y.load(std::memory_order_seq_cst)) {}
    if (x.load(std::memory_order_seq_cst)) ++z;
}
// with SeqCst on all four, z is at least 1 after both readers run;
// with Acquire and Release pairs, z can be 0
```

## CAS variants

```cpp
// strong: no spurious failure
int expected = 0;
bool ok = val.compare_exchange_strong(expected, 42,
          std::memory_order_acq_rel,   // success ordering
          std::memory_order_acquire);  // failure ordering, a load

// weak: may fail spuriously, intended for retry loops
while (!val.compare_exchange_weak(expected, 42,
                                  std::memory_order_acq_rel,
                                  std::memory_order_acquire)) {
    expected = 0;
}
```

The failure ordering is a load, so it cannot be Release or AcqRel and cannot be stronger than the success ordering.

## Lock-free stack, with the caveat

```cpp
template <typename T>
class LockFreeStack {
    struct Node { T data; Node* next; };
    std::atomic<Node*> head{nullptr};

public:
    void push(T v) {
        Node* node = new Node{std::move(v), nullptr};
        node->next = head.load(std::memory_order_relaxed);
        while (!head.compare_exchange_weak(node->next, node,
                                           std::memory_order_release,
                                           std::memory_order_relaxed)) {}
    }

    std::optional<T> pop() {
        Node* node = head.load(std::memory_order_acquire);
        while (node && !head.compare_exchange_weak(node, node->next,
                                                   std::memory_order_acquire,
                                                   std::memory_order_acquire)) {}
        if (!node) return std::nullopt;
        T v = std::move(node->data);
        delete node;          // unsafe under concurrency: readers may still hold node
        return v;
    }
};
```

The `delete` marks the real problem: safe memory reclamation, for example hazard pointers or epochs, is a separate mechanism. The ABA problem lives in the same place.

## Platform defaults

| Architecture | Model | Practical reading |
|--------------|-------|-------------------|
| x86, x86-64 | TSO | Loads do not pass loads, stores do not pass stores. Acquire and Release compile to plain moves. SeqCst needs a fence or locked op. |
| ARMv8 | Weak | Acquire and Release map to load-acquire and store-release instructions. Full fences use `dmb`. |
| POWER | Weak | Relaxed pairing rules; compilers insert the needed sync. |
| RISC-V | RVWMO | Ordering is per instruction and per fence. |

## atomic_flag

```cpp
std::atomic_flag flag;             // starts clear since C++20
bool was = flag.test_and_set(std::memory_order_acquire);
flag.clear(std::memory_order_release);
bool now = flag.test(std::memory_order_acquire);   // C++20
```

It is the only atomic type guaranteed lock-free. Before C++20, initialize with `ATOMIC_FLAG_INIT`.

## Rust equivalents

| C++ | Rust |
|-----|------|
| `memory_order_relaxed` | `Ordering::Relaxed` |
| `memory_order_acquire` | `Ordering::Acquire` |
| `memory_order_release` | `Ordering::Release` |
| `memory_order_acq_rel` | `Ordering::AcqRel` |
| `memory_order_seq_cst` | `Ordering::SeqCst` |
| `atomic_thread_fence(o)` | `fence(o)` |

## Selection guide

```text
Counter, statistics only            -> Relaxed both sides
Reference count                     -> Relaxed increment, AcqRel decrement
One writer, one reader flag         -> Release store, Acquire load
Several writes, one publish flag    -> Release fence then Relaxed flag store
Need one order across many atomics  -> SeqCst, then weaken with proof
```
