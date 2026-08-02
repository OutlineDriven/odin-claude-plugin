---
name: debug
description: Hypothesis-driven debugging. Use when a test fails, a crash or exception occurs, output is wrong, or an intermittent flake has no obvious cause.
---

A bug is a falsified assumption. Build a signal that can catch it, then find the smallest assumption that explains the divergence.

## When to Apply / NOT

Apply: test fails and cause unclear; production stack trace; intermittent / flaky behavior; wrong output without crash; regression after known commit window; heisenbug.

NOT apply: performance regression with correct outputs; security defect; symptom obvious from one-line read; architectural confusion.

## Diagnostic process

Do not skip a phase unless you explicitly justify why. A feedback loop comes before a theory about the code.

### Phase 1 — Build a feedback loop

**This is the skill.** Build a tight pass/fail signal that goes red on this bug before hypothesizing. Bisection, hypotheses, and probes consume that signal; without it, reading code is guesswork. Spend disproportionate effort here. Be creative and do not give up early.

#### Ways to construct one

Try these in roughly this order:

1. **Failing test** at a seam that reaches the bug: unit, integration, or end-to-end.
2. **HTTP script** against a running development server.
3. **CLI invocation** with fixture input, comparing stdout with a known-good snapshot.
4. **Headless browser script** that drives the UI and asserts on the DOM, console, or network.
5. **Replay a captured trace** by saving a real request, payload, or event log and replaying it through the isolated path.
6. **Throwaway harness** that starts the smallest useful system subset with mocked dependencies and one call through the bug path.
7. **Property or fuzz loop** that runs many generated inputs and detects the failure mode.
8. **Bisection harness** that automates checking a known commit, dataset, or version range so `git bisect run` can use it.
9. **Differential loop** that runs the same input through an old and new version, or two configurations, then compares their output.
10. **Human-in-the-loop shell script** only when a person must act. Copy and adapt `scripts/hitl-loop.template.sh`; the agent runs it and captured output returns to the investigation.

Treat the loop as a product. Make it faster by caching setup and skipping unrelated initialization; make its assertion name the exact symptom rather than merely "did not crash"; make it deterministic by pinning time, seeding randomness, isolating filesystems, and freezing network input.

For a non-deterministic bug, raise the reproduction rate rather than waiting for a perfect repro: repeat the trigger, add controlled stress, narrow timing windows, or inject sleeps. A pinned high-rate failure is enough to debug; keep raising the rate until it is.

If no loop can be built, stop and say so. List what you tried, then ask for access to the reproducing environment, a captured artifact (HAR, log dump, core dump, or timestamped recording), or permission for temporary production instrumentation. Do not form hypotheses without a loop.

**Completion gate:** name one command you have already run and record its invocation and result. It must be:

- **Red-capable:** drives the real bug path and asserts the user's exact symptom, so it can go red on this bug and green after the fix.
- **Deterministic:** gives the same verdict each run, or has a pinned, high reproduction rate for a flake.
- **Fast:** finishes in seconds, not minutes.
- **Agent-runnable:** runs unattended; a human participates only through `scripts/hitl-loop.template.sh`.

No red-capable command means no Phase 2. If you notice yourself constructing a theory before this exists, stop and build the loop.

### Phase 2 — Reproduce and minimise

Run the loop and watch it go red. Confirm that it captures the user's reported failure rather than a nearby one, reproduces across runs or at a useful rate, and records the exact error, wrong output, or timing.

Then reduce it to the smallest scenario that still goes red. Remove inputs, callers, configuration, data, and steps one at a time, re-running after each removal. Keep only load-bearing parts. The phase is complete only when removing any remaining part makes the loop go green. This smaller repro narrows the hypothesis space and is the candidate regression test.

### Phase 3 — Hypothesise

Read `references/anti-patterns.md` before forming hypotheses. Audit assumptions first: list each "this must be true" belief and mark it verified or assumed.

Generate **three to five ranked, falsifiable hypotheses** before testing any one. For each, state what is wrong and where (`file:line`), one supporting observation, the trigger-to-symptom causal chain, and a prediction that could disprove it in another path or scenario:

> If `<X>` is the cause, then changing `<Y>` will make the bug disappear, or changing `<Z>` will make it worse.

A claim without a prediction is a vibe; discard it or make it testable. Show the ranked list to the user before testing so their domain knowledge can re-rank it. If they are away, proceed with the recorded ranking. Test one hypothesis at a time; if it is refuted, demote it and take the next. After two or three exhausted hypotheses, diagnose why the evidence or loop is insufficient before inventing more.

### Phase 4 — Instrument

Map every probe to one Phase 3 prediction and change one variable at a time. Prefer a debugger or REPL inspection; otherwise add targeted logs at boundaries that distinguish hypotheses. Do not log everything.

Every temporary debug log **must** have one unique tag in the form `[DEBUG-xxxx]`. Log shape and presence, not raw values; redact secrets and PII. Keep the tag in the investigation notes so cleanup is mechanical.

For a performance regression, do not use debug logs as the primary signal. Establish a baseline measurement with a timing harness, profiler, or query plan, then bisect; measure before fixing.

### Phase 5 — Fix and regression test

Write a regression test before the fix only at a correct, pre-agreed seam. A correct seam is a public boundary where the test exercises the real bug pattern as it occurs at the call site, rather than reaching into implementation details. Write down the seams under test and confirm them with the user before writing a test.

If no correct seam exists, record that finding: the architecture prevents the bug from being locked down, and the test is not written. Otherwise:

1. Turn the minimised repro into a failing test at the confirmed seam.
2. Run it and observe red.
3. Apply the minimal fix.
4. Run it and observe green.
5. Re-run the Phase 1 loop against the original, un-minimised scenario.

### Phase 6 — Cleanup and post-mortem

Before declaring the bug fixed:

- Re-run the Phase 1 loop; the original repro must no longer fail.
- Confirm the regression test passes, or document the missing correct seam.
- Remove every `[DEBUG-xxxx]` probe. Invoke the **`grep` tool**, scoped to the edited source paths, with that exact tag; its empty result is the removal proof. Never use shell `grep` for this check.
- Delete throwaway prototypes, or move a retained one to a clearly marked debug location.
- State the confirmed hypothesis in the commit or PR message so the next debugger can use the causal chain.

Ask what would have prevented the bug. If the answer is architectural — no useful seam, tangled callers, or hidden coupling — recommend an architectural follow-up after the fix, with the observed evidence.

## Anti-patterns

- **Shotgun debugging**: editing several files hoping one fixes it.
- **Print-and-rerun**: adding logs without a target observation.
- **Premature fix**: patching symptom before isolating root cause.
- **Ignoring the trace**: stack frames are evidence.
- **Changing two variables at once**: defeats falsification.
- **Deleting the failing test**: capturing the bug is the asset.
- **Confirmation bias**: interpreting ambiguous evidence as supporting the current hypothesis. Before declaring confirmed, ask: "What would disprove this?"
- **"It works now, move on"**: if the WHY cannot be explained — the full causal chain — the root cause is not confirmed. A coincidental fix is not a fix.
- **Weak prediction**: a prediction that restates the hypothesis adds no information. A good prediction names something not yet observed in a different code path or scenario.

Stop and re-examine if the internal monologue contains "quick fix for now," "this should work" without a tested prediction, or "let me just try" without a hypothesis.

When deeper investigation is needed (intermittent bugs, race conditions, cross-system tracing), load `references/investigation-techniques.md`.

## Stack-Trace Reading

- **Top frame is innermost**: the failure point.
- **Cause vs context**: An exception's `caused by` chain encodes *why*; the stack encodes *where*.
- **Async traces**: virtual stacks drop frames between awaits. Capture causal context.
- **Symbol fidelity**: Strip-mode binaries lose frame names. Build with debug info.
- **Inlined / optimized frames**: `<inlined>` markers signal source-line-to-instruction map is approximate.

## Parallel Tooling

| Family | Live debugger | Postmortem / record | Remote attach |
|---|---|---|---|
| Systems (C/C++/Rust) | `gdb`, `lldb`, `rust-gdb`, `rust-lldb` | `coredumpctl` + `gdb core`, `rr record/replay` | `gdb -p <pid>` / `lldb -p <pid>` |
| Python | `pdb`, `ipdb`, `pdbpp`, `breakpoint()` | `faulthandler`, `py-spy dump`, traceback module | `debugpy --listen` |
| Go | `dlv debug`, `dlv test`, `dlv attach <pid>` | `runtime/pprof`, GOTRACEBACK=crash | `dlv connect <addr>` |
| Java/Kotlin | IntelliJ debugger, `jdb` | hs_err logs, JFR, heap dump (`jmap`) | JDWP `-agentlib:jdwp=...` |
| JavaScript/TypeScript | `node --inspect`, Chrome DevTools | `--report-uncaught-exception` reports | `--inspect=0.0.0.0:9229` |
| OCaml | `ocamldebug`, `Printexc.record_backtrace true` | core file + `ocaml-gdb`, memtrace | `ocamldebug -s <socket>` |

Use `procs` (not `ps`) for PID. Use ranged `read` calls for trace files. Use the `grep` tool for callsites and tagged-log cleanup.

## Constitutional Rules

1. **Build the feedback loop before hypothesizing**.
2. **Reproduce before fixing**.
3. **One hypothesis at a time**.
4. **Evidence over inference**.
5. **Capture the bug as a test** at a confirmed, correct seam.
6. **Confirm with inverse**: removing or altering the cause restores correctness.
7. **Bisect for regressions**.
8. **Announce every edit**.
9. **Remove temporary instrumentation with proof**.

## Defense-in-Depth (conditional)

When the root-cause pattern exists in 3+ other files, or the bug would have been catastrophic in production, apply layered defense. Read `references/defense-in-depth.md` for the four-layer model (entry validation, invariant check, environment guard, diagnostic breadcrumb). Skip when the root cause is a one-off error with no realistic recurrence path.

## Reasoning approach

Before hypothesizing a fix, reason through the failure. SHORT-form KEYWORDS for trace notes, observe the symptoms, trace the execution path, break down where actual behavior diverges from expected, critically review each candidate cause, and validate each hypothesis against the evidence. The root cause is the smallest explanation that accounts for all observed symptoms. For numeric calculation (timing math, bound arithmetic, off-by-N analysis), invoke `fend` per the baseline rule; never self-calculate. Causal reasoning and trace interpretation are in-head; they are not arithmetic.

## Pre-flight Check

- Before writing a plan for a bug fix that touches multiple files
- Whenever you notice that the previous attempt to fix a bug failed

## Reference materials

- `references/anti-patterns.md`: common debugging traps and how to avoid them.
- `references/defense-in-depth.md`: layered defense strategies for preventing bug recurrence.
- `references/investigation-techniques.md`: structured investigation methods for complex defects.
