# Anchors

Eleven cross-domain anchors. Each carries a definition, 1-2 manifestations, and the failure mode it catches.

## Clarity

The artifact says what it means. The reader does not have to decode.

- Prose: the topic sentence carries the verdict; supporting sentences support it. No "let me first explain the context" preamble before the point.
- Code: the function name announces what the function does. Its body is what the name claims; nothing else.
- Decision: the recommendation is in the first line. The reasoning follows.

Failure mode: reader reaches the end and asks "so what?" The artifact buried the verdict, or never had one.

## Hierarchy

Important looks important. Secondary supports.

- Prose: the load-bearing claim is the largest sentence on the page (in weight, not in literal type size). Subordinate clauses are clearly subordinate.
- Code: the public API is what you see first; the helpers are below the fold; the private internals are not exposed at all.
- Design: the primary action is one weight up from secondary; tertiary is one weight down from secondary.

Failure mode: everything is bold; therefore nothing is. Equal-weight bullets in a row.

## Intent

Every choice is committed. Nothing reads as "I let the default decide."

- Prose: word choice is deliberate. "Decision" not "verdict" because the writer means decision; not because the thesaurus offered both.
- Code: the data structure was chosen for the access pattern, not because Map was the first thing imported.

Failure mode: the author cannot defend the choice when asked. The choice is the AI default.

## Coherence

Parts agree. Tension only where deliberately staged.

- Prose: tone holds across paragraphs. The voice in paragraph 3 is the voice in paragraph 1.
- Code: error-handling style is uniform across the module. One function does not throw while another returns Result with no signal of which.
- Decision: the framing in the intro matches the conclusion. The intro promised a decision; the conclusion delivers a decision.

Failure mode: the artifact reads as if assembled by a committee. Different sections, different voices.

## Restraint

Default posture: compress before adding. Cut before expanding.

- Prose: every sentence earns its place. Cut the framing paragraph; the reader can keep up.
- Code: the function does one thing. The module exposes the minimum API the caller needs.

Failure mode: the artifact is longer than its idea. Mass without density.
Also fails when: reduction without concentration. The artifact is small but emits no signal. Restraint without conviction reads as "I did not have a point of view."

## Generosity

Gives more than required at the right moment. Restraint default makes generosity visible.

- Prose: at the load-bearing moment, the artifact lingers. One extra sentence of clarification where ambiguity would cost the reader.
- Code: error messages name the offending value, not just the type. The exception that propagates carries enough context to debug from the trace alone.

Failure mode: terseness as default AND at the moment generosity would matter. The artifact is uniformly cold.

## Honesty
No decoration covering missing depth. No slop covering missing POV. Care finishes what no one sees; the inside is built to the standard of the outside.

- Prose: if the author has no point of view on a topic, the artifact says so. It does not perform certainty.
- Code: TODO comments name what is undone. Stub functions signal stub-ness; they do not pretend to be complete. The error path, the internal names, the log message are finished to the standard of the public API.
- Decision: trade-offs are stated, not buried. The cost of the recommendation is named.

Failure mode: confident-sounding hedges. "Best practice" with no citation. "Industry standard" doing the citation's job. **Also fails when**: unfinished interiors — polished where seen and abandoned where not. The error path no caller reads, the transition the skimmer glides over, the default no one sets.

## One strong moment

Exactly one commitment carries the lift. The rest supports.

- Prose: one paragraph is the load-bearing one. The others set it up or follow from it.
- Code: the module has one function that earns the import. The rest are scaffolding. One concern, one change; when something fails, only one thing must be reverted.
- Design: one element on the page is the moment. The rest holds the frame.

Failure mode: every section claims to be the moment, so nothing is. OR: nothing claims to be the moment, so the artifact has no reason to exist. **Also fails when**: mixed-concern bundles. The artifact bundles unrelated changes; reverting any one requires reverting all; the audit trail is unreadable because the unit of attention is "everything that happened that day."

## Invariants

The artifact names what must hold. Preconditions, postconditions, and invariants are explicit, not implicit.

- Code: preconditions are types, postconditions are tests, invariants are loop assertions. A defensive `if (x !== null)` after a constructor that cannot return null signals "I do not know what is invariant."
- Prose: the load-bearing claim is named in the topic sentence; supporting sentences derive from it. The argument's preconditions are stated, not assumed.
- Decision: the trade-off is stated as "X must hold; Y is paid in exchange", not "we picked X for reasons."

Failure mode: implicit invariants. The artifact relies on conditions it doesn't name; the conditions break in edge cases the author hadn't considered; the failure is mysterious because the invariant was never written down.

## Audience

The artifact enters through the reader's frame, not the author's. It adapts to the subject, never the subject to a protocol.

- Prose: begin at the reader's vocabulary and assumptions, then frame the claim so it lands without a change of voice.
- Code: shape the API around the caller's task and mental model, not the implementation's categories.
- Decision: start from the stakeholder's constraints and values, then frame the recommendation in terms they can use.

Failure mode: audience-blind or formulaic. The artifact assumes the subject will adapt to the author's frame, or deploys mechanical indirection without reading what this subject presents. The method is exposed or breaks when the audience changes.

## Emptiness

The artifact leaves space the user completes. The least assertion; withdrawal of signal, not concentration of it.

- Prose: the claim is stated once and left open; the reader draws the implication instead of being told it thrice.
- Code: the interface is small and unopinionated; the caller composes it, the library does not pre-decide their use.
- Design: whitespace is a held space the eye rests in, not a gap waiting to be filled.

Failure mode: space filled with the author's assertion. Every gap pre-answered, every affordance labelled, every meaning fixed. The vessel is already full, so nothing can be poured in.

## Using the anchors

Audit mode: walk all eleven. Anchor mode: hold all eleven as imperatives. The eleven cover the same artifact from eleven angles; they do not score independently. Conflicts surface; they do not auto-resolve.
