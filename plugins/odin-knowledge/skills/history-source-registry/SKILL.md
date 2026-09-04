---
name: history-source-registry
description: 'Use when a coding-agent session store is added or its format drifts, to document its layout, roles, quirks. Not for recalling a session: use history-recall. Not for peer transfer: use history-sync.'
---

# History source registry

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Maintainer or user adds or verifies a coding-agent session store when its format drifts. |
| Authority | Reversible local: writes only registry JSON, documentation pages, credential-free fixtures, and tests; rollback is version control. No remote mutation. |
| Side effect | Updates repository-owned registry, credential-free fixture, and tests. |
| Done | Observed discovery/layout/roles/time/quirks are documented; registry and page dates match; loader list cross-checks; a synthetic fixture passes; drift reports only the smallest redacted record, never a real transcript. |

## Inputs

- Session store path (required): filesystem path to the session store directory or file to register or re-verify.
- Store identifier (required): unique slug for the store in the registry.
- Existing registry path (required): path to the registry JSON file.
- Documentation root (required): path to the directory holding per-source documentation pages.
- Fixture root (required): path to the directory holding credential-free conformance fixtures.
- Test file path (required): path to the loader test file.

## Procedure

1. **Discover the store layout.** Read the session store directory. Identify the file structure: transcript files, metadata files, index files, and nested directories. Record the glob patterns that match transcript-bearing files.

2. **Extract roles and time handling.** Parse one representative transcript file. Identify speaker roles (user, assistant, system, tool). Identify the timestamp format and timezone. Note quirks: missing timestamps, role encoding differences, non-standard field names, or embedded tool-call structures.

3. **Bound scope.** Do not read real transcripts beyond the minimum needed to extract layout, roles, time, and quirks. Use the smallest representative record. Never copy or expose real transcript content into documentation or fixtures.

4. **Create or update the registry entry.** Add or modify the store entry in the registry JSON. Include these fields: identifier, discovery glob, layout summary, roles, time format, known quirks, page date, and documentation page path. Ensure the page date matches the current date.

5. **Write or update the documentation page.** Create or update the per-source markdown page under the documentation root. Explain how to discover transcripts, the file layout, role encoding, timestamp format, and known quirks. Use a synthetic redacted example, never a real transcript.

6. **Create or update the conformance fixture.** Under the fixture root, create or update a minimal synthetic fixture that exercises the store discovery glob and loader path. The fixture must contain no real credentials or transcript content. It must be loadable by the test harness.

7. **Cross-check the loader list.** Read the loader test file. Verify every identifier in the registry has a corresponding test case. If a test case is missing, add one that loads the synthetic fixture and asserts the expected layout fields.

8. **Run the conformance test.** Execute the loader test. Confirm the new or updated fixture passes. If it fails, diagnose the fixture or loader, fix within bounded scope, and re-run. Do not widen scope beyond the failing assertion.

9. **Verify drift detection.** If re-verifying an existing store whose format drifted, confirm the registry entry, documentation page, and fixture all reflect the new format. The drift report names only the changed fields using the smallest redacted record.

## Failure and recovery
- Store not found at path. Report the missing path. Do not create placeholder entries. Halt.
- Unparseable transcript format. Report the parse error with file path and first failing byte offset. Do not guess the format. Halt.
- Fixture fails conformance test. Report the failing assertion. Fix the fixture or loader within bounded scope of this store. If the fix requires loader code changes outside the test file, report the required change and halt for human review.
- Registry-page date mismatch. Correct the date before proceeding. This is a local write; revert by reverting the working tree.
- Real transcript leaked into fixture or docs. Delete the contaminated artifact. Rebuild from the synthetic redacted record. This is the only case where a step re-executes from scratch.

## Output
- Updated registry JSON with the new or revised entry.
- Updated or new per-source documentation page with synthetic examples.
- Updated or new conformance fixture under the fixture root.
- Passing loader test for the registered store.
- Drift report (if re-verifying) naming only changed fields with redacted examples.
