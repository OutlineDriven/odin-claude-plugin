---
name: copywriting-hooks
description: 'Use when a user asks for a hook, lede, or accroche for long-form content. Proposes 3-4 hooks from an 18-hook catalog with a type-fit table and anti-pattern cull, presents numbered A/B candidates, and records the chosen hook plus what it commits the opening to. Don''t use for tasks that require source or remote-system changes.'
---

# Copywriting hooks

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for a hook, lede, or accroche for long-form content. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | No state outside the conversation. |
| Done | User-selected hook plus what it commits the opening to. |

## Inputs

- Topic, audience, target language (EN, FR, or both), approximate length, and where it will be published. If any is unclear and material, ask before generating.
- Optional: an existing draft opening. If supplied, treat it as Option 0 and propose 3 alternatives; never silently discard it.

## Procedure

A hook's only job is to make the reader want sentence 2. What makes a reader want sentence 2 is one of five levers, and a strong hook usually pulls two at once:

1. **Open a gap** — pose something incomplete the reader needs to close (curiosity gap, question, open loop).
2. **Break a prediction** — state something that violates the reader's prior (contrarian, definition reversal, surprising statistic).
3. **Drop into a scene** — load sensory or specific detail that builds a vivid frame (in medias res, concrete detail, time anchor).
4. **Promise a payoff** — name an outcome the reader wants (benefit, conditional, direct problem).
5. **Borrow weight** — lean on a name, number, or quote that carries embedded authority (authority hook, statistic, quote with disagreement).

1. Confirm the brief (see Inputs). Ask before generating if a material field is missing.
2. Pick 3 to 4 hooks from the 18-hook catalog below that are genuinely different — different levers, not three flavors of the same technique.
3. Write 2 candidates per hook, specific to the user's article. The two candidates within one hook explore different angles (different anecdote, statistic, or scene), not rewordings of each other.
4. Apply the quality gates to every candidate:
   - Specific beats abstract: replace "many companies" with "Stripe, Shopify, Vercel"; replace "recently" with a date; replace "studies show" with the actual finding or cut the claim.
   - The first sentence must force the second: read each candidate cold; if sentence 2 would not be clicked after sentence 1, rewrite.
   - Match technique to article type using the type-fit table.
5. Run every candidate through the anti-pattern cull. If a candidate matches any entry, rewrite it before presenting.
6. Present using the Output format, ask the user through the question tool, and wait. Do not pick for them.
7. After the pick, name what the choice commits the rest of the article to. A contrarian hook commits paragraphs 2-3 to defending the non-consensus claim. A scene opener commits the next section to resolving or productively delaying the scene.

**Diversification rule.** Across the 3 to 4 options include at minimum one intellectual hook (contrarian, definition reversal, historical analogy, curiosity gap), one sensory hook (in medias res, concrete detail), and one reader-direct hook (conditional, direct problem, promise). Three flavors of contrarian is not a choice.

**Type-fit table:**

| Article type | Strong hooks | Avoid |
|---|---|---|
| Technical deep-dive | concrete detail, statistic, contrarian, direct problem | personal confession, scene opener |
| Personal essay | in medias res, personal confession, time anchor, definition reversal | bold claim, direct problem |
| Opinion / contrarian | bold claim, definition reversal, contrarian, quote + disagreement | gentle setup, dictionary opener |
| Tutorial / how-to | direct problem (PAS), promise, conditional | scene opener, historical analogy |
| Reported / investigative | concrete detail, time anchor, in medias res, statistic | bold claim, definition reversal |
| Listicle | curiosity gap, counted stakes, conditional | personal confession, in medias res |
| Longform analysis | historical analogy, statistic, contrarian | direct problem |
| Newsletter issue | personal confession + open loop, conditional, curiosity gap | dictionary opener |

**The 18-hook catalog.** Each hook: what it does, one example (EN or FR), when to use, when to avoid.

1. **Curiosity Gap** — open an information gap the reader wants closed. EN: "How does Shen Yun make any money? Short answer: they don't." Use when the gap can honestly be closed in 2-3 sentences and the reader cares about it. Avoid vague gaps ("You won't believe what happened next") the reader cannot even guess at.
2. **Contrarian** — knock down a consensus belief the reader holds. EN: "Prevailing wisdom claims the best way to achieve what we want in life is to set specific, actionable goals." Use when a defensible non-consensus view exists and 200-400 words are available to defend it. Avoid strawmen and contrarianism for its own sake.
3. **Bold Claim / Promise** — state the outcome upfront, before the proof. EN: "At 60 miles an hour the loudest noise in this new Rolls-Royce comes from the electric clock." Use when the promise can be delivered concretely. Avoid promises larger than the payoff; it destroys trust permanently.
4. **Scene Opener / In Medias Res** — drop the reader inside a specific moment, no setup. EN: "Frank Sinatra, holding a glass of bourbon in one hand and a cigarette in the other, stood in a dark corner of the bar between two attractive but fading blondes who sat waiting for him to say something." Use for longform, profile, reported piece, essay. Avoid short technical pieces where the reader has not earned the scene.
5. **Surprising Statistic** — lead with a number that violates the prior. EN: "You have five seconds to get people's attention." Use when the number is genuinely surprising and citable accurately. Avoid vague stats ("studies show 90%...") and stats that confirm the reader's prior.
6. **Question** — pose a question the reader actually wants answered. EN: "If you collected lists of techniques for doing great work in a lot of different fields, what would the intersection look like?" Use when the reader was implicitly carrying the question. Avoid "Have you ever wondered...?", "Did you know...?", "What if I told you...?" — they presuppose curiosity not yet formed.
7. **Quote + Disagreement** — borrow weight, then twist. EN: "Steve Jobs said people don't know what they want until you show it to them. For SaaS, this is exactly backwards." Use when a real quote exists that supports or genuinely contrasts the point. Avoid misattributed Einstein/Seneca/Confucius/Bouddha platitudes.
8. **Personal Confession** — admit something vulnerable, then universalize. EN: "I cheated on my husband." Use for personal byline, essay, newsletter. Avoid corporate byline, technical articles, and performative vulnerability ("I almost didn't write this...").
9. **Concrete Specific Detail** — replace abstraction with a single vivid detail. EN: "John Laroche is a tall guy, skinny as a stick, pale-eyed, slouch-shouldered, and sharply handsome, despite the fact that he is missing all his front teeth." Use for profile, reported piece, contrarian biographical setup. Avoid specificity that does not advance the thesis (clutter).
10. **Pattern Interrupt** — break expected rhythm with a fragment. EN: "This is not an article about productivity. It's an article about identity." Use for rhythm-driven content and opinion pieces. Avoid using it every article; it becomes its own pattern fast.
11. **Direct Problem (PAS)** — name the pain, sharpen it, hint at solution. FR: "Vos articles ne sont pas lus. 80% des lecteurs décrochent dès le deuxième paragraphe. Et la solution n'est pas celle que vous croyez." Use for tutorial, how-to, sales-adjacent content. Avoid manufactured problems; the pain must be real and recognizable.
12. **Promise / Benefit** — state a specific, bounded outcome. EN: "By the end of this article, you'll know exactly when to use goroutines and when not to." Use for tutorial, how-to. Avoid vague promises ("Learn how to be more productive"); add a time bound or a number to anchor it.
13. **Historical Analogy** — open with a vignette from history, pivot to the present. EN: "In 1965, Robert Lucas wrote a four-page paper that broke macroeconomics." Use for longform analysis, opinion piece, idea essay. Avoid tutorials and news pieces; reads as indulgent.
14. **Definition Reversal** — "X is not what you think. It's Y." EN: "Procrastination isn't laziness. It's a fight between two parts of your brain." Use for opinion piece, contrarian deep dive. Avoid when the reframe is just a slight angle; sounds gimmicky.
15. **Authority Borrow** — lead with a name plus a specific action. EN: "When Steve Jobs returned to Apple in 1997, he killed 70% of the product line in his first year." Use for business piece, profile, analytical essay. Avoid name-dropping without payoff; the action must be specific and relevant.
16. **Time Anchor** — lead with a specific date, hour, or moment. FR: "Octobre 2005, Bondy. Trois journalistes installent un blog dans un appartement de la cité Blanqui." Use for reported piece, retrospective, "why now" framing. Avoid vague anchors ("recently", "these past few years"); use a specific date or cut the framing.
17. **Conditional ("If you... then this")** — self-segment the reader. EN: "If you write for a living, you've probably been taught to start with context. Don't." Use for tutorial, advice piece, segmented audience. Avoid conditions too broad ("If you've ever felt stuck...") that segment nobody.
18. **Open Loop** — start something, withhold the resolution. EN: "He pressed Send and waited. Forty-seven seconds later, the company was worth 4 billion dollars less." Use for longform where the journey matters as much as the answer. Avoid unresolved loops; they create disproportionate betrayal when the article ends without paying off.

**Anti-pattern cull (never propose any of these).** Run every candidate through this list before presenting; if a candidate matches, rewrite.

- "In today's fast-paced world..." / "À l'heure du tout-numérique" / "À l'ère de l'IA" / "Dans un monde où..."
- "Have you ever wondered...?" / "Vous êtes-vous déjà demandé...?"
- Dictionary opener played straight ("Productivity, defined as...")
- "In this article, I'll discuss..." / "Dans cet article, nous allons voir..."
- Generic stats without source ("90% of people...", "Les études montrent...")
- Misattributed Einstein / Seneca / Confucius / Bouddha quotes
- "I'm not an expert, but..." / "Je ne suis pas spécialiste mais..."
- Three rhetorical questions in a row
- "Imagine waking up..." without a specific scene
- "Hot take:", "Unpopular opinion:", "Voici la vérité que personne ne veut entendre..."
- "At [Company], we believe..." / "Chez [Entreprise], nous pensons..."
- "Recently,..." / "Récemment,..." without a specific date
- "You're not alone."
- Current AI tells: "It's not just X, it's Y", "Picture this:", "Imagine a world where...", "What if I told you...", "Whether you're a seasoned X or a curious newcomer...", "In the realm of...", "Navigating the landscape of...", "Unlock the power of...", "Dive into...", "Buckle up,", "Let's dive in", "Crucially,/Notably,/Importantly,/Essentially," as sentence openers. French AI tells: "Dans un monde en constante évolution", "Plongez dans...", "Découvrez comment...", "Par ailleurs,...", "Notamment,...", "Il est crucial de...".

**Language handling.** If the audience is French, write in French and apply the _attaque journalistique_ register: concrete scene-setting, restrained tone, dated anchors, formal "vous" or restrained tutoiement. Do not translate American hype tropes literally ("You'll never believe..." becomes "Vous n'allez pas en croire vos yeux", which reads as scam in French); French marketing-skepticism is higher and high promises trigger _réactance_ faster. If English, default to direct-response register for marketing or tutorial content and longform register for essays and reported pieces. If bilingual, produce hooks in both languages and label clearly.

## Failure and recovery
- **Missing brief.** If topic, audience, language, length, or publication venue is unclear and material, stop and ask before generating. Do not invent a brief.
- **Anti-pattern match.** If a candidate matches the cull list, rewrite it before presenting. Never present a matched candidate.
- **No genuine choice.** If the 3-4 options collapse to flavors of one technique, regenerate across different levers per the diversification rule before presenting.
- **User says "more" or "none".** Produce 3 different hooks (different techniques), not new candidates for the same hooks.
- **User says "blend 1A and 2B".** Write one combined hook and check in again before proceeding.
- **Unverifiable statistic or quote.** If a candidate leans on a number or quote that cannot be cited accurately, replace it with a verifiable detail or cut the claim. Do not present an unsupported authority hook.
- Partial-result rule: never present fewer than 3 distinct options. If 3 distinct, non-anti-pattern hooks cannot be produced from the catalog, stop and report the blocker rather than presenting a narrowed set.
- Non-mutation rule: nothing is written to disk or any external system; recovery is always regenerate-in-conversation.

## Output
Present options exactly in this format:

```
### Hook options for: [working title]

**Option 1: [Hook name]** ([lever])
A. [Candidate 1]
B. [Candidate 2]

**Option 2: [Hook name]** ([lever])
A. [Candidate 1]
B. [Candidate 2]

**Option 3: [Hook name]** ([lever])
A. [Candidate 1]
B. [Candidate 2]

Which? Reply with letter combination (e.g., "1B") or "more" for different techniques.
```

If the user supplied an existing draft, it appears as Option 0 and 3 alternatives follow.

After the user picks, return the chosen hook plus one sentence naming what it commits the opening to (e.g., "1B commits paragraphs 2-3 to defending the claim that generics should be deleted"). Do not write the rest of the article until the user has chosen.

## Provenance

Origin: samber/cc-skills, `skills/copywriting-hooks/SKILL.md`, revision f9953962e135235137628ea92d06ea085688031f. License: MIT. Adaptation: condensed and restructured into the ODIN 2.0 contract form; retained the 18-hook catalog, five-lever model, type-fit table, diversification rule, anti-pattern cull, and numbered A/B output discipline; dropped the post-title section and external reference files to match the hook/lede/accroche trigger scope. Clean-room adaptation of the method; no third-party expression copied verbatim beyond the cited illustrative hook fragments, which are attributed inline to their authors.
