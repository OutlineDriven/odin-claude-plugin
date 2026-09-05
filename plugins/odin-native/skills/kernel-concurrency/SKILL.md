---
name: kernel-concurrency
description: 'Use when choosing kernel spinlocks versus mutexes, using RCU, seqlocks, completions, or memory barriers, or debugging scheduling-while-atomic. Not for userspace atomics: use concurrency-debugging.'
---

# Kernel concurrency

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Synchronizing Linux kernel code: lock selection between IRQ and process context, spinlock and mutex usage, RCU read sides, seqlocks, completions, memory barriers, or a `scheduling while atomic` splat. |
| Authority | Read-only. Writes nothing. Chat output only. No remote mutation. |
| Side effect | Returns locking designs and code patterns. No source files are modified. |
| Done | The lock choice with its context rule, the code pattern, and a fix for any reported splat are delivered. |

## Inputs

1. Shared data (required): what is protected, and which contexts touch it (IRQ, softirq, process).
2. Access pattern (optional): read-mostly versus write-heavy, hold length, and nesting.
3. Failure report (optional): the splat, hang, or corrupted counter.

## Procedure

1. Pick the primitive from the sleep rule of the innermost context. The rule: code that cannot sleep uses primitives that never sleep.

   ```
   Can the innermost context sleep?
   ├── No (IRQ, softirq, spinlock held, preempt disabled)
   │   └── spin_lock_irqsave() / spin_lock_bh() / atomic_t
   └── Yes (process context)
       ├── Exclusive, held across sleeps: mutex
       ├── Reader/writer, read-mostly: rw_semaphore or RCU
       └── One-shot event signaling: completion
   ```

   Sleeping while holding a spinlock is a bug: no `kmalloc(GFP_KERNEL)`, no `mutex_lock` inside the critical section. Done when: every context that touches the data is listed and the primitive matches the innermost one.
2. Protect data shared with an IRQ handler using the irqsave variant; it covers the case where the interrupt arrives on the same CPU while the lock is held.

   ```c
   spinlock_t lock;
   unsigned long flags;

   spin_lock_irqsave(&lock, flags);
   /* critical section: no blocking calls */
   spin_unlock_irqrestore(&lock, flags);
   ```

   When the only other accessor is a softirq or tasklet, `spin_lock_bh` is the lighter choice. Done when: every acquisition site uses the variant matching its interrupt context.
3. Use a mutex only in process context and only when the lock can be held across a sleep.

   ```c
   struct mutex m;
   mutex_lock(&m);
   /* may allocate, may sleep */
   mutex_unlock(&m);
   ```

   Done when: no mutex acquisition site is atomic.
4. Use RCU for read-mostly structures where readers cannot afford a lock. Readers run lockless inside an RCU read-side section; writers publish and reclaim after a grace period.

   ```c
   /* reader, no lock, must not block */
   p = rcu_dereference(ptr);
   use(p);
   rcu_read_unlock();

   /* writer */
   new = kmalloc(..., GFP_KERNEL);
   rcu_assign_pointer(ptr, new);
   synchronize_rcu();   /* wait out readers of the old value */
   kfree(old);
   ```

   Keep read-side sections short; a stalled reader stalls the grace period, and an RCU stall splat reports it. Done when: every reader is inside `rcu_read_lock` and every writer reclaims only after `synchronize_rcu` or a `call_rcu` callback.
5. Use a seqlock for data that is written rarely and read often with no allocation, such as timestamps. Readers retry when a writer intervened.

   ```c
   unsigned seq;
   do {
       seq = read_seqbegin(&sl);
       /* read the shared fields */
   } while (read_seqretry(&sl, seq));
   ```

   Writers serialize with `write_seqlock`/`write_sequnlock`. Done when: the read side retries and the write side is serialized.
6. Use completions for one-shot signaling between contexts. `wait_for_completion` sleeps, so it is process-context only.

   ```c
   struct completion done;
   init_completion(&done);
   /* waiter */
   wait_for_completion(&done);
   /* signaller */
   complete(&done);
   ```

   Reusing a completion for a second cycle needs `reinit_completion(&done)` before the new wait; the `INIT_COMPLETION` macro named in older code is gone. Done when: each completion cycle is initialized once, and reuse paths call `reinit_completion`.
7. Order memory explicitly when the dependency is not a lock. The kernel provides `smp_mb()`, `smp_wmb()`, `smp_rmb()` for CPU-to-CPU ordering, and `readl`/`writel` for MMIO, which most architectures order against each other. Do not replace them with plain C accesses and a comment. Ground barrier questions in `Documentation/memory-barriers.txt` of the target kernel; `concurrency-debugging` covers userspace TSan and lock-order work. Done when: each ordering requirement names the barrier and the pair of accesses it orders.
8. Diagnose the reported failure against the table before proposing code. Done when: the splat, hang, or corruption maps to one row.

## Failure and recovery

| Symptom | Cause | Recovery |
|---|---|---|
| `scheduling while atomic` | Sleeping call under a spinlock or in IRQ | Use `GFP_ATOMIC`, a workqueue, or restructure the locking. |
| Deadlock | AB-BA lock order across two locks | Impose one global acquisition order; document it at the lock definition. |
| RCU stall | Reader blocked or looping in read side | Shrink the read-side section; find the blocker the stall splat names. |
| Second `wait_for_completion` hangs | Completion consumed by the first cycle | `reinit_completion()` before each new cycle. |
| Corrupted counter | Non-atomic read-modify-write from IRQ | `atomic_t` or the irqsave spinlock. |

## Output

The primitive choice with the context analysis; the code pattern for each synchronization site; the RCU or seqlock protocol where chosen; the completion lifecycle with `reinit_completion` on reuse; the barrier pairs where ordering is hand-specified; the failure table row for each reported symptom.
