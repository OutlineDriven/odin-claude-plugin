---
name: debloat
description: 'Use when asked to compress a padded but still fully binding document, skill, or specification to its load-bearing density when the user says debloat, tighten this, or too long. Every rule present before the pass is present after it and the artifact is materially denser. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Debloat

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A document, skill, or specification is padded but still fully binding; the user says "debloat", "tighten this", or "too long". |
| Authority | Reversible local write: edit one named local prose artifact in place; recover the prior version from version control. |
| Side effect | Edits one local prose artifact in place without moving content to another artifact. |
| Done | Every prior rule and claim remains, the artifact is materially denser, and non-bloat problems are handed off rather than amputated. |

## Inputs

The path to one local prose artifact (document, skill, or specification) that is padded but still fully binding. Must be supplied. No second artifact is read or written.

## Procedure

1. Read the artifact end to end and note in one line what each section must convey.
2. Find the bloat, not the content: padding that adds length but not meaning, a qualifier the sentence holds without, a fused sentence carrying three ideas, a wall of enumeration where a rule plus a short list would do, a point restated within reach of itself, litigation-history where the rule alone suffices.
3. Compress in place. Cut the padding, split the fused sentence, collapse the wall, keep a repeated point once. Move nothing to another artifact and re-derive nothing.
4. Keep every load-bearing claim. If cutting a word would lose one, keep the word.
5. Hand off what is not bloat. Duplication across artifacts and drift are not bloat; do not force-compress them. State that they were handed off rather than amputating them.
6. Cut again cold. The first pass always leaves some.

## Failure and recovery
- Lost-claim cut: if cutting a word would lose a load-bearing claim, keep the word. Never swallow the loss.
- Not-bloat problem: if the defect is duplication across artifacts or drift rather than padding, do not mutate the artifact for it; hand it off and leave the artifact otherwise unchanged for that defect.
- Nothing-to-improve: a pass that finds nothing to genuinely improve changes nothing.
- Rollback: the prior artifact is recoverable from version control.

## Output
The artifact rewritten in place at materially higher density with every prior rule and claim preserved, plus a one-line summary of what was cut and what non-bloat problems were handed off.

## Provenance

Origin: odin-1.x current skill at skills/debloat/SKILL.md. Project-owned marker. Clean-room adaptation: the in-place compression method is restated without copying third-party expression.
