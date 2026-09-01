---
name: writing-skills
description: 'Use when a SKILL.md or AGENTS.md/CLAUDE.md is being authored, refactored, ported, or upgraded, or the user asks to write a skill, improve one, or fix unreliable skill firing. Not for general agent-consumed documents, use writing-for-agents.'
---

# Writing skills

One property decides whether a document works: the agent takes the same process every run. The
levers below produce it. The packaging differs across a skill, an AGENTS.md, and a pointer-reached
doc; the writing does not.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A SKILL.md or AGENTS.md/CLAUDE.md is being authored, refactored, ported, or upgraded, or the user asks to write a skill, improve one, or fix unreliable skill firing |
| Authority | Reversible local writes to the target document and the skill directory it belongs to, plus the repository-owned registration or attribution surfaces those artifacts require. Never publishes, installs, commits, or mutates remote state |
| Side effect | The target document changes on disk when the request is to author or refactor one. Guidance alone when the request is a review |
| Done | The document is predictable, and the repository's own gate passes on every changed file |

## Inputs

The document being authored or refactored: a skill, an AGENTS.md/CLAUDE.md, or a pointer-reached
doc. Optionally the surrounding skill tree, which co-location and routing decisions need.

## Procedure

Each step names its lever and its completion criterion. The levers themselves live in
`references/authoring-levers.md`; load it when a step's name is not enough to act on.

1. Identify the document type: a skill, an AGENTS.md/CLAUDE.md, or a pointer-reached doc. Done
   when: the type is named, because step 8 fires only for a skill.
2. Shape every context pointer against the pointer rules in `references/authoring-levers.md`: state what the material is and the branches that trigger reaching it, front-load the leading word, give one trigger per branch and collapse synonyms that rename a single branch, and cut identity the body already carries. Done when: every pointer meets all of those rules.
3. Assign every document and pointer to a load budget. Done when: each assignment is explicit and
   its trade-off is stated.
4. Place each piece on the information hierarchy. Done when: every piece sits at one level, and
   neither the top bloats nor needed material hides.
5. Apply progressive disclosure and co-location. Done when: branch-specific material is behind
   pointers and the top stays legible.
6. Set a completion criterion for every step, clear and high-demand. Done when: every step has one.
7. Justify every split by sequence-rush or invocation-reach. Done when: each split carries its
   justification and the rest are rejected.
8. For a skill document, apply `references/skill-mechanics.md`. Done when: those mechanics are
   applied, or the document is not a skill and this step is skipped.
9. Hunt for leading words and collapse restatements into them. Done when: restatements are
   collapsed.
10. Prune to one source of truth per meaning. Done when: no duplication and no no-op remain.
11. When the request writes a skill directory, follow `references/authoring-procedure.md`. Done
    when: the write path reached its validation step, or the request was a review.

## References

| File | Load when |
|---|---|
| `references/authoring-levers.md` | A step's one-line claim is not enough to act on; carries the theory behind steps 2 through 10 |
| `references/skill-mechanics.md` | Step 8 fires, meaning the document is a skill |
| `references/authoring-procedure.md` | Step 11 fires, meaning the request writes a skill directory |

## Failure and recovery

Unreliable firing is a pointer problem: sharpen the wording, and inline the material only if
sharpening fails. Premature completion is a criterion problem: sharpen the bound first, and split
across a context boundary only if the bound is irreducibly fuzzy and the rush is observed. Top
bloat means too little disclosure, so push reference behind pointers; hidden material means too
much, so pull back what the agent needs in-file. Sediment is stale layers kept because adding felt
safe and removing felt risky, so core down to what is live. Negation backfire is steering by
prohibition, which makes the forbidden behaviour more available, so restate as the positive target.

Reviews write nothing and need no rollback. Authoring writes are local and reversible, and a failed
validation is repaired at its source rather than by weakening the gate. When the document cannot be
made predictable, return the lever that failed and the evidence.

## Output

The authored or refactored document, with sharpened pointers, a defended information hierarchy,
checkable completion criteria, leading words that recruit pretrained priors, and no sediment. When
a skill directory was written, also the changed paths, the job each skill now owns, merge or
deletion decisions, attribution changes, and the validation evidence.
