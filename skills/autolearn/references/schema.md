# Frontmatter contract — `docs/solutions/`

Canonical schema for learning docs written by `autolearn`. Read this when classifying a track, assembling frontmatter, or validating. The validator (`scripts/validate-frontmatter.py`) only catches silent YAML-corruption; the field/enum rules below are yours to honor.

## Two tracks

`problem_type` picks the track. The track decides which extra fields are required.

| Track | problem_types | What it is |
|-------|---------------|-----------|
| **Bug** | `build_error`, `test_failure`, `runtime_error`, `performance_issue`, `database_issue`, `security_issue`, `ui_bug`, `integration_issue`, `logic_error` | Defects and failures that were diagnosed and fixed |
| **Knowledge** | `best_practice`, `documentation_gap`, `workflow_issue`, `developer_experience`, `architecture_pattern`, `design_pattern`, `tooling_decision`, `convention` | Practices, patterns, conventions, decisions, workflow improvements. Prefer the narrowest value; `best_practice` is the fallback. |

## Required fields (both tracks)

- **title** — clear problem/topic title (string).
- **date** — `YYYY-MM-DD`.
- **category** — the `docs/solutions/` subdirectory (see Category map).
- **module** — module or area affected (string).
- **problem_type** — one enum value from the tracks table; determines the track.
- **component** — component or subsystem involved (free-form string, e.g. `parser`, `auth`, `ci`, `cli`). Keep it consistent within a repo so frontmatter search works.
- **severity** — one of `critical`, `high`, `medium`, `low`.

## Bug-track required fields

- **symptoms** — array, 1–5 observable symptoms (errors, broken behavior).
- **root_cause** — one of: `missing_association`, `missing_include`, `missing_index`, `wrong_api`, `scope_issue`, `thread_violation`, `async_timing`, `memory_leak`, `config_error`, `logic_error`, `test_isolation`, `missing_validation`, `missing_permission`, `missing_workflow_step`, `inadequate_documentation`, `missing_tooling`, `incomplete_setup`.
- **resolution_type** — one of: `code_fix`, `migration`, `config_change`, `test_fix`, `dependency_update`, `environment_setup`, `workflow_improvement`, `documentation_update`, `tooling_addition`, `seed_data_update`.

## Knowledge-track fields

No required fields beyond the shared core. All optional:

- **applies_when** — array (≤5), conditions where the guidance applies.
- **symptoms** — array (≤5), the gap or friction that prompted the guidance.
- **root_cause** — from the bug-track enum, if there is a specific one.
- **resolution_type** — from the bug-track enum, if a change was applied.

## Optional fields (both tracks)

- **related_components** — array of other components involved.
- **tags** — array (≤8) of search keywords, lowercase and hyphen-separated.

## Category map (problem_type → directory)

| problem_type | directory |
|---|---|
| `build_error` | `docs/solutions/build-errors/` |
| `test_failure` | `docs/solutions/test-failures/` |
| `runtime_error` | `docs/solutions/runtime-errors/` |
| `performance_issue` | `docs/solutions/performance-issues/` |
| `database_issue` | `docs/solutions/database-issues/` |
| `security_issue` | `docs/solutions/security-issues/` |
| `ui_bug` | `docs/solutions/ui-bugs/` |
| `integration_issue` | `docs/solutions/integration-issues/` |
| `logic_error` | `docs/solutions/logic-errors/` |
| `developer_experience` | `docs/solutions/developer-experience/` |
| `workflow_issue` | `docs/solutions/workflow-issues/` |
| `best_practice` | `docs/solutions/best-practices/` |
| `documentation_gap` | `docs/solutions/documentation-gaps/` |
| `architecture_pattern` | `docs/solutions/architecture-patterns/` |
| `design_pattern` | `docs/solutions/design-patterns/` |
| `tooling_decision` | `docs/solutions/tooling-decisions/` |
| `convention` | `docs/solutions/conventions/` |

Filename: `[sanitized-problem-slug].md` — no date suffix (the `date` field carries that).

## Validation rules

1. Determine the track from `problem_type`.
2. All shared required fields present.
3. Bug-track docs additionally carry `symptoms`, `root_cause`, `resolution_type`.
4. Knowledge-track docs need no extra required fields.
5. Enum fields match allowed values exactly.
6. Array fields respect min/max item counts.
7. `date` matches `YYYY-MM-DD`.

## Backward compatibility

Pre-existing docs may carry bug-track fields (`symptoms`/`root_cause`/`resolution_type`) on a knowledge-track `problem_type`. Harmless — leave them. Strip only when rewriting the doc for other reasons. New docs follow the track rules above.

## YAML safety (array items)

Strict YAML parsers (`yq`, `js-yaml` strict, PyYAML) misread array items that *start* with a reserved indicator as unquoted scalars. For any array-of-strings field (`symptoms`, `applies_when`, `tags`, `related_components`), wrap the value in double quotes when it starts with any of these commonly-hit indicators:

`` ` ``  `[`  `]`  `{`  `}`  `,`  `*`  `&`  `!`  `|`  `>`  `%`  `@`  `?`

Also quote when the value contains `": "` — that punctuation confuses flow-style parsers. The list above is the set that actually shows up at the front of solution-doc values, not an exhaustive YAML indicator catalogue; when unsure, just quote, and let a real YAML parse be the backstop.

Before (breaks strict YAML):

```yaml
symptoms:
  - `flush-cache` does not restore in-container mDNS
```

After (parses cleanly):

```yaml
symptoms:
  - "`flush-cache` does not restore in-container mDNS"
```

Scalar fields (`title:`, `module:`) have a separate failure mode — an unquoted ` #` truncates at the comment, an unquoted `: ` reframes as a mapping. `scripts/validate-frontmatter.py` catches those; quote and re-run until it exits 0.
