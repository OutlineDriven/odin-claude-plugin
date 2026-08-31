---
name: pre-send-sensitive-redaction
description: 'Use when session content is about to leave the device to the model provider on Analyze, this skill intercepts to detect and redact secrets and structured PII; only masked content reaches the provider. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Pre send sensitive redaction

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

1. **Structured-PII scan** — Run the structured-PII detector over sessionContent. Each detector is a regex with an optional accept function for checksum or format validation:
   - credit-card (rank 55, high): `\b\d(?:[ -]?\d){12,18}\b` + Luhn validation on the bare digits
   - ssn (rank 55, high): `\b(\d{3})-(\d{2})-(\d{4})\b` + area/group/serial validation (no 000, 666, 9xx area; no 00 group; no 0000 serial)
   - phone NA (rank 45, low): `(?<!\d)(?:\+?1[\s.-]?)?(?:\(\d{3}\)[\s.-]?|\d{3}[\s.-])\d{3}[\s.-]\d{4}(?!\d)` + 10-digit or +1 11-digit validation; the leading `(?<!\d)` prevents a trailing "1" in an SSN from growing into a phone match
   - phone E.164 (rank 45, low): `\+\d(?:[\s.-]?\d){7,14}(?!\d)` + 8–15 bare digits validation
   - email (rank 40, medium): `\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b`
   Guard each /g regex with per-scan lastIndex reset and a zero-length match guard.

2. **Secretlint scan** — Dynamically import `@secretlint/core`, `@secretlint/secretlint-rule-preset-recommend`, and `@secretlint/secretlint-rule-pattern`. Load lazily so the large rule set is not loaded at startup. Build the config with the preset (enabling the AWS access-key-ID sub-rule) plus a JWT pattern `eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}`. Run the engine over sessionContent. Map each result message back to a SensitiveMatch by slicing the raw value directly from sessionContent via the message range (never from the masked message text). Assign rank 90 and severity high to every secretlint match. Gracefully fall back to structured-PII-only if the engine fails to load.

3. **Overlap resolution** — Merge the two match sets and pass them through resolveOverlaps. Sort by descending severity (high=3, medium=2, low=1), then descending rank, then descending span length, then ascending start offset. Scan the ordered list and keep each match only if it does not overlap any kept match. Return the kept, non-overlapping, ascending-offset list.

4. **Build redactor** — Deduplicate matched values by exact string equality, filter out values shorter than 3 characters (MIN_REDACT_LEN: below this length literal replacement would mask too many innocent substrings), sort remaining values in descending length order, and return a function that replaces each value with `maskValue(value)`. maskValue shows the first 2 and last 2 characters of the value, with a fixed-width `••••` mask in the middle; values of 6 characters or fewer are fully masked.

5. **Apply redaction** — Run the redactor over sessionContent. Verify that no original matched value appears anywhere in the output.

6. **Eval corpus validation** — For every entry in eval:sensitive mustRedact: confirm it is absent from or masked in the output. For every entry in eval:sensitive mustKeep: confirm it is present unchanged in the output. If any mustRedact is unmasked or any mustKeep is missing, block the send and return blocked/non-converged with a redaction report.

7. **Send and report** — If redactions were made: send the redacted string, set redacted flag to true, and persist the redaction summary (SensitiveReport: counts per category, masked redactedValue, redactedSnippet per finding, severity counts; raw values are never persisted or transmitted). If no detections were made: send the original content and set redacted flag to false.

## Failure and recovery
| Failure class | Partial-result rule | Recovery |
|---|---|---|
| Eval corpus: mustRedact unmasked or mustKeep missing | Send blocked; no content transmitted | Return blocked/non-converged; do not retry without a corrected corpus |
| Secretlint engine load failure | Structured-PII-only scan continues; warning logged | Retry on next send; secretlint failures are reported separately |
| Detection-layer exception for a field | Field skipped; remaining fields processed | Continue scan; warn on the affected field only |
| Redaction produces a string that still contains a matched value | Send blocked | Return blocked/non-converged; log as a redactor defect |

## Output
| Output | Type |
|---|---|
| Redacted session content | string |
| redacted flag | boolean |
| SensitiveReport (only when redacted is true) | SensitiveReport — counts per SensitiveCategory, masked redactedValue, redactedSnippet, severity counts; raw values are absent |
| blocked/non-converged | Terminal classification when eval corpus validation fails |

## Provenance

| Field | Value |
|---|---|
| Origin | https://github.com/microsoft/skill-recorder |
| Revision | c7f2fe4402527a0eb7f4fc1b653bf438229bac61 |
| License | MIT — retain the copyright notice and this permission notice in all copies or substantial portions. README Trademarks section (lines 182–188): use of Microsoft trademarks or logos in modified versions must not cause confusion or imply Microsoft sponsorship. No copyleft obligation. |
| SPDX | MIT |
| Adaptation statement | Adapted: two-layer offline detection (structured-PII in-process regex + secretlint dynamic-import in-process linter), overlap resolution by severity/rank/length, shape-preserving mask, shape-validated REDACT-keep corpus, MIN_REDACT_LEN guard, longest-first literal redactor. Written as a self-contained ODIN skill. |
