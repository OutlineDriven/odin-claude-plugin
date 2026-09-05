# CORPUS format

## Template

```md
# Corpus: {name}

corpus_root: {absolute path}
mapped: {YYYY-MM-DD}

## Sources

| File | Kind | Cite from |
|---|---|---|
| {rel-path} | {kind} | {anchors or reference only} |

## Concepts

1. **{Term}** — {one sentence}. Needs: {prereqs or none}. Source: `{anchor}`
```

## Kind values

- textbook: structured chapter/section exposition.
- paper: peer-reviewed publication or preprint that makes claims suitable for a research venue.
- practitioner book: field guide, handbook, or how-to.
- work document: notes, memos, onboarding docs authored on the job.
- notes: the learner's own capture; may be fragmentary.
- Mark a file `reference only` in the Sources row when it orients but teaches no distinct concept.

## Citation anchors

- Preferred: `<path-relative-to-corpus-root>#<heading-slug>`, for example `ch03-locks.md#deadlock`.
- Fallback when the source has no headings: `<path>:<start>-<end>`, for example `notes/raw.md:12-34`.
- Every concept line carries exactly one anchor; a concept taught in two places cites the earlier introduction.

## Rules

- Keep the Sources row count equal to the readable-file count; every readable file appears.
- List unreadable files under `## Unreadable` with the file name and why it could not be read.
- The Concepts list is prerequisite-ordered: no concept appears before a concept it needs.
- When two concepts need each other, keep the one the corpus introduces first first and append `cycle: see {other}` on the other's line.
- Re-running overwrites `CORPUS.md` whole; do not merge with a prior version.
