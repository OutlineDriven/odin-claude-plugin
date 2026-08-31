---
name: visual-diff-review
description: 'Use when asked to review a diff and produce a 7-section visual page: scope, before/after, risk, coupling, and merge recommendation, each cited from evidence, written to the diagrams directory and opened. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Visual diff review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Diff review of a branch, commit, range, PR, or working tree against main or master by default |
| Authority | Write only named local artifacts; rollback path stated before mutation |
| Side effect | Writes the 7-section review page to the diagrams directory; opens it |
| Done | Scope, before/after behavior, risk, coupling, and a merge recommendation all cited from evidence |

## Inputs

The diff target must be supplied: a branch name, commit hash or range, PR identifier, or working tree. The comparison base defaults to `main`; supply a named base only when it differs. The source is the live git diff of the named target against the named or default base.

## Procedure

1. **Collect.** Resolve the diff target to the named comparison base. Extract the full diff.
2. **Scope.** Enumerate every file and component affected. Classify the change surface.
3. **Before/After.** Describe the behavior before and after each hunk. Capture the delta in concrete terms.
4. **Risk.** Assess each risk dimension: correctness, performance, security, and compatibility. Cite evidence from the diff.
5. **Coupling.** Identify cross-component dependencies and side-effect surfaces within the diff.
6. **Merge recommendation.** State merge, defer, or reject with the specific evidence from steps 2–5.
7. **Render.** Write the 7-section review page to `diagrams/visual-diff-review.html`. Open it.

## Failure and recovery
- **Unresolvable diff target.** Report the exact name that failed and stop. Do not widen scope.
- **Empty diff.** Report that no changes were found and stop. The done predicate does not hold.
- **Unavailable external reference.** Mark the affected section as `INSUFFICIENT EVIDENCE` and continue. Do not fabricate citations.
- **Filesystem error on write.** Report the error and stop. Roll back any partial file. Do not proceed to open.

Partial results are acceptable only when each incomplete section is explicitly labeled. Silence is not a partial result.

## Output
A self-contained `diagrams/visual-diff-review.html` with these sections:

1. **Overview**: files changed, insertions, deletions, components touched.
2. **Before State**: behavior before each hunk.
3. **After State**: behavior after each hunk.
4. **Risk Assessment**: per-dimension risk cited from evidence.
5. **Coupling Analysis**: cross-component dependencies.
6. **Merge Recommendation**: concrete recommendation with evidence trail.
7. **Evidence Log**: every citation from the diff.

Done: every section cites evidence from the diff or is explicitly marked `INSUFFICIENT EVIDENCE`.

## Provenance

Origin: `nicobailon/visual-explainer` at commit `7163c3e10660912e0b89e1af465db9f387282b88`. License: MIT — MIT notice retained; expression reuse or clean-room rederivation permitted. Source paths: `plugins/visual-explainer/commands/diff-review.md`, `plugins/visual-explainer/SKILL.md`, `plugins/visual-explainer/references/css-patterns.md`, `plugins/visual-explainer/references/libraries.md`, `plugins/visual-explainer/references/responsive-nav.md`. Adaptation: ODIN 2.0 ODIN-CODE module remap; executable procedure derived from `diff-review.md`; 7-section structure from `SKILL.md`; CSS patterns from `css-patterns.md`; layout from `responsive-nav.md`.
