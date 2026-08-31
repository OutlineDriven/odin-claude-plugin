---
name: lockstep-version-guard
description: 'Use when a human invokes the version guard at a release gate to check that all ten ODIN modules share one canonical release version. Reads release metadata, compares every version-bearing manifest against the canonical, and exits non-zero with a per-file listing on any mismatch. Don''t use for remote, credential, publish, deploy, or irreversible changes, or for editing release metadata.'
disable-model-invocation: true
---

# Lockstep version guard

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly invokes the guard at a release gate. |
| Authority | Read-only: inspect local release metadata without changing files, version control, credentials, paid services, published artifacts, deployments, or remote state. |
| Side effect | None; the check writes no project state. |
| Done | Exit 0 when every checked version equals the canonical version; otherwise exit 1 with a per-file listing. |

## Inputs

Supply the release-root directory. Its root package manifest must provide the canonical version, and its release catalog must enumerate the ten ODIN modules and their version-bearing manifests. No input is optional.

## Procedure

1. Resolve the supplied release root without changing the working tree. Reject a missing, unreadable, or non-directory root.
2. Read the canonical version from the root package manifest. Reject a missing, non-string, or empty version.
3. Read the release catalog and collect the version-bearing root, plugin, marketplace, skill-package, and module manifests it identifies. Require exactly ten distinct ODIN module entries; reject duplicate, missing, out-of-root, or non-file paths. Do not discover or add unrelated files to make the check pass.
4. Parse every collected file according to its declared data format and extract each release version field. Record the file path, field, parsed value, and whether it matches the canonical version. A missing, malformed, non-string, or empty field is a mismatch, not an assumed value.
5. Sort records by file path and field so repeated runs produce the same listing.
6. Exit 0 only if the ten-module coverage check passed and every record matches. Otherwise exit 1 and print every record, including matching records, so the release gate receives a complete per-file comparison.

## Failure and recovery
Input-boundary failure, catalog-coverage failure, path-boundary failure, parse failure, and version mismatch all stop the gate with exit 1. Preserve every record obtained before a failure and mark unreadable or invalid entries with their exact error; never substitute a version or report partial agreement as success. Because the procedure is read-only, recovery requires no rollback: correct the release metadata outside this guard, then invoke it again. If a complete per-file listing cannot be produced, return exit 1 with the records available and a `blocked` entry naming each inaccessible file or unresolved catalog error.

## Output
A deterministic per-file listing containing path, version field, observed value or exact error, canonical version, and match status, followed by exit 0 for complete lockstep or exit 1 for any mismatch, invalid input, incomplete ten-module coverage, or blocked read.

## Provenance

Clean-room adaptation of the lockstep release-version check in `nicobailon/visual-explainer` at revision `7163c3e10660912e0b89e1af465db9f387282b88`, originally represented by `scripts/check-versions.mjs`, package and plugin manifests, marketplace metadata, and skill metadata. Source license: MIT. The adaptation retains the canonical-version comparison, cross-manifest coverage, deterministic per-file mismatch reporting, and release-gate exit semantics while extending coverage to the ten-module ODIN catalog.
