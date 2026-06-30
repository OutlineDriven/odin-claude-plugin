# Scoping Synthesis

**Scoping synthesis is not the plan doc.** The scoping synthesis is the scope/decisions checkpoint that plan-write (Phase 5.2) consumes as input. It surfaces decisions the agent CAN make at synthesis time: scope-level (does this plan cover the full scope or narrow to a subset?), posture (extend existing pattern vs. introduce new abstraction), test approach. It does NOT surface decisions plan-write produces: PR count, commit/branch sequencing, effort or time estimates, Implementation Unit lists, exact file paths, test command recipes. If the synthesis claims any of those, it has leaked plan-write thinking and must be re-cut to scope-decisions only. Even when the agent has formed plan-write opinions earlier in the session, the synthesis stays at scope altitude -- the user is being asked to affirm scope, not to rubber-stamp implementation.

**Two-stage shape: internal draft, then chat-time synthesis.** The synthesis is composed in two stages. Stage 1 is an internal three-bucket draft (Stated / Inferred / Out of scope) the agent uses to think comprehensively about scope. Stage 2 is the compressed chat-time output: a tier-shaped summary plus "Call outs" (zero or more, capped by plan depth -- see the cap table under "How many call-outs are right?") -- the specific forks where the user might redirect. The user only sees stage 2. The internal draft still informs the plan body via the doc-shape routing below; it just doesn't reach the user verbatim. This split exists because the comprehensive audit shape produced too much detail for the user to weigh in on, even when the granularity rules were followed.

**Three-bucket structure is the internal draft, not the user-facing artifact.** It does its scope-thinking job during stage 1 and dissolves when Phase 5.2 writes the plan: Stated content informs the plan's Requirements, Inferred content informs Key Technical Decisions / Implementation Units (normal interactive mode) or Assumptions (non-interactive mode, or a skip-confirmation run), Out-of-scope content informs Scope Boundaries. The plan has no parallel `## Synthesis` section -- only the stage-2 summary embeds, under the plan's Summary. See "Doc shape after confirmation" below for the exact routing and section nesting.

There are two variants -- they share structure but differ in timing and content focus:

- **Solo variant** (Phase 0.7): fires after Phase 0.4 bootstrap and Phase 0.6 depth classification, before Phase 1 research begins. Catches scope misinterpretation before sub-agent dispatch is spent. Full breadth -- problem frame, intended behavior, success criteria, in/out scope.
- **Upstream-sourced variant** (Phase 5.1.5): fires after Phase 1 research, before Phase 5.2 plan-write. Focuses on plan-time decisions (which files/modules to touch, which patterns extended vs. introduced new, test scope, refactor scope). Upstream-validated WHAT is assumed and not re-stated.

Both variants share the two-stage shape, the keep test for call-outs, soft-cut behavior, and the doc-shape routing. In non-interactive (headless) mode, both compose the internal draft and skip stage 2 -- the user-facing compression is moot when there is no synchronous user. The internal draft dissolves into the plan body the same way, with Inferred bets routing to an Assumptions section. See "Headless mode (shared)" below for the full routing.

---

## Stage 1: internal three-bucket draft (shared)

The internal draft is structured in three labeled buckets. Items may appear in two buckets when meaningfully both -- flag the inclusion-then-exclusion as Inferred so the reasoning is captured.

- **Stated** -- what the user said directly (in the original prompt, prior conversation, dialogue answers, or the upstream doc when present). Items here have explicit user-language anchors.
- **Inferred** -- what the agent assumed to fill gaps. Scope boundaries the user never explicitly named, success criteria extrapolated from intent, technical assumptions made because the brief interview didn't probe them. The Inferred list is the most actionable bucket -- items here are the agent's bets that the user can correct.
- **Out of scope** -- deliberately excluded items. Adjacent work the agent considered but decided not to include, refactors, nice-to-haves, future-work items.

This draft is internal. Do not paste it verbatim into chat. Compose it as a thinking step, then derive stage 2 from it.

---

## Stage 2: chat-time scoping synthesis

Stage 2 is what the user actually sees. The shape differs between variants because they serve different purposes -- upstream-sourced plans inherit a validated WHAT and surface plan-specific HOW; solo plans have no upstream and the synthesis is the WHAT.

### Upstream-sourced shape (Phase 5.1.5)

Two content sections plus call-outs:

1. **Upstream-scope restatement** (1-2 sentences, prose). Restates the upstream scope as orientation. The user wrote this content, but the synthesis may be read days later or in parallel with other plans -- the restatement is the topic anchor that says "this is the artifact we're planning against." Stay in the upstream's own vocabulary. Do NOT enumerate Implementation Units, restate constraints back at the user, or list acceptance examples.

2. **Plan-specific scoping decisions** (prose, or bullets when multi-faceted). Scope-level commitments the agent made that the upstream did not: does this plan cover the full scope or narrow to a subset; are adjacent refactors pulled in or held out; what test scope at scenario level. Each item must pass the **affirmability test** -- the user can affirm or redirect it without reading code. This section is scope claims at affirm-or-redirect level, NOT a description of where the implementation reaches, NOT PR count or commit sequencing, NOT Implementation Unit lists, NOT exact file paths or test commands -- those are all plan-write outputs the synthesis cannot honestly claim. If the plan covers the full scope with no narrowing, expansions, or adjacent work, this section stays short ("This plan covers the full scope; test scope is X").

3. **Call outs** (zero or more, capped by plan depth -- see "How many call-outs are right?" below). Each a real fork where the user's input materially changes the plan. Omit the "Call outs:" header entirely when zero forks survived the keep test.

### Solo shape (Phase 0.7)

No upstream document; the synthesis itself is the scope claim:

1. **Scope claim** (prose, or bullets when multi-faceted). What the agent is planning to build, at affirm-or-redirect level -- names what's in and what's out. NOT an enumeration of Implementation Units the plan will contain.

2. **Call outs** (zero or more, capped by plan depth). Same as upstream-sourced.

### Shape budgets

Tier-aware budgets are **ceilings, not targets**. Less is correct when there isn't more to say -- filling the budget produces noise.

| Plan depth | Restatement (upstream-sourced) | Plan-specific scoping (upstream-sourced) / Scope claim (solo) |
|---|---|---|
| Lightweight | 1 sentence | 1-3 lines prose |
| Standard | 1-2 sentences | up to 3-5 lines or 2-4 bullets |
| Deep | 1-2 sentences | up to 4-6 lines or 3-6 bullets |

Form within each section (prose, bullets, mix) follows whatever communicates best.

### Shared rules

- **No "Stated" bucket in chat** (the orientation or scope-claim covers it).
- **No "Out of scope" bucket as a separate list** -- fold a non-obvious exclusion into a call-out when it survives the keep test, otherwise drop it.
- **Source-document vocabulary.** When an upstream doc exists, use its terms. Don't invent agent-coded shorthand. When referencing acceptance examples, requirements, or flows, name them in plain terms ("the install-prompt acceptance case") -- never use bare IDs.

- **Pre-emit mechanical checks.** Before emitting the synthesis, scan the output:
  - **Bare ID references** (`AE\d+`, `R\d+`, `F\d+`, `A\d+`, `U\d+`) -> replace with plain names. Mixed forms (case named AND ID cited) still violate the rule because the ID adds noise without information.
  - **File paths** (`path/like.md`, `path/like.py`, etc.) -> cut unless the path IS the topic of an explicit fork in the call-outs. Allowed: "cleanup hook in the existing archive step vs. a new dedicated phase" (where the path is implicit in the decision). Forbidden: paths listed to demonstrate completeness, preview Implementation Units, or describe where the implementation reaches. The synthesis names *what* the plan targets, not *where* the code lives.

### The keep test for each call-out

Before keeping a candidate call-out from the internal draft, run the **affirmability test**: would the user need to look at code to evaluate this? If yes, it is plan-body content -- cut. If no, apply the keep test -- one of the following must be true:

- **Real fork**: another reasonable agent might choose differently on this dimension (extend pattern X vs. introduce abstraction Y; scan source A vs. source B; etc.)
- **Non-obvious behavioral choice**: a default the agent picked that the user would not see by reading the summary alone, but that materially affects what the plan does
- **Non-obvious exclusion**: an item was deliberately excluded that the user might want to add back in
- **Cheap-now-expensive-later correction**: a bet the user is well-placed to redirect now that would be expensive to undo after research or plan-write

Cut anything else, including:

- Mechanical items where there is no real alternative (e.g., "no new dependencies" when the work clearly does not need any)
- Implementation choices that will be settled during the work (e.g., regex precision tuned during impl)
- Items already implied by the summary

### The detail test (per call-out and per summary bullet)

After the keep test, every surviving item runs the **detail test**: 1-2 lines max, conversational not documentary. A call-out or summary bullet that runs to 4+ lines of dense prose is naming an implementation consequence rather than a decision -- re-cut at higher abstraction.

The keep test addresses *which* items survive. The detail test addresses *how much* each surviving item says. Without it, the count cap is gameable: an agent can hit "3 call-outs" while each call-out is a 6-line paragraph, and the synthesis reads as a doc preview instead of a checkpoint.

### How many call-outs are right?

The cap is heuristic, not law. The real discipline is the keep test on each candidate. Typical bounds by plan depth:

| Plan depth | Typical | Cap |
|---|---|---|
| Lightweight | 0-2 | 3 |
| Standard | 1-3 | 4 |
| Deep | 2-5 | 6 |

**If the stage-2 pass exceeds the tier cap, OR any call-out or summary bullet runs to 4+ lines of dense prose, the synthesis is misshapen -- do not raise the cap or accept the bloat, re-cut at a higher level of abstraction.** Almost always, 2-3 of those call-outs are sub-decisions of one larger fork (file path, flag name, JSON key behavior, and dependency choice are usually four facets of one "how to extend the existing scaffold" decision, not four independent forks). Collapse related call-outs into a single decision named at the level the user actually weighs in on.

A useful test: read the call-outs aloud. If two or more sound like "and also" extensions of the same idea, they belong as one.

### Anti-patterns in call-outs

Each anti-pattern below produces a call-out that fails the affirmability test. If a candidate call-out matches one of these, it is plan-body content -- cut, do not rephrase.

- Names a file path or module name (`internal/artifacts/pii.go`)
- Names a flag, env var, or exact env value (`--accept-redaction-list=<finding-id,...>`)
- Specifies a JSON shape, response format, or exact data structure
- Names HTTP status codes, event names, or exact error wording
- Describes implementation flow ("first X, then Y, then Z")
- Names exact method signatures, call graphs, or SQL syntax
- States a mechanical choice with no real alternative ("uses stdlib regexp")

---

## When to skip the blocking confirmation

The auto-proceed path (announce without waiting for user confirmation) fires only when **plan depth is Lightweight AND zero call-outs survive the keep test**. For Standard or Deep plans, always fire the confirmation gate even when zero call-outs survive -- substance earns the checkpoint, not interaction history.

When auto-proceed applies (Lightweight + zero call-outs), emit a one-line announcement and continue:

```
Planning: [1-3 line summary]

No open decisions to weigh in on -- proceeding to [research / plan-write]. Interrupt if I have the scope wrong.
```

The announcement is mandatory when skipping -- silent proceeding is not allowed.

For Standard/Deep with zero call-outs, the confirmation template still fires; the "Call outs:" header is simply omitted. The user gets the summary plus the explicit confirmation request.

---

## Synthesis structural discipline (shared)

Both variants share these structural rules. They address failure modes where the synthesis becomes a plan-write preview instead of a scope checkpoint.

**Summary leads, call-outs follow** -- not the reverse, and no separate framing block above.

**Anti-pattern: synthesis as plan-pitch.** Plan-body content -- file paths, code shapes, sentinel strings, exact error messages, "Recommendation" / "Behavior when X" / "Why this shape" rationale -- does not belong in chat output regardless of where it appears: not in a block above the call-outs, not inside the summary, and not nested in a call-out's commentary or sub-bullets.

**Anti-pattern: numerical attestation.** "All nine requirements covered," "all three flows in scope," counts of files or test scenarios. These are the agent showing its work or attesting completeness, not naming scope decisions. Cut the numbers; keep the scope claim.

**A revision is not a confirmation.** After any user revision (even a trivially-understood swap), integrate the change, re-present the revised stage 2 with the change reflected, and wait for explicit confirmation before writing the plan. The loop is:

1. Present stage 2 -> user responds
2. User confirms -> write the plan
3. User revises -> integrate, re-present revised stage 2, return to step 1

Plan-write (Phase 5.2) fires only on explicit confirm or after the soft-cut blocking question's "proceed" option. Never write immediately after a revision, even when the revision is small enough that the agent feels it understood -- the confirmation step is what makes the synthesis **confirmed** rather than "agent's last proposal."

---

## Granularity: name the decision; don't expand it (shared)

Each call-out should be affirmable or rejectable by the user **without reading code**. Name the decision at the granularity that lets the user say "yes" or "I want X instead." Anything more specific is plan-body content.

**Allowed** (when these ARE the decisions being made):
- File / module names -- "skip filter in the matcher" when "where to put it" is the choice
- Pattern names -- "extends the existing event-skip pattern" when "extend vs. introduce" is the choice
- Column / table names -- "user-TZ" or "destination-calendar TZ" when "which source" is the choice
- Approach posture -- "DB-side query with Google-side fallback" when "which strategy" is the choice

**Not allowed** (always plan-body, regardless of variant):
- Line numbers (`route.ts:249-255`)
- Exact method signatures, call graphs, or implementation flow
- Exact JSON / response shapes
- HTTP status codes
- Exact event / activity-log / type names
- Exact wording of error messages or UI labels
- SQL syntax or query bodies

---

## Soft-cut on circularity (shared)

Track which call-outs the user touched per round. The soft-cut blocking question fires **only when the same call-out is revised twice** (or a third-round revision targets a call-out already revised in round two). New-call-out revisions across rounds proceed without limit.

**Identity across rounds is by decision dimension, not surface wording.** A revision may cause stage 2 to re-derive -- the same underlying fork can come back rephrased, merged with another call-out, or split into two. "Same call-out" means the same decision being made.

When the soft-cut fires, use the platform's blocking question tool with two options:

- `Proceed and continue to [research / plan-write]`
- `Hold off -- keep discussing before continuing`

Fall back to numbered list in chat only when no blocking tool exists or the call errors. Never silently skip.

---

## Headless mode (shared)

When the skill is invoked from an automated workflow or any non-interactive context, the skill runs in headless mode (no synchronous user).

**Stage 2 is moot in headless mode.** Compose the internal draft (stage 1) as usual, but skip the chat-time compression -- there is no synchronous user to confirm to, no call-outs to derive, no auto-proceed announcement. Route the internal draft directly into the plan body via the doc-shape table below.

**Per-variant behavior:**

- **Solo variant (Phase 0.7)**: fires *before* research. Compose the internal draft and continue to Phase 1 research as normal. Inferred content is held until plan-write (Phase 5.2), where it routes to Assumptions.
- **Upstream-sourced variant (Phase 5.1.5)**: fires *after* research, before plan-write. Compose the internal draft and proceed to Phase 5.2 plan-write. Inferred content routes to Assumptions.

**Shared behavior across both variants:**

- **No user prompt; no stage 2; no auto-proceed announcement.** All three are moot.
- **Route internal-draft content with mode-aware shape:**
  - **Stated** content -> Requirements (user-stated constraints, traced to origin's R-IDs when present)
  - **Out-of-scope** content -> Scope Boundaries
  - **Inferred** content -> Assumptions -- explicitly labeled as un-validated agent bets. Do NOT route Inferred items into Key Technical Decisions or Implementation Units; that would make un-validated bets indistinguishable from user-confirmed decisions.

The Assumptions section appears in non-interactive plans and in interactive plans where the user opted into skip-confirmation -- both cases proceed without confirming Inferred bets, so those bets must stay visibly labeled. A normal interactive plan doesn't need it (Inferred bets either get user-corrected via call-outs and become Key Technical Decisions, are revised away, or were judged not-fork material by the keep test and dissolved into Implementation Units silently).

---

## Self-redirect (shared)

If the user response indicates they're in the wrong skill or want a different workflow, stop and suggest the alternative. Don't push back or argue -- the user's redirect signal is the deliberate choice.

---

## Doc shape after confirmation

After user confirmation (or after the soft-cut decision proceeds), Phase 5.2 writes the plan doc. The internal draft does NOT carry into the plan as a `## Synthesis` section. Only the stage-2 summary embeds, under the plan's Summary. Internal-draft content dissolves into the plan's sections.

| Internal-draft element | Where it goes in the plan |
|---|---|
| Summary (stage 2) | Summary (1-3 lines prose, forward-looking) -- rewrite to plan convention if the chat-time summary used bullets. Solo variant: scope being targeted. Upstream-sourced: implementation approach |
| Stated bullets | Requirements (R-IDs) and where relevant Problem Frame for narrative context |
| Inferred bullets | Key Technical Decisions (with rationale) and Implementation Units when the bet drives a structural choice. In non-interactive mode or a skip-confirmation run, route to Assumptions instead -- both proceed without confirming the bets, so they must stay labeled; see Headless mode above. |
| Out-of-scope bullets | Scope Boundaries |

No italic capture-context note. It would leak engineering process into an artifact whose readers do not need that signal.

The plan's Summary and Problem Frame must serve distinct purposes: Summary answers "what is this plan proposing?" (forward-looking, 1-3 lines); Problem Frame answers "why does this proposal exist?" (backward-looking, paragraphs). Don't restate the proposal in Problem Frame; don't pad Summary with situational context.

---

## What does NOT belong in the synthesis

- Implementation code (no imports, exact method signatures, framework-specific syntax, JSON shapes, exact error message wording) -- in chat output OR in the internal draft
- Re-statement of the entire upstream doc -- the synthesis is plan-perspective, not a copy
- Defensive what-ifs and hedges -- if a concern is real, state it as Inferred (internal); if speculation, drop it
- The internal three-bucket draft pasted into chat as a verbatim user-facing artifact -- compose internally, derive call-outs, present compressed
- Open questions surfaced outside the buckets/call-outs -- by synthesis time, every scope-shaping question must be in **Stated** (internal -- asked and answered earlier), **Inferred** (internal -- agent's bet for correction, surfaces as a call-out if it survives the keep test), or **Out** (internal -- deliberately excluded). There is no fourth status
- Floating questions adjacent to stage 2 -- if a question genuinely cannot be defaulted, pause synthesis and resolve it before presenting. Integrate the answer, then present stage 2. Never present stage 2 with adjacent floating questions
