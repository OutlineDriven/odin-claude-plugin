---
name: open-source-license-selection
description: 'Use when the user asks to choose, reconcile, or apply an open-source license and package metadata, recommend a license with tradeoffs and, when requested, update license files, SPDX metadata, and README statements consistently. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Open source license selection

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to choose, reconcile, or apply an open-source license and associated package metadata for a repository or non-code artifact. |
| Authority | Reversible local: write only named local artifacts; rollback is a VCS revert or user file restoration. |
| Side effect | Recommend a license with tradeoffs and, when requested, update LICENSE, package manager metadata, and README statements consistently. |
| Done | The selected license fits the stated distribution and reciprocity goals, rights and third-party constraints are surfaced, and LICENSE, package metadata, and README agree. |

## Inputs

Must be supplied: the artifact (repository, package, or non-code project) and its distribution intent.

Must be supplied: reciprocity goal (permissive, weak-copyleft, strong-copyleft, or proprietary-trade-secret).

Optional: existing license declaration, third-party dependency licenses, trademark policy, patent grant requirement, security disclosure policy, jurisdiction or export restriction.

## Procedure

1. Gather the user's stated distribution intent and reciprocity goal.
2. If present, read the existing LICENSE file and any declared license in package manager files (package.json, Cargo.toml, pyproject.toml, setup.cfg, pyproject.toml) to identify any existing license constraint.
3. Collect third-party dependency licenses from the dependency graph or lock file.
4. Surface any conflicts between the existing license declarations and the stated goal.
5. Classify license families relevant to the distribution intent and reciprocity goal:
   - Permissive: MIT, BSD-2-Clause, BSD-3-Clause, Apache-2.0.
   - Strong-copyleft: GPL-3.0, AGPL-3.0.
   - Weak-copyleft: LGPL-3.0, MPL-2.0, EPL-2.0.
   - Proprietary-compatible: CDDL-1.0, OSL-3.0, EUPL-1.2.
6. Compare each viable license against the stated goal on: attribution burden, share-alike propagation, patent grant, trademark policy, security disclosure, and compatibility with third-party dependencies.
7. Recommend the best-fit license with: the decision, reasoning, tradeoffs, key obligations, compatibility notes, attribution guidance, and the exact SPDX License Identifier.
8. If the user requests an update:
   a. Write the LICENSE file with the license text for the chosen SPDX Identifier.
   b. Write the SPDX License Identifier into package.json ("license" field), Cargo.toml (license field), pyproject.toml (license field with SPDX expression), and setup.cfg (license = field with SPDX expression).
   c. Update the README license statement to reflect the chosen license, or add one if absent.
9. Before writing any file, validate: license text is present and matches the chosen SPDX Identifier, package manager format is correct, SPDX expression is valid, and no conflict exists with an already-declared incompatible license.
10. Return the written file paths for user verification.

## Failure and recovery
**Unretrievable license text**: return the full recommendation with manual application steps. Do not write files.

**Incompatible existing declaration**: surface the contradiction. Do not write files that would conflict.

**Invalid SPDX expression or unrecognized license identifier**: return partial result: write valid files, flag invalid ones, provide manual fix steps.

**Partial result**: if some files write and others fail, return the written paths and explicitly list the unwritten files.

**Rollback**: authority is reversible-local; written files are recoverable via VCS revert or user action.

**Non-converged**: stop and return the recommendation without writes if any failure class applies.

## Output
Either:

- **Recommendation only**: the chosen license with reasoning, tradeoffs, obligations, compatibility notes, attribution guidance, and step-by-step metadata update instructions for manual application.

- **Full update**: all written file paths, the chosen license, SPDX Identifier, and a statement that LICENSE, package metadata, and README are consistent under the selected license.

Both outputs include the file paths written or recommended for manual application, and the provenance section.

## Provenance

Adapted from the Trail of Bits open-sourcing skill (source-trail-of-bits:trail-p4-008), origin https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3, licensed CC-BY-SA-4.0. Adaptation preserves Trail of Bits attribution and source link, marks modifications, applies ShareAlike to adaptations, claims no trademark rights, and does not reuse trail-of-bits-mark.svg as branding. Procedure is a clean-room re-derivation of the license-family decision logic and file-update workflow from the source; no source expression is copied.
