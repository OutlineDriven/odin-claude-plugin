---
name: prompt-optimizer
description: 'Use when asked to improve, optimize, rewrite, tune, or port a prompt, skill, or tool description, to build prompt evals, or to audit prompt text for dated instructions. Optimize mode returns a shorter prompt validated on holdout cases; audit mode returns a confidence-ordered findings report and a proposed diff, and applies nothing.'
---

# Prompt optimizer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to improve, optimize, rewrite, tune, or port a prompt, or to audit prompt text for dated instructions |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. A proposed diff is chat output; applying it is outside this skill. |
| Side effect | Chat output returns either an optimized prompt or an audit report plus a proposed diff |
| Done | Optimize mode: shorter prompt validated on holdout cases with one owner per behavior rule. Audit mode: every finding names a pattern and a target-model reason, and the diff carries only high- and medium-confidence hunks. |

## Inputs

Required:
- The source prompt text or document to optimize or audit
- The target task or goal the prompt must serve (optimize mode)

Optional:
- Mode (optional): optimize (default) or audit. Audit when the request names auditing, dated instructions, cruft, or a model migration; optimize otherwise. When a request asks for both, run audit first and report each result separately.
- Known failure cases or error patterns from prior runs
- Model family or adapter context (e.g., Claude, GPT-4, Gemini); audit mode reads this as the target model
- Evaluation criteria the user already accepts

## Procedure

### Optimize mode (default)

1. **Capture the source.** Record the exact prompt text or document. Note any quoted variable slots, numbered steps, conditional branches, or formatting constraints present in the original. Done when: the source prompt is recorded with all structural features noted.
2. **Identify the target.** Confirm the single goal the optimized prompt must serve. Reject scope that would require two different outputs or two disjoint audiences. Done when: a single goal is confirmed or scope is rejected.
3. **Extract behavior rules.** Enumerate every requirement the prompt must satisfy: output format, tone, constraints, handling of edge cases. Assign one named owner per rule. Collapse rules that overlap. Done when: behavior rules are enumerated with one named owner per rule and overlaps collapsed.
4. **Write the optimized prompt.** Apply these transformations:
   - Remove every sentence that does not change a routing, format, or constraint decision
   - Replace vague verbs with concrete imperatives
   - Flatten nested conditionals into numbered choices
   - Substitute one placeholder per variable slot; name the slot by its semantic role
   - Add a final residual-risks clause naming the prompt behaviors that are not guaranteed under distribution shift or novel inputs
   Done when: the optimized prompt applies all transformations and includes a residual-risks clause.
5. **Build holdout cases.** Write three cases on which the original prompt failed or would fail: one at each boundary (minimum valid input, maximum valid input, empty or malformed input). Verify the optimized prompt handles all three without contradictory outputs. Done when: three holdout cases are written and verified against the optimized prompt.
6. **Validate one owner per rule.** Confirm each behavior rule from step 3 is observable in the optimized prompt or in the holdout cases. Flag any rule that appears nowhere. Done when: every behavior rule is observable in the prompt or holdout cases, or unobservable rules are flagged.
7. **Annotate adapter notes.** Record model-family-specific adjustments (token budget, instruction hierarchy, chat-template constraints) that would affect reliability if changed. Done when: adapter notes are recorded for each model family.
8. **Return the result.** Output the optimized prompt, target, success criteria (rule list), external context (adapter notes), residual risks, and holdout validation summary as a structured response. Done when: the structured response is returned with all six elements.

### Audit mode

Prompts, skills, and tool descriptions accumulate instructions tuned to older models: emphasis added because an old model under-triggered, step-by-step scripts added because an old model planned poorly. Current models follow instructions more closely and more literally, so leftover text is not wasted tokens but an active degradation. The job is to find specific dated instructions, not to make prompts shorter. A finding that cannot name a pattern from `references/audit-patterns.md` and a target-model reason grounded in a row of `references/prompt-guides.md` is not a finding; it is a low-confidence report line that stays out of the diff. An audit that finds nothing reports the surface clean and proposes an empty diff.

1. **Establish scope and target model.** Scope is the files the request names; otherwise the working directory's prompt surface: `SKILL.md` files, `AGENTS.md`, output styles, and tool descriptions. The target model is the one the request names; else the destination of an in-progress migration; else the newest current-tier row in `references/prompt-guides.md` for the provider the surface addresses, Claude by default. Read the guide rows for that model before asserting anything about its behavior; if a current-tier guide cannot be fetched, continue and mark every model-behavior claim `unverified`. State scope, target, and guide-fetch status at the top of the report rather than pausing to ask. Done when: scope, target model, and guide-fetch status are stated.
2. **Inventory the prompt surface.** List every file in scope by kind: skill and rule files, output styles, tool descriptions including `description` fields and parameter descriptions, and every few-shot block or embedded example wherever it lives. Report the list before auditing so the user can correct it. Done when: the inventory is listed.
3. **Establish provenance.** For every emphatic or prohibitive line, run `git log` or `git blame` and ask which failure, on which model, the line prevented, and whether that failure reproduces on the target model. A line added as a mitigation for a retired model is a presumptive removal candidate. Idioms date a line without history (scratchpad or thinking tags, "think step by step", role-context-rules-examples boilerplate) but idiom dating alone caps a finding at low confidence; a blame line tying the text to a retired model plus a documented target-model behavior is what earns medium or high. Done when: every emphatic or prohibitive line carries a provenance note.
4. **Classify every line.** Ask one question per instruction: could the model already know this? Keep what only the author knows: audience, product, environment facts, quality bar, tool contracts and mechanics, hard judgment calls, and the reasons behind constraints. Mark as candidates restatements of trained defaults, behavior the model does unprompted, and workarounds for failures the target model no longer has. Then separate a constraint on behavior (candidate: test it) from context the model cannot get elsewhere (keep). This check keeps the audit from becoming a length contest. Done when: every line is marked keep, candidate, or context.
5. **Scan against the pattern groups.** Work every candidate through the groups in `references/audit-patterns.md` in order, running the signal greps over the inventory rather than eyeballing. Classify trigger text by function before flagging shouting: a frontmatter `description` may carry calibrated urgency. Check the keep list before recording a match. Done when: every candidate has a group row or is marked flag-only.
6. **Produce the report.** One entry per finding in the report shape from `references/audit-patterns.md`: location, quoted evidence, pattern row, why obsolete for the target model citing the `references/prompt-guides.md` row, confidence, and action. Order by confidence, highest first, with a summary at the top giving counts per group and the two or three highest-impact findings in prose. Findings with no pattern and no target-model reason go at the bottom as `flag` items or not at all; `unverified` claims are `flag` items. Done when: the report is emitted with scope, target, and guide-fetch status at its head.
7. **Produce the proposed diff.** Include only findings with action `remove`, `rewrite`, `move`, or `add` at high or medium confidence; `flag` and low-confidence items appear in the report only. One finding per hunk, each hunk naming its pattern row, so the user can take hunks selectively. Prefer a rewrite to a bare deletion where the instruction has a live purpose. A removal covers every reference: tests asserting the old behavior, docs, rule files, and cross-references in other skills. Write the diff to chat, never to the audited file. Done when: the diff is emitted, every hunk names its pattern, and no `flag` or low-confidence item is inside it.
8. **Verify contested changes.** For each hunk the user or the provenance step contests, run a behavioral probe before and after on a scratch copy: the user's eval suite if one exists, otherwise a minimal probe exercising the instruction's purpose. Asking the model whether it needs an instruction is not a measurement. Change one thing at a time where stakes are high so a regression attributes to its cause; if a cut regresses, re-express the instruction minimally and re-probe rather than restoring the verbose original. Grep the wider tree for the exact prompt text before proposing a deletion, because classifiers, tests, and log parsers match on prompt strings. Done when: each contested hunk carries a probe result or is downgraded to `flag`.

## Failure and recovery
- Ambiguous target (optimize): Stop and ask the user to name one goal. Do not optimize for two goals.
- No observable rule (optimize): Stop if step 3 produces zero behavior rules. A prompt with no constraints is not an optimized prompt.
- Holdout validation fails (optimize): Return the failing case and the specific contradictory output. Do not declare the prompt done.
- Owner gap (optimize): If step 6 finds a rule with no observable trace, add it explicitly to the success criteria and revise the prompt.
- Partial result: If the user interrupts, return what is complete through optimize step 4 or audit step 6. Label it partial.
- Guide unreachable (audit): Run the structural pattern groups, mark every model-behavior claim `unverified`, and drop those findings to `flag`; the diff carries none of them.
- No history (audit): With no `git` history, provenance rests on idiom dating alone and every finding caps at low confidence unless the target model's guide documents the behavior on its own.
- Clean surface (audit): Report the surface clean and emit an empty diff. Never manufacture a finding to fill the report.
- Both modes requested: Run audit first, then optimize, and report each result under its own heading.
- Diff application requested: Decline inside this skill; applying hunks is a separate editing invocation.

## Output
Optimize mode: a structured response with optimized prompt text, target statement, success criteria, external context, residual risks, and holdout validation summary, in that order. Audit mode: the audit report with scope, target model, and guide-fetch status at its head, then the proposed diff as a separate block; both always, and the diff may be empty.
