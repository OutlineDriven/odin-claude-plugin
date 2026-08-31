---
name: node-internals-diagnosis
description: 'Use when deep diagnostics target Node.js segfaults, addon crashes, native or heap memory leaks, event-loop anomalies, thread-pool saturation, V8 deoptimizations, or binding.gyp failures. Returns a root-cause classification with tool evidence. Not for code edits or service restarts.'
---

# Node internals diagnosis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Diagnosing native segfaults, addon crashes, native or heap memory leaks, event-loop anomalies, thread-pool saturation, unexplained V8 deoptimizations, or binding.gyp failures in Node.js. |
| Authority | Runs diagnostic binaries and reads diagnostics; writes only a diagnosis report. Does not modify code or restart services. Reversible-local: written artifacts are the report and any diagnostic artifacts, rollback is deletion. |
| Side effect | Runs diagnostic binaries and produces local diagnostic artifacts; no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Done | A diagnosis report names one root cause per accepted failure class with supporting tool evidence, or returns blocked with the named blocker. |

## Inputs

Required:
- The symptom class (segfault, addon crash, native memory leak, heap memory leak, event-loop anomaly, thread-pool saturation, deoptimization, or binding.gyp failure)
- The Node.js version and platform (OS, arch)

Optional:
- Crash signal (e.g., SIGSEGV, SIGABRT) and process ID
- Core dump or minidump path
- Heap snapshot (`--heap-snapshot-signal` or `v8.writeHeapSnapshot()` output)
- Deoptimization log (`--trace-deopt` output)
- libuv trace output (`LIBUV_TRACE` with level 1-4)
- gdb or lldb backtrace of the crashing process
- The crashing native addon or module name and version

## Procedure

1. **Classify the failure.** Match the symptom to one of: segfault or addon crash, native memory leak, heap memory leak (V8), event-loop anomaly, thread-pool saturation, V8 deoptimization, or binding.gyp failure. If the symptom does not match any class, stop and return `blocked: unsupported-failure-class`. Done when: the failure is classified or returned as unsupported.

2. **Collect class-specific evidence.**

   - Segfault or addon crash: Run the process under gdb with a catchpoint on the signal, or attach to the core dump. Capture `thread apply all bt full`. Record the crashing instruction address and shared object name.
   - Native memory leak: Use AddressSanitizer (ASAN) or Valgrind on the process. Capture the leak report. Cross-reference with the addon that was active at the earliest leak frame.
   - Heap memory leak (V8): Generate a heap snapshot with `--heap-snapshot-signal=SIGUSR2` or `v8.writeHeapSnapshot()`. Compare two snapshots delta. Identify objects retaining the most paths.
   - Event-loop anomaly: Enable `LIBUV_TRACE=4` and reproduce. Identify handles active beyond their expected lifetime. Check libuv refs on the relevant handles.
   - Thread-pool saturation: Instrument libuv thread-pool size with `UV_THREADPOOL_SIZE` probes. Capture the queue depth and average wait time. Correlate with async operations outstanding.
   - V8 deoptimization: Parse `--trace-deopt` output. For each deopt site, reconstruct the hidden class and property access order. If a deopt fires at the same site repeatedly, identify whether a polymorphic inline cache transitioned to megamorphic state.
   - binding.gyp failure: Inspect `include_dirs`, `libraries`, and `cflags_c` in the generated `build/config.gypi`. Verify the target Node.js `abi_{NODE_MODULE_VERSION}` matches the runtime. Check that platform (win, darwin, linux) is correctly detected.

   Done when: the minimum evidence for the matched class is collected.

3. **Follow the decision tree for the class to derive the root cause.**

   - Segfault or addon crash: Follow HandleScope lifetime and libuv-lifetime checks. Determine whether a C++ object was accessed after destruction or a handle was closed prematurely. If the backtrace points into a native addon, cross-reference the addon's source for object lifetime violations. If it points into V8 internals, check for improper `Persistent` handle management.
   - Native memory leak: Follow the ASAN or Valgrind leak report to the allocating frame. Determine whether the addon allocates without a matching free, or whether a `Persistent` handle holds a reference that prevents V8 garbage collection of a native buffer. Cross-reference the addon's cleanup path.
   - Heap memory leak (V8): Compare snapshot deltas. Identify the retaining path: which object holds the reference that prevents collection. Determine whether a closure captures an unexpected reference, an event listener is not removed, a cache grows without eviction, or a `setInterval` callback retains objects. Name the retaining path and the code that creates it.
   - Event-loop anomaly: Identify which handle type keeps the loop alive (timer, socket, pipe, signal, or `uv_poll_t`). Determine whether the handle was not closed, was closed but a reference was retained, or a callback registered a new handle on each iteration. Check for missing `uv_close()` calls or unref'd handles that should have been ref'd.
   - Thread-pool saturation: Correlate queue depth with the outstanding async operations. Determine whether the workload exceeds `UV_THREADPOOL_SIZE` (default 4), whether a single slow operation blocks the pool, or whether unnecessary work is dispatched to the thread pool that could run on the event loop. Name the blocking operation and the pool size mismatch.
   - V8 deoptimization: Follow hidden-class and property-order checks. Determine whether property insertion order varies across calls, a constructor returns a different layout than it initially constructed, or a polymorphic inline cache transitioned to megamorphic state. Name the deopt site, the hidden-class transition, and the code causing the layout divergence.
   - binding.gyp failure: Follow include_dirs, ABI, and platform checks. Determine whether a header path is missing, the ABI version mismatches the runtime, or platform detection failed. Name the specific configuration error.

   Done when: the decision tree is applied and a root-cause hypothesis is formed.

4. **Write the diagnosis report.** Name the root cause as one of: C++ object lifetime violation, megamorphic IC, hidden-class layout mismatch, thread-pool starvation, libuv handle leak, native allocation leak, V8 retaining-path leak, event-loop handle leak, ABI mismatch, or other. Include the supporting tool evidence (backtrace, leak report, snapshot delta, trace output, queue metrics). Done when: the report names one root cause with supporting evidence.

5. **Verify the root cause is named and evidence-backed.** Confirm the report states the failure class, the root cause, the evidence that supports it, and any missing evidence. If the root cause is ambiguous or the evidence is contradictory, return `blocked: ambiguous-root-cause`. Done when: the root cause is named, evidence-backed, and unambiguous, or the blocker is reported.

## Failure and recovery

- Missing evidence: the diagnostic binary exited with an error or produced no output. Capture the stderr. Return `blocked: missing-evidence` with the error message. Do not fabricate a root cause.
- Unsupported failure class: the symptom does not map to any known decision tree. Return `blocked: unsupported-failure-class`.
- Ambiguous root cause: tool output is present but contradicts itself (e.g., a leak reported but the snapshot shows no growth). Return `blocked: ambiguous-root-cause` and list both findings. Do not pick one without resolving the contradiction.
- Partial-result rule: if only part of the evidence is available, return the partial classification with the evidence on hand and explicitly name what is missing.
- Rollback: delete any written diagnostic artifact (heap snapshot, trace file, core dump copy) when the session ends or on explicit request. Do not leave artifacts in the working tree.

## Output

One diagnosis report: failure class, root cause, supporting evidence, and missing evidence, or `blocked` with the named blocker and detail.
