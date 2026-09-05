---
name: writing-for-agents
description: 'Use when authoring or restructuring an agent-consumed document, a SKILL.md or skill directory, or deciding a skill split-or-monolith disclosure question. Not for prose style: use unslop.'
---

# Writing for agents

One property decides whether a document works: the agent takes the same process every run. The packaging differs across a skill, an AGENTS.md, and a pointer-reached doc; the writing does not.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Author, restructure, or review an agent-consumed document; author, refactor, port, or upgrade a SKILL.md, AGENTS.md/CLAUDE.md, or skill directory; or decide whether a skill stays monolith or splits. |
| Authority | Reversible local: writes only the target document, its skill directory, and the repository-owned registration or attribution surfaces those artifacts require; rollback is version control or undo; never publishes, installs, or commits. No remote mutation. |
| Side effect | The target document is edited, split, or pruned; in mode skill, its directory and registration surfaces change. Reviews and disclosure decisions write nothing beyond the decision record. |
| Done | A cold agent routes and executes predictably with no stale duplication. For a skill write, the repository's own gate passes on every changed file. For a disclosure decision, the split-or-monolith verdict is justified with pointer hygiene and an evaluation plan. |

## Inputs

- The target document path. Required.
- Mode: `document` (default), `skill`, or `disclosure`. Inferred from the request when not stated.
- Optional: the current document content (read it before editing when absent); the surrounding skill tree, which co-location and routing decisions need; empirical evidence such as eval transcripts and token counts for mode disclosure.

## Procedure

Steps 1 through 7 apply to every mode. Then run the named mode, and finish at step 10. The theory behind steps 2 through 7 lives in `references/authoring-levers.md`; load it when a step's claim is not enough to act on.

1. Read the target document fully. Identify whether it contains steps (ordered actions), reference (definitions, rules, facts), or both, and name the document type: skill, AGENTS.md/CLAUDE.md, or pointer-reached doc. Done when: the content type and document type are named.
2. Apply the information hierarchy: rank material by how immediately the agent needs it. In-file step is the primary tier, what the agent does, in order. In-file reference is consulted on demand. Disclosed reference is pushed to a separate file, reached by a context pointer, loaded only when the pointer fires. Done when: every piece of material sits at one level, and neither the top bloats nor needed material hides.
3. Shape every context pointer: state what the material is and the branches that trigger reaching it, front-load the leading word, give one trigger per branch, collapse synonyms that rename a single branch, and cut identity the body already carries. Done when: every pointer meets all of those rules.
4. Set a completion criterion for every step, checkable and high-demand. A vague bound invites premature completion. Sharpen the bound first; only if irreducibly fuzzy and the rush is observed, split the sequence across a real context boundary. Done when: every step has a checkable and exhaustive completion criterion.
5. Apply progressive disclosure and co-location: inline what every branch needs, push behind a pointer what only some branches reach, and keep a concept's definition, rules, and caveats under one heading. Done when: branch-specific material is behind pointers and co-located concepts share one heading.
6. Hunt leading words: compact concepts from pretraining that anchor behaviour in few tokens. Collapse restatements into single tokens. Replace negation with the positive target so the banned behaviour is never spoken. Done when: restatements are collapsed into leading words and negation is replaced.
7. Prune: keep each meaning in a single source of truth; cache only what the agent cannot find by looking; check every line for relevance; delete each sentence that fails the no-op test. Done when: each meaning has one source of truth, no no-op sentences remain, and every line bears on the task.

Mode skill:

8. Apply `references/skill-mechanics.md`: choose model-invoked or user-invoked, justify any split by invocation-reach or sequence-rush, and use a router skill when user-invoked skills multiply past recall. Done when: the invocation mode is chosen and each split carries its justification.
9. When the request writes a skill directory, follow `references/authoring-procedure.md`. Done when: the write path reached its validation step, or the request was a review.

Mode disclosure:

8. Diagnose triggering versus disclosure. Triggering is whether the model invokes the skill at all; it is driven by the YAML description, and file splitting never fixes it. Disclosure is what loads after activation: the SKILL.md body always loads, `references/*` loads only when a pointer fires, `scripts/*` executes without loading into context. If the request conflates the two, surface that first and fix the description before any structural change. Done when: the problem is classified as triggering, disclosure, or both.
9. Run the split-or-monolith decision:
   a. Default to monolith. Split only when SKILL.md exceeds about 400 lines with natural branches, eval evidence shows context wasted on irrelevant sections, or large content is needed only in narrow conditions. Record the rationale either way.
   b. If splitting is justified, select the axis: variant branch (user intent picks one path; fails when variants share over 60% content), workflow versus reference data (fails when the workflow must weave the data inline), or depth tier (fails when the load condition is not sharp and observable from user input).
   c. Reject anti-pattern splits: topic-based splits where invocations do not cluster by topic, splits to hit a line target without a branching condition, rare-but-critical content in references, and cosmetic files with no load condition.
   d. Apply pointer hygiene to every reference: an observable load signal, one sentence per pointer, a filename that encodes the condition, a table of contents for any reference over 300 lines, and a merge when two references co-load in most runs. Prefer `scripts/` over `references/` for deterministic work such as validation, transforms, or schema generation.
   e. Run the decision checklist: a sharp observable load condition; real context saving after router prose; reference data versus procedural content; a possible script instead; expected load fraction (below 20% inline or delete, 20-80% split, above 80% promote).
   f. Design the architecture evaluation: one query per variant, edge-case branch, and lookup category, plus a common-path query that loads zero references and off-topic queries that should not trigger. Instrument each run for files loaded, tokens, and time. Apply the metric decision rules: a reference loaded under 20% of runs is inlined or deleted, over 80% promoted, co-loaded pairs merged, a load unused in output means a fixed pointer, an unreachable reference is deleted. Compare candidate architectures on the identical eval set for cost, quality, and path coverage; reliability beats efficiency.
   Done when: the decision record carries the diagnosis, the verdict with rationale, the architecture, and the evaluation plan.

Every mode:

10. Verify the document is self-contained: it restates every safety, authority, execution, and proof rule the workflow needs, with no pointer to AGENTS.md, a system prompt, a rule file, another skill, or an optional peer step. Done when: the document is self-contained with no external runtime pointers.

## References

| File | Load when |
|---|---|
| `references/authoring-levers.md` | A step's one-line claim is not enough to act on; carries the theory behind steps 2 through 7 |
| `references/skill-mechanics.md` | Mode skill fires, meaning the document is a skill |
| `references/authoring-procedure.md` | The request writes a skill directory |

## Failure and recovery

- Pointer failure: a pointer's wording does not reliably trigger reaching the target. Sharpen the wording first; inline the material only if sharpening fails.
- Premature completion: the agent ends a step before it is genuinely done. Sharpen the completion criterion; if irreducibly fuzzy, split the sequence across a real context boundary.
- Sprawl: the document is too long even when every line is live. Disclose reference behind pointers; split by branch or sequence so each path carries only what it needs.
- Top bloat or hidden material: too little disclosure bloats the top, too much hides what the agent needs. Push reference down or pull it back accordingly.
- Duplication: the same meaning in more than one place. Collapse to a single source of truth.
- No-op retention: an instruction the model already obeys by default. Delete the whole sentence.
- Sediment: stale layers kept because adding felt safe and removing felt risky. Core down to what is live.
- Negation backfire: steering by prohibition makes the forbidden behaviour more available. Restate as the positive target.
- Stale pointer: the target no longer exists or has moved. Update or remove the pointer; never leave a dangling reference.
- Triggering-disclosure conflation (disclosure): surface the confusion as the first finding before recommending any structural change.
- No sharp load condition (disclosure): keep the content inline; never create references that always-load or never-load.
- Metrics unavailable (disclosure): recommend instrumentation before committing to a split; do not split on intuition when the cost profile is unknown.
- Split increases total tokens (disclosure): revert to monolithic and record the measured overhead as evidence.
- Non-convergent architecture (disclosure): stop and deliver the monolith with the eval evidence explaining why.
- Failed validation (skill): repair the source of each failure; do not weaken the gate. When the document cannot be made predictable, return the lever that failed and the evidence.

## Output

- Mode document or skill: the authored or restructured document, every line earning its place by changing routing, authority, reads/writes, procedure, success proof, failure handling, or attribution; no stale duplication, no unreachable pointers, no peer-skill runtime routing. When a skill directory was written, also the changed paths, the job each skill now owns, merge or deletion decisions, attribution changes, and the validation evidence.
- Mode disclosure: a decision record in this order: diagnosis (triggering versus disclosure, with evidence), decision (split or monolith, with rationale), architecture (chosen split axis and pointer hygiene, or monolith rationale and pruning recommendations), and evaluation plan (query set, instrumentation, metrics, and decision thresholds).
