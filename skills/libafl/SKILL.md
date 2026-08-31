---
name: libafl
description: 'Use when a user needs a custom LibAFL fuzzer, observer, feedback, mutator, scheduler, or executor composition. Compose a LibAFL fuzzing engine from its modular components that runs the target, records coverage, and persists findings. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# LibAFL custom fuzzer composition

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs a custom LibAFL fuzzer, observer, feedback, mutator, scheduler, or executor composition. |
| Authority | Reversible-local: write only named local Rust source artifacts; rollback by deleting the generated crate or reverting VCS changes. |
| Side effect | Local-write: creates or modifies Rust source files implementing the composed fuzzing engine and target integration. |
| Done | The composed LibAFL fuzzer compiles, runs the target, records coverage feedback, and persists objective findings to disk. |

## Inputs

- **Target**: the function, binary, or harness to fuzz. Required.
- **Components**: which LibAFL modules to compose — at minimum an executor, observer, feedback, and mutator. Optional; defaults to a coverage-guided in-process fuzzer with `StdScheduledMutator` and `HitcountsMapObserver`.
- **Objective**: the stopping condition or crash classification (e.g., timeout, crash, custom `ExitKind`). Optional; defaults to crash detection.
- **Output directory**: where corpus and findings persist. Optional; defaults to `./fuzz_out`.

## Procedure

1. **Identify the target boundary.** Determine the function signature or binary entry point to fuzz. Confirm the target accepts byte-slice input (`&[u8]`) or can be wrapped in a `BytesInput` harness.

2. **Select the executor.** Choose `InProcessExecutor` for in-process fuzzing or `ForkserverExecutor` / `CommandExecutor` for out-of-process. For `InProcessExecutor`, set a signal handler via `InProcessForkHelper` to catch crashes.

3. **Select the observer.** Create a `HitcountsMapObserver` backed by a `CoverageMap` (typically `AFL-style` shared memory). Wrap in `MultiMapObserver` if tracking multiple maps.

4. **Select the feedback.** Combine `MaxMapFeedback` (coverage novelty) with `TimeoutFeedback` or `CrashFeedback` for objective classification. Use `feedback_or!` / `feedback_and!` macros to compose.

5. **Select the objective.** Define the stopping condition using `CrashFeedback`, `TimeoutFeedback`, or a custom `ExitKind`-based feedback. This determines what the fuzzer reports as a finding.

6. **Select the mutator.** Choose `StdScheduledMutator` with a stack of mutations (`havoc_mutations`, `token_mutations`, or custom). For structured inputs, implement `HasMaxSize` and use `encoded_mutations`.

7. **Select the scheduler.** Use `QueueScheduler` for corpus cycling, `PowerScheduleScheduler` for power scheduling, or `MinimizerScheduler` wrapping another scheduler for corpus minimization.

8. **Assemble the fuzzer.** Create a `StdFuzzer` with the chosen scheduler and feedback. Wire the executor, observer, and objective into a `FuzzingLoop` or call `fuzzer.fuzz_loop(&mut executor, &mut state, &mut mgr)`.

9. **Set up the event manager.** Use `SimpleEventManager` for single-process or `LlmpEventManager` for multi-process. Connect to a `StatsMonitor` (e.g., `MultiMonitor` printing to stdout).

10. **Initialize state and corpus.** Create `StdState` with the initial corpus directory, the feedback, and the objective. Load seed inputs from the corpus directory or provide inline `BytesInput` seeds.

11. **Run the fuzzer.** Call `fuzzer.fuzz_loop(...)`. The fuzzer will mutate inputs, execute the target, observe coverage, and persist new corpus entries and objective findings to the output directory.

12. **Verify findings.** After the run, inspect the output directory for crash/timeout artifacts. Replay each finding against the target to confirm reproducibility.

## Failure and recovery
- **Compilation failure**: LibAFL API changes between versions. Pin the `libafl` crate version in `Cargo.toml`. If compilation fails, check the LibAFL changelog for breaking API changes and adjust component wiring.
- **No coverage observed**: the observer map may not be linked to the target. Verify the `CoverageMap` is shared with the executor (e.g., via `OwnedMutRawPtr` or forkserver shared memory). Fix the map linkage before re-running.
- **Target crash before fuzzing starts**: the harness panics or aborts on initialization. Wrap the target in `catch_unwind` or fix the harness. Do not widen scope to debug the target itself.
- **Empty corpus**: no seed inputs loaded. Provide at least one valid input in the corpus directory or inline. The fuzzer cannot make progress without seeds.
- **Non-convergent mutation**: the mutator produces only invalid inputs that the target rejects immediately. Add a `MapFeedback` or custom `IsInteresting` feedback to guide toward valid input regions, or switch to a structured mutator.

## Output
- Compiled fuzzing engine binary in the project `target/` directory.
- Live corpus of interesting inputs in the output directory.
- Persisted crash and timeout findings in the output directory, each replayable against the target.
- Coverage statistics printed to the event manager monitor.

## Provenance

Origin: Trail of Bits testing-handbook LibAFL skill. Revision: d1f1575cff97816e5cc08af66cd2506099c681d3. License: CC-BY-SA-4.0 with Trail of Bits attribution preserved. Source: https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3. Adapted to ODIN 2.0 format; modifications licensed ShareAlike. No trademark rights claimed; trail-of-bits-mark.svg not reused as branding.
