---
name: skill-progressive-disclosure-design
description: 'Use when the model is creating or refactoring a skill, faces a SKILL.md over 300-400 lines, or confuses triggering with disclosure. Produces a justified split-or-monolith decision with pointer hygiene and an architecture-eval plan. Not for skill authoring, use writing-skills.'
---

# Skill progressive disclosure design

## Contract

| Field | Bound contract |
|---|---|
| Trigger | the model is creating or refactoring a skill, faces a SKILL.md over 300-400 lines, or confuses triggering with disclosure |
| Authority | reversible-local: write only named local skill files; rollback by restoring prior file contents |
| Side effect | restructures the skill's files (split or monolith with reference pointers), limited to the target skill directory |
| Done | justified split-or-monolith decision with pointer hygiene and an architecture-eval plan |

## Inputs

- The existing skill directory (`SKILL.md`, any `references/`, `scripts/`). Required.
- The skill's YAML description. Required for triggering diagnosis.
- Empirical evidence (eval transcripts, token counts) if available. Optional; absence triggers the instrumentation recommendation path.

## Procedure

1. **Diagnose triggering vs. disclosure.** Separate these two problems before deciding whether to split.
   - **Triggering** is whether the model invokes the skill at all. Driven entirely by the YAML description. File splitting does not affect triggering. If the question is "my skill doesn't trigger reliably", do not split files. Fix the description.
   - **Progressive disclosure** is what loads after the skill activates. `SKILL.md` body always loads. `references/*` only loads when `SKILL.md` tells the model to read a specific file. `scripts/*` executes without loading into context. This is where context protection happens.
   - If the user asks about splitting because of triggering issues, surface the confusion first and redirect. Do not recommend structural changes until the triggering question is resolved.
   **Done when:** the problem is classified as triggering, disclosure, or both, and the user understands the distinction.

2. **Default: do not split.** A monolithic `SKILL.md` beats a split one until proven otherwise. Split only when at least one holds:
   - `SKILL.md` exceeds ~400 lines and content has natural branches.
   - Empirical evidence (eval transcripts) shows the model wasting context on irrelevant sections.
   - Specific content is large and only needed in narrow conditions.
   - Record the rationale for the monolith-or-split decision before proceeding.
   - Monolith pros: single context load, no router prose, no wrong-load risk, one source of truth, easier human review.
   - Monolith cons: every invocation pays full token cost, does not scale past ~500 lines, no mechanism to gate rare content.
   **Done when:** the default is stated and the specific conditions that would override it are recorded.

3. **Select split axis if splitting is justified.** Three axes that work:
   - Variant branch. User intent selects exactly one path. `SKILL.md` holds decision logic and shared workflow. Each `references/<variant>.md` holds path-specific detail. Clean variants: cloud provider, database engine, framework choice, output format, language. Fails when variants share >60% content.
   - Workflow vs. reference data. `SKILL.md` holds the procedure (verbs, sequence, decisions). `references/` holds lookup material queried by key: schemas, error code tables, API surface listings, configuration matrices. Fails when the workflow must weave reference data inline rather than at discrete lookup points.
   - Depth tier. `SKILL.md` covers the 80% common path. `references/edge-cases.md` covers the rest. The pointer must name the observable signal: "When X, Y, or Z appear, stop and read `references/edge-cases.md` before continuing." Fails when the load condition is not sharp and observable from user input.
   **Done when:** the chosen axis is named and the conditions under which it fails are stated.

4. **Reject anti-pattern splits.** Do not split on these patterns:
   - Topic-based splits where invocations do not cluster by topic. Real tasks span 2-3 topics, forcing multiple loads. Savings are theoretical.
   - Splitting to hit a line target without a branching condition. Without a branching condition, references load in parallel or always, providing no savings.
   - Rare-but-critical content in references. References are optional by design; the model may skip them. If content is critical, it must be in `SKILL.md`. "Rare" and "critical" together usually means the skill is doing two jobs.
   - Cosmetic splits (examples, notes, tips files). No load condition; either always loaded or never loaded.
   **Done when:** every proposed split is classified as valid or rejected with a reason.

5. **Apply pointer hygiene to every reference.**
   - Name the user-visible signal that triggers the load. "If the user mentions snapshot tests" not "for testing concerns".
   - One sentence per pointer. Do not summarize the reference content in `SKILL.md`.
   - Encode the load condition in the filename. `go126-simd.md` not `advanced.md`.
   - Add a top-of-file table of contents for any reference over 300 lines.
   - If two references are co-loaded in most runs, merge them.
   **Done when:** every existing or proposed reference has an observable load signal, a filename that encodes it, and a one-sentence pointer.

6. **Prefer `scripts/` over `references/` for deterministic work.** Put deterministic work (formatting, validation, schema generation, file transforms, regex-heavy parsing) in `scripts/`. Execution has zero context cost and deterministic output, and does not require re-reading. Script errors stop the workflow.
   **Done when:** any deterministic sub-task is assigned to a script or a concrete reason is recorded for keeping it in prose.

7. **Run the decision checklist.** Before finalizing any split:
   1. Does this content have a sharp, observable load condition the model can detect from user input?
   2. Will splitting actually reduce context, accounting for the router prose added to `SKILL.md`?
   3. Is this reference data (lookup) or procedural (sequence)? Procedural content usually stays.
   4. Could a script handle this deterministically instead?
   5. Across realistic invocations, what fraction of runs would load this file? Below 20%: inline or delete. 20-80%: the split sweet spot. Above 80%: promote into `SKILL.md`.
   **Done when:** the checklist is complete and a clear yes/no split verdict is recorded.

8. **Design the architecture evaluation.** Architecture evaluation differs from output evaluation. Output evals ask, "Did the skill produce the right thing?" Architecture evals ask, "Did the skill load the right files for the right reasons, at acceptable cost?"
   - Construct queries: one per declared variant, one per edge-case branch, one per major lookup category, one common-path query that loads zero references, 2-3 off-topic queries that should not trigger the skill.
   - If no realistic query triggers a given reference file, that file is dead. Inline it or delete it before running anything.
   **Done when:** the query set, coverage targets, and cost thresholds are written.

9. **Instrument eval runs.** Each eval run captures:
   - Full transcript including every tool call.
   - Which `references/*` files were read.
   - Whether `scripts/*` were invoked.
   - Total tokens and wall time.
   - The output (for the parallel output-quality eval).
   **Done when:** the instrumentation plan records every required signal.

10. **Collect metrics.**
    - Per reference file: load rate (fraction of runs that read it), co-occurrence (fraction of runs that loaded both this and another reference), use rate when loaded (did the content inform the output), re-read rate.
    - Overall: median and p95 tokens per invocation with and without references, `SKILL.md` utilization (sections never referenced in any run), path coverage (every declared path hit by at least one query).
    **Done when:** the metric set is complete and the collection method is stated.

11. **Apply decision rules from metrics.**
    | Observation | Action |
    |---|---|
    | Reference loaded in <20% of runs | Inline into `SKILL.md` or delete |
    | Reference loaded in 20-80% of runs | Leave split, the sweet spot |
    | Reference loaded in >80% of runs | Promote into `SKILL.md` |
    | Two references co-load in >70% of runs | Merge into one file |
    | Reference loaded but not used in output | Fix or remove the pointer |
    | Reference re-read in same run | Clarify `SKILL.md` routing |
    | No query triggers a reference | Delete the reference |
    | `SKILL.md` section never referenced | Delete that section |
    **Done when:** each metric observation maps to a specific action for the current skill.

12. **Compare architectures when choosing between alternatives.** Run the identical eval set against both versions. Confirm no output-quality regression. Compare median tokens, p95 tokens, and median time. Compare path coverage. A split that saves 15% tokens but adds variance in output quality is worse than the monolith. Reliability beats efficiency.
    **Done when:** both architectures are compared with cost, quality, and coverage numbers.

## Failure and recovery

- Triggering-disclosure conflation. If the diagnosis conflates triggering with disclosure, surface the confusion as the first finding before recommending any structural change. Do not proceed with splitting until the distinction is clear.
- No sharp load condition. If a proposed reference has no observable signal from user input that would trigger its load, keep the content inline in `SKILL.md`. Do not create references that always-load or never-load.
- Metrics unavailable. If empirical eval data is not available, recommend instrumentation (design queries, run evals, collect metrics) before committing to a split. Do not split on intuition alone when the cost profile is unknown.
- Split increases total tokens. If router prose added to `SKILL.md` outweighs the savings from splitting, revert to monolithic. Record the measured overhead as evidence for the monolith decision.
- Non-convergent architecture. If repeated eval cycles show no stable architecture outperforming the monolith, stop and deliver the monolith with the eval evidence explaining why.

## Output

A structured decision record in this order: diagnosis (triggering vs. disclosure classification with evidence), decision (split or monolith with rationale), architecture (chosen split axis and pointer hygiene, or monolith rationale and pruning recommendations), and evaluation plan (query set, instrumentation, metrics, and decision thresholds).
