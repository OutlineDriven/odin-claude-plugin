---
name: pre-send-sensitive-redaction
description: 'Use on Analyze when session content is about to leave the device for the model provider. Detects and redacts secrets and structured PII so only masked content reaches the provider. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Pre-send sensitive redaction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Any session content is about to leave the device to the model provider on Analyze |
| Authority | reversible-local — redacted copy is written to renderer-visible state; raw values never reach renderer-visible state; write is the redaction artifact only |
| Side effect | Masks matched values (resolveOverlaps by severity/rank/length, maskValue preserves shape); no raw secret is written to renderer-visible state |
| Done | Only masked content reaches the provider; recall/precision continuously proven by the deterministic eval:sensitive corpus (mustRedact/mustKeep) |

## Inputs

| Input | Required | Description |
|---|---|---|
| sessionContent | Yes | The raw session content string about to be sent |
| eval:sensitive corpus | Yes | mustRedact entries (must be masked) and mustKeep entries (must not be masked) for recall/precision validation |

## Procedure

1. **Structured-PII scan.** Run the structured-PII detector over sessionContent. Each detector is a regex with an optional accept function for checksum or format validation: credit-card (rank 55, high): `\b\d(?:[ -]?\d){12,18}\b` plus Luhn validation on bare digits; ssn (rank 55, high): `\b(\d{3})-(\d{2})-(\d{4})\b` plus area/group/serial validation (no 000, 666, 9xx area; no 00 group; no 0000 serial); phone NA (rank 45, low): `(?<!\d)(?:\+?1[\s.-]?)?(?:\(\d{3}\)[\s.-]?|\d{3}[\s.-])\d{3}[\s.-]\d{4}(?!\d)` plus 10-digit or +1 11-digit validation; phone E.164 (rank 45, low): `\+\d(?:[\s.-]?\d){7,14}(?!\d)` plus 8–15 bare digits validation; email (rank 40, medium): `\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b`. Guard each /g regex with per-scan lastIndex reset and a zero-length match guard. Done when: all structured-PII detectors have scanned sessionContent with validation and regex guards applied.
2. **Secretlint scan.** Dynamically import `@secretlint/core`, `@secretlint/secretlint-rule-preset-recommend`, and `@secretlint/secretlint-rule-pattern`. Load lazily so the large rule set is not loaded at startup. Build the config with the preset (enabling the AWS access-key-ID sub-rule) plus a JWT pattern `eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}`. Run the engine over sessionContent. Map each result message back to a SensitiveMatch by slicing the raw value directly from sessionContent via the message range, never from masked message text. Assign rank 90 and severity high to every secretlint match. Gracefully fall back to structured-PII-only if the engine fails to load. Done when: secretlint matches are mapped from source ranges or the structured-PII-only fallback is active with a warning.
3. **Overlap resolution.** Merge the two match sets and pass them through resolveOverlaps. Sort by descending severity (high=3, medium=2, low=1), then descending rank, descending span length, and ascending start offset. Scan the ordered list and keep each match only if it does not overlap any kept match. Return the kept, non-overlapping, ascending-offset list. Done when: matches are non-overlapping and ordered by ascending offset.
4. **Build redactor.** Deduplicate matched values by exact string equality, filter out values shorter than 3 characters (MIN_REDACT_LEN prevents literal replacement from masking too many innocent substrings), sort remaining values in descending length order, and return a function that replaces each value with `maskValue(value)`. maskValue shows the first 2 and last 2 characters with a fixed-width `••••` middle mask; values of 6 characters or fewer are fully masked. Done when: the redactor is built from deduplicated values of at least 3 characters in descending length order.
5. **Apply redaction.** Run the redactor over sessionContent. Done when: no original matched value appears anywhere in the output.
6. **Eval corpus validation.** For every eval:sensitive mustRedact entry, confirm it is absent from or masked in the output. For every mustKeep entry, confirm it remains unchanged. If any mustRedact is unmasked or any mustKeep is missing, block the send and return blocked/non-converged with a redaction report. Done when: every mustRedact is masked and every mustKeep remains unchanged, or the send is blocked.
7. **Send and report.** If redactions were made, send the redacted string, set redacted to true, and persist the SensitiveReport: counts per category, masked redactedValue, redactedSnippet per finding, and severity counts; raw values are never persisted or transmitted. If no detections were made, send the original content and set redacted to false. Done when: only approved content is sent and the flag and report match the detection result.

## Failure and recovery

| Failure class | Partial-result rule | Recovery |
|---|---|---|
| Eval corpus: mustRedact unmasked or mustKeep missing | Send blocked; no content transmitted | Return blocked/non-converged; do not retry without a corrected corpus |
| Secretlint engine load failure | Structured-PII-only scan continues; warning logged | Retry on next send; secretlint failures are reported separately |
| Detection-layer exception for a field | Field skipped; remaining fields processed | Continue scan; warn on the affected field only |
| Redaction produces a string that still contains a matched value | Send blocked | Return blocked/non-converged; log as a redactor defect |

## Output
Redacted session content, `redacted` boolean, SensitiveReport only when redacted is true (category and severity counts, masked redactedValue, redactedSnippet; no raw values), or `blocked/non-converged` when corpus validation fails — content first, then flag, report, and terminal classification.

## Provenance

| Field | Value |
|---|---|
| Origin | https://github.com/microsoft/skill-recorder |
| Revision | c7f2fe4402527a0eb7f4fc1b653bf438229bac61 |
| License | MIT — retain the copyright notice and this permission notice in all copies or substantial portions. README Trademarks section (lines 182–188): use of Microsoft trademarks or logos in modified versions must not cause confusion or imply Microsoft sponsorship. No copyleft obligation. |
| SPDX | MIT |
| Adaptation statement | Adapted: two-layer offline detection (structured-PII in-process regex + secretlint dynamic-import in-process linter), overlap resolution by severity/rank/length, shape-preserving mask, shape-validated REDACT-keep corpus, MIN_REDACT_LEN guard, longest-first literal redactor. Written as a self-contained ODIN skill. |
