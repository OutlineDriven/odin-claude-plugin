---
name: check-impl-against-spec
description: 'Use during PR review when checked-in spec context exists in the repository: compare the implementation against that spec. Fold material spec-drift findings into review.json or record an explicit close-match. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Check implementation against spec

## Contract

| Field | Bound contract |
|---|---|
| Trigger | During PR review when checked-in spec context exists in the repository (spec_context.md or equivalent checked-in spec files to check the implementation against). |
| Authority | Reversible local write limited to folding spec-drift findings into review.json. No GitHub posts, no separate report file, no repository mutation beyond review.json. |
| Side effect | Folds spec-drift findings into review.json. |
| Done | review.json contains material spec-drift findings or an explicit close-match. |

## Inputs

- `spec_context.md` (required): spec context to compare against. May include product spec content (intended behavior, acceptance criteria) and tech spec content (implementation details, file changes).
- `pr_diff.txt` (required): annotated diff for the PR.
- `pr_description.md` (optional): additional scope or rationale.
- Working tree (required): checked-out PR branch contents.

## Procedure

1. Read `spec_context.md` and extract the concrete commitments it makes: required behaviors (from the product spec), required files or subsystems to change (from the tech spec), stated constraints, and required follow-up steps, validation, or migrations.
2. Compare those commitments against the actual implementation in `pr_diff.txt` and the checked-out files.
3. Treat small implementation-level adjustments as acceptable when they preserve the spec's intent. Do not flag harmless differences in naming, structure, or low-level technique.
4. Flag a mismatch only when it is material: a required behavior in the product spec is missing; the implementation contradicts a spec decision; the change introduces significant unplanned scope; or a required validation, migration, or compatibility step from the tech spec is absent.
5. Fold spec-alignment findings into `review.json`: put broad spec-drift concerns in the review summary; add inline comments only when the mismatch can be tied to changed lines in the diff; treat material spec drift as at least an important concern.
6. If the implementation matches the spec closely enough, record an explicit close-match and add no comments just to mention alignment.

## Failure and recovery
- Missing spec context: the skill does not route. Stop without writing `review.json`.
- `spec_context.md` present but makes no concrete commitments: record an explicit close-match (nothing concrete to check against) rather than speculating about spec details that are not actually present.
- Ambiguous whether a difference is material: do not flag. Only flag mismatches tied to evidence in `spec_context.md` and the diff.
- Partial-result rule: never create a separate report file. All findings fold into `review.json`, or none are written.
- Non-mutation rule: do not post to GitHub directly. Do not require literal one-to-one implementation of the spec when the PR achieves the same outcome safely.

## Output
`review.json` updated with material spec-drift findings (broad concerns in the review summary, inline comments tied to changed diff lines) or an explicit close-match entry. No separate report file is produced.

## Provenance

- Origin: warpdotdev/common-skills, `.agents/skills/check-impl-against-spec/SKILL.md`.
- Revision: `f589e224907eda566c13755529f59db563090d14`.
- License: MIT — Copyright (c) 2026 Denver Technologies, Inc.
- Adaptation: clean-room rewrite in ODIN style. Spec-drift detection rides the review workflow instead of standing alone; the mechanism (extract commitments, compare against the implementation, flag only material drift, fold into review.json) is preserved.
