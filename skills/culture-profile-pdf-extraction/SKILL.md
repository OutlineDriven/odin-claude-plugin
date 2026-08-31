---
name: culture-profile-pdf-extraction
description: 'Use when a Culture Index PDF must be converted into verified structured profile data before analysis. Machine-extracts trait dots, arrows, energy units, identity, and archetype and spot-checks them against the PDF without visual estimation. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Culture profile PDF extraction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A Culture Index PDF must be converted into verified structured profile data before analysis. |
| Authority | Reversible local write: emit extracted JSON and a human-checkable verification summary; optionally write to a user-selected output file. No PDF, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Extracted Culture Index JSON and a verification summary on local disk or stdout; optionally a user-selected output file. |
| Done | Trait dots, arrows, energy units, identity, and archetype are machine-extracted and spot-checked against the PDF without visual estimation. |

## Inputs

- A Culture Index profile PDF (required).
- Optional: path to an already-extracted JSON for the same profile (same directory as the PDF, or user-supplied). When present, it is used directly and extraction is skipped.
- Optional: output file path for the extracted JSON (defaults to stdout).

## Procedure

1. If a JSON for the same profile already exists (same directory as the PDF, or a user-supplied path), use it directly and stop; do not re-extract.
2. Verify prerequisites for programmatic extraction: `uv`, `poppler` (`pdftoppm`), and `tesseract`. If any is missing, install it (`brew install uv poppler tesseract` on macOS, or `apt install uv poppler-utils tesseract-ocr` on Ubuntu) or instruct the user to install it. Do not proceed until all three are present.
3. Extract programmatically with computer vision — never by visual estimation. Render the PDF pages to images with poppler, detect each trait dot and the red arrow position by color and contour with OpenCV, OCR the name, archetype, and Energy Unit values with tesseract, and compute each trait value as `[absolute, relative_to_arrow]` (arrow-relative for A, B, C, D; `null` relative for L and I). Run the extraction with verification enabled so it emits an ASCII verification summary alongside the JSON.
4. Spot-check the verification summary against the PDF: confirm each trait dot sits in the same column as the dot on the PDF, the arrow marker aligns with the red arrow on each chart, and the EU values match what is displayed on the PDF.
5. When both Survey and Job graphs are present, compute energy utilization as `(Job EU / Survey EU) × 100` and classify status: Healthy (70–130%), STRESS (>130%, burnout risk), or FRUSTRATION (<70%, flight risk).
6. Emit the JSON to stdout or the user-selected output file.

## Failure and recovery
- Missing prerequisite (`uv`, `poppler`, or `tesseract` not found): install the dependency or instruct the user to install it. Never fall back to visual estimation, which has a 20–30% error rate and violates the done predicate.
- Computer-vision extraction failure: report the error verbatim. Do not substitute vision-derived values. No partial JSON is emitted; the PDF is not mutated.
- Verification mismatch: if any spot-checked dot, arrow, or EU value does not match the PDF, the extraction is wrong. Re-run extraction; if it still mismatches, report the mismatch and stop without emitting JSON.
- Blocked or non-converged result: report the failing step, the missing dependency or mismatch, and that no JSON was produced. Never claim the done predicate holds when extraction or spot-check failed.

## Output
- A JSON object with: `name`; `archetype`; `header`; `survey` and `job`, each containing `eu` (integer), `arrow` (tenths), and traits `a`, `b`, `c`, `d`, `logic`, `ingenuity` as `[absolute, relative_to_arrow]` (relative `null` for L and I); and `analysis` with `energy_utilization` (percent) and `status` (`healthy`, `stress`, or `frustration`).
- An ASCII verification summary chart matching the PDF layout (trait rows with dot markers, arrow position, EU values, energy utilization) for human spot-check.
- JSON written to stdout or the user-selected output file.

## Provenance

Adapted from Trail of Bits skills (https://github.com/trailofbits/skills) at revision d1f1575cff97816e5cc08af66cd2506099c681d3, workflow `plugins/culture-index/skills/interpreting-culture-index/workflows/extract-from-pdf.md`. License CC-BY-SA-4.0: preserve Trail of Bits attribution and the source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding. Adapted into a self-contained extraction skill; the original OpenCV extraction script is not bundled, so the procedure states the computer-vision mechanism rather than a fixed script path.
