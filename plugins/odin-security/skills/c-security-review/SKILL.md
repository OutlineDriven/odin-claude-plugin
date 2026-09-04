---
name: c-security-review
description: 'Use when the user requests a userspace C or C++ security review with an explicit threat model, severity filter, and model. Not for kernel drivers, managed languages, or embedded code.'
---

# C security review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user requests a complete userspace C or C++ security review with an explicit threat model, severity filter, and model. |
| Authority | Reversible local: writes only the `.c-review-results/<stamp>/` run directory under the current working directory; rollback is deleting that directory. No remote mutation. No reviewed source tree, VCS, or credential is mutated. |
| Side effect | A `.c-review-results/<stamp>/` directory holding REPORT.md, REPORT.sarif, and findings.json. |
| Done | Every source file in scope is reviewed or named as uncovered, REPORT.md and REPORT.sarif agree, findings are filtered by severity, and the report discloses that no false-positive review ran. |

## Inputs

Required, resolved before review. Infer from free text on the invocation ("remote" to REMOTE, "local" to LOCAL_UNPRIVILEGED, "all" or "high only", an explicit model name, "X only" to scope_subpath), then ask once for whatever stays unresolved. Never silently default a required parameter.

- `threat_model`: REMOTE / LOCAL_UNPRIVILEGED / BOTH. Scopes which bug classes are in scope and the severity table the reviewer scores against.
- `worker_model`: the model for every review pass; an explicit name, or `inherit` for the session model.
- `severity_filter`: all / medium / high. What reaches REPORT.md and REPORT.sarif.

Optional:

- `scope_subpath` (default `.`): repo-relative directory; a finding must live inside it and it is the tree the unit list is built from.
- `context_roots` (default `.`): directories read freely for callers, build flags, and reachability. Narrow it to `scope_subpath` only if the user explicitly forbids wider reading, and state that reachability confidence drops when doing so.

Use for native C/C++ userspace: memory safety, integer overflow, races, type confusion, daemons, services. Not for kernel drivers or modules, managed languages (Java, C#, Python, Go, Rust), or embedded/bare-metal code with no libc.

## Procedure

Bound scope first: create `.c-review-results/<stamp>/` (UTC timestamp) and clear any prior artifacts in it so a failed run cannot leave stale files looking current.

1. **Enumerate source files.** Walk the `scope_subpath` tree and collect every C/C++ source file (`.c`, `.cc`, `.cpp`, `.cxx`, `.h`, `.hh`, `.hpp`, `.hxx`). Record the file list and total line count in `findings.json` under `scope`. Done when: every source file in scope is enumerated with its line count.

2. **Partition and review.** Split the file list into contiguous slices of roughly 1500 source lines per pass, floored at 4 passes and capped at 14. A trailing slice too small to be worth a pass folds into its neighbour. For each pass, read the code and file findings with severity scored against the threat model. Within every pass:
   - A finding cites `path:line` and the specific code pattern. Presence of a banned API is not reportable without a data flow to the sink.
   - No clearing from recalled knowledge: every negative conclusion rests on the code in front of the reviewer. Any claimed mitigation cites a `path:line` showing the guard.
   - Read cold error paths deliberately. Reachability weights depth, never coverage.
   - Score severity against the threat model: a bug class the threat model rules out is not a finding.
   Done when: every pass is reviewed and its findings are recorded.

3. **Consolidate and filter.** Merge all pass findings. Deduplicate identical `(file, line, class)` triples and findings in the same function within three lines of each other. Apply the severity filter: only findings at or above the filter threshold reach REPORT.md and REPORT.sarif. Done when: findings are deduplicated and filtered.

4. **Generate reports.** Build `findings.json` (every finding including duplicates merged), `REPORT.md` (severity-grouped, filtered, human-readable), and `REPORT.sarif` (SARIF 2.1.0, the same reported set). REPORT.md and REPORT.sarif share one finding set; never retype a finding by hand between them. Done when: all three artifacts are written and agree.

5. **Return.** Read `REPORT.md` and return it with a prominent, separate disclosure that no false-positive review ran: every severity is the reviewer's own (`severity_source: "reviewer"`, `judge_ran: false`), nothing rejected anything, and some findings may be wrong or out of scope. Done when: REPORT.md is read and returned with the disclosure.

## Failure and recovery

- Empty scope: no source files found in `scope_subpath`. Stop and report which path was searched. Do not write a report.
- Parsing failure: a source file cannot be read. Record the file and error in `findings.json` under `unreadable_files`, continue with the rest, and disclose the gap in REPORT.md.
- Missing artifacts: if REPORT.md or REPORT.sarif cannot be written, report which artifact failed and what findings were collected. Do not claim success.
- Partial result: a failed pass is uncovered ground, not a rounding error. Report it next to the findings. Name the files and line ranges that were not reviewed.
- Non-mutation: a source edit under a running review invalidates the findings. Do not modify the reviewed tree. Roll back by deleting the run directory.

## Output

`.c-review-results/<stamp>/` containing: `REPORT.md` (severity-grouped, filtered, human-readable; start here), `REPORT.sarif` (SARIF 2.1.0, the same reported set), and `findings.json` (every finding including duplicates merged, plus scope metadata). The returned text is REPORT.md plus the disclosure that no false-positive review ran.
