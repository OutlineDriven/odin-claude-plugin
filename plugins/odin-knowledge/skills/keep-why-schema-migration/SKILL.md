---
name: keep-why-schema-migration
description: 'Use when a project context-schema differs from the installed entry format. Classifies behind/current/ahead, consent-gates migration, marks missing values undefined, and advances only after every entry catches up. Don''t use for remote, publish, deploy, or irreversible changes.'
---

# Keep why schema migration

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The project context store records a `context-schema` value that is behind this skill's entry-format version (applicable entry-format changes exist) or ahead of it (older skill on newer project). |
| Authority | Reversible local write, consent-gated: rewrites only entry files and the `context-schema` field inside the named project context store, after an explicit operator answer. A backup or version control provides the rollback path. Nothing is written outside the store, and nothing is migrated silently. |
| Side effect | Rewrites existing entries per the migration catalog below, marking missing info `undefined` with a reason (never guessed); updates the `context-schema` field only after every entry is caught up. |
| Done | The schema comparison runs every session before the store is written; migrations happen only with explicit consent; a per-developer decline changes nothing in the project store; in the ahead state no entry writes happen until the installed skill is updated. |

## Inputs

- Required: path to the project context store — the directory holding the project's entry files and its config file, which records `context-schema: <version>`.
- Supplied by this file: the current entry-format version (4) and the migration catalog. No other version source exists.
- Optional: the operator consent answer (`migrate now` / `defer` / `decline`). No answer means `defer`.
- Checked, not assumed: whether the store is under version control, which decides the rollback mechanism.

## Procedure

1. Perform this comparison before any other write to the store in the session. Read `context-schema` from the store config. If the value is absent or unparseable, stop with failure F1 and write nothing. Done when: the `context-schema` value is read and parseable, or F1 is reported and nothing is written.
2. Compare the recorded value with the current entry-format version 4 and classify: `current` (equal), `behind` (lower), `ahead` (higher). Done when: the store is classified as current, behind, or ahead.
3. **Ahead** — state once that the store is newer than the installed skill, recommend updating the installed skill to the store format, make no writes, and tell the session not to rewrite existing entries until the skill is updated. Terminal: `ahead-blocked`. Done when: the ahead state is stated, no writes are made, and the terminal is `ahead-blocked`.
4. **Current** — report `current` and make no writes. Terminal: `current`. Done when: `current` is reported and no writes are made.
5. **Behind** — list which catalog versions between the recorded value and 4 changed what, then offer exactly one of: `migrate now`, `defer to next session`, `decline for this developer`. Done when: the catalog changes are listed and one consent option is offered.
6. `defer` — no writes; the comparison repeats next session. Terminal: `deferred`. Done when: no writes are made and the terminal is `deferred`.
7. `decline` — record the decline personally for that developer, in this conversation or their own notes, never in the shared project store. The project schema stays unchanged and later sessions re-offer. Terminal: `declined`. Done when: the decline is recorded personally, the project schema is unchanged, and the terminal is `declined`.
8. `migrate now` — bound scope first: enumerate the store's entry files; then secure rollback: if the store is version-controlled, record the current commit as the restore point; otherwise copy every affected entry file to `<store>/migration-backup/schema-<recorded-version>/`. Done when: all entry files are enumerated and the rollback path is secured.
9. Apply the catalog rules for every version from recorded+1 through 4, in order, to each entry. A value that is missing or not determinable from the entry itself is written as `undefined: <reason>`; never fabricate or infer a value beyond what the entry states. An entry whose structure no rule can parse is left untouched and listed as unmigrated. Done when: every entry is rewritten per catalog rules or listed as unmigrated, and no value is fabricated.
10. After every entry is rewritten or confirmed caught up, set `context-schema` to 4 — including when some intermediate versions had nothing to apply; a no-op version still advances (nothing-to-migrate does not mean do-not-advance). If any entry is unmigrated, leave the schema value unchanged and report the store as still behind. Done when: `context-schema` is set to 4 (all entries caught up) or left unchanged (unmigrated entries exist).
11. Report per-entry results, the final schema value or the reason it is unchanged, and the rollback path. Done when: the report names every rewritten entry, every `undefined` value with its reason, any unmigrated entry, the final schema value, and the rollback path.

### Migration catalog

Current entry-format version: **4**.

| Version | Change | Rewrite rule |
|---|---|---|
| 2 | `Type:` field added to every entry | Add one `Type:` line naming the entry kind (decision, preference, incident, reference, constraint), derived from the entry text. If the kind is not determinable from the entry, write `Type: undefined (reason: kind not stated in entry)`. |
| 3 | Unknown values carry a reason | Replace every blank or unstated field value with `undefined: <reason>` naming why the value is missing. Never fill a blank by guessing. |
| 4 | Repeated `Type:` lines are allowed | Keep one `Type:` line per distinct kind; merge duplicate identical `Type:` lines into one. Do not collapse distinct kinds into one line. |

## Failure and recovery
- F1 — missing or unparseable schema record: write nothing, report the exact file and field problem, stop. The store is not modified and no schema value is initialized here.
- F2 — unmigratable entry: leave that entry untouched, keep the schema value unchanged, and list the entry in the report; the store stays behind and the next session re-compares. Because the schema field moves last, a partial migration can never read as caught up.
- F3 — consent missing or refused at the prompt: treat as `defer`; no writes.
- F4 — write error mid-migration: stop immediately, restore every already-rewritten entry from the rollback path (version-control restore or the backup copy), leave the schema value at its old setting, and report which entries were rewritten before the failure. Re-running later re-offers `migrate now`.
- Never swallow an error and never report `current` or `migrated` unless steps 2, 9, and 10 actually completed as written.

## Output

One migration report with a terminal classification: `current`, `migrated` (schema advanced to 4, per-entry summary, rollback path), `deferred`, `declined` (personal record only; project unaffected), `ahead-blocked` (no writes; skill update recommended), or `failed` (F1–F4 with details). The report names every rewritten entry, every `undefined` value with its reason, and any unmigrated entry.
