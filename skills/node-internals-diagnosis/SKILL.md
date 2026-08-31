---
name: node-internals-diagnosis
description: 'Use when deep diagnostics target Node.js segfaults, addon crashes, memory leaks, event-loop anomalies, thread-pool saturation, or V8 deoptimizations. Returns a root-cause classification with tool evidence. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Node internals diagnosis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Diagnosing native segfaults, addon crashes, native/heap memory leaks, event-loop anomalies, thread-pool saturation, or unexplained V8 deoptimizations in Node.js. |
| Authority | Runs diagnostic binaries (gdb, trace flags, heap snapshots); no repo edits by itself. Reversible-local: write only named local diagnostic artifacts; rollback path is deletion of those artifacts. |
| Side effect | Runs diagnostic binaries and produces local diagnostic artifacts; no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Done | Root cause identified with tool evidence (backtrace, handle dump, deopt trace, heap-snapshot delta) via the nodejs-core decision trees. |

## Inputs

Required:
- The symptom class (segfault, addon crash, memory leak, event-loop anomaly, thread-pool saturation, or deoptimization)
- The Node.js version and platform (OS, arch)

Optional:
- Crash signal (e.g., SIGSEGV, SIGABRT) and process ID
- Core dump or minidump path
- Heap snapshot (--heap-snapshot-signal or v8.writeHeapSnapshot() output)
- Deoptimization log (--trace-deopt output)
- libuv trace output (LIBUV_TRACE with level 1-4)
- gdb or lldb backtrace of the crashing process
- The crashing native addon or module name and version

## Procedure

1. **Classify the symptom.** Match to one of: segfault/addon crash, native/heap memory leak, event-loop anomaly, thread-pool saturation, V8 deoptimization, or binding.gyp failure. If the symptom does not match any class, stop and return `blocked: symptom-not-in-scope`. Done when: the symptom is classified or returned as out-of-scope.

2. **Collect the minimum evidence for the class.**

   - **Segfault / addon crash:** Run the process under gdb with a catchpoint on the signal, or attach to the core dump. Capture `thread apply all bt full`. Record the crashing instruction address and shared object name.
   - **Memory leak (native):** Use AddressSanitizer (ASAN) or Valgrind on the process. Capture the leak report. Cross-reference with the addon that was active at the earliest leak frame.
   - **Memory leak (heap, V8):** Generate a heap snapshot with `--heap-snapshot-signal=SIGUSR2` or `v8.writeHeapSnapshot()`. Compare two snapshots delta. Identify objects retaining the most paths.
   - **Event-loop anomaly:** Enable `LIBUV_TRACE=4` and reproduce. Identify handles active beyond their expected lifetime. Check libuv refs on the relevant handles.
   - **Thread-pool saturation:** Instrument libuv thread-pool size with `UV_THREADPOOL_SIZE` probes. Capture the queue depth and average wait time. Correlate with async operations outstanding.
   - **V8 deoptimization:** Parse `--trace-deopt` output. For each deopt site, reconstruct the hidden class and property access order. If a deopt fires at the same site repeatedly, identify whether a polymorphic inline cache transitioned to megamorphic state.
   - **binding.gyp failure:** Inspect `include_dirs`, `libraries`, and `cflags_c` in the generated `build/config.gypi`. Verify the target Node.js abi_`{NODE_MODULE_VERSION}` matches the runtime. Check that platform (win/darwin/linux) is correctly detected.

   Done when: the minimum evidence for the matched class is collected.

3. **Apply the nodejs-core decision tree for the matched class.**

   - **segfault:** Follow HandleScope lifetime and libuv-lifetime checks. Determine whether a C++ object was accessed after destruction or a handle was closed prematurely.
   - **deoptimization:** Follow hidden-class and property-order fixes. Determine whether property insertion order varies across calls or a constructor returns a different layout than it initially constructed.
   - **binding.gyp failure:** Follow include_dirs, ABI, and platform checks.

   Done when: the decision tree is applied and a root-cause hypothesis is formed.

4. **Name the root cause** as: C++ object lifetime violation, megamorphic IC, hidden-class layout mismatch, thread-pool starvation, libuv handle leak, ABI mismatch, or other. Done when: the root cause is named.

5. **Return `done: root-cause-identified`** with the named root cause and the supporting tool evidence. Done when: the classification object is returned with root cause and evidence.

## Failure and recovery

- **`no-evidence-acquired`:** The diagnostic binary exited with an error or produced no output. Capture the stderr. Return `blocked: no-evidence-acquired` with the error message. Do not fabricate a root cause.
- **`inconclusive-evidence`:** Tool output is present but contradicts itself (e.g., a leak reported but the snapshot shows no growth). Return `blocked: inconclusive-evidence` and list both findings.
- **`unmatched-symptom`:** The symptom does not map to any known decision tree. Return `blocked: symptom-not-in-scope`.
- **Partial-result rule:** If only part of the evidence is available, return the partial classification with the evidence on hand and explicitly name what is missing.
- **Rollback:** Delete any written diagnostic artifact (heap snapshot, trace file, core dump copy) when the session ends or on explicit request. Do not leave artifacts in the working tree.

## Output

One terminal classification object: done/symptom_class/root_cause/evidence/missing_evidence, or blocked/blocker/detail when blocked.
