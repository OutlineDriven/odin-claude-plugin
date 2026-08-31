---
name: prompt-optimizer
description: 'Use when a user asks to improve, optimize, rewrite, tune, or port prompts, or build prompt evals: returns a shorter, reliable prompt validated on holdout cases, with target, success criteria, external context, and adapter notes. Don''t use for tasks that require source or remote-system changes.'
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

1. **Capture the source.** Record the exact prompt text or document. Note any quoted variable slots, numbered steps, conditional branches, or formatting constraints present in the original.

2. **Identify the target.** Confirm the single goal the optimized prompt must serve. Reject scope that would require two different outputs or two disjoint audiences.

3. **Extract behavior rules.** Enumerate every requirement the prompt must satisfy: output format, tone, constraints, handling of edge cases. Assign one named owner per rule. Collapse rules that overlap.

4. **Write the optimized prompt.** Apply these transformations:
   - Remove every sentence that does not change a routing, format, or constraint decision
   - Replace vague verbs with concrete imperatives
   - Flatten nested conditionals into numbered choices
   - Substitute one placeholder per variable slot; name the slot by its semantic role
   - Add a final residual-risks clause naming the prompt behaviors that are not guaranteed under distribution shift or novel inputs

5. **Build holdout cases.** Write three cases that the original prompt failed or would fail: one at each boundary (minimum valid input, maximum valid input, empty or malformed input). Verify the optimized prompt handles all three without contradictory outputs.

6. **Validate one owner per rule.** Confirm each behavior rule from step 3 is observable in the optimized prompt or in the holdout cases. Flag any rule that appears nowhere.

7. **Annotate adapter notes.** Record model-family-specific adjustments (token budget, instruction hierarchy, chat-template constraints) that would affect reliability if changed.

8. **Return the result.** Output the optimized prompt, target, success criteria (rule list), external context (adapter notes), and residual risks as a structured response.

## Failure and recovery
- **Ambiguous target:** Stop and ask the user to name one goal. Do not optimize for two goals.
- **No observable rule:** Stop if step 3 produces zero behavior rules. A prompt with no constraints is not an optimized prompt.
- **Holdout validation fails:** Return the failing case and the specific contradictory output. Do not declare the prompt done.
- **Owner gap:** If step 6 finds a rule with no observable trace, add it explicitly to the success criteria and revise the prompt.
- **Partial result:** If the user interrupts, return what is complete through step 4. Label it partial.

## Output
A structured response containing:
- The optimized prompt text
- Target statement
- Success criteria: named rule list with one owner per rule
- External context: adapter notes by model family or adapter
- Residual risks: behaviors not guaranteed under distribution shift
- Holdout validation summary (pass/fail per case)

## Provenance

Origin: getsentry/skills (Apache-2.0)
Revision: c2f99a5b04b4cd992ec3022d7c2c3e23e938d241
Adaptation: Prompt engineering and eval construction procedure extracted and restated as a self-contained, read-only ODIN 2.0 skill. No third-party expression copied. Apache-2.0 license.
