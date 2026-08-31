---
name: prototype-logic
description: 'Use when someone needs to press buttons and watch state change to check a state-model, logic, or data-shape question. Produces a throwaway HTML demo whose isolated logic answers the question and folds into real code after validation. Not for visual design — use prototype.'
---

# Prototype logic

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human wants to check one state-model, logic, or data-shape question by pressing buttons and observing state changes, including when the driver is a non-developer. |
| Authority | Create or update only the named throwaway local HTML artifact and, after the human validates the logic, the named real-code target; commit only on a throwaway branch based on the supplied main branch. Do not push, delete existing work, or change production rendering. |
| Side effect | Write one self-contained throwaway HTML file, then fold only its validated pure logic module into the named real-code target. All changes remain locally recoverable by abandoning the throwaway branch or restoring its commits. |
| Done | The human-driven demo answers the stated question, the verdict and question are recorded in the throwaway-branch commit, and any validated logic module has been folded into the real code without shipping the HTML shell. |

## Inputs

Supply one state-model, logic, or data-shape question; the relevant state, actions, domain terms, and legal-transition rules; a path for the throwaway HTML file; and the main branch from which to create the throwaway branch. Supply representative scenarios or enough domain rules to derive a happy path, a tricky edge case, and an illegal-action attempt. A real-code target is required only after the human validates the module. Human feedback is optional until handoff and may request additional actions or scenarios.

## Procedure

1. Inspect the named paths and current version-control state. Bound the change to the throwaway HTML path and, only after validation, the supplied real-code target. Stop if either target would overwrite unrelated work, the main-branch basis is unavailable, or a required domain rule cannot be established without guessing. Done when: the change is bounded and no target overwrites unrelated work or guesses a domain rule.
2. Express the state model and the single question in one paragraph that will appear at the top of the demo. Keep the prototype about whether the logic feels right; do not create visual variants or alter a production rendering path. Done when: the state model and question are expressed in one paragraph.
3. Implement the logic as a portable pure module in one `<script>` block. Use a `(state, action) => state` reducer for discrete events over one value, an explicit state machine when legal actions depend on current state, pure functions over plain data when no implicit current state exists, or a module with a clear method surface only when the logic genuinely owns ongoing state. The module must not access the DOM, `document`, or event handlers; the page may call the module, but the module must not call back into the page. Done when: the logic is implemented as a pure module with no DOM access.
4. Build one HTML file with all HTML, CSS, and JavaScript inline and no framework, bundler, server, real database, tests, hypothetical generalization, or production shell. Mark the filename and visible page as throwaway. It must run by opening the file directly and remain portable as a standalone file. Done when: one self-contained HTML file is built and runs by direct open.
5. Lay out the page in this order: a title and one-line question; the complete relevant current state as labelled domain-language fields rather than raw JSON; free-play buttons for every action, all enabled so any order can be attempted; and one tab per guided walkthrough. Re-render after every click and identify what changed. Done when: the page layout follows the specified order and re-renders after every click.
6. Give every walkthrough a plain-language description and an ordered sequence of the same real action buttons used in free play. Each click performs its action and advances the walkthrough. Reset each tab to a known initial state so reruns are deterministic. Include a happy path, a tricky edge case, and an attempted illegal action. Done when: every walkthrough has a description, ordered actions, deterministic reset, and all three scenario classes.
7. Keep state in memory unless persistence is the question. If persistence is under examination, use only a separately named scratch target that explicitly says it must be wiped, and include that target in the bounded local scope before writing it. Done when: state is kept in memory or persistence uses a named scratch target in scope.
8. Open the standalone file, exercise free play and all three scenario classes, and confirm that every action visibly produces the modeled state transition, including rejection or handling of the illegal action. Repair only defects that prevent the demo from answering the stated question. Done when: free play and all three scenario classes produce the modeled transitions.
9. Hand the runnable file to the human to drive. Add actions or scenarios only when that feedback requests them; do not infer broader scope. Done when: the human is handed the runnable file.
10. After the human settles the question, record the exact question and verdict in the commit that adds the demo on a throwaway branch based on the supplied main branch. Do not push. If the verdict validates the module, fold that module—not the HTML shell—into the supplied real-code target and verify the same settled transitions there. Done when: the question and verdict are recorded in a throwaway-branch commit, and validated logic is folded into the real-code target.

## Failure and recovery
- Invalid or incomplete model: If state, actions, legal transitions, or the question remain ambiguous, make no speculative transition and return `blocked` with the missing rule.
- Scope or worktree conflict: If a named write would overwrite existing work, require deletion, touch production rendering, or exceed the bounded paths, make no such write and return `blocked` with the conflicting path and intended change.
- Unrunnable or incorrect demo: If the standalone file fails to open, a button does not invoke the isolated module, state is not fully visible, a walkthrough is nondeterministic, or an expected transition is wrong, do not claim a verdict. Leave the last runnable local artifact intact and return `non-converged` with the failed scenario and observed state.
- Human validation unavailable or negative: Preserve the throwaway demo as the partial result, do not fold logic into real code, and return `blocked` with the unanswered question or rejected behavior.
- Integration failure: If validated logic cannot preserve the settled transitions in the named real-code target, restore that target from version control while retaining the throwaway branch and return `non-converged` with the failing transition.
- Rollback: Abandon the unpushed throwaway branch or restore its local commits to remove the demo; restore the named real-code target from version control if integration fails. Never delete unrelated work or hide an error behind a success claim.

## Output
Return the standalone throwaway HTML path, the state-model question, the exercised happy-path, edge-case, and illegal-action scenarios, their observed transitions, and one terminal classification: `validated`, `blocked`, or `non-converged`. For `validated`, also return the human verdict, the local throwaway-branch commit, and the real-code target containing the validated module. Never report or ship the HTML shell as production code.
