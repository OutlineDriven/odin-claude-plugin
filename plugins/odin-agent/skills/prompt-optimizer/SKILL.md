---
name: prompt-optimizer
description: 'Use when asked to improve, optimize, rewrite, tune, or port prompts, or build prompt evals. Returns a shorter, reliable prompt validated on holdout cases with target, success criteria, external context, and adapter notes.'
---

# Prompt optimizer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to improve, optimize, rewrite, tune, or port prompts, or build prompt evals |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | Chat output returns an optimized prompt with target, success criteria, external context, and adapter notes |
| Done | Shorter, reliable prompt validated on holdout cases with one owner per behavior rule and residual risks |

## Inputs

Required:
- The source prompt text or document to optimize
- The target task or goal the prompt must serve

Optional:
- Known failure cases or error patterns from prior runs
- Model family or adapter context (e.g., Claude, GPT-4, Gemini)
- Evaluation criteria the user already accepts

## Procedure

1. **Capture the source.** Record the exact prompt text or document. Note any quoted variable slots, numbered steps, conditional branches, or formatting constraints present in the original. Done when: the source prompt is recorded with all structural features noted.
2. **Identify the target.** Confirm the single goal the optimized prompt must serve. Reject scope that would require two different outputs or two disjoint audiences. Done when: a single goal is confirmed or scope is rejected.
3. **Extract behavior rules.** Enumerate every requirement the prompt must satisfy: output format, tone, constraints, handling of edge cases. Assign one named owner per rule. Collapse rules that overlap. Done when: behavior rules are enumerated with one named owner per rule and overlaps collapsed.
4. **Write the optimized prompt.** Apply these transformations:
   - Remove every sentence that does not change a routing, format, or constraint decision
   - Replace vague verbs with concrete imperatives
   - Flatten nested conditionals into numbered choices
   - Substitute one placeholder per variable slot; name the slot by its semantic role
   - Add a final residual-risks clause naming the prompt behaviors that are not guaranteed under distribution shift or novel inputs
   Done when: the optimized prompt applies all transformations and includes a residual-risks clause.
5. **Build holdout cases.** Write three cases on which the original prompt failed or would fail: one at each boundary (minimum valid input, maximum valid input, empty or malformed input). Verify the optimized prompt handles all three without contradictory outputs. Done when: three holdout cases are written and verified against the optimized prompt.
6. **Validate one owner per rule.** Confirm each behavior rule from step 3 is observable in the optimized prompt or in the holdout cases. Flag any rule that appears nowhere. Done when: every behavior rule is observable in the prompt or holdout cases, or unobservable rules are flagged.
7. **Annotate adapter notes.** Record model-family-specific adjustments (token budget, instruction hierarchy, chat-template constraints) that would affect reliability if changed. Done when: adapter notes are recorded for each model family.
8. **Return the result.** Output the optimized prompt, target, success criteria (rule list), external context (adapter notes), residual risks, and holdout validation summary as a structured response. Done when: the structured response is returned with all six elements.

## Failure and recovery
- Ambiguous target: Stop and ask the user to name one goal. Do not optimize for two goals.
- No observable rule: Stop if step 3 produces zero behavior rules. A prompt with no constraints is not an optimized prompt.
- Holdout validation fails: Return the failing case and the specific contradictory output. Do not declare the prompt done.
- Owner gap: If step 6 finds a rule with no observable trace, add it explicitly to the success criteria and revise the prompt.
- Partial result: If the user interrupts, return what is complete through step 4. Label it partial.

## Output
A structured response with optimized prompt text, target statement, success criteria, external context, residual risks, and holdout validation summary, in that order.
