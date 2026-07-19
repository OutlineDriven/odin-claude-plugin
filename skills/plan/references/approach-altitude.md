# Approach Altitude

Loaded from SKILL.md Phase 0.1a when a request is answered one level up -- produce a grounded **approach-plan** (a plan for *how the deliverable will be made*), hold at a checkpoint, then execute now or save for later. Entered explicitly ("plan for a plan") or via an accepted proactive offer. Domain-general: the deliverable may be a document, a synthesis, a study artifact, or a software implementation plan.

## Stage 1: Light recon (cheap grounding)

The whole point of the approach-plan is to be specific enough to judge. Generic methodology ("read the book, extract themes, synthesize") is not worth approving. So before composing it, skim the provided inputs enough to ground the approach in specifics -- **not** the full read; that is the deliverable's work, deferred to execution.

- **Bound the recon per input type** so the checkpoint stays cheap. Directional guidance, not a rule: for a PDF, section headers + first/last pages + a few sampled sections; for a long transcript, sampled spans plus topic shifts; for a codebase, entry points and the relevant module shape. Skim to locate what matters and how the pieces relate, then stop.
- **Ground in specifics:** name the concrete bridges the approach will make ("the transcript spends ~40 minutes on pricing, which maps to the book's chapter-3 framework -- I'll connect them there"), not a generic recipe.
- **Degrade gracefully.** If the inputs are absent or arrive later, fall back to proposing from the request alone and flag the approach-plan as provisional/ungrounded -- never block waiting for inputs, never emit generic methodology dressed as a plan.
- **No process exhaust.** The approach-plan reads as value to the user, not as an audit log of recon steps ("I skimmed the PDF, then sampled the transcript, then..."). Surface what you concluded, not the plumbing. (See the Veil of value in `references/universal-planning.md`.)

## Stage 2: Compose the approach-plan (chat-first)

Deliver the approach-plan in chat. It is **file-optional** -- the user decides whether to persist it. Keep it scannable. Cover, right-sized to the request:

- **How each input will be handled** -- what you'll mine from each, grounded in the recon.
- **How they combine** -- the synthesis strategy / sequencing; this is usually the risky part and the most valuable thing to confirm.
- **The shape of the deliverable** -- structure/outline of what executing this will produce.
- **The forks worth confirming** -- the few decisions where the user's steer materially changes the result (e.g., weighting one source over another, depth vs. breadth, audience).
- **Open questions** -- anything genuinely unresolved that the user should answer before execution.

This is not a software plan template (no implementation units / test scenarios) unless the deliverable itself is a software implementation plan -- in which case "execute now / code" routes into the normal plan flow (below) rather than composing the deliverable here.

## Stage 3: Checkpoint

Hold at the approach. Use the platform's blocking question tool. Fall back to numbered options in chat only when no blocking tool exists or the call errors -- never silently skip.

**Sequence orthogonal axes** rather than cramming them into one menu (per the "split orthogonal decisions" rule and the 4-option cap):

1. **First:** "Execute now, or save for later?"
2. **Then, only if executing now and the domain isn't already obvious:** confirm code vs. knowledge-work deliverable. Offer to deepen the approach-plan as part of "save for later".

## Stage 4: Route

**Save for later.** Persist the approach-plan to `docs/plans/` so it survives. Keep the plan **agent-agnostic** so any agent can execute it later. Offer to deepen it.

> **Restricted-write harness fallback:** when the harness blocks working-tree writes but exposes session-local artifacts (for example omp plan mode's `local://`), write this artifact to `local://<slug>-approach-plan.md` instead, carrying `intended_path: docs/plans/<slug>.md` as metadata (a frontmatter key when the artifact has YAML frontmatter, otherwise a first-line `<!-- intended_path: ... -->` comment). Read it back to confirm it landed, and defer the mkdir, staging, and commit steps and their gates. The `local://` copy is a working draft, not persistence: a same-session skill may consume it by URI, but never report the artifact as saved to `docs/plans/<slug>.md`; it reaches that path only when a writes-allowed session materializes it there. `intended_path` is metadata for that later persist step, never a trigger to auto-write. An explicit user-given `local://` destination is honored in any mode.

**Execute now.** The approach-plan's job is done; continue into the normal plan flow to produce the implementation plan, then hand off for execution.
