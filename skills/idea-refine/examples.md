# Ideation Session Examples

These sessions show what good ideation looks like across different kinds of ideas. Study the rhythm, tone, and structure, not just the content. The skill should work equally well on a vague startup concept, a feature for an existing product, or a process change.

---

## Example 1: Vague Early-Stage Concept (Full 3-Phase Session)

**User invokes:** `/ideate I want to help small local restaurants compete with the big delivery platforms`

### Phase 1: Understand & Expand

**Skill response:**

> **How might we** give independent restaurants the reach and convenience customers expect from delivery platforms, without forcing them into a model that erodes their margins and brand?

Big space. Sharpening it:

1. **Which part of "compete"?** Customer acquisition? Delivery logistics? Online ordering UX? Loyalty/retention? Margin pressure from platform fees?
2. **Who are you building for?** The restaurant owner? The diner? Both?
3. **What is the constraint?** Software? A cooperative model? Something physical?

**User responds:** "Restaurant owners. The core pain is that they're paying 25-30% commission to delivery apps but feel they can't opt out because that's where the customers are. I'm thinking software but I'm open."

**Skill continues:**

So the problem is not delivery logistics — it is **customer dependency**. The platforms own the customer relationship, and restaurants rent access to their own customers at 30% of revenue. That is the leverage to break.

Six variations:

1. **Direct Channel Toolkit:** give restaurants their own branded ordering — web, SMS, maybe a lightweight app — so they can move existing customers off-platform. The bet: customers who *already know* a restaurant will order direct if it is easy enough. You do not compete with DoorDash for discovery, only for reordering.

2. **Inversion — charge the customer, not the restaurant:** flip the fee model. Customers pay a small premium for direct ordering; restaurants pay zero commission. Position it as "support your local spot." The bet: enough customers care about local businesses to pay $1-2 more per order.

3. **Constraint removal — what if delivery were not required?** Platforms bundle discovery + ordering + delivery, but most of their cost (and the restaurant's commission) is delivery. Solve only ordering and pickup. Restaurants keep 100% of revenue; customers skip the delivery fee. Works best in dense neighborhoods.

4. **Combination — restaurant collective:** a co-op where 20-50 local restaurants share a platform, split costs, and cross-promote. One restaurant cannot afford marketing; a neighborhood collective can. A digital local food hall.

5. **Audience shift — for regular customers:** do not chase new customers. Build only for a restaurant's existing regulars — the weekly crowd. A dead-simple reorder tool: "Your usual?" one tap. The bet: 20% of customers drive 80% of revenue, and those people do not need DoorDash to find the restaurant.

6. **Expert lens — what restaurant owners actually do:** most small owners are in the kitchen, not at a dashboard. Any tool that asks them to "manage" something fails. The winner runs itself — auto-texts regulars who have not ordered in 2 weeks, auto-posts the daily special, auto-handles reorders. Zero restaurant-side effort.

Variations 5 and 6 together are the interesting ones. Instead of out-platforming the platforms, build something hyper-narrow: a reorder and retention tool for a restaurant's best existing customers. No discovery, no delivery, no marketplace. Just "keep your regulars ordering direct."

Which directions interest you?

---

### Phase 2: Evaluate & Converge

**User responds:** "I love the regulars angle (5 and 6). The direct channel toolkit (1) feels necessary but boring. The co-op idea (4) is interesting but complex. Let me focus on 1 + 5 + 6 combined."

**Skill response:**

Good instinct. That combination has a clear thesis: **own the relationship with your best customers, make reordering effortless, and require zero effort from the owner.** Stress-testing it.

**Direction A: the "Regulars Engine" (variations 5 + 6 fused)**
A tool aimed entirely at a restaurant's existing repeat customers. Auto-reorder, auto-engagement, zero management.

- **Core bet:** a restaurant's top 20% of customers shift to direct ordering if the experience is frictionless and personal. The restaurant does not need *new* customers; it needs to stop paying 30% on the ones it already has.
- **User value:** high and immediate. Every direct reorder saves 25-30% commission. A regular ordering $30/week is ~$400/year in saved fees. 50 regulars is $20K/year — real money for a small restaurant.
- **Feasibility:** medium. Ordering and payment tech is commodity. Hard parts: (a) identify and onboard "regulars" without manual owner work; (b) cold start — the first reorder needs an order history that lives on the delivery platform, not with you.
- **Differentiation:** high for the niche. Platforms optimize for marketplace dynamics — new-customer discovery, driver logistics. Nobody optimizes specifically for "keep your regulars ordering direct." Too small for DoorDash to care about, which is exactly why it is a good wedge.
- **Hidden assumptions:**
  - Regulars will adopt yet another ordering method (most likely to be wrong).
  - Owners will share customer contact info or let you access it.
  - Direct ordering will not cannibalize dine-in revenue.
- **What could kill it:** customers simply will not switch channels. Habit is powerful — even if DoorDash costs more, it is already on their phone.

**Direction B: direct channel + retention hybrid (variation 1 + 5)**
Branded ordering for the restaurant *plus* the retention automation. More complete, more complex.

- **Core bet:** restaurants need both the channel (a way to accept orders) and the engine (a way to keep customers coming back through it).
- **User value:** higher ceiling, but only if both parts work together. The ordering channel alone is a commodity (Square, Toast). The retention layer alone has no channel to retain customers on.
- **Feasibility:** lower. You build two products and hope they are better together.
- **Differentiation:** medium. The combination is interesting, but each piece has competitors.
- **Hidden assumption:** that bundling beats partnering (a retention layer on top of Square Online).
- **What could kill it:** scope. Building two things well is exponentially harder than one.

**The honest read:** Direction A is the sharper bet. Direction B is safer but less differentiated. A's biggest risk is the channel-switching problem — getting customers to order through a new method. Crack that (variation 6's "zero effort" approach helps — an SMS reorder needs no new app) and the rest follows.

One pushback: you called variation 1 "necessary but boring." That instinct to bolt on the "necessary" thing is how products lose focus. If the regulars engine works, add a branded channel later. Build the channel first and you are just another Square Online competitor.

---

### Phase 3: Sharpen & Ship

**Skill produces:**

# ReOrder: Keep Your Regulars Ordering Direct

## Problem Statement
How might we help independent restaurants retain their best existing customers through direct ordering, eliminating the 25-30% platform commission on the revenue that matters most?

## Recommended Direction
Build a **regulars-only retention engine** — not a marketplace, not a full ordering platform. Hyper-focused on one job: make it effortless for a restaurant's repeat customers to reorder directly.

Restaurants do not need help *finding* their best customers — they know who walks in every Tuesday. They need help moving those relationships off-platform. And the tool must run itself, because the owner is in the kitchen, not at a dashboard.

SMS-first, not app-first, is the channel. A text — "Want your usual Thursday order from Marco's?" with a one-tap confirm — beats any app install on friction.

## Key Assumptions to Validate
- [ ] Repeat customers will reorder via SMS/direct link instead of their usual app — test with 5 restaurants, 20 regulars each, measure conversion over 4 weeks
- [ ] Owners can identify their top 20-30 regulars and share contact info — ask 10 owners whether they would
- [ ] The commission savings ($8-10/order) motivates owners to invest setup effort — interview 10 owners about platform-fee pain

## MVP Scope
- SMS reordering for a restaurant's self-identified regulars
- Owner adds regulars manually (name + phone + usual order) — 15-minute setup
- Customer gets a text with their usual order, confirms by reply, pays via link
- Restaurant receives the order via text/simple dashboard
- No delivery — pickup only in v1
- No discovery, no marketplace, no app

## Not Doing (and Why)
- **Delivery logistics** — the expensive, complex part, and not the core problem. Pickup-first validates demand without operational burden.
- **Customer acquisition/discovery** — the platform's game. Competing on discovery means competing with DoorDash's budget. Compete on retention instead.
- **Branded restaurant apps/websites** — commodity. Square and Toast already do this. Another channel does not solve the behavioral problem.
- **Menu management, POS integration** — scope creep. "Your usual" does not need a dynamic menu. Start with static orders.
- **Analytics dashboards** — the owner is in the kitchen. Reporting is passive (weekly text summary), not active (log in and look at charts).

## Open Questions
- What is the legal/compliance landscape for SMS marketing to restaurant customers?
- How do you handle menu/price changes for "usual" orders?
- Can you bootstrap the regular-customer list from POS data instead of manual entry?
- What is the pricing model — per-order fee or monthly subscription?

---

## Example 2: Feature Idea Within an Existing Product (Codebase-Aware)

**User invokes:** `/ideate adding real-time collaboration to our document editor`

### Phase 1: Understand & Expand

**Skill response:**

> **How might we** let multiple people work on the same document simultaneously in a way that feels natural, not chaotic?

I scanned the codebase: a block-based editor with a REST API for persistence and no WebSocket layer yet. That grounding is stack-agnostic — the block model lives in `src/models/document.ts:45` in this TypeScript service, and the same shape would sit in `app/models/document.py` for a Python backend or `internal/document/model.go` for a Go one. Either way it is important context. A few questions:

1. **What is the collaboration pattern?** Same paragraph at the same time (Google Docs style)? Different sections (Notion style)? Reviewing/commenting while one person edits?
2. **How many simultaneous users?** 2-3 (pair editing)? 10+ (team workspace)?
3. **What is driving this now?** Customer requests? Competitive pressure? Internal need?

**User responds:** "2-5 people, usually working in different sections. Customers keep asking. We're losing deals to Notion because they assume any modern editor has this."

**Skill continues:**

The competitive framing matters — this may be a checkbox feature (must-have to stay in the consideration set) rather than a differentiator. That changes how much to invest.

The document model uses independent blocks with flat ordering — `src/models/document.ts:45` here, the same pattern in a `models/document.py` or `internal/document/model.go` had this been a Python or Go service. That is favorable: block-level granularity makes conflicts rarer than character-level editing, whatever the language.

Five variations:

1. **Block-level locking (simplest path):** when someone edits a block, it locks for others. They see a presence indicator ("Alex is editing...") and can edit any other block freely. No conflict resolution. The existing block model supports this with minimal change — add a `locked_by` field and a WebSocket layer for presence. The field and the transport are the same idea in any stack.

2. **Inversion — async-first collaboration:** instead of real-time co-editing, lean into async. Inline suggestions, comments, proposed edits the owner merges. Suggestion mode as the *primary* model. Bet: for 2-5 people in different sections, async may be *better* than real-time.

3. **Simplification — presence without co-editing:** show who is viewing and what section they are on (cursors, margin avatars), but do not enable simultaneous editing. People coordinate verbally. Primitive, but possibly 80% of the value at 10% of the cost.

4. **Combination — collaboration + version branches:** let people branch a document, edit independently, then merge. Each person gets their own space, no conflicts during editing, and you build a merge UI. Plays to the existing versioning system.

5. **10x version — AI-mediated collaboration:** multiple people describe what they want in a section, and the system synthesizes their inputs into a draft they all iterate on. Nobody edits the same text directly; they all influence it. Radical, possibly too early, worth naming.

Given the architecture and the competitive context, push toward variation 1 or 3. You need this shipped to close deals, which means the simplest version that checks the box. Variation 1 gives real co-editing; variation 3 is cheaper but may not satisfy the "we need real-time" checkbox.

---

*Phase 2 would cluster into "minimum viable co-editing (1 or 3)" vs. "differentiated collaboration model (2 or 4)" — deciding whether to check the competitive box fast or invest in something that becomes a selling point.*

*Phase 3 would produce a one-pager recommending block-level locking as the MVP, with a "Not Doing" list covering character-level CRDT (too complex), offline sync (not needed for 2-5 users), and AI features (premature).*

---

## Example 3: Process/Workflow Idea (Non-Product)

**User invokes:** `/ideate a better way to run our weekly team retrospectives — they've gotten stale and people dread them`

### Phase 1: Understand & Expand

**Skill response:**

> **How might we** make retrospectives genuinely useful — something the team looks forward to — instead of a recurring meeting people endure?

Before expanding:

1. **What is stale about them?** Same format every time? Same people talking? Action items that never get done? Repetitive topics?
2. **Team size and dynamic?** 5 people who all speak up, or 15 where 3 dominate?
3. **What does a *good* retro look like to you?** Have you had one that worked? What made it different?

**User responds:** "8 people, maybe 3-4 actually talk. Same 'what went well / what didn't / action items' format for a year. The action items pile up and nothing changes. People think it's theater."

**Skill continues:**

The action-item problem is the real signal. If nothing changes after the retro, people rationally disengage. The meeting is not stale — it is **broken at the output layer**. The format might be fine if the follow-through worked.

Six variations:

1. **Fix the output, not the meeting:** keep the format but change what happens after. One action item max per retro. Owner and deadline assigned during the meeting. The next retro opens with a 5-minute demo of the completed action. Not done? That *becomes* the retro topic. The one-item constraint forces prioritization.

2. **Inversion — kill the meeting:** replace the synchronous retro with an async one. Everyone submits reflections in writing during the week. A rotating facilitator synthesizes themes and proposes one change. The "meeting" is a 15-minute standup to agree or disagree. Bet: writing produces more honest feedback than speaking in a group.

3. **Audience shift — retro for the quiet ones:** design for the 4-5 who do not talk. Anonymous topic submission. Dot-voting to prioritize. Pair breakouts before full-group discussion. The loud voices still participate, but the structure stops them from dominating.

4. **Simplification — the one-question retro:** each retro has exactly one question, changed weekly. "What slowed you down?" "What did you learn that the team should know?" "If you could change one thing about how we work, what?" The constraint forces depth over breadth.

5. **Combination — retro + experimentation:** treat each output as a hypothesis. "We believe [change] will improve [outcome]." Run it as a 2-week experiment. Next retro: did it work? Keep, modify, or kill. The retro becomes a continuous-improvement engine with built-in accountability.

6. **Expert lens — what facilitators know:** the #1 retro killer is lack of safety, not format. People will not say what is really wrong if they fear consequences. The fix may not be structural — start each week with an anonymous "team health check" score (1-5). When safety is high, retros improve on their own.

The tension: variations 1 and 5 fix the *output* problem (nothing changes); 2, 3, and 4 fix the *input* problem (same voices, same topics); 6 says both are symptoms of a deeper issue. Where is the real bottleneck?

---

*Phase 2 would evaluate by effort to try (most are free — just change how you run the next meeting), risk (variation 2 is the biggest departure), and whether the real problem is output (action items die) or input (not enough honesty).*

*Phase 3 would produce a one-pager recommending variation 1 (one action item, demo next week) as a zero-cost experiment, combined with variation 3's anonymous submission. "Not Doing" list: new tools, elaborate facilitation techniques, anything requiring budget. The first fix should take 0 minutes of prep and $0.*

---

## What to Notice in These Examples

1. **The restatement changes the frame.** "Help restaurants compete" becomes "retain existing customers." "Add real-time collaboration" becomes "let people work simultaneously without chaos." "Fix stale retros" becomes "fix the output layer."

2. **Questions diagnose before prescribing.** Each question determines which *type* of problem this is. The retro example reveals the problem is action-item follow-through, not meeting format — and that changes every variation.

3. **Variations have reasons.** Each one explains *why* it exists (which lens generated it), not just *what* it is. The label (Inversion, Simplification) teaches the user to think this way themselves.

4. **The skill has opinions.** "Push toward 1 or 3." "Variation 6 is worth sitting with." It says what it thinks matters and why, not a neutral menu.

5. **Phase 2 is honest.** Ideas get called out for low differentiation or high complexity. The skill pushes back: "That instinct to bolt on the 'necessary' thing is how products lose focus."

6. **The output is actionable.** The one-pager ends with things to *do* (validate assumptions, build the MVP, run the experiment), not things to *think about*.

7. **The "Not Doing" list does real work.** Specific and reasoned. Each item is something you might *want* to do but should not yet.

8. **The skill adapts to context.** The codebase-aware example cites actual architecture across stacks. The process idea generates zero-cost experiments instead of products. The framework holds; the output matches the domain.
