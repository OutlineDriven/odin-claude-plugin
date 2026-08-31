---
name: lifecycle-diagram
description: 'Use when states, waits, retries, decisions, transitions, and terminals need a lifecycle view. Produces a fail-closed lifecycle JSON spec and self-contained interactive HTML topology. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Lifecycle diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to visualize states, statuses, retries, waiting conditions, decisions, success or failure terminals, or an entity or process lifecycle. |
| Authority | Reversible-local: write only the artifacts named under Side effect, into the output directory fixed in step 1; rollback is deleting exactly the paths written this run; no other mutation. |
| Side effect | One typed lifecycle JSON specification and one self-contained interactive HTML artifact, plus at most two visual-evidence image sidecars actually captured this run. |
| Done | Every requested legal transition and terminal state is represented in the topology without using cards or prose as a substitute, the specification validates fail-closed, delivery passes all checks, and the receipt and visual-review status are truthful. |

## Inputs

The user must supply these inputs; never invent them:

- Entity or process name.
- Every state with its kind (the user's facts about statuses, waits, recoverable failures, and terminals).
- Every legal transition between states.

Optional:

- Ordered phases and lanes.
- Transition guards (waiting conditions), decision conditions, and retry counts.
- Output directory and filenames; defaults are `<entity>.lifecycle.json` and `<entity>.lifecycle.html` in the current working directory.

## Procedure

1. Bound scope before any write: fix the output directory and the two filenames (defaults above). Every artifact of this run is written there and nowhere else. Done when: the output directory and both filenames are fixed.

2. Collect the lifecycle facts from the user. If a state, transition, guard, or retry count is missing, stop and ask. Never fabricate facts to fill a gap. Done when: all states, transitions, guards, and retry counts are collected from the user.

3. Write the typed lifecycle JSON specification with exactly this shape:

   ```json
   {
     "specVersion": "1",
     "title": "<entity or process name>",
     "phases": ["<ordered phase>"],
     "lanes": ["<lane>"],
     "states": [
       {
         "id": "<unique id>",
         "kind": "entry|active|waiting|recoverable|success-terminal|failure-terminal",
         "phase": "<one of phases>",
         "lane": "<one of lanes>",
         "summary": "<one line>",
         "outcome": "<success or failure; terminal states only>"
       }
     ],
     "transitions": [
       {
         "from": "<state id>",
         "to": "<state id>",
         "kind": "advance|retry|decision|recovery|abort",
         "when": "<guard or waiting condition>",
         "retries": 3
       }
     ]
   }
   ```

   `phases` holds 1-8 ordered entries; `lanes` holds 0-6 and may be omitted; `lane` is required on each state only when `lanes` exists; `summary` is optional; `when` is required on `decision` transitions; `retries` is allowed only on `retry` transitions and must be an integer from 1 to 99. Done when: the JSON specification is written with the exact shape and field constraints.

4. Validate the specification fail-closed; any violation blocks delivery:
   - Exactly one state of kind `entry`.
   - State ids are unique, and every `from`, `to`, `phase`, `lane`, and `outcome` value references a declared entry or an allowed literal.
   - Terminal states (`success-terminal`, `failure-terminal`) have no outgoing transitions and carry `outcome` bounded to `success` or `failure`, matching their kind; this is the bounded outcome column.
   - Every `recoverable` state has at least one outgoing `recovery` transition to an `active` or `waiting` state: a real transition back to an active state, never to itself or a terminal.
   - Every state is reachable from the entry state.
   - Nothing from the user's stated facts is absent: every requested legal transition and terminal appears, and nothing extra was invented.
   Done when: every validation rule passes, or a violation is identified and delivery is blocked.

5. Generate the HTML artifact as one self-contained file: inline CSS and vanilla JS only, zero external references (no CDN scripts, stylesheets, fonts, or images), with the validated specification embedded verbatim. Done when: the HTML is one self-contained file with zero external references and the spec embedded.

6. Render topology, not prose: one node per state and one directed edge per requested transition, laid out as the ordered phase columns; terminals placed in the bounded outcome column; lanes as rows when present; `recoverable` states show their recovery edge back to the active state; retry edges annotate their retry counts; decision edges show their guards. Cards, lists, or prose describing states never substitute for nodes and edges. Done when: node count equals state count, edge count equals transition count, and every terminal appears in the topology.

7. Make it interactive: hovering a node highlights it and its connected edges; clicking a node reveals its summary and the guards and retry counts of its transitions. HTML-escape every user-supplied string before interpolation and never splice one into script code. Done when: hover and click interactions work and every user-supplied string is HTML-escaped.

8. Optional visual evidence: only if a rendering or inspection capability is actually available, capture up to two image sidecars (for example one rendered screenshot) beside the HTML. Write a sidecar only when actually captured; never fabricate one. Done when: at most two sidecars are written (only when actually captured) or none are written.

9. Run the delivery checks; all must pass:
   - The specification passes the fail-closed rules and the verdict is recorded.
   - The HTML is one file and contains zero external references.
   - Rendered node count equals state count, edge count equals transition count, and every terminal state appears.
   - No user-stated state or transition is missing and none was invented.
   - Sidecars, if any, are within the two-file cap and were actually captured.
   Done when: every delivery check passes with its verdict recorded.

10. Report the receipt: each written path, the validation verdict, each check result, and the visual-review status - `reviewed` only when the artifact was actually rendered and inspected, otherwise `unreviewed`. Done when: the receipt is reported with every path, verdict, check result, and truthful visual-review status.

## Failure and recovery
- Missing facts: stop before any write and ask for the missing states or transitions.
- Invalid specification: fix and re-validate, or delete the invalid draft; never render HTML from an invalid specification.
- Impossible constraint: if self-containment or topology completeness cannot be met, keep the specification, report blocked with the exact unsatisfied requirement, and make no done claim.
- Failed delivery check: roll back by deleting exactly the paths written this run, then report the failing check verbatim.
- Never swallow an error and never report the done predicate as satisfied when a check failed.

## Output

Return the specification path, the HTML path, any sidecar paths, the validation verdict, the per-check delivery results, and a receipt whose visual-review status is truthfully `reviewed` or `unreviewed`.
