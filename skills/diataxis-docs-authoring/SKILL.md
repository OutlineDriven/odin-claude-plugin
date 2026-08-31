---
name: diataxis-docs-authoring
description: 'Use when writing, structuring, or reviewing docs as tutorial, how-to, reference, or explanation. Each document becomes one Diataxis type with type-specific validation and cross-links. Not for collaborative drafting — use doc-coauthoring. No remote or irreversible changes.'
---

# Diataxis docs authoring

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Writing, structuring, or reviewing documentation; choosing between tutorial/how-to/reference/explanation; reorganizing existing docs. |
| Authority | Write only named local documentation files; rollback is restoring prior content from the pre-edit copy kept before mutation or from version control. |
| Side effect | Creates or restructures documentation files under the working tree. |
| Done | Each document is a single Diataxis type and passes its validation: tutorial (beginner completes unaided, visible result per step), how-to (experienced user completes without backtracking), reference (fact findable in <30s, entry format name->type->default->description->example), explanation (reader can restate the why); cross-links connect types. |

## Inputs

Required: the documentation file(s) to author or restructure, or a request naming the audience and subject. Optional: existing docs to reorganize and the target Diataxis type per document.

## Procedure

1. Classify each document into exactly one Diataxis type: tutorial, how-to, reference, or explanation. A document mixing types must be split into separate documents, one per type. **Done when:** every document is classified as exactly one type, with mixed-type documents split.

2. Bound scope: list every file to create or edit before any mutation. Keep a copy of prior content for rollback. **Done when:** the file list is enumerated and prior-content copies are kept.

3. Author each type:
   - Tutorial: learning-oriented; a beginner completes it unaided, and each step yields a visible result. State what the reader will learn, followed by ordered steps.
   - How-to: task-oriented; an experienced user completes it without backtracking. Give steps toward a concrete goal, with no theory.
   - Reference: information-oriented; a fact is findable in under 30 seconds. Each entry uses the format name -> type -> default -> description -> example.
   - Explanation: understanding-oriented; the reader can restate the why. Discuss design choices and context, with no steps.

   **Done when:** each document is authored to its type's orientation and structure.

4. Add cross-links between types: a tutorial links to the how-to and reference it prepares for; a how-to links to the reference and explanation behind it; reference and explanation link back to the practical types. **Done when:** cross-links connect each type to its related types.

5. Run the done validation for each document against its type predicate. Stop on the first document that fails rather than widening scope. **Done when:** every document passes its type predicate, or the skill stops on the first failure.

## Failure and recovery
- Mixed-type document: split into separate documents, one per type; do not merge types to save a file.
- Validation failure: keep the document at its classified type and fix the failing predicate; never reclassify to dodge a failed check.
- Partial result: emit the documents that pass validation and list each failing document with its failed predicate; do not mark the done state as held.
- Rollback: restore prior file content from the pre-edit copy or version control; never leave a half-restructured tree.

## Output
A set of documentation files, each a single Diataxis type passing its validation, with cross-links connecting the types, plus a list of any document that failed validation with its failed predicate, ordered classify → bound → author → cross-link → validate.

## Provenance

Origin: mcollina/skills, revision 856efd268ae85482d882f3d0bed869fd020b5c06, MIT. Mechanism adapted: the Diataxis four-type structure and per-type validation criteria are preserved; wording is clean-room.
