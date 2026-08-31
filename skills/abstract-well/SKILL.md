---
name: abstract-well
description: 'Use when the user wants to classify abstractions as useful, bad, or busy and keep one shallow level. Classifies each by whether its cooked form is easier than its raw form, and selects one shallow level. Don''t use for tasks that require source or remote-system changes.'
---

# Abstract well

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user wants to classify a set of abstractions as useful, bad, or busy and keep one shallow level. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A chat-output classification and one-shallow-level recommendation. Nothing is written or changed. |
| Done | Every abstraction in scope is classified as useful, bad, busy, or unclassified, and a single shallow level is selected whose cooked form is easier than its raw form, or an explicit statement is returned that no useful level exists. |

## Inputs

- The abstractions to review. Supply either an explicit list of named abstractions (wrappers, helpers, interfaces, layers, adapters) or a scope (file, module, or function set) from which they are enumerated.
- The caller perspective: whose code uses each abstraction. If omitted, the caller is the immediate consumer of the abstraction.
- The underlying operation each abstraction wraps must be knowable so a raw form can be written. If it is not, the abstraction is marked unclassified.

## Procedure

1. Enumerate the abstractions in scope. If the user named them, use that list. If the user gave a scope, list every named wrapper, helper, interface, layer, or adapter inside it. Do not invent abstractions that the input does not name or contain. Done when: every abstraction in scope is listed.
2. For each abstraction, write two concrete forms at the same caller task: the raw form, the code the caller writes without the abstraction, and the cooked form, the code the caller writes with it. Keep both at the same task and the same caller. Done when: raw and cooked forms exist for every abstraction.
3. Classify each abstraction by comparing cooked form to raw form for that caller:
   - useful: the cooked form is easier than the raw form — fewer concepts, less ceremony, fewer places to get wrong.
   - bad: the cooked form is harder than the raw form — more indirection, more concepts, or more ceremony than the inline path.
   - busy: the cooked form is neither easier nor harder — it relocates complexity to another place without reducing total difficulty for the caller.
   - unclassified: the raw form cannot be written concretely because the underlying operation is unknown.
   Done when: every abstraction is classified as useful, bad, busy, or unclassified.
4. Select one shallow level to keep: the single useful abstraction whose cooked-form advantage over its raw form is largest. If no abstraction is useful, select none and state that explicitly. Done when: one useful abstraction is selected or an explicit statement that none exists.
5. Reject stacking: when two abstractions both sit between the same caller and the same raw operation, keep only the one with the larger cooked-form advantage; do not recommend keeping both layers. Done when: no two stacked abstractions both remain between the same caller and raw operation.

## Failure and recovery
- Ambiguous scope: if the abstractions cannot be enumerated from the input, stop and ask for an explicit list or a narrower scope. Do not guess which wrappers count.
- Unobservable raw form: if the underlying operation is unknown, mark the abstraction unclassified rather than inventing a raw form. An unclassified row carries no recommendation.
- No useful abstraction: a valid result, not a failure. Return the full classification with zero useful entries and no selected level.
- Non-mutation: the review changes nothing on disk. Re-running with different input produces an independent classification; there is no state to roll back.

## Output
A classification table with one row per abstraction: name, raw-form summary, cooked-form summary, and class (useful, bad, busy, or unclassified). Followed by the one selected shallow level with its cooked-versus-raw justification, or an explicit statement that no shallow level was selected because no abstraction is useful.
