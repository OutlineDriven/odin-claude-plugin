---
name: debug
description: Isolate defects with hypothesis-driven debugging and minimal reproduction. Use when a test fails, a crash or exception occurs, output is wrong, or an intermittent flake has no obvious cause.
---

A bug is a falsified assumption. Find the assumption, falsify it deliberately, observe the divergence, narrow until one line owns the lie.

## When to Apply / NOT

Apply: test fails and cause unclear; production stack trace; intermittent / flaky behavior; wrong output without crash; regression after known commit window; heisenbug.

NOT apply: performance regression with correct outputs; security defect; symptom obvious from one-line read; architectural confusion.

## Anti-patterns

- **Shotgun debugging**: editing several files hoping one fixes it.
- **Print-and-rerun**: adding logs without a target observation.
- **Premature fix**: patching symptom before isolating root cause.
- **Ignoring the trace**: stack frames are evidence.
- **Changing two variables at once**: defeats falsification.
- **Deleting the failing test**: capturing the bug is the asset.
- **Confirmation bias**: interpreting ambiguous evidence as supporting the current hypothesis. Before declaring confirmed, ask: "What would disprove this?"
- **"It works now, move on"**: if the WHY cannot be explained -- the full causal chain -- the root cause is not confirmed. A coincidental fix is not a fix.
- **Weak prediction**: a prediction that restates the hypothesis adds no information. A good prediction names something not yet observed in a different code path or scenario.

Read `references/anti-patterns.md` before forming hypotheses. Stop and re-examine if the internal monologue contains "quick fix for now," "this should work" without a tested prediction, or "let me just try" without a hypothesis.

## Hypothesis Loop (language-neutral)

1. **Observe**: Reproduce the failure deterministically. Verify environment sanity (correct branch, dependencies installed, expected runtime version, no stale build artifacts).
2. **Trace**: Read the failure artifact (stack, log, core dump). Trace backward from symptom to where valid state first became invalid. Check recent changes in relevant files.
3. **Hypothesize**: One falsifiable claim. Rank hypotheses by likelihood. For each: state what is wrong and where (file:line), cite one concrete observation that supports it, and trace the causal chain from trigger to symptom. For uncertain links in the chain, form a prediction -- something in a different code path that must also be true. Before forming hypotheses, audit assumptions: list "this must be true" beliefs and mark each as verified or assumed.
4. **Instrument**: Insert minimum probe (breakpoint, structured log, assertion). Log shape and presence, not raw values. Redact secrets and PII.
5. **Run**: Execute the minimal repro.
6. **Confirm or refute**: If refuted, demote and pick next hypothesis. If 2-3 hypotheses are exhausted without confirmation, diagnose why (see smart escalation in `references/anti-patterns.md`).
7. **Narrow**: Binary-search the suspect range. Use `git bisect` for regressions.
8. **Confirm root cause**: Inverse test: removing/altering the cause must restore correctness. The causal chain from trigger to symptom must have no gaps. If a prediction was wrong but the fix appears to work, a symptom was found, not the cause.
9. **Hand off**: Forward to TDD: minimal repro becomes permanent failing test.

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

Use `procs` (not `ps`) for PID. Use `bat -P -p -n` (not `cat`) for trace files. Use `git grep -n -C 3 'pattern'` (not `grep`) for callsites.

## Constitutional Rules

1. **Reproduce before fixing**.
2. **One hypothesis at a time**.
3. **Evidence over inference**.
4. **Capture the bug as a test** (hand to TDD).
5. **Confirm with inverse**.
6. **Bisect for regressions**.
7. **Do not make silent edits**.

## Defense-in-Depth (conditional)

When the root-cause pattern exists in 3+ other files, or the bug would have been catastrophic in production, apply layered defense. Read `references/defense-in-depth.md` for the four-layer model (entry validation, invariant check, environment guard, diagnostic breadcrumb). Skip when the root cause is a one-off error with no realistic recurrence path.

## Reasoning approach

Before hypothesizing a fix, reason through the failure. SHORT-form KEYWORDS for trace notes, observe the symptoms, trace the execution path, break down where actual behavior diverges from expected, critically review each candidate cause, validate each hypothesis against the evidence. The root cause is the smallest explanation that accounts for all observed symptoms. For numeric calculation (timing math, bound arithmetic, off-by-N analysis), invoke `fend` per the baseline rule; never self-calculate. Causal reasoning and trace interpretation are in-head; they are not arithmetic.

## Pre-flight Check

- Before writing a plan for a bug fix that touches multiple files
- Whenever you notice that the previous attempt to fix a bug failed

## Reference materials

- `references/anti-patterns.md`: common debugging traps and how to avoid them.
- `references/defense-in-depth.md`: layered defense strategies for preventing bug recurrence.
- `references/investigation-techniques.md`: structured investigation methods for complex defects.
