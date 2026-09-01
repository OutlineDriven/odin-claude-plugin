# Naming and copy

Loaded for spec and action modes. Wording decisions made here are copy and UX ownership downstream; this file decides them at the product level.

- NC-01 Buttons name the verb and object. "Save draft", not "OK". A label that does not say what acts on what forces the user to guess.
- NC-02 Destructive labels name the loss. "Delete 14 messages", not "Confirm". The label carries the consequence so the confirmation dialog can carry the detail.
- NC-03 Sentence case for UI labels. Headings, buttons, and menu items use sentence case. Title case drift within one interface is a defect.
- NC-04 Errors state what happened, why, and what to do next. No blame, no codes without meaning, no "Something went wrong" without a next step.
- NC-05 No happy talk, no instructions describing the obvious. Cut welcome paragraphs and self-evident instructions. Copy survives only when it carries information the interface cannot.
- NC-06 One name per object across the product. A second name for the same object is a rename migration, not a synonym. Flag every divergence as a finding.
- NC-07 Confirmations state the consequence, not the mechanism. "This revokes access for 3 people" is a consequence; "This will execute the revoke operation" is a mechanism. Only the first helps the decision.
