---
name: humansense2system
description: 'Use when the user wants to compile taste and "this feels wrong" signals into machine-consumable tokens, rules, forbidden combinations, and examples. Not for remote or irreversible changes.'
---

# Humansense → system

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to compile taste and "this feels wrong" into tokens, rules, forbidden combinations, and examples |
| Authority | Reversible local: writes only the named local artifact; rollback is version control or undo. No remote mutation. |
| Side effect | One structured rule/pattern document written to the project shared docs or agent-rule folder |
| Done | At least one classified entry exists across any section (Forbidden, Tokens, Examples, or Rules) and the user has validated the artifact |

## Inputs

Must be supplied:
- **Target artifact path**, a file under the project shared docs or an agent-rule folder that stores the human's agent-facing patterns

Optional:
- **Existing patterns**, any prior rule/pattern document at the same path; the procedure merges into it

## Procedure

1. **Elicit raw taste signals.** Ask the user for concrete cases where the outcome felt wrong, off, or missing, rather than abstract preferences. Record each as a named signal with the observable behavior, not the inferred cause. Stop when the user says they have listed what they can.

2. **Classify each signal.** For every named signal, ask the user to place it into one bucket:
   - FORBIDDEN: must never happen
   - TOKEN: a named flag or category the agent can recognize and route on
   - EXAMPLE: a concrete input-output pair that defines what is acceptable
   - RULE: a conditional statement (if-then) that captures the boundary

   If the user cannot classify a signal, discard it rather than guess.

3. **Write the artifact.** If the target file does not yet exist, create it with the full template, including the top-level `# Agent Taste Guide — [project name]` heading:

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

   If the file already exists (the "Existing patterns" input was set or the file is present), do not write a second top-level heading. Append only the section blocks this run produced (`## Forbidden`, `## Tokens`, `## Examples`, `## Rules`) under the file's existing top-level heading, and merge each new block into its matching existing section when one already exists rather than duplicating the section header. Preserve existing content; do not delete or overwrite sections that are not being updated.

   **Done when:** at least one classified entry from step 2 is written, and a new file has exactly one top-level `# Agent Taste Guide` heading with all produced sections, or an existing file still has exactly one top-level heading with the produced sections merged into it. This gates step 3 only; the skill is done when step 4's validation passes, which the Contract `Done` row states.

4. **Validate with the user.** Read the artifact back. Ask: "Does this match what you meant?" Accept additions or corrections before declaring done.

## Failure and recovery
| Failure | Handling |
|---|---|
| No signals supplied | Declare partial-result: artifact is empty; do not claim done |
| User cannot classify a signal | Drop that signal; do not invent a bucket |
| File write fails | Roll back to the pre-write state; report the failure |
| User rejects the artifact | Return to Step 3 for the rejected section only |
| Artifact does not exist after Step 3 | The done predicate is false; do not close the skill as done |

## Output
One structured rule/pattern document at the user-supplied path. The document contains at least one entry across any of the four sections (Forbidden, Tokens, Examples, Rules). The skill is done only when the artifact exists and the user has validated it.
