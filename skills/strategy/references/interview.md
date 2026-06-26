# Strategy interview — question bank and pushback flow

Load before any interview turn (Phase 1 first-run, Phase 2 per-section). The pushback rules, anti-pattern examples, and per-section quality bar live here; improvising them from memory produces a passive transcription instead of a strategy.

Each section below maps one-to-one to a section in `assets/strategy-template.md`. For each: ask the opening question, judge the answer against the bar, push back when it hits a named anti-pattern, capture the final answer in the user's own language.

## VS preamble (before section 1)

The orchestrator runs a short Verbalized Sampling preamble (the `askme` skill) first: surface the distinct framings the user could mean by "strategy" for this repo, pin one. Without a pinned intent the interview anchors the wrong product. Skip only when the user already stated a single unambiguous intent.

## Overall rules

1. **Ask, don't prescribe.** Free-form answers for the substantive sections (problem, approach, persona). Reserve single-select for routing (which section to revisit).
2. **Push back once, maybe twice.** First weak answer → name the specific issue, ask a sharper question. Second still weak → capture what's given, mark the section worth revisiting. Don't spiral.
3. **Quote the user back.** Challenge with the user's own words verbatim. Paraphrase softens the challenge and is easy to dismiss.
4. **1–3 sentences per answer.** A paragraph is usually hiding something vague — ask for the one sentence that matters.
5. **Don't leak the anti-pattern names.** Don't say "that's a vanity metric" — just ask the sharper question.

---

## 1. Target problem

**Opening:** "What's the core problem this product solves — and what makes it hard?"

**Strong:** names a specific situation the user is in, identifies what makes it hard *right now* (a crux that isn't easy to route around), and is falsifiable.

**Anti-patterns → pushback:**

- Goal stated as problem ("we need to grow revenue") → "That's a goal. What in the world makes it hard? Whose situation are you changing?"
- Vague wish ("people need better tools for X") → "Whose situation, doing what? What do they try today, and why doesn't it work?"
- Symptom, not cause ("users churn after 30 days") → "That's a symptom. What's happening in their world that makes them stop caring?"
- Too broad ("communication at work is broken") → "Civilization-scale. Narrow it: which users, doing what, when does it hurt most?"
- Feature-shaped ("there's no good way to do X with AI") → "That's a missing feature. What outcome do they want that the feature would give them?"

**Capture:** one or two sentences naming the situation and the crux. No solution language.

---

## 2. Our approach

**Opening:** "Given that problem, what's your approach — the commitment that makes it tractable?"

**Strong:** a choice that implies alternatives *not* pursued; general enough to direct many decisions, specific enough to rule things out. Sounds like "we win by doing X differently," not "we do a list of things."

**Anti-patterns → pushback:**

- Fluff / values ("customer-obsessed, move fast") → "Those apply to any company. What are you doing *differently* from the products users could pick instead?"
- Feature list ("AI-powered X, Y, Z") → "What's the bet that makes you pick those over others? What principle guides what you ship?"
- Product description ("we use AI to draft replies") → "Every competitor says that. What's the *choice* inside it the obvious alternative isn't making?"
- Goal restated ("be the market leader") → "Still the goal. How does the product win? What choice are competitors not making?"
- Many approaches at once ("enterprise, self-serve, and consumer") → "Pick the one that organizes the rest. Which is it?"
- Disconnected from the problem → "Draw the line from this approach to the problem you named. If there's none, one of the two is wrong."

**Capture:** one or two sentences, ideally implying "...so that [outcome tied to the problem]."

---

## 3. Persona (who it's for)

**Opening:** "Who's the primary user, and what job are they hiring this product to do?"

**Strong:** one primary persona (secondaries allowed but subordinate), identified by role or situation not demographic, with a concrete job as a verb phrase.

**Anti-patterns → pushback:**

- Too many primaries ("founders, PMs, engineers, designers") → "If it's for everyone, it's for no one. Who drives the product decisions?"
- Demographic ("25–45 professionals") → "That's a demographic. What are they trying to do that makes them reach for this?"
- Role without situation ("PMs") → "PMs doing what — a roadmap review, a midnight spec, convincing a skeptical eng lead? The situation is where it matters."
- Generic job ("be more productive") → "Productive at what? They're hiring this to do *what*, specifically?"

**Capture:** persona name + JTBD sentence. E.g. "Solo founders running their own roadmap, hiring the product to keep strategy and execution aligned without a PM on staff."

---

## 4. Key metrics

**Opening:** "What 3–5 metrics tell you whether the approach is working?"

**Strong:** 3–5 (not 10), a mix of leading and lagging, and each could plausibly regress if the product got worse.

**Anti-patterns → pushback:**

- Vanity ("total signups, pageviews, cumulative users") → "Those rise while the product gets worse. What moves when users actually get value?"
- Too many ("12 metrics") → "A dashboard isn't a strategy. Which 3–5 would you stake the quarter on?"
- Outputs not outcomes ("deploys per week") → "That measures the team. If velocity doubled but users didn't care, is it a win?"
- Can only go up ("cumulative hours saved") → "What's the rate or ratio — the thing that can regress?"
- Unmeasurable ("user delight") → "How would you check it on a Tuesday? If you can't, it's aspirational."

**Capture:** 3–5, each with a one-line definition and where it's measured. If measurement is undefined: "Where does this live today? If nowhere, can you start measuring it?"

---

## 5. Tracks

**Opening:** "What 2–4 tracks of work are you investing in to execute the approach?"

**Strong:** 2–4 named *domains of work* (not features, not todos), each connected to the approach and broad enough to hold multiple features.

**Anti-patterns → pushback:**

- Feature list in disguise ("Slack integration; mobile app; dark mode") → "Those are features. What investment area does each live inside? 'Integrations' might be one track."
- Too many ("7 tracks") → "Seven means every track is starved. Which 3 are load-bearing?"
- Disconnected from approach → "How does this track serve the approach? If it's a separate bet, name it as one."
- Too vague ("improve the product") → "Every track is that. What's the specific area that's different from the others?"
- One track only → "With one track there's no choice being made. What 2–3 things must the product be good at, and how do they differ?"

**Capture:** 2–4 tracks, each with a name, one-line purpose, and why it serves the approach.

---

## 6. Milestones (optional)

**Opening:** "Any dated milestones worth anchoring — a launch, fundraise, conference, renewal? Skip if none."

Only externally visible, real milestones. Default skip. Don't push the user to invent any. If named, capture verbatim with dates.

---

## 7. Non-goals (optional)

**Opening:** "Anything you've explicitly decided *not* to do right now that's worth naming — something the team keeps being tempted by?"

A clarity tool, not a blocker list. Default skip. One sentence each if named; don't encourage a long list.

---

## 8. Marketing (optional)

**Opening:** "Any positioning the doc should carry — a one-liner, tagline, key message? Skip if not yet."

Default skip. 2–3 lines max if present.

---

## After the interview

Once sections 1–5 clear the reject-by-default gate (plus any optional sections the user engaged), read `assets/strategy-template.md`, fill it in the user's language, present the full draft in chat, offer one edit round, then hand back to the SKILL's Phase 3 write/read-back/commit. If sections 1–5 can't clear the gate after two rounds of pushback each, write nothing and say so in one line.
