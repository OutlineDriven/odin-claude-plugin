# CONTEXT.md entry format

Write one glossary entry per resolved term to `CONTEXT.md`. Each entry carries exactly these fields:

- `term`: the canonical term as it must be used in the codebase.
- `definition`: what the term means in this project, in one or two sentences.
- `avoid`: superseded or ambiguous spellings and near-synonyms that must not be used for this term. Omit or leave empty when there are none.
- `recorded_at`: ISO 8601 timestamp of when the resolution was recorded.

Keep entries stable: update an entry only when the resolution itself changes, and never silently rewrite a previously recorded definition.
