# Memory Audit Checklist

13 structural transforms + staleness detection.
`audit-memory.sh` maps each finding to one of these categories.

## Severity levels

- **critical** — data loss risk, security risk, or index/file inconsistency that corrupts future reads
- **warn** — quality issue that degrades memory usefulness
- **info** — cosmetic / maintenance issue

---

## 1. orphan (warn)
**Detection:** file exists in `$MEMORY_DIR/*.md` (excluding MEMORY.md itself) but has no matching entry in MEMORY.md.
**Fix:** append `- [name](file.md) — <description from frontmatter>` to MEMORY.md.

## 2. dangling (critical)
**Detection:** MEMORY.md contains a link `[text](filename.md)` where `filename.md` does not exist.
**Fix:** remove the line from MEMORY.md (after showing user).

## 3. near-duplicate (warn)
**Detection:** two memory files share >70% of their non-frontmatter lines (Jaccard similarity on lines).
**Fix:** show merged draft; write merged file; remove the superseded one; update MEMORY.md.

## 4. missing-frontmatter (critical)
**Detection:** file begins without `---\n` on line 1.
**Fix:** add minimal frontmatter using filename to infer type and slug.

## 5. missing-required-sections (warn)
**Detection:** file has `type: feedback` or `type: project` but body lacks `**Why:**` and/or `**How to apply:**`.
**Fix:** append placeholder sections for the user to fill in.

## 6. missing-originSessionId (info)
**Detection:** frontmatter has no `originSessionId` field.
**Fix:** add `originSessionId: unknown` (can't recover the original session).

## 7. type-mismatch (warn)
**Detection:** frontmatter `type` field is not one of `user|feedback|project|reference`.
**Fix:** show the file; ask user to pick the correct type.

## 8. index-too-long (info)
**Detection:** any MEMORY.md line is longer than 150 characters.
**Fix:** truncate the hook phrase to fit; preserve the link text and filename.

## 9. memory-index-too-large (warn)
**Detection:** MEMORY.md has more than 200 lines.
**Fix:** identify the N oldest/least-specific entries and ask user whether to archive or delete.

## 10. path-pinned (warn)
**Detection:** memory body contains a reference to a specific absolute file path or function name that looks like `path/to/file.ext` or `` `FunctionName()` `` or `file.go`.
**Fix:** rewrite the rule to be path-agnostic, or downgrade severity to info if the path is a stable external resource (URL).

## 11. fix-recipe (warn)
**Detection:** body text contains patterns suggesting a debugging or fix recipe: "the fix is", "to resolve this", "the bug was", "the error occurred because".
**Fix:** mark for deletion (fix recipes belong in code comments / commit messages, not memory).

## 12. frontmatter-typo (warn)
**Detection:** frontmatter key spelling is not exactly `name|description|type|originSessionId`. Common typos: `desc`, `summary`, `kind`, `originSession`.
**Fix:** rename the key to the canonical spelling.

## 13. relative-date (warn)
**Detection:** body contains date phrases like "last week", "yesterday", "next Thursday", "this sprint" without an accompanying absolute date.
**Fix:** ask user for the absolute date and replace the relative phrase.

---

## Staleness (warn / critical)

**Detection:** cross-reference each `feedback` memory against the `SESSION_HISTORY_GLOB` corpus.

A memory is stale when:
- Its stated rule is contradicted in 3+ distinct sessions (not just one off-turn)
- Evidence: show the session UUIDs and the specific contradicting turn text
- A `project` memory's stated date or event context is past (e.g., "merge freeze before 2025-12-01" and today > 2025-12-01)
- A `reference` memory's target path or URL does not exist (file: check with stat; URL: skip unless user requests a live check)

Severity: warn unless the contradiction count is ≥5, then critical.

**Fix options:**
- Update the rule to reflect the current preference
- Archive the file (rename to `archived_<filename>` and remove from MEMORY.md)
- Delete the file entirely
