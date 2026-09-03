---
name: open-source-license-selection
description: 'Use when the user asks to choose, reconcile, or apply an open-source license and package metadata. Classifies candidates using standard OSI families, checks dependency license compatibility against the reciprocity goal, and when requested applies the chosen license atomically across LICENSE, package metadata, and README. Not for readiness auditing.'
---

# Open source license selection

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to choose, reconcile, or apply an open-source license and associated package metadata for a repository or non-code artifact. |
| Authority | Reversible local: write only LICENSE, package manager metadata, and README. Rollback is a VCS revert or user file restoration. |
| Side effect | Recommend a license with tradeoffs and, when requested, update LICENSE, package metadata, and README consistently in a single atomic pass. |
| Done | The selected license fits the stated distribution and reciprocity goals, rights and third-party constraints are surfaced, and LICENSE, package metadata, and README agree under the chosen SPDX ID. |

## Inputs

- Distribution intent (required): how the artifact will be distributed.
- Reciprocity goal (required): permissive, weak-copyleft, or strong-copyleft.
- Existing license (optional): current LICENSE file or declared license in package metadata.
- Dependency licenses (optional): third-party dependency licenses from lockfiles or the dependency graph.

## Procedure

1. Gather the artifact's distribution intent, reciprocity goal, and any existing license declarations. Read the existing LICENSE file and any declared license in package manager files (`package.json`, `Cargo.toml`, `pyproject.toml`, `setup.cfg`). Done when: intent, reciprocity goal, and existing declarations are recorded or confirmed absent.
2. Read dependency lockfiles to evaluate license compatibility against the stated reciprocity goal. Bound the transitive scope explicitly: check direct dependencies and their transitive closure as reported by the lockfile. Record which dependencies were checked and which were unavailable. Done when: dependency licenses are collected within the stated scope or confirmed absent.
3. Classify candidate licenses using standard OSI families:
   - Permissive: MIT, BSD-2-Clause, BSD-3-Clause, Apache-2.0.
   - Weak-copyleft: LGPL-3.0, MPL-2.0, EPL-2.0.
   - Strong-copyleft: GPL-3.0, AGPL-3.0.
   Done when: relevant license families are classified.
4. Recommend the best-fit license with: the decision, reasoning, tradeoffs, key obligations, compatibility notes, attribution guidance, and the exact SPDX License Identifier. Compare each viable license against the stated goal on attribution burden, share-alike propagation, patent grant, trademark policy, and compatibility with the checked dependencies. Done when: the recommendation includes decision, reasoning, tradeoffs, obligations, compatibility, attribution, and SPDX ID.
5. If the user requests application, apply the chosen license atomically. Write all files before confirming success:
   a. Write the LICENSE file with the license text for the chosen SPDX Identifier.
   b. Write the SPDX License Identifier into package metadata (`package.json` license field, `Cargo.toml` license field, `pyproject.toml` license field with SPDX expression, `setup.cfg` license field).
   c. Update the README license statement to reflect the chosen license, or add one if absent.
   Validate before writing: license text is present and matches the chosen SPDX ID, package manager format is correct, SPDX expression is valid, and no conflict exists with an already-declared incompatible license. If any file fails to write, revert all written files and report the failure. Done when: LICENSE, package metadata, and README are all written, consistent under the chosen SPDX ID, and file paths are returned for verification.

## Failure and recovery

- Unresolvable dependency license conflict: return the recommendation with the conflict named. Do not write files.
- Unretrievable license text: return the full recommendation with manual application steps. Do not write files.
- Invalid SPDX expression or unrecognized license identifier: stop. Name the invalid expression. Do not write files.
- Partial write: if any file fails to write during application, revert all files written so far and report the failure. Never leave LICENSE, package metadata, and README in an inconsistent state.
- Incompatible existing declaration: surface the contradiction. Do not write files that would conflict.

## Output

Either a recommendation only (chosen license, reasoning, tradeoffs, obligations, compatibility, attribution, SPDX ID, manual application steps) or a full application (written file paths, chosen license, SPDX ID, consistency statement). No partial or inconsistent write is ever returned as success.
