---
name: c-security-review
description: 'Use when the user requests a userspace C or C++ security review with a threat model and severity filter and wants validated findings. Not for kernel or bare-metal code: use kernel-security.'
---

# C security review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user requests a complete userspace C or C++ security review with an explicit threat model, severity filter, and model. |
| Authority | Reversible local: write only the `.c-review-results/<stamp>/` run directory under the current working directory. Roll back by deleting that directory. No remote mutation. |
| Side effect | A `.c-review-results/<iso-timestamp>/` directory holding `units.json`, `ledger.json`, `findings.json`, `REPORT.md`, and `REPORT.sarif`. The reviewed tree is never modified. |
| Done | Every unit in scope has a ledger row per question or is named as uncovered, every reported finding carries a validation verdict of `confirmed` or `needs-context`, refuted findings are removed with their count disclosed, and REPORT.md and REPORT.sarif agree. |

## Inputs

Required, resolved before review. Infer from free text on the invocation ("remote" to `REMOTE`, "local" to `LOCAL_UNPRIVILEGED`, "all" or "high only" to the filter, an explicit model name, "X only" to `scope_subpath`), then ask once for whatever stays unresolved. Never silently default a required parameter.

- `threat_model`: `REMOTE`, `LOCAL_UNPRIVILEGED`, or `BOTH`. Scopes which bug classes count and the severity table each finding is scored against.
- `worker_model`: the model for every review pass. An explicit name, or `inherit` for the session model.
- `severity_filter`: `all`, `medium`, or `high`. What reaches REPORT.md and REPORT.sarif.

Optional:

- `scope_subpath` (default `.`): repo-relative directory. A finding must live inside it, and it is the tree the unit list is built from.
- `context_roots` (default `.`): directories read freely for callers, build flags, and reachability. Narrow it to `scope_subpath` only when the user forbids wider reading, and state that reachability confidence drops.

Scope is native userspace C and C++: memory safety, integer overflow, races, type confusion, daemons, and services. Kernel drivers and modules, bare-metal or embedded code with no libc, and managed languages are out of scope. Stop and say so when the target is one of those.

## Procedure

Create `.c-review-results/<stamp>/` (UTC timestamp) first and clear any prior artifacts in it, so a failed run cannot leave stale files looking current.

1. Enumerate units. Walk `scope_subpath` and collect every C and C++ source file (`.c`, `.cc`, `.cpp`, `.cxx`, `.h`, `.hh`, `.hpp`, `.hxx`). Cut each file into units: one function per unit, and a function longer than 150 lines split at statement boundaries into slices of at most 150 lines. File-level code outside any function is one unit per file. Every line in scope lands in exactly one unit. For each unit, count the sites each question below is about (the writes, the arithmetic that becomes a size, the allocation calls, the `sizeof` uses, the string operations, the checked calls, the parameter mentions, the banned APIs, the macro expansions). Write `units.json` with the unit list, per-unit site counts, and the file list with line totals. Done when: every source file in scope is in `units.json` and every line belongs to one unit.

2. Partition. Split the unit list into contiguous slices of about 1500 source lines per review pass, with at least 4 passes and at most 14. A trailing slice too small to be worth a pass folds into its neighbour. Location is the partition on purpose: each line has one owner, so two passes never write up the same bug. Done when: each unit is assigned to exactly one pass and the assignment is recorded in `units.json`.

3. Review each pass and fill the ledger. For each unit in the pass, read the unit and the code around it (callers, types, buffers it touches) from `context_roots`. Ask the ten questions of every unit that has a non-empty site count for them:
   - `bounds`: what bounds each write destination, and can the index or length reach past it. The high-yield shape is a size computed for one buffer and applied to another.
   - `integer`: width, signedness, and wrap at every conversion and at every expression that becomes a size or an index. Unsigned subtraction below zero wraps to a value that passes every upper-bound check.
   - `alloc-lifetime`: single owner, freed once, never used after free, no surviving copy of a reallocated pointer, released on every error path.
   - `sizeof-arith`: each `sizeof` is the pointee not the pointer, and the surrounding arithmetic cannot overflow before it reaches the allocator.
   - `nul-termination`: every string produced or consumed is terminated on every path, and byte length is not confused with character length.
   - `return-values`: every call whose failure matters is checked against the convention that function uses. A negative return stored in an unsigned type makes the following check unreachable.
   - `caller-contract`: what the unit assumes of each parameter, and whether every caller guarantees it. Read the callers.
   - `banned-api`: for each banned or deprecated API, the source of the data and the size that reaches it, and what validates between them. A bounded internal constant reaching one is a hardening note, not a vulnerability.
   - `initialisation`: every field of every out-parameter and every returned local is written on every path before it is read. `malloc` and the stack do not zero.
   - `macro-contract`: what each function-like macro assumes of its arguments, and whether every expansion site enforces it.

   Write one ledger row per (unit, question) pair into `ledger.json`: `unit_id`, `question`, `verdict` (`clean`, `finding`, `needs-human`, `not-applicable`), `sites_accounted` (the line numbers found by reading, all of them, not only the ones filed at), and `evidence` (what was found at those lines, including the ones not filed). The site count says when to stop looking, not what to write down: never trim a found site to match the count, and say in `evidence` when the two disagree. `not-applicable` is valid only when the counted population is empty. A `finding` verdict does not close the unit: a function with one bug found is likely to hold more.

   A finding cites repo-relative `file:line`, the enclosing function, the real code snippet copied not paraphrased, the broken invariant and what the attacker controls, the data flow from source to sink with the validation between them, the reachability chain from an entry point or the honest limit of what was traced, each mitigation looked for with the `file:line` where it was found or the statement that it is absent, and a severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) scored against the threat model with a one-line rationale. Presence of a banned API is not a finding without a data flow to it. Every negative conclusion rests on the code in front of the reviewer, never on recalled knowledge of the project. Read cold error paths on purpose. A bug class the threat model rules out is not a finding. A bug outside the pass's own units is a one-line pointer (`file`, `line`, one sentence naming the mechanism), promoted to a finding in step 5 only if the owning pass never files within 12 lines of it. Done when: every (unit, question) pair with a non-empty population has a ledger row and every pass's findings and pointers are recorded.

4. Sweep the class axis. List every bug class in the threat model that received no finding in any pass. For each, enumerate its candidate sites across the whole scope tree (a `grep` over the pattern that class needs, then reading each hit) and either file a finding or record a ledger row with `unit_id` `(sweep)`, `question` set to the class name, empty `sites_accounted`, and the enumerated population in `evidence`. A class that could not be reached gets an honest `not-searched` row, which is worth more than a skimmed one. Done when: every silent class has a sweep row or a finding.

5. Check coverage and assemble findings. Diff `ledger.json` against `units.json`: every (unit, question) pair with a non-empty count needs a row, and each row's `sites_accounted` must cover the counted sites. Report coverage as checks satisfied over checks required, never as functions touched, and list every missing pair by name. Merge duplicates by rule: identical `(file, line, bug_class)` triples merge, and two findings on the same sink construct in one function within 5 lines merge. Two different constructs in one function are two bugs even when one fix covers both. Promote unclaimed pointers. Apply `severity_filter`. Write `findings.json` (every finding, including merged duplicates, plus scope metadata and the coverage numbers). Done when: the coverage gap is named exactly, duplicates are merged, and `findings.json` is written with the filtered set marked as reported.

6. Validate findings. Take each reported finding in `findings.json` and re-read its cited lines from the source, plus the callers and the data flow it names, in a fresh read with the finding's own prose closed. Mark one verdict per finding:
   - `confirmed`: the cited line holds the cited construct, the data flow reaches it, and no mitigation the finding declared absent is present.
   - `refuted`: the cited line does not hold the construct, a guard the finding missed sits on every path to it, or the threat model excludes the class. Record the reason in one sentence with the `file:line` of the disproof.
   - `needs-context`: the verdict depends on code outside `context_roots`, on build configuration, or on a runtime fact the source does not settle. Record what would settle it.
   Refuted findings stay in `findings.json` with their verdict and reason, and leave the reported set. Never downgrade a severity to avoid a refutation, and never soften a `refuted` to `needs-context` to keep a count up. Done when: every reported finding carries `confirmed` or `needs-context`, every refutation carries its disproof line, and `validation_ran: true` with the refuted count is recorded in `findings.json`.

7. Write the reports. Build `REPORT.md` (severity-grouped, the reported set only, each finding with its validation verdict, the coverage numbers, the uncovered pairs, the refuted count, and the `needs-context` findings under their own heading) and `REPORT.sarif` (SARIF 2.1.0, the same reported set). Both read one `reported` flag from `findings.json`; never retype a finding between them. Zero findings still produces both files, and zero findings on real C code is worth saying out loud. Done when: both files exist and list the same findings.

8. Return. Read `REPORT.md` and return it. State next to the findings that each was validated by a re-read of its cited lines, that severities are the reviewer's own scored against the stated threat model, and how many findings were refuted and removed. State the coverage numbers and name every uncovered (unit, question) pair and every pass that failed. Done when: REPORT.md is returned with the validation, coverage, and refutation disclosures.

## Failure and recovery

- Empty scope: no source files under `scope_subpath`. Stop, report the searched path, write no report.
- Out-of-scope target: the tree is a kernel module, bare-metal firmware, or a managed language. Stop and say which, before any review pass runs.
- Unreadable file: record the file and error in `findings.json` under `unreadable_files`, continue, and disclose the gap in REPORT.md.
- Coverage gap: a (unit, question) pair has no ledger row, or a row's sites do not cover the count. The run is assembled and unverified. Name each missing pair in REPORT.md and in the return. Do not present the run as fully covered.
- Failed pass: a pass produced no rows. That ground is uncovered, not a rounding error. Name its files and line ranges next to the findings.
- Validation cannot re-read a cited line: the file changed or the line is gone. Mark the finding `needs-context` with that reason. A source edit under a running review invalidates the ledger for every unit, so do not modify the reviewed tree.
- Missing artifact: REPORT.md or REPORT.sarif cannot be written. Report which failed and what `findings.json` holds. Do not claim success.
- Rollback: delete `.c-review-results/<stamp>/`.

## Output

`.c-review-results/<stamp>/` containing `units.json` (the unit list, per-question site counts, and pass assignments), `ledger.json` (one row per unit and question, plus sweep rows), `findings.json` (every finding with its validation verdict, merge history, scope metadata, coverage numbers, and `validation_ran: true` with the refuted count), `REPORT.md` (the reported set, severity-grouped and validated; start here), and `REPORT.sarif` (SARIF 2.1.0, the same reported set). The returned text is REPORT.md plus the validation, coverage, and refutation disclosures.
