# Product design rules

Loaded in every mode. Cite these IDs for every finding and non-mechanical decision. If no ID here or in the mode's other references governs a decision, record a coverage gap instead of inventing one.

## Internal brief

The brief is required before any UI is proposed in shape, spec, and harden modes. Its fields:

- Job: the progress the user is trying to make, stated as a verb and object.
- Desired outcome: the observable end state that satisfies the job.
- Consequence: what changes for the user when the outcome holds, and what breaks if it fails.
- Object: the thing each action in scope affects.
- Action scope: what each action does and does not touch.
- Permissions: who may trigger each action and who may see its results.

If job, desired outcome, or consequence cannot be filled, stop and ask. Do not propose UI.

## Rules

- R-01 One primary action per view. Every view has exactly one primary action; everything else is visually subordinate. A view with two competing primaries has no decision behind it.
- R-02 Reversibility decides confirmation. An action the user can undo needs no confirmation. An irreversible action requires an explicit confirmation that names the consequence (what is lost, how much, for how long), never a bare "Are you sure?".
- R-03 Every reachable state has a defined rendering. Empty, loading, error, partial data, permission-denied, and offline or stale states are designed states. A surface that renders one of them by accident is a defect.
- R-04 No UI before the brief. If the job, desired outcome, or consequence is unstated, the correct move is to ask, not to sketch.
- R-05 Scope is explicit. Every action names the object it affects and what it does not affect. "Delete" without an object and a blast radius is an incomplete decision.
- R-06 Progressive disclosure. Show what the current decision needs and defer the rest. A surface that presents every option at once has transferred the prioritization work to the user.
- R-07 Errors name cause and next step. An error that states what happened, why, and what to do next is recoverable. A bare failure message is a dead end.
- R-08 Defaults serve the majority case. An option exists only when a real population differs from the default. Each setting without a demonstrated second population is a decision the product refused to make.
- R-09 Destructive and bulk actions report scope before execution. The user learns how many items, which items, and whether the action is reversible before committing, not after.
- R-10 Accessibility is a correctness property. Keyboard-reachable, screen-reader-conveyable, and at least 4.5:1 contrast for body text (3:1 for large text) are part of the product decision, not a later audit.
