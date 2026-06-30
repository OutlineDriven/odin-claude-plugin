# Post-Ideation Workflow

Read this file after Phase 2 ideation agents return and the orchestrator has merged and deduped their outputs into a master candidate list. Do not load before Phase 2 completes.

## Phase 3: Adversarial Filtering

Review every candidate idea critically. Critique runs in two layers — a fresh-context verifier first, then orchestrator arbitration. Fresh-context verification outperforms self-critique: the orchestrator synthesized some of these candidates itself and carries the full generation history, so it is anchored in ways a verifier that never saw the generation is not.

1. **Basis verification (one sub-agent).** Dispatch a verifier whose payload is only the consolidated grounding summary (including the evidence gists and dossier file paths — it reads dossier files itself as needed) and the merged candidate list — none of the generation history. Prompt it to refute: for each candidate, check that the stated basis actually supports the claimed move, that `direct:` quotes exist where cited (spot-check by reading the file), that `external:` prior art is real and relevantly analogous, that `reasoned:` arguments hold, and that the idea genuinely passes the meeting-test. It returns a per-candidate verdict (sound / weak / refuted) with a one-line reason. The verifier did not write the ideas, so its meeting-test judgment supersedes the generators' self-attestation.

2. **Orchestrator arbitration.** The orchestrator makes the final cut, weighing verifier verdicts without being bound by them — overrule a verdict when evidence in context contradicts it, and say so in the rejection reason.

If verifier dispatch fails (platform limits, errors), fall back to orchestrator-only filtering and note the degradation in the rejection summary.

Do not generate replacement ideas in this phase unless explicitly refining.

For each rejected idea, write a one-line reason.

Rejection criteria:
- too vague
- not actionable
- duplicates a stronger idea
- not grounded in the stated context
- too expensive relative to likely value
- already covered by existing workflows or docs
- interesting but better handled separately, not as a product improvement
- **unjustified — no articulated basis** (subagent failed to provide `direct:`, `external:`, or `reasoned:` justification, or the stated basis does not actually support the claimed move)
- **basis refuted by verification** (the verifier found a cited quote absent, prior art mischaracterized, or a reasoned argument unsound — and the orchestrator concurs)
- **below ambition floor** (fails the meeting-test: would not warrant team discussion — except when tactical focus signals detected, in which case this criterion is waived)
- **subject-replacement** (abandons or replaces the subject of ideation rather than operating on it)
- **scope overrun** (expands beyond the asked scope rather than ideating within it). Allowed only when the basis explicitly justifies the expansion; default is reject or downgrade.

Score survivors using a consistent rubric weighing: groundedness in stated context, **basis strength** (`direct:` > `external:` > `reasoned:`; none excluded, but direct-evidence ideas score higher all else equal), expected value, novelty, pragmatism, leverage on future work, implementation burden, overlap with stronger ideas, and **axis spread** (when Phase 1.5 produced an axis list) — survivor sets that cover the topic's surface outscore sets that cluster on one axis, all else equal.

**Axis coverage as a list-level concern.** When axes were defined, axis spread is evaluated across the survivor set, not per-idea. After per-idea filtering, check the survivor set: if axis coverage is uneven and stronger candidates exist on under-represented axes, prefer the spread when promoting borderline candidates. Phase 2's recovery dispatch should already have surfaced candidates for empty axes; this is a polish step on the survivor selection. If an axis ends up with zero survivors despite recovery (or because recovery hit the 2-axis cap), note it in the rejection summary as a deliberate gap rather than an oversight.

Target output:
- keep 5-7 survivors by default
- if too many survive, run a second stricter pass
- if fewer than 5 survive, report that honestly rather than lowering the bar

## Phase 4: Write and Present the Deliverable

The ideation artifact is produced **automatically** — persistence is not opt-in. After filtering, write the deliverable and show a concise summary. The full content lives in the file; the session shows only an orienting summary.

**Checkpoint B.** Before writing the deliverable, write `/tmp/odin-ideate/<run-id>/survivors.md` containing the survivor list plus key context (focus hint, grounding summary, rejection summary). Best-effort: if the write fails, log a warning and proceed; the checkpoint is not load-bearing.

### 4.1 Write the Deliverable (automatic)

Write the file every run — do not wait for the user to ask.

1. **Resolve the target directory.** Ensure `docs/ideation/` exists (create if absent).
2. **Choose the file path:** `docs/ideation/<slug>.md` where `<slug>` is the sanitized subject. Markdown is the canonical surface, always written.
3. **Load the section contract:** read `references/ideation-sections.md` for the section structure (metadata, Grounding Context, Topic Axes, Ranked Ideas with per-idea fields, Rejection Summary).
4. **Write the document** per the section contract. If `format:html` is active, also read `references/html-rendering.md` and render `docs/ideation/<slug>.html` as a self-contained view derived from the markdown; read it back and verify content parity.
   - **On write failure** (no writable path, permissions): announce the failure and offer a custom path (validate writable; create parent dirs). Never lose the survivors silently.

### 4.2 Present a Concise Summary (not the full deliverable)

The full cards, rationale, downsides, and the rejection table live in the file. Do **not** reproduce them in the session — reprinting the whole deliverable as chat text defeats the rich format. Show a tight orientation instead:

- One line with counts and the path: e.g. `Wrote 7 ranked ideas (36 raw, 13 cut) across 5 axes -> <absolute path>`.
- A ranked list, **one line per survivor**: `1. <Title> . <axis> . Conf <High/Med/Low> . Cx <S/M/L>`.
- The top pick called out in a sentence.
- Any axis with zero survivors noted in one line (the deliberate gap).

This ranked list doubles as the index the user references when choosing an idea in Phase 5.

### 4.3 Present It

- **HTML (`format:html`):** best-effort open the file in the browser (`open` on macOS, `xdg-open` on Linux); always print the absolute path. Skip auto-open in headless / pipeline runs.
- **Markdown (default):** print the path.

## Phase 5: Next Steps — askme Handoff

Hand the survivors to `askme` to clarify intent on the chosen direction(s) before any planning. The deliverable already exists (Phase 4), so the handoff is purely *what next*.

**Stem:** "Your ideation is saved to `<path>`. What next?"

Offer three options:

1. **Open in browser** (if HTML) / **View markdown** (if markdown) — open or print the deliverable.
2. **Choose a direction** — pick a survivor and hand off to `askme` for intent-clarification before planning. Asks which idea first.
3. **Discuss or refine the ideas first** — stay here to think across the set before committing: adjust or interrogate one idea, compare several, or combine/merge them. Asks what you want to work on.
4. **Done — keep the file and stop.**

**Adjacent nudge:** "Don't want it kept? Say 'discard' and the agent deletes the file." Handled via free text; it is create-only and never deletes a resumed or pre-existing doc.

If the user already named what they want to work on inline (e.g., "brainstorm the table tool", "tighten the highlighter idea"), skip the follow-up that asks what to work on.

### 5.1 Discuss or Refine the Ideas First

This stays in ideate — no skill handoff. It is the "think across the set before committing" step. The orchestrator still holds the full grounding and generation context, so it can reason across every survivor.

1. **Establish what the user wants to work on and how.** Infer from their phrasing when given; otherwise ask one open question. The scope may be one idea, a subset, or the whole set.
2. **Route by intent:**
   - **Ask / compare** — answer in conversation, grounded in the ideas' bases and the Phase 1 grounding. **No file rewrite** unless the discussion yields a change the user wants captured.
   - **Adjust** — revise that idea's framing, scope, or basis as discussed, then **rewrite the saved file** so the deliverable stays current.
   - **Deepen** — extend an idea's analysis; capture into the file only if the user wants it kept.
   - **Combine / merge** — synthesize the named ideas into one: write a unified title, description, and basis that draws from each source idea. On a file rewrite, **replace the merged source entries with the single combined entry** — do not leave the originals alongside the merge — and renumber the ranked list.
3. **Rewrite only on change.** The file is rewritten only when idea content actually changes — Q&A and comparison alone do not churn it.
4. **Return to the Phase 5 menu.**

### 5.2 Done

The file is already written, so there is no save step.

- **Inside a git repo:** offer to commit only the ideation doc (do not create a branch, do not push; if the user declines, leave it uncommitted).
- **Non-repo file:** skip the commit offer.

Then narrate the path and end the session — do not return to the menu.

### 5.3 Discard (free text)

Only when the file was **created fresh this run**: delete it, confirm the deletion, and end. On a **resume** run (a pre-existing file was updated in place), do **not** delete — tell the user the existing doc at `<path>` remains and offer no destructive action. Discard is never a default; it fires only on an explicit request.

Do not delete the run's scratch directory (`/tmp/odin-ideate/<run-id>`) on completion — it holds the web research cache, checkpoint files, and grounding artifacts. OS handles eventual cleanup.

## Quality Bar

Before finishing, check:

- the idea set is grounded in the stated context
- **every surviving idea has an articulated basis** (`direct:`, `external:`, or `reasoned:`) that actually supports the claimed move — speculation dressed as ambition was rejected, with reasons
- load-bearing `direct:` bases were verified against the repo — by the generating agent's verification reads or the Phase 3 verifier — not taken on faith
- **every surviving idea passes the meeting-test**
- **no surviving idea replaces the subject** rather than operating on it
- when Phase 1.5 produced an axis list, the survivor set spreads across axes rather than clustering on one — and any axis with zero survivors is noted as a deliberate gap in the rejection summary, not silently absent
- the candidate list was generated before filtering
- the original many-ideas -> critique -> survivors mechanism was preserved
- every rejected idea has a reason
- survivors are materially better than a naive "give me ideas" list
- the deliverable was written automatically (Phase 4)
- the session showed a concise summary, not a reproduction of the full deliverable
- `ideate` ends at survivors plus the `askme` handoff, not at an implementation plan
