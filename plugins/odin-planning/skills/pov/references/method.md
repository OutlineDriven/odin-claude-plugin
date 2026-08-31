# Method and verdict contract

Load this before reasoning about the verdict (SKILL.md stage 3). It defines the two-floor gate, the verdict contract, and the output schema. This file and SKILL.md use the same failure labels, the same schema, and the same reversal-trigger rule.

## The five stages

1. Frame (SKILL.md stage 1): the question, incumbent, horizon, and success criteria are pinned, the tier is sized, and the selection escape hatch has fired if the field is unbounded.
2. Scouts (SKILL.md stage 2): the project-grounding, precedent-and-activity, and external-evidence scouts have written dossiers. Precedent-aware, not rigidly first: a CVE's urgency can lead, but you still consume precedent before grading.
3. Verify (SKILL.md stage 3): apply the two-floor gate below to the scout dossiers.
4. Verdict (SKILL.md stage 4): compute the grade from passing dossiers.
5. Output (SKILL.md stage 5): emit the unified verdict contract below.

## Two cross-cutting properties (not stages)

- Skeptic stance. At every step, seek disconfirming evidence and name the real alternatives, including "keep the incumbent" and "do nothing." "No", "Reject", and "Not-our-problem" are first-class outcomes, not failures to complete. Do not let the framing (or, in warm mode, the conversation's momentum) pull the grade upward.
- Reversibility-tiered effort. The stage 1 tier sizes the work. Tier 1 (reversible): one screen, 1-2 external + 1-2 project facts, no reversal trigger, single combined grounding pass. Tier 2 (moderate): fuller alternatives. Tier 3 (one-way / security / legal): deep research, precedent search, durable record offered. A shallow Tier 1 verdict is defensible because the tier is stated, not lazy.

## The two-floor Invalid-Verdict gate

The verdict must clear two absolute floors. They are independent: strong external evidence never compensates for a thin project leg, and vice versa. This is a pass/fail checklist, not a comparison of leg sizes.

- Project floor: PASS requires the verdict to rest on a concrete, verified project fact relevant to the decision, in one of these forms: a named incumbent plus at least one concrete touchpoint (a `file:line`, dependency, issue, PR, or doc passage from the dossiers) for a replace/migrate; the verified absence of an incumbent plus a concrete integration/fit point (where it would slot in, the conventions it must match) for a net-new adoption; or a prior decision on the question. FAIL means the project was not actually inspected. Return `Hold — insufficient project grounding` with a numbered list of exactly what to inspect to make the floor passable. Forbidden from Adopt/Reject on a failed project floor, regardless of how strong the external leg is.
- External floor: PASS requires at least one verified external source whose text supports the claim it backs. FAIL (no research tools were reachable) requires `Hold — external evidence unavailable`, not a graded verdict at lowered confidence.

A conversation claim (warm mode) never satisfies a floor until a scout corroborated it. It sits in the conversation hypotheses bucket, never the verified facts bucket.

## The verdict contract

Every verdict carries a fixed vocabulary and a fixed shape so it is comparable and the next run's precedent search can find it.

Grade, exactly one of:

- Adopt: proven fit for us; use it.
- Trial: promising; use on a low-risk slice first; the next step is a scoped spike.
- Hold: a complete, valid decision to wait (promising but unstable, migration cost exceeds current pain, category moving too fast). `Hold — insufficient project grounding` and `Hold — external evidence unavailable` are the two gate-failure subtypes.
- Reject: judged not worth it for us.
- Not-our-problem: for an exposure question (CVE / deprecation) that does not reach us; avoids forcing an adopt/reject.

Render the grade so the reader never has to decode it. Lead the chat verdict with the call in plain words and attach the label: "Hold, wait, don't switch now," "Trial, promising; pilot it on a low-risk slice first." The fixed vocabulary exists for the durable record and precedent search; it tags a plain-language verdict, it does not replace one.

Schema: every verdict states these fields:

- Grade (the label plus its one-line plain-language meaning, never the bare token)
- Incumbent
- Project evidence (verified, cited from dossiers)
- External evidence (verified, cited from dossiers)
- Conversation hypotheses (unverified, warm mode only)
- Tier
- Confidence
- Conditions ("yes, if...")
- Reversal trigger (Tier 2/3 only; Tier 1 omits this field)
- Next action (computed from the grade)

Keep the verified-evidence fields split into project and external halves. Keep conversation hypotheses in their own field; never let an unverified claim sit among verified facts.

## Output economy

`pov` writes no document by default, so the chat block is the whole deliverable. Make it a tight verdict, not a transcript of the investigation. Lead with the grade. Keep each schema field to one line or a few bullets. The evidence fields cite from the dossiers (`file:line`, issue/PR number, url) rather than reproducing them, and the dossiers themselves are never printed to chat. Length is governed by the tier, not by how much was found:

- Tier 1: one screen (the grade, the incumbent, 1-2 project + 1-2 external cited facts, the conditions, the next action). No reversal trigger, no alternatives walk-through.
- Tier 2/3: fuller (alternatives, the reversal trigger, deeper conditions), but still leads with the grade and keeps evidence to cited bullets, never walls of quoted text.

If the verdict is running past its tier's budget, you are pasting evidence that belongs in a citation. Cut it.
