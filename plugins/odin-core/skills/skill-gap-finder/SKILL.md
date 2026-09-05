---
name: skill-gap-finder
description: 'Use when the user suspects no installed skill covers a task and wants proof. Names the owning skill or writes a missing-skill brief. Never routes or invokes the matched skill.'
---

# Skill gap finder

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user suspects no installed skill covers a task, or wants exhaustive proof that a task is a skill gap before requesting a new skill. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Consults the installed skill catalog; never invokes or routes to the matched skill. |
| Side effect | None. Catalog lookup only; no persistent writes. |
| Done | Either an owning skill is named with its trigger sentence (without invocation), or a missing-skill brief is produced proving no installed skill covers the task. |

## Inputs

1. The task description or user request that needs gap analysis.
2. The installed skill catalog, available at runtime through the host harness.

Both are required. If the catalog is unavailable, stop and report the blocker.

## Procedure

1. Extract the core action and domain from the task description. **Done when:** the core action and domain are identified.
2. Search the installed skill catalog exhaustively for skills whose trigger predicate could match the extracted action and domain. Test broad and narrow phrasings of the task to avoid false gaps. **Done when:** the matching set is enumerated with the search strategy recorded.
3. If one or more skills match, name the best-matching skill and quote its trigger sentence. Report the selection rationale. Do not invoke the skill or route the user to it: naming the owner is the terminal output. **Done when:** the owning skill is named with its trigger sentence and rationale, without invocation.
4. If no skill matches, produce a missing-skill brief containing: the task description, the exhaustive search strategy used and why it found no match, and the trigger predicate a new skill would need. **Done when:** the brief contains all three elements.
5. Never invent behavior, fork a near-duplicate, or widen scope. **Done when:** no invention, fork, or scope widening occurred.

## Failure and recovery
| Failure class | Rule |
|---|---|
| Ambiguous task | Stop. Ask the user to clarify the task before searching. |
| Catalog unavailable | Stop. Report that the catalog could not be read. Do not guess. |
| Multiple equal matches | Name all matching skills with their trigger sentences. Do not pick one. Report the overlap and let the user decide. |
| Near-duplicate detected | Produce a missing-skill brief instead of forking. Record the overlap. |

No partial results. If the search fails, the output is a brief or a user clarification request, never a best-effort invocation.

## Output
Either the owning skill name with its trigger sentence and selection rationale (without invocation), or a missing-skill brief with the task description, exhaustive search strategy, gap proof, and trigger predicate a new skill would need.
