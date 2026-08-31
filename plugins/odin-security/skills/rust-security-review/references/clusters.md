# Rust security review clusters and finders

Cluster and finder definitions for the Rust security review. Load the section for the
capability level before dispatching workers.

## Capability levels

- `minimal`: critical-only clusters. Use when the user wants a fast check for
  high-severity issues.
- `standard` (default): common vulnerability classes. Use for most audits.
- `deep`: exhaustive, including research-grade patterns. Use for thorough audits
  of unsafe-heavy or FFI-heavy code.

## Standard clusters

Each cluster is one worker. The worker reads the cluster criteria below, runs
targeted searches over the source, records findings, and writes a worker report.

### unsafe-boundary

Audit every `unsafe` block and `unsafe fn`. For each, determine whether the
safety invariant is documented and upheld by all callers. A finding is filed
when an `unsafe` block's precondition can be violated by a safe-code caller.
Search: `unsafe`, `unsafe impl`, `unsafe fn`, `unsafe trait`.

### memory-safety

Audit raw pointer dereferences, `from_raw_parts`, `transmute`, and manual
memory management. A finding is filed when a pointer's validity or aliasing
cannot be proven from the surrounding code. Search: `*mut`, `*const`,
`from_raw`, `as_ptr`, `transmute`, `MaybeUninit`.

### concurrency-data-race

Audit shared mutable state across threads. A finding is filed when two threads
can access the same memory without synchronization, or when `AtomicBool` or
`AtomicPtr` ordering is too weak for the access pattern. Search: `Arc`,
`Rc`, `Cell`, `RefCell`, `Atomic*`, `static mut`, `lazy_static`, `OnceCell`.

### concurrency-locking

Audit lock acquisition order and scope. A finding is filed when two locks can
be acquired in opposite orders across code paths (deadlock), or when a lock
guard is held across an await point. Search: `Mutex`, `RwLock`, `.lock()`,
`.write()`, `.read()`, `await` near a lock guard.

### async-runtime

Audit async code for blocking calls, task cancellation safety, and waker
handling. A finding is filed when a blocking call (`std::thread::sleep`,
`std::fs::read`, busy-wait) runs inside an async context, or when a `select!`
branch drops a future without cleanup. Search: `.await`, `spawn`, `select!`,
`tokio::`, `async fn`, `FuturesUnordered`.

### ffi-cross-language

Audit `extern` blocks, `extern "C"` functions, and C callback registration.
A finding is filed when a Rust type crossing the FFI boundary has a different
layout or lifetime than the C side assumes, or when a panic can cross the
boundary. Search: `extern`, `repr(C)`, `c_int`, `c_void`, `NonNull`,
`callback`, `Box::from_raw`.

### input-os-safety

Audit untrusted input parsing and OS interaction. A finding is filed when
input validation is missing or bypassable, or when an OS call's error path
leaves state inconsistent. Search: `from_utf8`, `from_str_radix`, `Command`,
`fs::`, `env::`, `process::`, `std::io`.

### layout-safety

Audit `repr(C)`, `repr(packed)`, and manual struct layout. A finding is filed
when padding or alignment assumptions are violated, or when a packed struct
field is borrowed by reference. Search: `repr(C)`, `repr(packed)`,
`align_of`, `size_of`, `offset_of`.

### logic-correctness

Audit control flow for off-by-one, wrong comparison operator, inverted
condition, and missing case in a match. A finding is filed when a logic
error produces a wrong result on a reachable input. Search: `match`, `if`,
`while`, `for`, `range`, `..`, `..=`.

### error-handling

Audit error propagation and recovery. A finding is filed when an error is
silently swallowed (`let _ =`, `.ok()`, `.unwrap_or_default()` on a
fallible operation), or when a `Result` is converted to `Option` losing
context. Search: `unwrap`, `expect`, `ok()`, `let _ =`, `?`, `map_err`.

### panic-dos

Audit for panics that an attacker can trigger. A finding is filed when
arithmetic overflow, array index, or `unwrap` on attacker-controlled input
can crash the process. Search: `unwrap`, `expect`, `panic!`, `unreachable!`,
`as usize`, `[`, indexing.

### recursion-dos

Audit for unbounded recursion. A finding is filed when a recursive call
depth depends on input size without a depth limit. Search: `fn ` followed by
a call to the same function name, recursive types.

### resource-handling

Audit file descriptors, sockets, and connections for leaks. A finding is
filed when a resource is opened but not guaranteed to close on every path.
Search: `File::open`, `TcpListener`, `UdpSocket`, `connect`, `accept`,
`spawn`.

### info-disclosure

Audit for secrets in logs, error messages, or panic messages. A finding is
filed when a secret, token, or credential appears in an output channel.
Search: `println!`, `eprintln!`, `log::`, `tracing::`, `format!`, `Debug`,
`Display`.

### static-hygiene

Audit static and global state for initialization races and mutable
access. A finding is filed when a `static mut` is accessed without
synchronization, or when `Lazy` initialization has a race. Search:
`static`, `static mut`, `Lazy`, `OnceLock`, `lazy_static`.

## Deep finders (added to standard clusters)

Each finder is a focused search within a cluster. Deep capability runs all
standard clusters plus these finders.

- `arithmetic-overflow`: `+`, `-`, `*` on integer types without
  `checked_` or `saturating_` variants.
- `buffer-overflow-unsafe`: `ptr::add`, `ptr::offset`, `slice::from_raw_parts`
  with attacker-controlled length.
- `closure-ffi`: closure passed to C as a function pointer without
  `unsafe` marking.
- `closure-panic`: closure that can panic crosses an FFI or spawn boundary.
- `destructor-skip`: `mem::forget` or `ManuallyDrop` skips `Drop`.
- `double-free`: `Box::from_raw` called twice on the same pointer.
- `drop-panic`: `Drop` impl panics, causing abort or double-drop.
- `dyn-trait-ffi`: `dyn Trait` object passed across FFI.
- `foreign-drop`: C code frees Rust-allocated memory or vice versa.
- `invalid-free`: `free` called on a pointer not returned by the
  corresponding allocator.
- `out-of-bounds-index`: array or slice index without bounds check
  (`get_unchecked`, `unsafe` block around indexing).
- `panic-unwind-unsafe`: `catch_unwind` used to mask a panic that violates
  an invariant.
- `pointer-exposure`: raw pointer stored in a struct reachable from safe
  code.
- `refcell-borrow-panic`: `RefCell::borrow` or `borrow_mut` panics on
  double borrow.
- `repr-c-padding`: `repr(C)` struct with padding assumed to be zero.
- `send-sync-bounds`: `unsafe impl Send` or `unsafe impl Sync` without
  justification.
- `uninitialized-read`: `MaybeUninit::assume_init` on uninitialized data.
- `unsafe-sync-impl`: `Sync` implemented for a type with interior
  mutability without synchronization.
- `use-after-free`: pointer used after the owner is dropped.
- `vec-set-len-uninit`: `Vec::set_len` without initializing elements.

## Worker report schema

Each worker writes a JSON report to the review directory:

```json
{
  "cluster": "<cluster-name>",
  "status": "complete | failed",
  "findings": [
    {
      "id": "<cluster-name>-<sequence>",
      "file": "<path>",
      "line": <number>,
      "class": "<class-name>",
      "severity": "high | medium | low",
      "description": "<what is wrong>",
      "evidence": "<code snippet or search result>",
      "confidence": "confirmed | probable | speculative"
    }
  ],
  "coverage": {
    "files_reviewed": <number>,
    "files_in_scope": <number>,
    "searches_run": <number>
  }
}
```

A worker that finds nothing still writes a report with an empty `findings`
array and `status: "complete"`. A worker that crashes or cannot read the
source writes `status: "failed"` with an empty `findings` array.

## Dedup identity

Two findings are duplicates when they share the same `(file, line, class)`
triple. The dedup judge reads all worker reports, groups findings by this
triple, and writes a dedup report listing one surviving finding per group
with the source worker noted.

## False-positive proof standard

A finding is a false positive when the reviewer can cite a `path:line` where
the code establishes the safety invariant the finding claims is missing. The
false-positive judge reads each non-deduplicated finding, checks the cited
evidence against the source, and classifies it as `true-positive` or
`false-positive`. A finding without a cited `path:line` mitigation is a
true positive; absence of a mitigation is not proof of safety.

## SARIF conversion

Each surviving finding maps to a SARIF 2.1.0 result:

```json
{
  "ruleId": "<class>",
  "level": "error | warning | note",
  "message": { "text": "<description>" },
  "locations": [
    {
      "physicalLocation": {
        "artifactLocation": { "uri": "<file>" },
        "region": { "startLine": <line> }
      }
    }
  ]
}
```

Severity maps to level: high to `error`, medium to `warning`, low to `note`.
The SARIF file wraps results in a single run with the tool name
`rust-security-review`.
