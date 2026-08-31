# Phase boundaries

A **phase** is a chunk of work inside a session, such as the interview, implementation, or review. The definition is deliberately fuzzy: a phase ends when you think, "ok, we're done with that."

The **phase boundary** is the gap between two phases and the only place to decide how to carry context forward. Do not make that decision mid-phase. Continue instead, or split the remaining work among subagents. Compressing mid-phase makes the agent lose the thread.

## The five options

| Option | What it does |
| ------ | ------------ |
| **Continue** | Stay in the session. No context switch at all. |
| **Discard** | Empty the context window and start from nothing. |
| **Hand off** | Write a portable Markdown artifact and seed a session anywhere with it. This is the `handoff` skill. |
| **Delegate** | Send the task to its own context window and get a report back. |
| **Compress** | Compact this context in place and seed a fresh session with the summary. |

Harnesses use different names for these options. Match each option to your harness's term; the decision stays the same.

## The tree

At the boundary, work from top to bottom. Stop at the first **yes**.

**1. Can you continue in this session?** The answer is yes when the next phase needs this phase as a **primary source**, or enough **smart zone** remains for the next phase to fit. The smart zone is the stretch of the context window where the model still reasons well, roughly the first 150k tokens; quality degrades beyond it, before the window fills. Interview → implementation is the standard yes because implementation needs the reasoning verbatim, not a summary. Continuing costs nothing and loses nothing, so rule it out before considering another option.

**2. Is the context irrelevant to what comes next?** If everything in this session, including the exploration, decisions, and dead ends, is disposable, **discard** it. Discarding takes no time and returns the whole window. It is not terminal because the old session stays resumable.

This mistake is one-way. Discard a *relevant* context and the **why** behind what you built is gone; reading the diff cannot restore it.

**3. Do you need to hand off?** Handing off is narrow. It earns its cost only when you are:

- swapping to a **different harness**,
- moving to a **different directory** or repository,
- sending the work to a **colleague**,
- or forking a side task you found **mid-phase** without derailing what you are doing.

This list is exhaustive. A handoff buys **portability**: a file that travels. If nothing is travelling, you do not need one.

**4. Can the task run unattended?** Is it scoped tightly enough to run with nobody steering? Then **delegate** it and leave this session untouched. Automated review is the standard case: the agent reads the diff and reports, and you are not needed while it does.

**5. Otherwise, compress.** Compress when the context is relevant, you are staying in the same harness and directory, and you need to remain involved. Pass an instruction with the compressed context so the summary retains what the next phase needs.

Compression is the **default, not the first choice**. It comes last because the four options above are cheaper or more precise. Starting with compression can produce a fresh session that is confidently wrong about a decision flattened by the summary.

## Primary and secondary sources

Every move except **Continue** turns a **primary source** into a **secondary source**: the session as it happened, replaced by a summary of it. The trade is always the same shape.

| Source | Information | Noise | Room to move |
| ------ | ----------- | ----- | ------------ |
| Primary (Continue) | Full | Lots | Little |
| Secondary (Hand off, Compress) | Lossy | Less | Lots |

This is why question 1 comes first. You only pay the lossiness when staying costs more than it saves.

## These are judgement calls

The questions are subjective: each requires judgement, and the same boundary can call for different choices on different days. Their value comes from asking them **in order** at the boundary, not in the middle of the work.
