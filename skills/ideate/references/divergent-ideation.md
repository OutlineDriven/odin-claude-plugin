# Divergent Ideation (Phase 2)

Read this file at the start of Phase 2 — after Phase 1 grounding completes and before building any ideation dispatch prompt. It defines the ideation fleet, the dispatch payload, the frames, the per-idea output contract, and the post-merge synthesis steps.

## Fleet

Dispatch parallel ideation sub-agents per ODIN's standard subagent dispatch. The default fleet is **5 agents covering all six frames**:

- **3 agents**, one per evidence-driven frame (Pain and friction; Inversion, removal, or automation; Leverage and compounding). These frames live on evidence — the grounding summary does the heavy lifting.
- **2 agents** for the reasoning-heavy frames, where strong reasoning is the product: one takes Cross-domain analogy; the other takes Assumption-breaking and reframing **plus** Constraint-flipping (cousins — both invert givens; one agent holds both as starting biases).

Each frame targets ~6-8 ideas (a two-frame agent targets that per frame), yielding ~36-48 raw ideas; roughly 25-30 survive dedupe. Adjust per-frame targets when volume overrides apply (e.g., "100 ideas" raises it, "top 3" may lower the survivor count instead).

## Dispatch Payload (cache-friendly, long-context ordered)

Build one shared grounding block and keep it byte-identical across every ideation dispatch this run — identical prefixes let platforms with prompt caching reuse the expensive part. Longform shared material goes first; the agent-specific task goes last:

- `<grounding>` — the consolidated grounding summary from Phase 1. Instruct each agent to read any referenced files before generating — the grounding summary is orientation, not evidence.
- `<constraints>` — the user's prompt, the focus hint, and any *User-named references*: ideas that violate these are out regardless of basis
- `<background>` — everything else in the grounding (codebase context, additional context, learnings, external context, user-supplied research): informative, not directive — it can supply an idea's basis, but it must not pull ideation toward whatever was loudest in the corpus when the user named a different focus
- `<axes>` — the Phase 1.5 axis list, when present
- `<task>` — the frame assignment, per-frame volume target, ambition charter, verification-read budget, and the per-idea output contract; generate raw candidates only (critique comes later)

The `<constraints>`/`<background>` split is the primary defense against grounding noise (an unrelated file the user did not name, a tangentially-cited prior-art result) shaping survivors against user intent — keep it mechanical via the tags, not prose hedging. User-supplied *research* artifacts are background even though user-named — supplying evidence is not issuing a directive; only directive files (per the Phase 1 routing test) ride in `<constraints>`.

**Ambition charter (include verbatim in every ideation dispatch):**

> This ideation exists so the user can choose a direction worth building — the output's value is decided by whether one idea changes what they do next. Generate the smartest, most inventive ideas your frame can reach: ideas a strong team would say "we have to do this" about. Your first few ideas will be the obvious ones — treat them as warm-up, and keep only the ones that still earn their place after the non-obvious ideas exist. If an idea would appear in a generic listicle about this topic, sharpen it with grounding evidence or drop it. Anchor every idea in specific entries from the grounding.

**Verification reads.** After an agent makes its internal cut, it may spend up to 5 targeted reads following `file:line` pointers to verify or deepen the bases of ideas it will submit. A `direct:` basis must quote a line the agent actually read — in the grounding or in the repo — never a guessed citation.

## Frames

Assign each subagent its frame (or frame pair) as a **starting bias, not a constraint**. Prompt each to begin from its assigned perspective but follow any promising thread — cross-cutting ideas that span multiple frames are valuable.

**Frame selection (six frames):**

1. **Pain and friction** — user, operator, or topic-level pain points; what is consistently slow, broken, or annoying.
2. **Inversion, removal, or automation** — invert a painful step, remove it entirely, or automate it away.
3. **Assumption-breaking and reframing** — what is being treated as fixed that is actually a choice; reframe one level up or sideways.
4. **Leverage and compounding** — choices that, once made, make many future moves cheaper or stronger; second-order effects.
5. **Cross-domain analogy** — generate ideas by asking how completely different fields solve a structurally analogous problem. The grounding domain is the user's topic; the analogy domain is anywhere else (other industries, biology, games, infrastructure, history). Push past the obvious analogy to non-obvious ones.
6. **Constraint-flipping** — invert the obvious constraint to its opposite or extreme. What if the budget were 10x or 0? What if the team were 100 people or 1? What if there were no users, or 1M? Use the resulting design as a candidate even if the constraint flip itself is not realistic.

**Axis spread instruction.** When an axis list is present, instruct each sub-agent to distribute its ideas across multiple axes — the frame's lens applies to every axis, but ideas should not all cluster on one. Each idea must be tagged with the axis it targets. The frame is a lens; the axis list is the surface map. A frame that plausibly reaches an axis should produce at least one idea there before doubling up on a different axis. When decomposition was skipped (atomic subject), omit the axis instruction entirely — do not invent axes at dispatch time.

## Per-Idea Output Contract (uniform across all frames)

Each subagent returns this structure per idea:

- **title**
- **summary** (2-4 sentences)
- **axis** — required when Phase 1.5 produced an axis list. Pick the one axis this idea most centrally targets; do not span. Omit entirely when decomposition was skipped.
- **basis** (required, tagged) — one of:
  - `direct:` quoted line / specific file / named issue / explicit user-supplied context
  - `external:` named prior art, domain research, adjacent pattern, with source
  - `reasoned:` explicit first-principles argument for why this move likely applies — not a gesture; the argument is written out
- **why_it_matters** — connects the basis to the move's significance
- **meeting_test** — one line confirming this would warrant team discussion (waived when tactical focus signals were detected)

Basis is required, not optional. If a subagent cannot articulate a basis of at least one type, the idea does not surface. The failure mode to prevent is generic "AI-slop" ideas that sound plausible but lack a basis the user can verify.

**Generation rules (uniform across frames):**

- Every idea carries an articulated basis. Unjustified speculation does not surface, regardless of how plausible it sounds.
- Bias toward the basis type your frame naturally produces — pain/inversion/leverage tend toward `direct:`; analogy and constraint-flipping tend toward `reasoned:`; assumption-breaking is mixed — but don't exclude other basis types.
- Apply the meeting-test as a default floor: would this idea warrant team discussion? If not, it's below the floor and does not surface.
- Stay within the subject's identity. Product expansions, new surfaces, new markets, retirements, and architectural pivots are fair game when the basis supports them. Subject-replacement moves (abandoning the project, pivoting to unrelated domains, becoming a different organization) are out regardless of basis.
- **Honor the asked scope.** When the focus hint names a part of the subject (a flow, a stage, a section, a feature within a larger product — e.g., "account settings", "onboarding flow", "pricing page copy", "gameplay rules"), ideate at full ambition *within that scope*. Expanding the surface to the whole subject — proposing fundamental changes to the broader product when the user named one slice — is a scope mismatch even when no subject-replacement occurred. Big-picture thinking still applies; it just operates inside the bounded surface the user named, not by widening the surface.

## After All Subagents Return

1. Merge and dedupe into one master candidate list.
2. Synthesize cross-cutting combinations — scan for ideas from different frames that combine into something stronger. Expect 3-5 additions at most.
3. **Axis-coverage check (when Phase 1.5 produced an axis list; skipped otherwise).** Count ideas per axis after dedupe. For any axis with zero ideas, dispatch one recovery subagent (any unused frame, or the frame whose lens fits the missing axis best) targeting that axis specifically. The recovery dispatch carries the same per-idea output contract and ~3-5 ideas as its target. **Cap recovery at 2 axes total** — if more than 2 axes are empty after the first round, accept thin coverage rather than fanning out further. After recovery returns, merge into the master list and dedupe again. Note empty axes that were not recovered in the rejection summary as "axis: <name> — recovery skipped (cap reached)" so the gap is visible to the user.
4. If a focus was provided, weight the merged list toward it without excluding stronger adjacent ideas.
5. Spread ideas across multiple dimensions when justified: workflow/DX, reliability, extensibility, missing capabilities, docs/knowledge compounding, quality/maintenance, leverage on future work.

**Checkpoint.** Immediately after the cross-cutting synthesis step completes and the raw candidate list is consolidated, write `/tmp/odin-ideate/<run-id>/raw-candidates.md` containing the full candidate list with subagent attribution. This protects the most expensive output (the parallel ideation dispatches + dedupe) before Phase 3 critique potentially compacts context. Best-effort: if the write fails (disk full, permissions), log a warning and proceed; the checkpoint is not load-bearing.

When the merge, synthesis, and axis-coverage steps are complete, return to SKILL.md Phase 2's closing instruction and load `references/post-ideation-workflow.md` before any critique begins.
