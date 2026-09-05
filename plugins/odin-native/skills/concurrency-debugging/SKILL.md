---
name: concurrency-debugging
description: 'Use when reading TSan race reports, debugging deadlocks with GDB thread inspection, analyzing Helgrind lock-order violations, or reviewing std::atomic and happens-before usage.'
---

# Concurrency debugging

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A ThreadSanitizer or Helgrind report needs reading, a process hangs in a suspected deadlock, `std::atomic` usage needs review, or a cross-thread access needs a happens-before justification. |
| Authority | Read-only. Emits analysis and commands for the operator to run on the target; no file writes, no rollback needed. No remote mutation. |
| Side effect | Diagnostic commands and a verdict in chat. Nothing is written. |
| Done | The race or deadlock is named by its two conflicting accesses or its lock cycle, the fix is stated, and the verification run is described. |

## Inputs

1. Symptom (required): a TSan or Helgrind report, a hung or deadlocked process, or code under review.
2. Build access (required for TSan and Helgrind): the project rebuilds with a sanitizer flag or runs under Valgrind.
3. Source (required): the code paths named in the report.

## Procedure

1. Detect the race with ThreadSanitizer. TSan ships inside GCC and Clang; it needs no separate install.

   ```bash
   gcc -fsanitize=thread -g -O1 -o prog main.c    # clang takes the same flags
   ./prog
   TSAN_OPTIONS="halt_on_error=1:second_deadlock_stack=1" ./prog
   ```

   `halt_on_error` stops at the first report. `second_deadlock_stack` adds the other lock stack to deadlock reports. Done when: the instrumented binary runs and a report exists, or the run is clean.
2. Read the TSan report. A report names the access type and address, the stack of the thread that performed it, the stack of the conflicting earlier access, and where each thread was created. The race is the pair of accesses on one address with no synchronization between them.

   ```text
   WARNING: ThreadSanitizer: data race (pid=12345)
     Write of size 4 at 0x7f1234 by thread T2:
       #0 increment /src/counter.c:8:5
     Previous read of size 4 at 0x7f1234 by thread T1:
       #0 read_counter /src/counter.c:3:14
     Thread T2 created at:
       #0 pthread_create ...
       #1 main /src/counter.c:28:3
   SUMMARY: ThreadSanitizer: data race /src/counter.c:8:5 in increment
   ```

   Done when: the two conflicting accesses, their threads, and the shared address are named.
3. Fix the race by pattern.

   | Race pattern | Fix |
   |---|---|
   | Unsynchronized read or write on shared state | Add a mutex or make the variable `std::atomic` |
   | Double-checked locking without atomics | `std::once_flag` with `std::call_once` |
   | Compound update on a shared integer | `fetch_add` or `compare_exchange_strong` |
   | Container mutated during iteration | Hold the lock for the whole critical section |
   | `shared_ptr` control block | Already atomic; the pointed-to object still needs its own synchronization |

   Done when: every reported access pair is covered by a named fix.
4. Detect lock-order violations with Helgrind. Helgrind runs on Valgrind and reports acquisition orders that can deadlock.

   ```bash
   valgrind --tool=helgrind --log-file=helgrind.log ./prog
   ```

   A lock-order report names two observed orders over the same mutex pair: thread T1 takes M1 then M2, thread T2 takes M2 then M1. The fix is one global order: take M1 before M2 at every site. Done when: every reported order pair resolves to one order.
5. Find the deadlock cycle in GDB.

   ```bash
   gdb -p $(pgrep prog)
   ```

   ```gdb
   (gdb) info threads        # threads parked in __lll_lock_wait wait on a mutex
   (gdb) thread 2
   (gdb) bt                  # which lock this thread waits on
   (gdb) p ((pthread_mutex_t*)0x601090)->__data.__owner   # glibc: TID of the owner
   ```

   `__data.__owner` is a glibc implementation detail; other libcs do not have it. To dump every thread at once:

   ```python
   python
   import gdb
   for t in gdb.selected_inferior().threads():
       t.switch()
       print(f"Thread {t.num}: {gdb.execute('bt 3', to_string=True)}")
   end
   ```

   Done when: the cycle of threads and mutexes is named.
6. Fix `std::atomic` misuse.

   ```cpp
   // TOCTOU: the check and the store are not one operation
   if (counter == 0) counter = 1;
   // Fix: one atomic compare-exchange
   int expected = 0;
   counter.compare_exchange_strong(expected, 1);

   // Publication needs release/acquire, not relaxed
   data = 42;
   ready.store(true, std::memory_order_release);   // producer
   if (ready.load(std::memory_order_acquire)) {    // consumer
       use(data);                                 // sees data == 42
   }
   ```

   Done when: every shared access is atomic or mutex-guarded and every publication uses release/acquire.
7. Apply happens-before reasoning. The edges: sequenced-before orders statements inside one thread; `store(release)` synchronizes-with `load(acquire)` on the same atomic; thread creation synchronizes-with the new thread's first action; a thread's last action synchronizes-before `join`; `unlock(M)` synchronizes-with the next `lock(M)`. A cross-thread read with no edge behind it is a race. Done when: each cross-thread read has a named edge or is flagged as a race.
8. Rust. Ownership rejects data races at compile time: shared mutable state goes behind `Arc<Mutex<T>>` or atomics, and `Send`/`Sync` gate what crosses a thread boundary. TSan works on nightly:

   ```bash
   RUSTFLAGS="-Zsanitizer=thread" cargo +nightly test
   ```

   Done when: shared state sits behind `Arc<Mutex<T>>` or atomics, or the nightly TSan run is clean.

## Failure and recovery

- TSan needs an instrumented rebuild; an uninstrumented binary produces no report. Rebuild with `-fsanitize=thread -g -O1`.
- Helgrind reports on custom spinlocks or lock-free code are expected noise. Annotate or filter them; do not chase them as bugs.
- The deadlock does not reproduce under the debugger: a stopped process still shows the cycle through `info threads` and per-thread `bt`.
- `__data.__owner` is absent: the libc is not glibc. Identify the mutex owner from the backtraces instead.
- A reported race is benign by design, such as a statistical counter: make it a `memory_order_relaxed` atomic so the intent is explicit and the report goes quiet.

## Output

A verdict naming the race or deadlock by its conflicting accesses or lock cycle, the fix per pattern, and the verification run: clean TSan or Helgrind output, or the resolved GDB thread state.
