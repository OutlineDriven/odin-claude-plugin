---
name: training-report
description: 'Use when a trainer wants a training session documented as a compte rendu. Runs a structured interview, iterates a Markdown draft under user lead, then generates a .docx once after explicit content confirmation via python-docx. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Training report

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to document a training session or workshop (compte rendu) |
| Authority | Reversible-local: write only the named .md draft and the final .docx in the chosen output directory. Rollback: delete the .md and .docx files; no other artifact is created. |
| Side effect | Writes the Markdown draft first, then the .docx once, after explicit content confirmation. No other file is written. |
| Done | Both .md and .docx files delivered after explicit content confirmation, with a terminal classification distinguishing complete from partial. |

## Inputs

- Session details (required): collected through a structured interview with the trainer. No detail is fabricated; only what the trainer explicitly provides enters the document.
- Report language (required): asked at the start. French, English, or other.
- Primary reader (required): executive, HR, direct management, external client, or internal archive. Determines tone and depth.
- Word template (optional): a .docx template with company branding. If provided, used as the base for the final document. If absent, a clean document is produced with a default brand color.
- Survey data (optional): satisfaction scores, NPS, verbatim comments. Included only if provided.
- Individual feedback (optional): observations about specific participants. Included only if the trainer explicitly provides meaningful observations.
- Annexes (optional): photos, slides, survey results, participant deliverables. Local image files at a path on disk are embedded programmatically; images referenced by URL, cloud link, or not available as local files are listed for manual insertion with their intended position and caption.
- Closing and contact details (optional): trainer name, email, phone for a personal closing note.

## Refusals

- Will not fabricate details the trainer did not provide. Omit the section or ask.
- Will not generate the .docx before the user explicitly confirms the draft is final.
- Will not write the Individual Feedback section without the trainer's explicit consent.
- Will not edit the .docx directly after generation. Update the .md and regenerate from scratch.

## Procedure

1. Confirm the report language and the primary reader. Apply tone guidance: lead with outcomes for executives; emphasize behavior and evolution for HR; be practical and operational for direct management; be professional and measured for external clients; be comprehensive for internal archives. In French, use formal register with `vous`, active voice, and guillemets. In English, use active voice and concrete nouns. In other languages, apply the equivalent formal register. Done when: language and reader are confirmed with tone guidance applied.

2. Ask whether the user has a Word (.docx) template. If yes, request the file and use it as the base at step 9. If no, ask for a brand color; default to `#2E75B6` if none is given. Done when: the template decision and brand color are resolved.

3. Conduct a structured interview in batches, waiting for answers before moving to the next batch. Extract what the user already stated before asking. Collect: trainer name and role; date, location, company/team; duration; participant count; stated goal; subject or tool used; rules or constraints set at the start; materials provided; distribution of familiarity across the group; a step-by-step walkthrough of the session (objective, what participants did, materials, how it landed, difficulties); deliverables produced; general observations (optional); individual feedback (optional); recommendations and next steps; annexes (optional); closing and contact details (optional). Done when: all batches are collected or the trainer has no more to add.

4. If survey data was provided, synthesize it in the conversation before drafting: overall score or NPS, rating distribution, top three positive themes, top three areas for improvement, outlier responses. Ask the user to confirm before it enters the document. Done when: survey data is synthesized and confirmed, or no survey data was provided.

5. Present the outline and ask the user to confirm or adjust before drafting. The outline lists: Context, Starting Levels, Session Walkthrough (with step count), General Observations (only if provided), Participant Satisfaction (only if survey data provided), Individual Feedback (only if provided), Recommendations and Next Steps, Annexes (only if provided), and Closing with contact. Done when: the outline is confirmed by the user.

6. Write the Markdown draft to the output directory as `training_report_[team]_[date].md`. Use one canonical file; overwrite on every iteration. Structure: title and metadata header, Context (2-3 paragraphs), Starting Levels (bullet list), Session Walkthrough (numbered subheadings, one paragraph per step focusing on what participants did), General Observations (factual, no editorializing), Participant Satisfaction (headline number first), Individual Feedback (one subheading per participant, starting level in bold, background then evolution; diplomatic, describe behavior not character), Recommendations and Next Steps (grouped under subheadings, bold labels, actionable bullets, always include a Pacing subgroup), Annexes (list with title, description, and status: embedded or manual-insertion), and Closing with contact details. Done when: the canonical .md file is written.

7. Edit the draft before presenting it: cut AI throat-clearing openers and adjective doublets; replace passive voice with active voice; replace vague praise or criticism with specific behaviors; prefer short sentences; and adapt the prose to the document language. Do not present the draft before this pass. Done when: the editing pass is complete.

8. Present the draft inline in the conversation. Let the user lead the iteration. Update the .md file for every change. One canonical file, no versions. Only proceed to step 9 when the user explicitly confirms the content is final. Done when: the user explicitly confirms the content is final.

9. Generate the .docx once from the approved Markdown using python-docx as the executable mechanism. First verify python-docx is installed:
   ```
   python3 -c "import docx; print(docx.__version__)"
   ```
   If not installed, stop with `docx-generation-failed` and deliver the .md as canonical with a partial classification. If a template was provided, open it with python-docx, inject section content into existing paragraph styles without redefining fonts or colors, preserve headers/footers/logo, and save. If no template, build from scratch: cover block (title 48pt bold brand color, subtitle 28pt, metadata 22pt gray), header with team name, footer with trainer name and date, heading styles mirroring the Markdown structure, and native tables for any HTML table blocks. For annex images: embed local image files at a path on disk via `document.add_picture()`; list images referenced by URL or not available locally for manual insertion with their intended position and caption. Save as `training_report_[team]_[date].docx` in the same directory as the .md. This step is terminal: if the user requests changes after the .docx is generated, update the .md and regenerate from scratch. Done when: the .docx is generated from the approved .md, or the step has stopped with `docx-generation-failed`.

10. Deliver both files. Print the absolute paths to both the .md and .docx. List any images needing manual insertion with instructions. State the terminal classification: complete if both files were produced, partial if only the .md was delivered. Remind the user that future edits go through the .md first. Done when: both file paths are printed, image instructions are provided, and the terminal classification is stated.

## Failure and recovery

| Failure class | Rule |
|---|---|
| `no-session-details` | The trainer has not provided enough information to write a meaningful report. Stop and ask for the missing batch. Do not fabricate. |
| `content-not-confirmed` | The user has not explicitly confirmed the draft is final. Do not generate the .docx. Continue iterating the .md. |
| `docx-generation-failed` | The .docx could not be generated (python-docx not installed or generation error). The .md remains the canonical artifact and is delivered. The outcome is reported as partial, not complete. Report the error and the .md path. Do not delete the .md. |
| `fabrication-risk` | A section would require inventing details the trainer did not provide. Omit the section or ask the trainer. Never fabricate. |
| `individual-feedback-without-consent` | The trainer did not explicitly provide individual feedback. Do not write the Individual Feedback section. Do not prompt for feedback on every participant. |
| `post-docx-change-request` | The user requests changes after the .docx is generated. Update the .md and regenerate the .docx from scratch. Do not edit the .docx directly. |
| `rollback` | Delete the .md and .docx files from the output directory. No other artifact is created, so no further rollback is needed. |

## Output

Two files in the same output directory: `training_report_[team]_[date].md` (canonical Markdown draft) and `training_report_[team]_[date].docx` (terminal derivative generated once from the approved Markdown via python-docx). The .md is the source of truth; the .docx is a styled rendering of the final approved text. The delivery report states absolute paths, the image-insertion list, and a terminal classification distinguishing complete from partial.
