# Diversity

The model defaults toward centroid output. Diversity is engineered, not wished. This file documents six techniques for engineering it; combine them — none alone is sufficient. Skipping any one technique re-anchors the candidate set to the centroid; the techniques compound, they do not substitute.

## §1. Verbalized Sampling

Source: arXiv 2510.01171 ("Verbalized Sampling Yields More Diverse and Higher-Quality LLM Generations").

Algorithm:

1. Prompt the model to generate N candidates *and* their probabilities ("rank these from most to least likely"). Use N = 4-6; below 4 the centroid swallows the set, above 6 the tail collapses into restatements.
2. The model verbalizes its own distribution; this de-anchors from the centroid because the model now sees its own bias as text. The act of naming the bias is what breaks it.
3. Drop the highest-ranked candidate (the centroid / slop direction). Retain the remaining K = N − 1 lower-probability candidates as the working set.
4. Use the surviving K as parallel directions; if two converge, re-sample with sharpened constraints (e.g., add a forbidden-token list or pin a different persona per slot).
5. Empirical: 1.6-2.1× diversity gain vs naive temperature-up on creative-writing benchmarks (arXiv 2510.01171). Inference-only for design-direction prompts: the failure mode (RLHF anchoring) is the same, but the gain has not been measured on design surfaces.

Concrete VS prompt template for design context:

```
Generate 4 distinct visual directions for <surface>.
For each, name 1-2 taste anchors and rate the probability you would have generated this direction WITHOUT this prompt (0.0 to 1.0).
Rank by probability descending. The lowest-probability direction is often the most useful.
```

The lowest-probability direction is often the most useful because the RLHF-favored (highest-probability) direction is the slop direction. Treat probability inversely: high probability == high suspicion, drop first. The verbalized probability is not calibrated, but the *ordering* is informative — that is what the technique exploits.

Operating notes:

- If all probabilities cluster within ~0.1 of each other, the model is hedging; re-prompt with explicit instruction to spread the distribution.
- If a candidate is rated below 0.05 it is usually noise, not signal — verify it has a defensible taste anchor before keeping it.
- Re-running VS with the dropped centroid named as a forbidden direction tightens the surviving set on the second pass.
- VS works on prompts that ask for one direction too — the prompt structure (rank-with-probabilities) is the lever, not the cardinality of the request. A single-direction surface still benefits from naming the centroid before committing.

Worked example. Surface: a settings panel for a developer tool. VS returns:

- 0.62 — "clean SaaS card grid, blue primary, soft shadows" (centroid; drop)
- 0.21 — "Linear-style monochrome list, single teal accent, no shadows"
- 0.10 — "neo-brutalist hard borders, mono labels, system serif"
- 0.07 — "TUI-port: high-density rows, no chrome, semantic role colors"

The 0.62 is dropped. The remaining three pull in genuinely opposing directions — restraint, anti-polish, and density. That is the working set actor-critic operates on.

## §2. Actor-critic per candidate

Mirrors `odin:askme` exhaustive mode. After VS produces N candidates, for EACH candidate explicitly record:

- **Weakness** — what about this direction is fragile? (e.g., "neo-brutalism on a B2B dashboard fails the trust register")
- **Contradiction** — what about this direction conflicts with the surface's stated goal? (e.g., "post-minimalism on a marketing landing page underspecs hierarchy")
- **Oversight** — what does this direction miss? (e.g., "Material 3 default ignores the brand's existing color register")

The candidate survives only if all three are answerable AND the weakness is acceptable for the surface. A direction with no answerable weakness is suspect — either the model is shielding the centroid, or the candidate has not been pushed hard enough. Run the critique a second time if all three axes return "none."

Skipping actor-critic produces directions that look diverse on paper but collapse under one round of critique. The critique is the load-bearing step; VS without it is decoration. Critique should be written in the same pass as the candidate, not deferred — deferred critique tends to rationalize rather than test.

A candidate that survives actor-critic with all three axes named and acceptable is *load-bearing*: the team can defend it, iterate on it, or kill it on principle. A candidate without named weaknesses cannot be defended — only repeated.

Critique-quality note: if every candidate's weakness reads identically (e.g., "may not appeal to all users"), the critique pass is producing slop too. Restart with sharper, surface-specific anchors.

Worked example. Continuing the settings panel surface from §1, the 0.10 neo-brutalist candidate:

- **Weakness** — "developer-tool users tolerate brutalism, but enterprise admins reading the same surface will not; the trust register fails for half the audience"
- **Contradiction** — "settings panels reward scannability; brutalism's hard borders fragment the row rhythm needed for fast scanning"
- **Oversight** — "ignores accessibility — pure-mono labels lose semantic state color (error / warning / success), which the surface relies on"

Result: weakness is unacceptable for the enterprise half of the audience. Drop the candidate. The 0.21 Linear-style and 0.07 TUI-port survive; both have answerable weaknesses that the surface can carry.

## §3. Persona injection

Anchor each VS candidate to a named persona / studio / aesthetic. The persona forces a register the centroid model would not pick:

- **Linear designer** — restraint + density-driven, monochrome with one accent
- **Stripe designer** — editorial type accent on transactional UI, warm neutrals
- **Are.na designer** — coarse, archival, anti-platform, system-font-by-default
- **Read.cv designer** — neo-brutalism, anti-LinkedIn, hard borders, mono accent
- **Rosé Pine maintainer** — semantic-role TUI palette, muted but high-signal
- **Brutalist** — raw, deliberately unfinished, anti-grid, exposed structure
- **Swiss/International Style** — grid-driven, sans-serif, asymmetric balance
- **Editorial print** — serif body, generous leading, columnar discipline

Pick personas that pull in opposite directions. If three of the four candidates are anchored on similar personas (e.g., Linear + Stripe + Vercel — all "clean SaaS"), the diversity is illusory. Cross-check persona choices against the taste anchors named in `references/anti-slop.md` §1; the persona's anchor must not collapse onto the default centroid. Personas are levers, not labels — the candidate's tokens, type, and density must actually shift to match. A "Linear" candidate that ships purple gradients is not a Linear candidate; it is the centroid wearing a label.

Persona-pair heuristic: if two candidates' personas could plausibly co-exist in the same studio's portfolio, they are too close. Linear and Vercel: too close. Linear and Are.na: opposed. Stripe and Brutalist: opposed. Force opposition at the persona-selection step, not after.

Avoid rotating through the same persona list across sessions; the personas listed above are starting points, not a fixed roster. New personas should be drafted from current studios the surface's audience already trusts — the persona's authority is what makes its register stick.

## §4. Two-pass temperature

- **Direction-setting pass: temperature 1.2.** The pass that produces the candidate directions runs hotter than default. Higher temperature explores away from centroid, but only AFTER VS structure has surfaced the centroid as an explicit, named candidate. Without VS, temperature 1.2 just produces louder slop.
- **Execution pass: temperature 0.7.** The pass that derives tokens, types, and code from the picked direction runs cooler than default. Tighter execution prevents drift away from the committed direction; the direction is fixed, the artifacts must be consistent with it.

Two-pass temperature is the inverse of "temperature 1.0 throughout" (which under-diversifies the direction pass and over-rigidifies the execution pass). The two passes have opposite goals — exploration vs. fidelity — and should not share a temperature. If the runtime exposes only a single temperature, prefer 0.9 as a compromise but expect both passes to underperform their two-pass equivalents.

Temperature is a coarse lever; VS and persona injection do most of the work. Treat the two-pass setting as a multiplier, not a substitute, for the structural techniques.

Edge cases. Temperature 1.5+ on the direction pass crosses from exploration into incoherence — candidates start violating their own taste anchors. Temperature below 0.5 on the execution pass starts producing verbatim restatements of the prompt; the artifacts lose room to breathe. Stay inside 1.0-1.3 for direction and 0.5-0.8 for execution.

## §5. "Most unlikely good answer" prompt pattern

Standard prompt: "What is a good direction for X?" — model returns the centroid (slop).

Reframed prompt: "What is the most *unlikely* good direction for X — one that a typical AI assistant would not propose first?" — model is forced to search away from the centroid because the prompt has named it as undesirable.

This pairs with VS: VS makes the centroid visible as a ranked candidate; this pattern explicitly devalues it. Use both for stronger displacement. The "good" qualifier is load-bearing — without it, the unlikely answer collapses into noise rather than displaced taste. "Unlikely AND defensible" is the operative shape; either word alone is insufficient. The pattern fails if the surface is so constrained that only one direction is defensible — in that case, drop diversity and commit. See `references/soul.md` for the principle that conviction beats spurious choice.

Worked reframe. Standard prompt → "high-density rows, mono labels, semantic role color." Reframed prompt → "Swiss-grid editorial layout with serif column heads on a settings surface — unconventional, but the surface is read in long sessions and a serif column head signals section depth in a way sans does not." The reframed answer is more defensible *because* it had to argue for itself; the standard answer arrived without friction.

Pair this pattern with VS only after VS has produced a working set; running it first tends to produce contrarian answers that are unlikely AND undefensible.

## §6. Anti-patterns

Five anti-patterns the model must NOT use as substitutes for the techniques above:

1. **Naive temperature-up** — temp=1.5 without VS structure produces noise, not diversity. The "candidates" trade slop for incoherence; the centroid is still the modal output, just blurrier.
2. **"Be creative" / "be original" directives** — under RLHF, "creative" maps to the same centroid the model already produces; the directive is a no-op or worse (intensifies cliché). The phrase has been trained into a synonym for "produce the expected output."
3. **Single-shot aggregation** — generating one direction with "include several aesthetics" produces a Frankenstein direction (the multi-paradigm mash from `references/anti-slop.md` §2 row 4), not diversity. Diversity is across candidates, not within one.
4. **RLHF over-alignment to purple** — every "creative" prompt that does not explicitly forbid purple gets purple; treat purple as default-banned, second-order forbid Space Grotesk + Geist (ban-and-also-ban from `references/anti-slop.md` §3 technique #1). Bans are part of the diversity stack — they prune the centroid before VS runs.
5. **Skipping actor-critic** — VS with no critique surfaces directions that look distinct on paper but converge after one round of pressure-testing. The critique is what makes the diversity load-bearing.

Each anti-pattern shares a common shape: it substitutes a single intervention for the stack. Diversity is not a setting to flip; it is a composition of structural prompt design (VS, personas), behavioral discipline (actor-critic), and runtime configuration (two-pass temperature). Removing any layer and amplifying another does not work; the layers address different failure modes.

The six techniques are a stack, not a menu. VS surfaces the centroid as a ranked candidate; the centroid is dropped; personas anchor each survivor to an opposing register; actor-critic stress-tests each one; two-pass temperature splits exploration from fidelity; the "most unlikely good" reframe re-runs displacement when the survivors still cluster. Apply all six; the diversity is in the composition, not any single step.
