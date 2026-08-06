# Phase boundaries

A **phase** is a chunk of work inside a session — the interview, the implementation, the review. The definition is fuzzy on purpose: a phase ends when you think *"ok, we're done with that"*.

The **phase boundary** is the gap between two phases, and it is the only place this decision belongs. Mid-phase there is no decision to make: continue, or split the remaining work into subagents. Compressing mid-phase makes the agent lose the thread.

## The five options

| Option | What it does |
| ------ | ------------ |
| **Continue** | Stay in the session. No context switch at all. |
| **Discard** | Empty the context window and start from nothing. |
| **Hand off** | Write a portable Markdown artifact and seed a session anywhere with it. This is the `handoff` skill. |
| **Delegate** | Send the task to its own context window and get a report back. |
| **Compress** | Compact this context in place and seed a fresh session with the summary. |

Every harness spells these differently. Match the option to whatever your harness calls it; the decision is the same either way.

## The tree

Work top to bottom at the boundary. The first **yes** wins.

**1. Can you continue in this session?** Two things make the answer yes: the next phase needs this phase as a **primary source**, or enough **smart zone** is left for the next phase to fit. The smart zone is the stretch of the context window where the model still reasons well, roughly the first 150k tokens; past it, quality degrades before the window fills. Interview → implementation is the standard yes, because the implementation wants the reasoning verbatim rather than a summary of it. Continuing costs nothing and loses nothing, so rule it out before anything else.

**2. Is the context irrelevant to what comes next?** Is everything in this session — the exploration, the decisions, the dead ends — disposable? Then **discard**. It is the cheapest move on the board: it takes no time and hands back the whole window, and it is not terminal, because the old session stays resumable.

Getting this one wrong is one-way. Discard a *relevant* context and the **why** behind what you built is gone; reading the diff back does not return it.

**3. Do you need to hand off?** Handing off is narrow. It earns its cost only when you are:

- swapping to a **different harness**,
- moving to a **different directory** or repository,
- sending the work to a **colleague**,
- or forking a side task you found **mid-phase** without derailing what you are doing.

That list is the whole clause. What a handoff buys is **portability**: a file that travels. If nothing is travelling, you do not need one.

**4. Can the task run unattended?** Is it scoped tightly enough to run with nobody steering? Then **delegate** it and leave this session untouched. Automated review is the standard case: the agent reads the diff and reports, and you are not needed while it does.

**5. Otherwise, compress.** Relevant context, same harness, same directory, and you need to stay in the loop — this is where the tree lands, and it lands here often. Pass an instruction along with it so the summary keeps what the next phase needs.

Compression is the **default, not the first reach**. It sits at the bottom because the four questions above it are all cheaper or more precise. The failure mode when people start here is a fresh session that is confidently wrong about a decision the summary flattened.

## Primary and secondary sources

Every move except **Continue** turns a **primary source** into a **secondary source**: the session as it happened, replaced by a summary of it. The trade is always the same shape.

| Source | Information | Noise | Room to move |
| ------ | ----------- | ----- | ------------ |
| Primary (Continue) | Full | Lots | Little |
| Secondary (Hand off, Compress) | Lossy | Less | Lots |

This is why question 1 comes first. You only pay the lossiness when staying costs more than it saves.

## These are judgement calls

The questions are not objective — each has taste in it, and the same boundary can go two ways on two days. The value is in asking them **in order**, at the boundary rather than in the middle of the work.
