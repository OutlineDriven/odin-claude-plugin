---
name: dimensional-analysis
description: 'Use when code mixes units, fixed-point precisions, scaling factors, rates, prices, shares, or conversions and needs dimensional consistency validated. Annotates every in-scope file with unit comments, derives a units vocabulary, and reports confirmed and refuted mismatches. Not for type-level unit modeling — use type-driven.'
---

# Dimensional analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A financial, scientific, DeFi, blockchain, or off-chain codebase contains mixed units, fixed-point precisions, scaling factors, rates, prices, shares, or conversions and needs full annotation plus validation. |
| Authority | Reversible local writes only: comment-only dimensional annotations in in-scope source files plus DIMENSIONAL_SCOPE.json, DIMENSIONAL_UNITS.md, and a findings report in the project root. Recover by reverting comments through version control and deleting the three generated artifacts. |
| Side effect | Comment-only annotations in all in-scope source files; DIMENSIONAL_SCOPE.json, DIMENSIONAL_UNITS.md, and a final findings/coverage report in the project root. No executable code, types, or logic are changed. |
| Done | Every in-scope file has terminal annotation, propagation, and validation status; no PENDING entries remain; blocked files reconcile exactly; only comments changed; confirmed and refuted mismatches are separated. |

## Inputs

- Project root path (required).
- Optional pre-existing DIMENSIONAL_UNITS.md and DIMENSIONAL_SCOPE.json for reuse, only when their `project_root` matches this repo and they contain the required structure.
- No mode argument is honored; the full four-phase pipeline always runs end to end.

## Procedure

1. Bound scope. Confirm the project root. Identify every file containing numeric arithmetic with mixed units, precisions, scaling factors, rates, prices, shares, or conversions, and prioritize each as CRITICAL, HIGH, MEDIUM, or LOW. Write `DIMENSIONAL_SCOPE.json` to the project root with `project_root`, `in_scope_files` (all priorities), `discoverer_focus_files` (narrowed to CRITICAL/HIGH only when more than 50 arithmetic files are found), `recommended_discovery_order`, and every in-scope file initialized to `step2: "PENDING"`, `step3: "PENDING"`, `step4: "PENDING"`. If no arithmetic files exist, write an empty manifest and skip to Output with zero findings. **Done when:** `DIMENSIONAL_SCOPE.json` is written with every in-scope file initialized to PENDING, or an empty manifest is written with zero findings.

2. Discover vocabulary. Read `DIMENSIONAL_SCOPE.json` as the source of truth. Infer base units, derived units, and precision prefixes from naming, interfaces, constants, and decimal scaling. Write `DIMENSIONAL_UNITS.md` to the project root with `Base Units`, `Derived Units`, and `Precision Prefixes` sections; write the same empty headings when `in_scope_files` is empty. Reuse a valid existing `DIMENSIONAL_UNITS.md` only when it matches this repo; otherwise discard and regenerate. If `in_scope_files` is empty after this step, skip to Output with zero findings. **Done when:** `DIMENSIONAL_UNITS.md` is written with the three sections, or the empty-headings case skips to Output.

3. Annotate anchors (Step 2). For every `in_scope_files` entry, add dimensional comments at anchor points (state variables, struct fields, function parameters, return values, inline arithmetic) using the vocabulary and the `D{decimals}{dimension}` format. Batch files: 10 or fewer in one batch; 11-30 in one batch per category; more than 30 in one batch per category, splitting categories larger than 10 files into sub-batches of about 8. Process categories in `recommended_discovery_order`: math libraries, then oracles, then core logic, then peripheral. Set `step2 = "PENDING"` for every in-scope file before launch and persist the manifest. After each batch, persist exactly one status per file: `ANNOTATED`, `REVIEWED_NO_ANCHOR_CHANGES`, or `BLOCKED`; for `BLOCKED` also persist `step2_reason` and `step2_retry_count`. Retry each `BLOCKED` file once with a focused prompt. Do not advance while any `step2` is `PENDING`. **Done when:** no `step2` entry is `PENDING`; each file is `ANNOTATED`, `REVIEWED_NO_ANCHOR_CHANGES`, or `BLOCKED` with reason and retry count.

4. Propagate dimensions (Step 3). For every `in_scope_files` entry, extend annotations through arithmetic, function calls, and assignments using dimension algebra (multiplication combines dimensions, division inverts, addition requires matching dimensions). Use the same batching and category order as Step 2. Confirm every file has a non-pending `step2` status before launch; then set `step3 = "PENDING"` and persist. After each batch, persist exactly one status per file: `PROPAGATED`, `REVIEWED_NO_PROPAGATION_CHANGES`, or `BLOCKED`; for `BLOCKED` also persist `step3_reason` and `step3_retry_count`. Retry each `BLOCKED` file once. Aggregate annotations by confidence (`CERTAIN`, `INFERRED`, `UNCERTAIN`), mismatches with severities, and coverage gaps that could not be inferred. Do not advance while any `step3` is `PENDING`. **Done when:** no `step3` entry is `PENDING`; each file is `PROPAGATED`, `REVIEWED_NO_PROPAGATION_CHANGES`, or `BLOCKED` with reason and retry count.

5. Validate and detect bugs (Step 4). Validate every `in_scope_files` entry. Process in this priority order without skipping lower tiers: (a) files with CRITICAL or HIGH Step 3 mismatches, (b) remaining CRITICAL and HIGH scanner-priority files, (c) remaining MEDIUM and LOW files. Confirm every file has a non-pending `step3` status before launch; then set `step4 = "PENDING"` and persist. Validate one file per unit, running in waves of roughly 10-30 files. Reject rationalizations of mismatches; a dimension that does not balance is a finding, not an explanation. After each wave, persist exactly one status per file: `VALIDATED` or `BLOCKED`; for `BLOCKED` also persist `step4_reason` and `step4_retry_count`. Retry each `BLOCKED` file once. Deduplicate findings: confirmed Step 3 mismatches keep their original IDs and severities; refuted Step 3 mismatches are noted as false positives and excluded from final counts; genuinely new findings receive new `DIM-XXX` IDs. Step 4 is complete only when no `step4` entry is `PENDING`. **Done when:** no `step4` entry is `PENDING`; every file is `VALIDATED` or `BLOCKED`, and findings are deduplicated with confirmed and refuted separated.

6. Reconcile. Derive `coverage.unprocessed_files` from terminal `BLOCKED` entries as `{ "path": "...", "blocked_step": "step2|step3|step4", "reason": "...", "retry_count": 1 }`. If the final report and `DIMENSIONAL_SCOPE.json` disagree, continue processing or reconcile the report until they match. Completion is determined by manifest coverage and final reported statuses, not by intent. **Done when:** `coverage.unprocessed_files` matches the terminal BLOCKED set and the report and manifest agree.

## Failure and recovery
- BLOCKED file: persist the blocking reason and retry count; retry once with a focused prompt; if still BLOCKED, keep the documented reason and continue. Never finalize while any in-scope file remains PENDING in any step.
- Stale or malformed manifest or vocabulary: discard reuse and rerun the phase that owns the artifact (scanner owns `DIMENSIONAL_SCOPE.json`; discoverer owns `DIMENSIONAL_UNITS.md`).
- Non-converged run: if a phase cannot clear PENDING after its one retry, the run is non-converged; report every blocked file with its reason and retry count; do not claim the done predicate holds.
- Rollback: only comments were changed. Revert comments through version control and delete `DIMENSIONAL_SCOPE.json`, `DIMENSIONAL_UNITS.md`, and the findings report to restore prior state.
- Never swallow errors, invent evidence, or substitute ad-hoc dimensional reasoning for a skipped or unlaunched phase.

## Output
A structured summary in the project root carrying mode, project_root, vocabulary (base_units, derived_units, precision_prefixes), annotations (total_added, by_file), findings (critical, high, medium, details), uncertainties_resolved, and coverage (in_scope_files, anchor/propagation/validation reviewed ratios, annotated functions and variables, unprocessed_files matching the terminal BLOCKED set), with confirmed and refuted mismatches separated and a list of modified files when edits occurred, ordered bound → discover → annotate → propagate → validate → reconcile.
