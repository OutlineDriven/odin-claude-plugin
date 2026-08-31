---
name: humansense2system
description: 'Use when the user wants to compile taste and "this feels wrong" signals into machine-consumable tokens, rules, forbidden combinations, and examples. Elicits concrete cases, classifies each into one of four buckets, and writes a structured rule/pattern document. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Humansense → system

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to compile taste and "this feels wrong" into tokens, rules, forbidden combinations, and examples |
| Authority | reversible-local: write only the named local artifact; state the rollback path |
| Side effect | One structured rule/pattern document written to the project shared docs or agent-rule folder |
| Done | At least one classified entry exists across any section (Forbidden, Tokens, Examples, or Rules) and the user has validated the artifact |

## Inputs

Must be supplied:
- **Target artifact path** — a file under the project shared docs or an agent-rule folder that stores the human's agent-facing patterns

Optional:
- **Existing patterns** — any prior rule/pattern document at the same path; the procedure merges into it

## Procedure

1. **Elicit raw taste signals.** Ask the user for concrete cases where the outcome felt wrong, off, or missing, rather than abstract preferences. Record each as a named signal with the observable behavior, not the inferred cause. Stop when the user says they have listed what they can.

2. **Classify each signal.** For every named signal, ask the user to place it into one bucket:
   - **FORBIDDEN**: must never happen
   - **TOKEN**: a named flag or category the agent can recognize and route on
   - **EXAMPLE**: a concrete input-output pair that defines what is acceptable
   - **RULE**: a conditional statement (if-then) that captures the boundary

   If the user cannot classify a signal, discard it rather than guess.

3. **Write the artifact.** Create or append to the target file using this structure:

   ```
   # Agent Taste Guide — [project name]

   ## Forbidden
   - [ONE LINE: observable behavior that must never occur]

   ## Tokens
   - `[token-name]`: description of what the agent should recognize and route on

   ## Examples
   ### Correct
   - [concrete input → concrete acceptable output]
   ### Incorrect
   - [concrete input → concrete wrong output]

   ## Rules
   - [if condition, then behavior]
   ```
   Preserve existing content. Do not delete or overwrite sections that are not being updated.

4. **Validate with the user.** Read the artifact back. Ask: "Does this match what you meant?" Accept additions or corrections before declaring done.

## Failure and recovery
| Failure | Handling |
|---|---|
| No signals supplied | Declare partial-result: artifact is empty; do not claim done |
| User cannot classify a signal | Drop that signal; do not invent a bucket |
| File write fails | Roll back to the pre-write state; report the failure |
| User rejects the artifact | Return to Step 2 for the rejected section only |
| Artifact does not exist after Step 3 | The done predicate is false; do not close the skill as done |

## Output
One structured rule/pattern document at the user-supplied path. The document contains at least one entry across any of the four sections (Forbidden, Tokens, Examples, Rules). The skill is done only when the artifact exists and the user has validated it.
