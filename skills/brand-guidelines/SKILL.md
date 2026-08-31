---
name: brand-guidelines
description: 'Use when writing UI text, error messages, empty states, onboarding, documentation, or marketing copy. Rewords copy to follow Sentry Plain Speech or Sentry Voice tone, spelling, punctuation, and UI element rules. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Brand guidelines

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User writes UI text, error messages, empty states, onboarding, documentation, or marketing copy |
| Authority | Reword supplied copy in place; no file, VCS, credential, or remote mutation |
| Side effect | Local text edits to follow Sentry Plain Speech or Sentry Voice tone |
| Done | Copy follows Sentry tone, spelling, punctuation, and UI element rules |

## Inputs

- The copy to edit (supplied inline or in a named local file). Required.
- The UI context for each string (button, error message, empty state, tooltip, heading, body text, 404 page, onboarding step, loading state, announcement, marketing copy, documentation, help text, transactional email). Optional but improves tone selection.

## Procedure

1. **Bound scope.** Edit only the copy strings the user supplies. Do not touch files, code, or configuration the user did not name for editing.
2. **Select tone.** Default to Plain Speech. Use Sentry Voice only for the contexts below. Do not use Sentry Voice for error messages, settings pages, documentation, or billing/payment flows.

   | Use Plain Speech | Use Sentry Voice |
   |---|---|
   | Product UI (buttons, labels, forms) | 404 pages |
   | Documentation | Empty states |
   | Error messages | Onboarding flows |
   | Settings pages | Loading states |
   | Transactional emails | "What's New" announcements |
   | Help text | Marketing copy |

3. **Apply Plain Speech rules** (default tone):
   - Concise: fewest words needed.
   - Direct: tell users what to do, not what they can do.
   - Active voice: "Save your changes" not "Your changes will be saved."
   - No jargon: use words users understand.
   - Specific: "3 errors found" not "Some errors found."

4. **Apply Sentry Voice principles** (when selected):
   - Empathetic snark: direct frustration at the situation, never the user.
   - Self-aware: acknowledge the absurdity of software.
   - Fun but functional: personality enhances, never obscures meaning.
   - Earned moments: use only when users have time to appreciate it.

5. **Enforce spelling and grammar:**
   - American English spelling (color, not colour).
   - Title Case for headings and page titles.
   - Sentence case for body text, buttons, and labels.

6. **Enforce punctuation:**
   - No exclamation marks in UI text (exception: celebratory moments).
   - No periods in short UI labels or button text.
   - Periods in complete sentences and help text.
   - No ALL CAPS except acronyms (API, SDK, URL).

7. **Enforce word choices:**

   | Avoid | Prefer |
   |---|---|
   | Please | (omit) |
   | Sorry | (be specific about the problem) |
   | Error occurred | Something went wrong |
   | Invalid | (explain what is wrong) |
   | Success! | (describe what happened) |
   | Oops | (be specific) |

8. **Enforce dash usage.** Hyphens for compound words and ranges ("real-time", "1-10"). En-dashes for date ranges and relationships ("2023--2024", "parent--child"). Em-dashes for interruption or emphasis in longer prose. Use hyphens in most UI contexts.

9. **Apply UI element rules:**
   - **Buttons:** action verbs, specific ("Create Project" not "Create"), max 2-3 words, no periods or exclamation marks.
   - **Error messages:** say what happened, say why if helpful, say what to do next. "Could not save changes. Check your connection and try again." not "Error: Save failed."
   - **Empty states:** explain what would normally be here, provide a clear action to populate, Sentry Voice is appropriate.
   - **Confirmation dialogs:** action clear in title, explain consequences if destructive, specific button labels ("Delete Project", not "OK").
   - **Tooltips and help text:** under 2 sentences, explain the why not just the what, link to docs for complex topics.

10. **Remove anti-patterns:**
    - Robot speak: "Item has been successfully deleted" → "Deleted".
    - Passive voice: "Changes were saved" → "Changes saved".
    - Unnecessary words: "In order to" → "To".
    - Hedging: "This might cause..." → "This will cause...".
    - Double negatives: "Not unlike..." → "Similar to...".
    - Marketing speak in UI: "Supercharge your workflow" → "Speed up your workflow".

## Failure and recovery
- **Ambiguous context:** If the UI context for a string is not supplied and tone cannot be determined, default to Plain Speech and note the assumption. Do not apply Sentry Voice without context confirmation.
- **Conflicting rules:** When two rules conflict (e.g., Sentry Voice personality vs. clarity), clarity wins. Note the conflict in the output.
- **Partial result:** Return edited strings with any unedited ones flagged with the reason (missing context, conflicting rules).
- **Rollback:** All edits are reversible local text changes. The original copy is the rollback state. Do not mutate files the user did not supply for editing.

## Output
Edited copy that follows Sentry tone, spelling, punctuation, and UI element rules. Each edited string is presented with its tone selection (Plain Speech or Sentry Voice) and the rule applied. Unedited strings are flagged with the reason.

## Provenance

Adapted from getsentry/skills `skills/brand-guidelines/SKILL.md` at revision c2f99a5b04b4cd992ec3022d7c2c3e23e938d241 (Apache-2.0). Clean-room adaptation: the tone selection table, Plain Speech rules, Sentry Voice principles, spelling, punctuation, word-choice, dash usage, UI element guidelines, and anti-patterns are restated from the source's public brand guidelines; no third-party expression is copied.
