---
name: fan-out-fresh-reads
description: 'Strip the leading framing from a question, put the bare version to several fresh zero-context reads, and report where they diverge before reporting where they agree. Use when one read might be an artifact of how the question was asked, or the user says "check this from scratch", "fan this out", or "check framing bias". Don''t use for tasks that require source or remote-system changes.'
---

# Fan out fresh reads

## Contract

| Field | Bound contract |
|---|---|
| Trigger | One read may be an artifact of how the question was framed, or the user asks to check from scratch, fan out, or test whether the current direction is just framing. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Spawns fresh zero-context reads only. |
| Side effect | Chat-output divergence-first finding; spawns fresh zero-context reads. |
| Done | Every read classified, divergences collapsed to shared roots, divergence leads, and convergence labeled reassurance rather than proof. |

## Inputs

The current direction the session is building on: the claim, plan, or framing under test. Optional: read count between 2 and 5 (default 3). The same model is allowed across reads.

## Procedure

1. Name the direction the session is about to keep building on.
2. Strip the bait. Remove the session's own examples, suggested answer, preferred naming, and framing-specific wording down to the underlying goal, constraints, and known facts. Restate the bare question in neutral terms that do not carry the session's loaded vocabulary; if a term is load-bearing, keep its denotation but drop the framing that points at one answer.
3. Fan out 2 to 5 fresh zero-context reads, default 3. The same model is allowed: this checks framing blind spots, not cross-model truth.
4. Classify each read against the current direction: `divergent-incompatible` (challenges a premise the direction depends on), `divergent-compatible` (adds or reframes without discarding the direction), or `convergent`.
5. Cluster before reporting. When several divergences share one root, name the root and put the instances under it as evidence.
6. Report divergence first, then compatible divergence, then convergence. Label convergence as reassurance, never proof. No majority vote, no averaging, no "verified."

## Failure and recovery
- Framing cannot be stripped: if the bare question still carries the session's loaded terms and no neutral restatement exists, report that the framing cannot be separated and stop. Do not fan out a still-loaded question.
- Read refuses or returns empty: report the refusal as a divergence lead rather than retrying with re-primed prompts.
- Partial result: return every read obtained with its classification. Never fabricate a read, invent a classification, or upgrade convergence to proof.

## Output
A divergence-first report: each read classified, divergences sharing a root collapsed to that root, divergence leads, and convergence described as reassurance rather than proof.

## Provenance

Origin: odin-1.x current skill (`skills/fan-out-fresh-reads/SKILL.md`). Revision: unpinned. License: project-owned. Adaptation: restructured into the ODIN 2.0 contract section order, removed the cross-skill pointer to `clean-and-true`, and restated the clean-room framing-strip inline; the framing-blind-sampling mechanism and divergence-first successful end state are preserved.
