---
name: cascade-dedup
description: 'Use when prompt-doctrine is duplicated, drifted, or conflicting across output-style embeds and external harness AGENTS files. Not for editing the canonical baseline itself.'
disable-model-invocation: true
---

# Cascade dedup

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Prompt-doctrine duplication, drift, or conflict across the cascade family. |
| Authority | Human-gated: previews the target and consequence before rewriting prompt doctrine at rest, bumping the catalog `releaseVersion`, or editing authorized external harness embeds; every other write is reversible local, with version control as the rollback. |
| Side effect | Rewrites cascade prefixes/tails, bumps the catalog `releaseVersion` and re-renders package surfaces, and edits authorized external embeds. |
| Done | All canonical tails match, every strip is evidenced, divergence ledger complete, verification green. |

## Inputs

- The canonical baseline file `system-prompt-baseline.md`, must exist and be the agreed source of truth.
- The six output-style embeds: `plugins/odin-core/output-styles/{axiom-mode,builder,duet,linus,odin,benchmark}.md`.
- The two external harness embeds: `~/.omp/agent/AGENTS.md` and `~/.codex/AGENTS.md`.
- Explicit user authorization, recorded in the run, before any `benchmark.md` tail repair or authorized external embed edit.

## Procedure

1. **Map the cascade family and zones.** The canonical baseline `system-prompt-baseline.md` is the whole-file source of truth and wins every conflict. For each output-style embed (`axiom-mode`, `builder`, `duet`, `linus`, `odin`, `benchmark`), the persona prefix above the charter `<role>` (the second `<role>` in each file) is the strip zone. The tail from the charter `<role>` to EOF is the byte-identity invariant zone and is never a dedup target. Never touch the `benchmark.md` auto-generated margin-runner preamble. The external harness embeds `~/.omp/agent/AGENTS.md` and `~/.codex/AGENTS.md` are editable in place but never committable; harness-adapted tool sections are legitimate divergence. **Done when:** the cascade family is mapped with strip zones, invariant zones, and external embeds identified.
2. **Verify the invariant before dedup.** Copy the canonical baseline to a temporary file. For each output style, diff the canonical against the file's tail of equal byte length:
   ```
   diff -q /tmp/canon.md <(tail -c "$(wc -c < /tmp/canon.md)" plugins/odin-core/output-styles/X.md)
   ```
   Drift in the invariant zone is a sync bug, not duplication. Repair by replacing the file's entire tail (from its charter `<role>` to EOF) with the canonical content as one block; dedup edits inside the invariant zone stay forbidden. For `benchmark.md`, obtain explicit user authorization before repairing. Record each diff result. **Done when:** all six tails are verified byte-identical (after repair where needed), or `benchmark.md` repair is deferred for lack of authorization.
3. **Strip-zone scan (persona prefixes).** `benchmark.md` has no eligible strip zone (its persona prefix sits inside the auto-generated block), so scan the five hand-authored styles and skip `benchmark.md`. Classify every sentence of each persona prefix as `voice`, `duplicate`, `conflict`, or `unique-directive`:
   - Normalize (lowercase tokens, stopwords removed). Jaccard >= 0.65 against a baseline rule -> **duplicate**: strip it; the baseline copy stands.
   - Jaccard >= 0.45 plus opposing modal verbs (must/never, always/must-not) -> **conflict**: the baseline wins; delete or rewrite the prefix line.
   - Persona voice (identity, tone, register) is not a directive: keep.
   - Unique directives (persona-specific rules with no baseline pair): keep.
   Done when: every prefix sentence is classified and every strip cites its baseline pair.
4. **Harness embeds.** Per external file (`~/.omp/agent/AGENTS.md`, `~/.codex/AGENTS.md`):
   - Internal duplication within the file, same thresholds as step 3.
   - Directive-level comparison against the baseline. Classify each divergence: `harness-adaptation` (names that harness's tools or commands: keep), `accidental drift` (same rule, mutated wording: align to baseline wording), `conflict` (baseline wins, unless the divergence fits harness-specific tooling).
   Done when: a divergence ledger with exactly one classification per divergence is produced, none unclassified.
5. **Apply, verify, then commit.**
   - Apply all repo edits: strips, conflict resolutions, tail repairs, and the `releaseVersion` bump if strips or conflict resolutions occurred. Let the package-surfaces generator (`scripts/render-plugin-surfaces.mjs`) re-render every package surface (`plugins/<id>/plugin.json` and `.claude-plugin/plugin.json`) from that one literal. A run that only re-syncs an embedded baseline with zero strips is a pure sync change -> no bump. Any `benchmark.md` change (tail repair included) ships only with explicit user authorization recorded in this run.
   - Run verification before committing: re-run the step 2 invariant diffs (all six tails must be byte-identical 6/6) and run `prek run --all-files`. If either fails, do not commit; report the failing diff or check and the file responsible.
   - Only after verification passes, commit all repo files in one atomic commit (edits plus regenerated surfaces).
   - External files: edit in place, never commit; end the report with an explicit warning listing every externally edited path for user review.
   - Output styles load at session start: smoke-test doctrine effects in a fresh session.
   Done when: the final report contains strips per file with citations, conflicts resolved with the winner named, kept harness-adaptations, externally edited paths, the `prek` result, and the invariant re-verified 6/6, with the atomic commit created only after verification passed.

## Failure and recovery
- Invariant-zone drift detected: a sync bug, not duplication. Repair by replacing the entire tail as one block; never edit inside the invariant zone. If the canonical itself is suspect, stop and surface the discrepancy rather than rewriting the canonical.
- benchmark.md repair without authorization: do not touch `benchmark.md` (tail or preamble) until explicit user authorization is recorded in the run. Without it, leave the file unchanged and report the needed authorization.
- Ambiguous classification (Jaccard in the 0.45-0.65 band without opposing modals): do not strip; classify as `unique-directive` and report it for human review.
- prek failure or invariant not 6/6 after edit: the done predicate does not hold. Do not commit; report the failing diff or check and the file responsible.
- Partial-result rule: a run that completes classification but fails final verification produces no commit. The divergence ledger and classification record are still reported as the partial result; the invariant must be re-verified before any commit.
- Rollback: verification runs before the atomic commit, so a failed verification produces no commit to revert. Uncommitted repo edits are discarded with `git checkout -- <files>`. External file edits are not VCS-tracked; record the original content before editing and restore from that record on failure.

## Output
A final report containing the 6/6 invariant re-verification diff results, strips per file with baseline-pair citations, conflicts resolved with the winner named, kept harness-adaptations, the complete divergence ledger (one classification per divergence), every externally edited path flagged for user review, the `prek run --all-files` result, and the `releaseVersion` bump decision (bumped literal plus regenerated surfaces, or no-bump rationale); repo changes land as one atomic commit, external edits land in place and are never committed.
