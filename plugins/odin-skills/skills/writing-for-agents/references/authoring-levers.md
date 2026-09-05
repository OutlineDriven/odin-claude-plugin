# Authoring levers

The theory behind the procedure in `SKILL.md`. Each lever names one property that decides whether
an agent takes the same process every run. Load this file when a step's one-line claim is not
enough to act on.

## Context pointers

A context pointer is a reference held in the agent's context that names out-of-context material and
encodes the condition for reaching it. A skill's description is one; a line in AGENTS.md naming a
doc is the same object.

The pointer's wording, not its target, decides when the agent reaches the material, and how
reliably. A must-have target behind a weakly worded pointer is a variance bug: sharpen the wording
first, and inline the material only if sharpening fails.

A pointer does two jobs: state what the material is, and list the branches that should trigger
reaching it. Every word of an always-loaded pointer costs on every turn, so it earns harder pruning
than the body. Front-load the leading word. One trigger per branch. Collapse synonyms that rename a
single branch. Cut identity the body already carries.

## The two loads

Every document and pointer spends one of two budgets.

Context load is the cost of always-loaded material on the agent's window: an AGENTS.md line, a
skill description, anything sitting in context every turn, spending tokens and attention whether or
not it fires.

Cognitive load is the cost on the human: which documents exist, and when to reach for each. The
human is the index. Spend it where human judgement matters, remove it where it does not.

Material reached only through a pointer escapes context load at the price of the pointer's own
line. Material with no pointer at all rides entirely on cognitive load.

## The information hierarchy

A document is built from two content types that mix freely: steps, the ordered actions the agent
performs, and reference, the definitions, rules, and facts consulted on demand.

The core decision is where each piece sits on the ladder. An in-file step is the primary tier: what
the agent does, in order. An in-file reference is consulted on demand. A disclosed reference is
pushed out into a separate file, reached by a context pointer, and loaded only when that pointer
fires.

Push too little down and the top bloats. Push too much and material the agent actually needs gets
hidden.

## Progressive disclosure and co-location

Progressive disclosure is the move down the ladder, out of the main file and behind a pointer, so
the top stays legible. Branching is the cleanest disclosure test: inline what every branch needs,
push behind a pointer what only some branches reach. When a document has steps, in-file reference
that should be disclosed buries them and turns attending to them into a coin-flip.

Co-location keeps a concept's definition, rules, and caveats under one heading rather than
scattered.

Sprawl is the failure mode: a document too long, even when every line is live and unique.
The cure is the ladder.

## Completion criteria

Every step ends on a completion criterion: the condition that tells the agent the work is done.

Clarity asks whether the agent can tell done from not-done. A vague bound invites premature
completion, because the visible post-completion steps supply the pull and the criterion's clarity is
the only resistance. Defend in order: sharpen the bound first, and only if it is irreducibly fuzzy
and the rush is observed, split the sequence across a real context boundary such as a hand-off or a
subagent dispatch. An inline call leaves the later steps in context and does not help.

Demand asks how much the criterion requires. "Every modified model accounted for" forces thorough
work where "produce a change list" does not. Demand drives legwork, the digging the agent does
within the work, and it is the lever most worth pulling.

## When to split

Splitting one document into two spends one of the two loads, so split only when the cut earns it.

Split by sequence where a run of steps lets the post-completion steps tempt the agent to rush the
one in front of it. Beware the reverse: merging sequences exposes each step's later steps to what
follows, which invites the same premature completion.

Split by invocation when a distinct leading word should trigger the material on its own, when a
trigger word is actually used in prompts, or when another skill must reach it. The context load for
the new always-loaded description is paid regardless, so that independent reach has to be worth it.

## Leading words

A leading word is a compact concept already living in the model's pretraining that the agent thinks
with while running the document. Repeated as a token, never as a sentence, it accumulates a
distributed definition and anchors a whole region of behaviour in the fewest tokens.

Reach for an existing word first. Coining a new one works if the definition is clear, but a made-up
word recruits no priors.

It anchors twice. In the body it anchors execution: the agent reaches for the same behaviour every
time the word appears. In a pointer it anchors invocation: when the same word lives in the prompts,
the docs, and the codebase, the agent links that shared language to the material and reaches it
more reliably.

## Pruning

Keep each meaning in a single source of truth, one authoritative place, so changing the behaviour
is a one-place edit. Duplication, the same meaning in more than one place, costs maintenance and
tokens.

The environment is a source of truth too: package.json scripts, config files, the directory layout,
`--help` output. A document that restates one is a cache, a copy of a lookup, earning its load only
when the lookup is expensive. Cache what the agent cannot find by looking: the unwritten
convention, the reason behind a choice, the gotcha no config confesses.

Check every line for relevance. Does it still bear on what the document does? Shorter documents are
easier to keep relevant.

Without a pruning discipline the default fate is sediment: stale layers accumulated because adding
felt safe and removing felt risky. Core down through them to find what is still live, and delete
sentences that fail the no-op test.
