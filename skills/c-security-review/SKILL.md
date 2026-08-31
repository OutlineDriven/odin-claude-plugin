---
name: c-security-review
description: 'Use when the user requests a userspace C or C++ security review with an explicit threat model, severity filter, model, and optional scope. Runs a location-partitioned audit with a coverage ledger and writes report, SARIF, findings, and gate to a .c-review-results run directory.'
---

# C security review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user requests a complete userspace C or C++ security review with an explicit threat model, severity filter, model, and optional scope. |
| Authority | Reversible local: write only the `.c-review-results/<stamp>/` run directory under the current working directory. Roll back by deleting that directory; no reviewed source tree, VCS, credential, or remote is mutated. |
| Side effect | A `.c-review-results/<iso-timestamp>/` directory holding REPORT.md, REPORT.sarif, findings.json, ledger-gate.json, units.json, detect.json, assignments/, and parts/. |
| Done | Every assigned unit and question is accounted for or named as uncovered, REPORT.md and REPORT.sarif agree, ledger coverage is reported as checks satisfied / checks required, and unadjudicated severity plus known gate limitations are disclosed next to the findings. |

## Inputs

Required, resolved before review — infer from free text on the invocation ("remote"→REMOTE, "local"→LOCAL_UNPRIVILEGED, "all"/"high only", an explicit model name, "X only"→scope_subpath fuzzy-matched against top-level dirs), then ask once for whatever stays unresolved; never silently default a required parameter:

- `threat_model`: `REMOTE` / `LOCAL_UNPRIVILEGED` / `BOTH` — scopes which bug classes are in scope and the severity table the reviewer scores against.
- `worker_model`: the model for every review pass; an explicit name, or `inherit` for the session model.
- `severity_filter`: `all` / `medium` / `high` — what reaches REPORT.md and REPORT.sarif.

Optional:

- `scope_subpath` (default `.`): repo-relative directory; a finding must live inside it and it is the tree the unit list is built from.
- `context_roots` (default `.`): directories read freely for callers, build flags, and reachability. Narrow it to `scope_subpath` only if the user explicitly forbids wider reading, and state that reachability confidence drops when doing so.
- `invariant_audit` (default off): add the shared-state struct field invariant audit to the sweep.

Use for native C/C++ userspace — memory safety, integer overflow, races, type confusion, daemons, services. Not for kernel drivers or modules, managed languages (Java, C#, Python, Go, Rust), or embedded/bare-metal code with no libc.

## Procedure

Bound scope first: create `.c-review-results/<stamp>/` (UTC timestamp) and clear any prior `parts/`, `assignments/`, and artifacts in it so a failed run cannot leave stale files looking current.

1. **Enumerate units.** Parse the `scope_subpath` tree at function granularity. Every source line lands in exactly one unit; a function longer than 150 lines is split at syntactic seams. For each unit decide which of ten questions apply and count the relevant spots, recording only the count per question — never the line numbers — in `units.json`:
   - bounds at every write
   - integer width and signedness
   - allocation/free pairing
   - `sizeof` arithmetic
   - NUL termination
   - unchecked return values
   - what the unit assumes of its caller
   - banned APIs
   - macro contracts
   - initialisation

   A question is owed only where the parse counted a non-empty population for it. Write `detect.json` with platform flags derived from actual API usage (not a single `#include` — a portability shim that includes `<windows.h>` is not a Windows codebase), entry points, shared-state structs, and per bug class whether any candidate site exists. **Done when:** every source line is assigned to a unit, per-question spot counts are written to `units.json`, and `detect.json` records platform flags, entry points, shared-state structs, and candidate-site flags.

2. **Partition and review.** Split the unit list into contiguous slices of about 1500 source lines per pass, floored at 4 passes and capped at 14; a trailing slice too small to be worth a pass folds into its neighbour. For each unit × owed question, read the code, find every counted spot, and write one ledger row recording the lines examined and what was at them, whether or not a finding was filed. File findings with severity scored against the threat model. Write each pass's findings and ledger rows to its own part file under `parts/` and its unit ownership to `assignments/`. Location is the partition on purpose; the class catalogue is a bounded completeness sweep on top — do not add a class-per-agent fan-out. Within every pass:
   - A finding raises the prior; it never closes the unit. A unit with a finding still owes an account of the rest of its population.
   - A verdict must account for a counted population: `sites_accounted` covers every site the parse counted, for `needs-human` as much as for `clean`.
   - No clearing from recalled knowledge: every negative conclusion rests on the code in front of the reviewer, and any claimed mitigation cites a `path:line`. Do not assert an upstream fix is present without showing the guard.
   - No stay-in-lane: any pass may report any class. A filed finding closes a finding, not a class.
   - A banned-API finding demands a data flow to the sink; presence alone is not reportable.
   - Read cold error paths deliberately; reachability weights depth, never coverage — every unit has an owner.
   **Done when:** every unit × owed question is reviewed with a ledger row, and each pass writes its findings, ledger rows, and ownership files.

3. **Sweep.** Take every bug class that got no finding anywhere, minus those the platform gate, the threat model, or the detect candidate-site check ruled out, and run one completeness pass over the whole tree for the residue — this catches the scattered single-site slips a region-ordered reader walks past. The class catalogue is eighteen groups: memory bounds; string handling; format and input APIs; object lifecycle; integer overflow and bounds arithmetic; conversions, precedence and undefined behavior; return values and errno; files and sockets; concurrency; ambient state and DoS; build hardening; library API contract misuse; logic, protocol and crypto (always on, two classes drop under REMOTE); C++ lifetime and C++ class semantics (C++ only); Windows processes, Windows filesystem and paths, Windows IPC and crypto (Windows only). POSIX-only classes drop when the code uses no POSIX APIs. `oob-read` is distinct from `buffer-overflow` (the out-of-bounds write) and `oob-comparison`; `logic-flaw` is the least specific class and is kept whole. If `invariant_audit` is on, add the shared-state struct field audit: list each shared struct's fields, state each field's invariant, find every writer and reader, and prove the rule at each — file results as `state-field-invariant`. **Done when:** every residual class is swept and the optional invariant audit is complete when enabled.

4. **Dedup.** Merge deterministically first: identical `(file, line, class)`, and any two findings in the same function within three lines of each other (including across classes, only when on the same line). Only the residue reaches a dedup pass; under a location partition cross-reviewer duplication is near zero, so this is usually skipped. **Done when:** duplicate findings are merged deterministically.

5. **Assemble and gate.** Re-derive the per-question spot counts from the source unconditionally — do not trust the counts written at review time — and diff the unit ids, the required questions, the per-question `site_counts`, and the enumerate-time denominator against what step 1 recorded. A missing or non-integer denominator is a refusal, not a skipped check. Write `ledger-gate.json` with checks required, checks satisfied, missing rows, and every violation. Coverage is checks satisfied / checks required, never "functions touched": a function can be touched by every pass while most of its questions go unanswered. Build `findings.json`, `REPORT.md`, and `REPORT.sarif` from the part files — never retype a finding by hand. REPORT.md and REPORT.sarif share one definition of "reported" so they cannot describe different sets. Assert the finding count per part; a part file shorter than what its pass returned is a hard failure, not a shorter report. **Done when:** all artifacts are assembled from part files, REPORT.md and REPORT.sarif agree, and the gate records measured coverage or a refusal.

6. **Return.** Read `REPORT.md` and return it. **Done when:** REPORT.md is read and returned.

## Failure and recovery
- **Enumeration parsed no units, nothing to check, or no part files:** each is a hard failure (a checker that inspects zero items must fail), not a clean run. Stop and report which.
- **Artifacts missing with part files intact:** re-assemble deterministically from the part files — never reconstruct the report from the tool result. Assert the finding count per part; a part shorter than returned is a hard failure. If the counts cannot be recovered, the run is assembled-but-unverified and that is the correct outcome to report.
- **Coverage gate could not run or rejected the ledger (artifacts written):** the failure that looks like success. Artifacts are complete but the review is assembled and unverified. Do not re-run assembly — read `ledger-gate.json` and report the gap.
- **`coverage: null`:** coverage is unmeasured, not complete; never report such a run as fully covered.
- **Partial result:** a failed pass is uncovered ground, not a rounding error; report it next to the findings. Name the exact (unit, question) pairs in `ledger-gate.json` rather than a percentage alone.
- **Non-mutation:** a source edit under a running review makes the gate refuse to score every unit; do not modify the reviewed tree. Roll back by deleting the run directory.
- **Known gate limitations (disclose next to the findings):** the gate measures an honest reviewer but is not a control against an adversary; a count-preserving source edit is invisible to the binding and surfaces as violations; a moved tree is caught only when the move changed a site count. A green gate means "no gap this could see", not "not tampered with". The catalogue has no real owner for authorization logic, injection, protocol state machines, deserialization, or crypto on POSIX targets — report tier breakdown separately from the total, because a headline recall number hides exactly that class.

## Output
`.c-review-results/<stamp>/` containing: `REPORT.md` (severity-grouped, filtered, human-readable — start here), `REPORT.sarif` (SARIF 2.1.0, the same reported set), `findings.json` (every finding including duplicates merged), `ledger-gate.json` (the coverage check), `units.json` (unit list with per-question counts, never line numbers), `detect.json` (platform flags, entry points, shared-state structs), `assignments/` (one file per review pass), and `parts/` (one file per pass). The returned text is REPORT.md plus a prominent, separate disclosure that no false-positive review ran: every severity is the reviewer's own (`severity_source: "reviewer"`, `judge_ran: false`), nothing rejected anything, and some findings may be wrong or out of scope — do not filter them and do not present severities as authoritative. Report `silentClasses` (swept and found nothing), `ruledOutClasses` (nothing looked — a human should look), and `platformDroppedClasses` (out of scope by configuration) separately, and surface any `groupsFailed`, `agentFailures`, or `unrecognisedParts` as ground not covered. A zero-finding run still produces both artifacts, and zero findings on real C code is itself worth stating.

## Provenance

Clean-room adaptation of the Trail of Bits `c-review` plugin (https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3, paths `/plugins/c-review/skills/c-review/SKILL.md`, `/plugins/c-review/AGENTS.md`, `/plugins/c-review/agents/c-review-worker.md`, `/plugins/c-review/README.md`). Licensed CC-BY-SA-4.0; preserve Trail of Bits attribution and the source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse `trail-of-bits-mark.svg` as branding. Bug-class knowledge derives from the Trail of Bits Testing Handbook (https://appsec.guide/docs/languages/c-cpp/). This adaptation restates the location-partitioned, ledger-gated audit mechanism as a self-contained agent-executed procedure; it does not copy the plugin's workflow scripts, Python, or worker-agent source expression.
