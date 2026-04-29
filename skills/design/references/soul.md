# soul.md — design philosophy

Why good design is good. Anti-slop catalogues what to avoid; this file prescribes what to chase. Distinct from paradigms (structural shape) and diversity (variation recipe).

## 1. Why design matters

Design is care, communication, and restraint — not decoration. The skill's posture rests here: a surface that has been *thought about* is legible at a glance; a surface that has been *decorated* requires the user to do the thinking the designer did not. Restraint is what allows information to surface.

Anti-example: a SaaS landing page with a gradient on every section background, an entrance animation on every card, and three competing CTAs styled identically. The user cannot tell what the product *does* because nothing is foregrounded — every element shouts at the same volume, so none of them carry. The page mistakes effort for craft. Removing the gradients, cutting two of the three CTAs, and giving the remaining one a single accent would surface the proposition the team is paid to communicate.

The page above is not unaesthetic. It is, more precisely, *unmediated* — the team shipped every idea instead of editing the ideas down to the one the user needs. Editing is the design act. Decoration without intent is noise. Care expressed at scale is design.

The reverse failure exists too: a surface so afraid of decoration that it ships a sterile grid of grey type and calls it minimalism. That is not restraint; it is abdication. Restraint without conviction reads as "I did not have a point of view". The posture this file argues for is *conviction with restraint* — one intentional moment, defended.

## 1.5 Balance — conviction without maximalism

The skill's posture is "don't hold back" with conviction, not "don't hold back" with volume. These are different things, and the model's RLHF training conflates them.

Two failure modes recur in AI-generated UI:

- **Side A — timid AI-generic.** Default Tailwind palette, Inter alone, centered hero plus 3-col grid, system-ui as the type system. The model picks the path of least friction; the surface reads as preset.
- **Side B — decorative overkill.** Sprites on every empty pixel, gradient backgrounds on every section, animation on every entrance, multi-paradigm mash. The model overcompensates for slop fear; the surface reads as panic.

Both come from the same root: fear of commitment. Side A doesn't pick a direction; Side B picks all directions. The cure for both is the same — pick one direction, commit to it, and let restraint amplify the lift.

Balance is the practice; conviction is the posture. The "ONE intentional moment per surface" rule from §4 is what conviction-with-balance looks like in practice — every other element earns its weight by NOT being the moment.

## 1.6 Theme is a decision, not a default

Dark vs. light is never a default. Not dark "because tools look cool dark." Not light "to be safe."

Before choosing, write one sentence of physical scene: who uses this, where, under what ambient light, in what mood. If the sentence doesn't force the answer, it's not concrete enough — add detail until it does.

"Observability dashboard" does not force an answer. "SRE glancing at incident severity on a 27-inch monitor at 2am in a dim room" does. Run the sentence, not the category.

## 2. First principles

Seven principles. Each is a positive claim with a concrete failure that violates it. Read the principle, then read the anti-example; the anti-example is the test that names the failure mode in the wild.

- **Clarity** — the user always knows what is happening and why. Anti: a confirmation modal that says "Are you sure?" without naming the action being confirmed; the user is forced to recall context the modal should have surfaced.

- **Hierarchy** — visual weight matches information weight. Anti: every CTA the same prominence — primary, secondary, and tertiary actions all rendered in the same filled button — reads as flat noise; the eye finds no entry point.

- **Intent** — every element earns its presence. Anti: decorative card borders that assert grouping the layout already conveys; the border is doing redundant work the whitespace already does, so it taxes attention without adding signal.

- **Coherence** — the surface holds together as one artifact. Anti: a post-minimalist hero, a neo-brutalist pricing table, and a glassmorphic footer on the same page; three paradigms reads as three teams, not eclecticism.

- **Restraint** — every removed element earns its absence. Anti: filling whitespace with a stock illustration "because it looked empty"; the empty space was the negative shape carrying hierarchy, and the illustration collapsed it.

- **Generosity** — the design serves the user, not the team. Anti: a settings panel whose taxonomy mirrors the engineering org chart (Auth team, Billing team, Infra team), forcing the user to reverse-engineer the org to find the toggle they need.

- **Honesty** — the surface tells the truth about state. Anti: a fake-progress spinner on a 500ms request that shows for 4 seconds anyway, or a "saving…" indicator that finishes before the network round-trip — both lie about what the system is doing, eroding the trust the next interaction depends on.

These seven are not independent — they reinforce each other. Clarity without hierarchy is a flat document; hierarchy without restraint is shouting; restraint without generosity is austerity for the designer's sake. Treat the list as a single posture, not a checklist.

When two principles collide on a single decision, generosity and honesty win. Decorative hierarchy is forgiven; dishonesty about state is not.

## 3. Anchor philosophies

The canonical reading list. Internalize before improvising.

- **Dieter Rams' 10 principles of good design** — innovative, useful, aesthetic, understandable, unobtrusive, honest, long-lasting, thorough down to the last detail, environmentally friendly, as little design as possible. Most-quoted: *"Less but better"* (*Weniger aber besser*). Anchor product: the Braun T1000 radio — every dial has a function, every surface a reason, no element decorative.

- **John Maeda's *Laws of Simplicity*** (MIT Press, 2006) — ten laws: reduce, organize, time, learn, differences, context, emotion, trust, failure, the one. The operating frame: *subtract the obvious, add the meaningful*. Reduction is not absence; it is concentration.

- **Brad Frost on craft** — atomic design and the Pattern Lab philosophy: components are atoms, molecules, organisms; design systems are care expressed at scale. Frost's frame turns restraint from a single-surface discipline into an institutional one.

- **Tobias van Schneider** — *"design that gives a damn"*; the personal-investment lens. Surfaces that feel alive are surfaces somebody fought for. Anonymous design ships anonymous product.

These four form the readable canon. Rams supplies the principles, Maeda supplies the operations, Frost scales the discipline, van Schneider supplies the conviction. Sections 4–6 apply the canon.

The canon is small on purpose. A larger reading list would buy breadth at the cost of internalization; these four are short enough to re-read in an afternoon and rich enough to argue with for a career.

## 4. Restraint as positive practice

Subtraction is craft, not laziness. Every removed element earns its absence the same way every kept element earns its presence — by serving the surface goal.

The operating rule: **ONE intentional moment per surface.** Each surface gets one *thing* that draws the eye — a hero illustration, a typographic accent, a single saturation spike in an otherwise neutral palette — and the rest of the surface earns its weight by *not* competing for that attention. Two intentional moments halve the impact of each. Three reads as a portfolio.

Counter-example, executed well: Stripe's docs use one accent (the indigo CTA) and one type accent (Tiempos for headlines, paired with a neutral sans for body). Everything else is structural — grid, type scale, whitespace. The result reads as confident, not sparse, because what remains was chosen.

A second case: Things 3's task-row hover state. The single intentional moment is the inline yellow check-circle that fades in on hover; the row itself does not change background, weight, or position. One affordance, surfaced precisely when needed, in a color the rest of the surface does not use. The restraint is what makes the affordance carry.

Restraint is also the cheapest form of accessibility — fewer competing signals means less cognitive load, which means a wider band of users can navigate the surface without effort.

The discipline is asymmetric: adding an element requires no defense, removing one requires a reason. Invert the asymmetry. Every addition must defend its presence; absence is the default.

## 5. Anti-pastiche

Do not ape style without philosophy. Understand WHY before WHAT. Every taste anchor below was *answering a constraint*; copying the answer without inheriting the constraint is what produces hollow imitation.

- Linear's restraint is *velocity-driven* — the team using Linear all day pays a tax on every redundant pixel, so density and minimalism compound. Lifting the look without the velocity register produces a sparse marketing site, not a tool.

- Read.cv's neo-brutalism is *anti-LinkedIn* — coarse type and harsh borders read as "this is not a corporate platform". Lift the visual language onto a corporate platform and the register inverts; the brutalism becomes costume.

- Things 3's yellow accent is *native macOS* — it is inherited from the platform, not chosen. Importing the yellow into a web app strips the inheritance and what remains is an arbitrary color choice.

- Rosé Pine's palette is *muted-warm by mathematical intent* — the OKLCH lightness band is narrow on purpose. Eyedropping the hex values without the lightness discipline yields swatches that no longer hold together.

Pasting the look without the *register* produces hollow imitation. The exemplars in `references/anti-slop.md` are evidence; the philosophy in this file is the lens through which to read them.

The diagnostic: if the design rationale collapses to "it looks like Linear", the design has no rationale. The rationale is the constraint that made Linear *choose* the look — name that constraint, or pick a different exemplar whose constraint matches the surface at hand.

## 6. The taste-spine

Taste is opinion built from looking. It is not innate, and it is not learned from a single source. Train the eye on Linear / Stripe / Things 3 / Read.cv / Rosé Pine / Anthropic — not as templates to copy but as *evidence* that restraint compounds across surfaces, runtimes, and decades.

Each exemplar is doing the same thing under different constraints: subtracting the obvious, surfacing the meaningful, committing to one intentional moment, and refusing to compensate for thinness with decoration. Reading them in parallel — not in isolation — is what builds the spine.

The spine is what allows a designer to reject a direction without articulating the rejection in the moment. The articulation comes later, when the surface is read aloud against the exemplars and the divergence is named. Until that articulation exists, the rejection is a hunch; with it, the rejection is a critique.

The spine compounds slowly. A year of looking at one exemplar a week, naming what is and is not working, builds more taste than a weekend of Pinterest scrolling. Looking with intent is the input; the spine is the output.

For extracted OKLCH values plus type stacks per exemplar, see `references/anti-slop.md` §4 taste anchors. That file holds the concrete tokens; this file holds the lens.

Looking is the practice. Naming what was seen is the discipline.
