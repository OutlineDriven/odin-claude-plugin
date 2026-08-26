---
name: fan-out-fresh-reads
description: 'Strip the leading framing from a question, put the bare version to several fresh zero-context reads, and report where they diverge before reporting where they agree. Use when one read might be an artifact of how the question was asked, or the user says "check this from scratch", "fan this out", or "is this just my framing". Divergence is the finding, and agreement across primed reads is not proof. To split one artifact across different lenses instead of repeating one read, use prism.'
disable-model-invocation: true
---
# Fan out fresh reads

Check whether the current direction is tunnel vision by asking several fresh, zero-context reads and reporting divergence first.

## Method

1. **Name the direction** the session is about to keep building on.
2. **Strip the bait.** Remove the session's own examples, suggested answer, preferred naming, and framing-specific wording down to the underlying goal, constraints, and known facts. See `../clean-and-true/references/idioms.md` for the clean-room procedure.
3. **Fan out 2 to 5 reads, default 3.** Same model is allowed; this checks framing blind spots, not cross-model truth.
4. **Classify each read** against the current direction: `divergent-incompatible` (challenges a premise the direction depends on), `divergent-compatible` (adds or reframes without discarding it), or `convergent`.
5. **Cluster before reporting.** When several divergences share one root, name the root and put the instances under it as evidence.
6. **Report divergence first**, then compatible divergence, then convergence. Label convergence as reassurance, never proof. No majority vote, no averaging, no "verified."

## Completion

Every read is classified, divergences sharing a root are collapsed to it, divergence leads, and convergence is described as reassurance rather than proof.

