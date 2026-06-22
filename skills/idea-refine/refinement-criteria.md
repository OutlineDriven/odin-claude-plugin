# Refinement & Evaluation Criteria

Use this rubric during Phase 2 (Evaluate & Converge) to stress-test idea directions. Not every criterion applies to every idea — judge which dimensions matter most for the context.

## Core Evaluation Dimensions

### 1. User Value

The dimension that matters most. If the value is not clear, nothing else counts.

**Painkiller vs. vitamin:**
- **Painkiller:** solves an acute, frequent problem. Users seek it out and switch from their current solution. Signs: people describe the problem with emotion, they have built workarounds, they will pay for a fix.
- **Vitamin:** nice to have. Marginal improvement. Users will not go out of their way. Signs: people nod politely, say "that's cool," then do not change behavior.

**Questions:**
- Can you name 3 specific people who have this problem right now?
- What are they doing today instead? The real competitor is always the current workaround.
- Would they switch from their current approach? What would make them switch?
- How often do they hit this problem? Daily beats monthly.
- Is this a "pull" problem (users are asking for it) or a "push" problem (you think they should want it)?

**Red flags:**
- "Everyone could use this" — no specific user means the value is not clear.
- "It's like X but better" — marginal improvements rarely drive adoption.
- Real but rare — high intensity, low frequency rarely justifies a product.

### 2. Feasibility

Can you build this — technically and practically?

**Technical:**
- Does the core technology exist and work reliably?
- What is the hardest technical problem? Known-hard or novel?
- Are there dependencies on third parties, APIs, or data you do not control?
- What is the minimum technical stack needed? If the answer is "a lot," that is a signal.

**Resource:**
- What is the minimum team and effort to build an MVP?
- Does it need specialized expertise you do not have?
- Are there regulatory, legal, or compliance requirements?

**Time-to-value:**
- How fast can you get something in front of users?
- Is there a version that delivers value in days or weeks, not months?
- What is the critical path? What has to happen first?

**Red flags:**
- "We just need to solve [very hard research problem] first."
- Multiple dependencies that all have to work simultaneously.
- An MVP that still needs months of work — likely not minimal enough.

### 3. Differentiation

What makes this genuinely different — not better, *different*.

**Questions:**
- If a user described this to a friend, what would they say? Is that description compelling?
- What is the one thing this does that nothing else does? If you cannot name one, that is the problem.
- Is the differentiation durable, or can a competitor copy it in a week?
- Is the difference something users care about, or something only builders find interesting?

**Types of differentiation (strongest to weakest):**
1. **New capability:** does something previously impossible.
2. **10x improvement:** so much better on a key dimension that it changes behavior.
3. **New audience:** brings an existing capability to people who were excluded.
4. **New context:** works where existing solutions fail.
5. **Better UX:** same capability, dramatically simpler experience.
6. **Cheaper:** same thing, lower cost — weakest, easily competed away.

**Red flags:**
- Differentiation is entirely about technology, not user experience.
- "We're faster/cheaper/prettier" with no structural reason why.
- The differentiating feature is not the feature users care most about.

## Assumption Audit

For every direction, list assumptions in three categories.

### Must Be True (dealbreakers)
If wrong, the idea dies. Validate before building.

Example: "Users will share their data with us." If they will not, the product does not work.

### Should Be True (important)
Significantly affect success but do not kill the idea. You can adjust the approach if these are wrong.

Example: "Users prefer self-serve over talking to a person." If wrong, you need a different go-to-market, but the core product can still work.

### Might Be True (nice to have)
Secondary features or optimizations. Do not validate until the core is proven.

Example: "Users will want to share their results with teammates." A growth feature, not core value.

## Decision Framework

When choosing between directions, rank on this matrix:

|                    | High Feasibility | Low Feasibility |
|--------------------|-------------------|-----------------|
| **High Value**     | Do this first     | Worth the risk   |
| **Low Value**      | Only if trivial   | Don't do this    |

Use differentiation as the tiebreaker between options in the same quadrant.

## MVP Scoping Principles

When scoping the MVP for the chosen direction:

1. **One job, done well.** Nail exactly one user job — not three jobs done partially.
2. **The riskiest assumption first.** The MVP exists to test the assumption most likely to be wrong.
3. **Time-box, not feature-list.** "What can we build and test in [timeframe]?" beats "What features do we need?"
4. **The 'Not Doing' list is mandatory.** Name what you are cutting and why. This blocks scope creep and forces honest prioritization.
5. **If it's not embarrassing, you waited too long.** The first version should feel incomplete to the builder. If it does not, you over-built.
