---
name: lockstep-version-guard
description: 'Use when a human invokes the release gate to prove all 28 ODIN plugins share one canonical version. Emits a per-file comparison and exits non-zero on mismatch. Don''t use to edit release metadata or for remote, credential, publish, deploy, or irreversible changes.'
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

Supply the release root. The identity ledger `catalog/plugins.json` under it must provide the canonical `releaseVersion` and enumerate the 28 ODIN package members, each identifying its version-bearing `plugins/<id>/plugin.json` via its `directory` field. No input is optional.

## Procedure

1. Resolve the supplied release root without changing the working tree. Reject a missing, unreadable, or non-directory root. Done when: the release root is resolved and confirmed as a readable directory.

2. Read the canonical version from the `releaseVersion` field of `catalog/plugins.json`. Reject a missing, non-string, or empty version. Done when: the canonical version is read and confirmed as a non-empty string.

3. Read the `entries` array of `catalog/plugins.json` and collect the version-bearing manifest each entry identifies (`plugins/<id>/plugin.json` resolved from the entry's `directory` field). Require exactly 28 distinct ODIN package entries; reject duplicate, missing, out-of-root, or non-file paths. Do not discover or add unrelated files to make the check pass. Done when: the manifests for all 28 catalog entries are collected.

4. Parse every collected file according to its declared data format and extract each release version field. Record the file path, field, parsed value, and whether it matches the canonical version. A missing, malformed, non-string, or empty field is a mismatch, not an assumed value. Done when: every collected file is parsed and its version field is recorded with match status.

5. Sort records by file path and field so repeated runs produce the same listing. Done when: records are sorted by file path and field.

6. Exit 0 only if the catalog-coverage check passed (all 28 entries covered) and every record matches. Otherwise exit 1 and print every record, including matching records, so the release gate receives a complete per-file comparison. Done when: exit 0 (all match) or exit 1 (any mismatch) with the complete per-file listing printed.

## Failure and recovery
Input-boundary failure, catalog-coverage failure, path-boundary failure, parse failure, and version mismatch all stop the gate with exit 1. Preserve every record obtained before a failure and mark unreadable or invalid entries with their exact error; never substitute a version or report partial agreement as success. Because the procedure is read-only, recovery requires no rollback: correct the release metadata outside this guard, then invoke it again. If a complete per-file listing cannot be produced, return exit 1 with the records available and a `blocked` entry naming each inaccessible file or unresolved catalog error.

## Output

A deterministic per-file listing containing path, version field, observed value or exact error, canonical version, and match status, followed by exit 0 for complete lockstep or exit 1 for any mismatch, invalid input, incomplete catalog coverage, or blocked read.
