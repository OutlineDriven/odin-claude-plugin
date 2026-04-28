# Memory File Frontmatter Schema

Every memory file must start with YAML frontmatter between `---` delimiters.

```yaml
---
name: short human-readable title
description: one-line summary used to decide relevance in future conversations — be specific
type: user | feedback | project | reference
originSessionId: <uuid of the session where this was saved>
---
```

## Type definitions

| type | Stores | Required extra sections |
|---|---|---|
| `user` | Who the user is, their role, goals, domain knowledge | None |
| `feedback` | Rules about how to approach work — corrections AND confirmations | `**Why:**` and `**How to apply:**` |
| `project` | Ongoing work context, decisions, deadlines (absolute dates only) | `**Why:**` and `**How to apply:**` |
| `reference` | Pointers to external systems and their purpose | None |

## Filename convention

`<type>_<slug>.md` — slug is lowercase, hyphens only, ≤ 40 chars.

Examples:
- `feedback_no-html-comments.md`
- `user_senior-go-engineer.md`
- `project_auth-rewrite-compliance.md`
- `reference_linear-pipeline-bugs.md`

## Body structure by type

### feedback

```markdown
Rule text — lead with the rule itself, imperative voice.

**Why:** The reason the user gave (prior incident, strong preference).
**How to apply:** When and where this guidance kicks in; edge cases.
```

### project

```markdown
Fact or decision — lead with the concrete thing that is true.

**Why:** The motivation (constraint, deadline, stakeholder ask).
**How to apply:** How this should shape future suggestions.
```

### user and reference

Free-form prose. One short paragraph is usually enough.

## MEMORY.md index entry

One line per memory file, ≤ 150 chars:

```
- [Title](filename.md) — one-sentence hook that distinguishes this from similar entries
```

## Anti-patterns (never save these)

- Code patterns or conventions derivable by reading the codebase
- Fix recipes or debugging solutions (the fix is in the code)
- Git history or activity summaries (use `git log`)
- Ephemeral task state or in-progress work from the current session
- Path-pinned rules that break if a file is renamed (e.g., "in auth.go, always X")
- Relative dates — convert to absolute dates (YYYY-MM-DD) before saving project memories
