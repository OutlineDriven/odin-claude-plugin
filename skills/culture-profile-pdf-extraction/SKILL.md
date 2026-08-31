---
name: culture-profile-pdf-extraction
description: 'Use when a Culture Index PDF must become verified structured profile data before analysis. Machine-extracts trait dots, arrows, energy units, identity, and archetype, then spot-checks them against the PDF without visual estimation.'
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

1. If a JSON for the same profile already exists (same directory as the PDF, or a user-supplied path), use it directly and stop; do not re-extract. Done when: the existing JSON is loaded or extraction proceeds.
2. Verify the programmatic extraction prerequisites: `uv`, `poppler` (`pdftoppm`), and `tesseract`. If any are missing, install them (`brew install uv poppler tesseract` on macOS, or `apt install uv poppler-utils tesseract-ocr` on Ubuntu) or instruct the user to install them. Do not proceed until all three are present. Done when: `uv`, `poppler`, and `tesseract` are all available.
3. Extract programmatically with computer vision; never estimate visually. Render the PDF pages to images with poppler, detect each trait dot and the red arrow position by color and contour with OpenCV, OCR the name, archetype, and Energy Unit values with tesseract, and compute each trait value as `[absolute, relative_to_arrow]` (arrow-relative for A, B, C, D; `null` relative for L and I). Run the extraction with verification enabled so it emits an ASCII verification summary alongside the JSON. Done when: the JSON and ASCII verification summary are emitted by the extraction tool.
4. Spot-check the verification summary against the PDF: confirm each trait dot sits in the same column as the dot on the PDF, the arrow marker aligns with the red arrow on each chart, and the EU values match what is displayed on the PDF. Done when: every dot, arrow, and EU value in the summary matches the PDF.
5. When both Survey and Job graphs are present, compute energy utilization as `(Job EU / Survey EU) × 100` and classify status: Healthy (70–130%), STRESS (>130%, burnout risk), or FRUSTRATION (<70%, flight risk). Done when: energy utilization is computed and classified, or skipped when only one graph is present.
6. Emit the JSON to stdout or the user-selected output file. Done when: the JSON is written to stdout or the output file path.

## Failure and recovery
- Missing prerequisite (`uv`, `poppler`, or `tesseract` not found): install the dependency or instruct the user to install it. Never fall back to visual estimation, which has a 20–30% error rate and violates the done predicate.
- Computer-vision extraction failure: report the error verbatim. Do not substitute vision-derived values. No partial JSON is emitted; the PDF is not mutated.
- Verification mismatch: if any spot-checked dot, arrow, or EU value does not match the PDF, the extraction is wrong. Re-run extraction; if it still mismatches, report the mismatch and stop without emitting JSON.
- Blocked or non-converged result: report the failing step, the missing dependency or mismatch, and that no JSON was produced. Never claim the done predicate holds when extraction or spot-check failed.

## Output
Extracted Culture Index JSON (traits, arrow, EU, identity, archetype, energy analysis) and an ASCII verification summary chart, written to stdout or the user-selected output file.
