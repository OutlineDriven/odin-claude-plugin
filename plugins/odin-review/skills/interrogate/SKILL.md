---
name: interrogate
description: 'Use when asked to "interrogate" or run an adversarial multi-model review of a supplied code artifact. Not for tasks that require source or remote-system changes.'
---

# Interrogate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Run adversarial multi-model review. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Read-only review fan-out. Output is chat-returned only; no mutation of any system state. |
| Done | Act/consider/note/dismiss verdict and agreement map returned. |

## Inputs

| Input | Required | Description |
|---|---|---|
| Code artifact | Yes | The code or document to review. Must be supplied in the conversation as text or a readable file path. |
| Review scope | Yes | The specific aspect, component, file, or question the review targets. |
| Rubric | Yes | The shared evaluation criteria all reviewing models use. |
| Lead judgment model | No | The model designated to synthesize a final position when models disagree. Defaults to the first reviewing model. |
| Reviewing model pool | No | The list of models to invoke adversarially. Must be at least two distinct models. |

## Procedure

1. Receive and validate the code artifact and review scope. If the artifact is unreadable or absent, halt and report `blocked: artifact missing or unreadable`. Done when: the artifact and review scope are received and validated, or a blocked result is reported.

2. Load the shared rubric. Confirm it defines concrete evaluation criteria. If the rubric is absent or defines no criteria, halt and report `blocked: rubric missing or invalid`. Done when: the rubric is loaded and confirmed to define concrete criteria, or a blocked result is reported.

3. Select at least two distinct models from the reviewing model pool. If fewer than two are available, halt and report `blocked: insufficient model pool`. Done when: at least two distinct models are selected, or a blocked result is reported.

4. Fan out one review request per model simultaneously. Send each model the same code artifact, review scope, and rubric. Do not share one model's output with another model before all reviews complete. Done when: one review request is sent to each selected model.

5. Collect all individual reviews. If any review fails to return, proceed with the available reviews and record the missing model in the failure log. Done when: all returned reviews are collected and missing models are recorded.

6. Build an agreement map: for each evaluation criterion in the rubric, record which models agreed, which dissented, and the substance of each position. Done when: the agreement map covers every rubric criterion with per-model positions.

7. Identify the lead judgment model from the pool or default to the first reviewing model. Request a synthesis from that model only. The synthesis must:
   - Acknowledge the full agreement map.
   - State a clear final verdict for each rubric criterion.
   - Mark any criterion where consensus was reached versus where it was not.
   - Recommend one of four actions: **act**, **consider**, **note**, or **dismiss**.
   Done when: the lead synthesis is requested with all four required elements.

8. If the lead synthesis fails, skip synthesis and return all individual reviews with the agreement map. Do not block on synthesis. Done when: the lead synthesis is received or skipped with individual reviews and agreement map returned.

9. Assemble the final report: verdict, agreement map, lead synthesis (if available), and any failure log. Return it as the terminal output. Done when: the final report is assembled and returned as terminal output.

## Failure and recovery
| Failure class | Partial-result rule | Blocked result |
|---|---|---|
| Artifact missing or unreadable | none | Halt; report `blocked: artifact missing or unreadable`. |
| Rubric missing or invalid | none | Halt; report `blocked: rubric missing or invalid`. |
| Fewer than two models available | none | Halt; report `blocked: insufficient model pool`. |
| One or more model reviews fail | Return available reviews; record missing models in failure log. | Never report full success when reviews are missing; always disclose the gap. |
| Lead synthesis fails | Skip synthesis; return all individual reviews and agreement map. | Do not block or report non-convergence on synthesis failure alone. |

## Output
A structured review report containing:

- Verdict: The act / consider / note / dismiss determination for each rubric criterion.
- Agreement map: Per-criterion model positions: agreement, dissent, and substance.
- Lead synthesis: The lead model's synthesis and final recommendation, if produced.
- Failure log: Any model that failed to return, with the criterion or scope it was assigned.
- Disposition recommendation: A final actionable next step derived from the aggregate verdict.
