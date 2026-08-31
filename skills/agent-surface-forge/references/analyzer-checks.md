# Enhance analyzer checks

Every analyzer emits `certainty` as HIGH/MEDIUM/LOW and `autoFix` as yes/no. HIGH means the invariant violation is directly observable from file content or parsed config. MEDIUM means context-dependent but likely useful. LOW means advisory.

Auto-fix policy: only `HIGH + autoFix: yes` may be applied, and only after explicit `--apply`. MEDIUM/LOW are report-only even when an individual row says the source tool once had a suggested fixer.

## Plugin analyzer

Scope: `.claude-plugin/plugin.json`, package metadata near it, command definitions, MCP/tool schemas, embedded agent/command references.

| Check | Certainty | autoFix |
|---|---|---|
| `plugin.json` missing, unreadable, or malformed JSON | HIGH | no |
| Missing required plugin fields: `name`, `version`, `description` | HIGH | no |
| `version` does not follow semver-like `x.y.z` format | HIGH | no |
| Version mismatch between `.claude-plugin/plugin.json`, marketplace metadata, and nearby `package.json` when both are present | HIGH | yes |
| Plugin declares command entries without required command fields (`name`, command path/entrypoint, or declared argument surface) | HIGH | no |
| Command markdown/frontmatter missing `description` or tool-description equivalent for what the command does | HIGH | no |
| Command or tool parameter object omits a `required` declaration for known required inputs | HIGH | yes |
| Tool schema missing `additionalProperties: false` / strict object closure | HIGH | yes |
| Tool definition missing human-readable `description` | HIGH | no |
| Parameter schema missing parameter descriptions | MEDIUM | no |
| Parameter schema is nested deeper than two object levels | MEDIUM | no |
| Tool or command description exceeds 500 characters without adding constraints or examples | MEDIUM | no |
| Plugin exposes many independent tools in one plugin; split may be clearer | LOW | no |
| Tool allow-list grants broad shell/file access without command restrictions | HIGH | no |
| Marketplace/plugin metadata contradicts manifest name, version, or capabilities | HIGH | no |

## Agent analyzer

Scope: `**/agents/*.md` and agent-like markdown with YAML frontmatter.

| Check | Certainty | autoFix |
|---|---|---|
| Missing YAML frontmatter block | HIGH | yes |
| Frontmatter missing `name` | HIGH | no |
| Frontmatter missing `description` | HIGH | no |
| No `tools` field, implying unrestricted access | HIGH | no |
| `tools` contains unrestricted `Bash` instead of command-scoped forms such as `Bash(git:*)` | HIGH | yes |
| Missing explicit role statement (`You are`, `## Role`, identity/mission section) | HIGH | yes |
| Missing output format or return contract | HIGH | no |
| Missing constraints / MUST NOT / safety section | HIGH | no |
| XML-like blocks are opened but not balanced/closed | HIGH | no |
| Complex agent prompt has no XML or similarly parseable sections for large context blocks | MEDIUM | no |
| Simple agent uses redundant step-by-step reasoning instructions | MEDIUM | no |
| Complex reasoning agent lacks thinking/verification guidance | MEDIUM | no |
| Vague instructions (`usually`, `maybe`, `try to`, `as needed`) drive behavior without decision criteria | MEDIUM | no |
| References `CLAUDE.md` but not `AGENTS.md` where both project-memory surfaces may matter | MEDIUM | no |
| Example count outside 2-5 examples for an example-driven role | LOW | no |
| Prompt body exceeds roughly 2k tokens without strong structure | LOW | no |
| Hardcoded `.claude/` state path instead of repo-relative or environment-aware location | HIGH | no |
| Bloat: repeated rules, duplicated role statements, or long preambles not tied to behavior | LOW | no |

## Skill analyzer

Scope: every `SKILL.md`.

| Check | Certainty | autoFix |
|---|---|---|
| Missing YAML frontmatter block | HIGH | no |
| Frontmatter `name` missing | HIGH | no |
| Frontmatter `name` does not equal directory basename | HIGH | no |
| Frontmatter `description` missing | HIGH | no |
| Description lacks explicit trigger phrase ending (`Use when ...`) | MEDIUM | yes |
| Skill causes side effects, writes files, runs commands, or coordinates multi-step work but lacks `disable-model-invocation: true` when it must be explicit-only | HIGH | no |
| Skill lists `allowed-tools` but omits a tool required by its own workflow | MEDIUM | no |
| Skill needs restricted tooling but has no allowed-tools/tool-boundary statement | MEDIUM | no |
| Missing workflow section for a procedural skill | HIGH | no |
| Missing validation gates for any skill that edits files, changes state, or executes commands | MEDIUM | no |
| Uses broad external delegation instead of native file/search/read/AST recipes | MEDIUM | no |
| Trigger phrasing is vague, purely marketing, or not action-oriented | MEDIUM | no |
| Bulk tables/templates in `SKILL.md` instead of a local `references/` file | LOW | no |
| Mentions non-native model routing, editor shims, or binary-cache state as required machinery | HIGH | no |
| `references/` link points outside the same skill directory | HIGH | no |

## Docs analyzer

Scope: `docs/**`, README, CHANGELOG, guide pages, API docs, inline code examples inside documentation.

| Check | Certainty | autoFix |
|---|---|---|
| Internal doc link targets a missing file or missing anchor | HIGH | no |
| Heading hierarchy skips levels (for example H1 → H3) | HIGH | yes |
| Code block lacks language tag | HIGH | no |
| Code block is syntactically invalid for its declared JSON/YAML/TOML language | HIGH | no |
| Code example imports, commands, or exported symbol names that do not exist in repo search/codegraph | HIGH | no |
| Version text contradicts manifest/package version in the same repo | HIGH | yes |
| Filler prose adds no operational information | HIGH | no |
| Verbose passage can be compressed without losing instructions | HIGH | yes |
| Section exceeds about 1000 tokens and should be chunked for retrieval | MEDIUM | no |
| Section mixes multiple unrelated topics | MEDIUM | no |
| Section lacks local context needed for retrieval; reader must rely on preceding sections | MEDIUM | no |
| Important setup or warning buried below unrelated material | MEDIUM | no |
| Long block has no section headers | MEDIUM | no |
| Token-reduction opportunity with no correctness impact | LOW | no |
| Readability/RAG balance issue: too terse for humans or too narrative for retrieval | LOW | no |
| Generic structure recommendation with no broken invariant | LOW | no |

## Prompt analyzer

Scope: command prompts, reusable prompts, system-prompt drafts, prompt templates, agent task prompts.

| Check | Certainty | autoFix |
|---|---|---|
| Vague language controls behavior without measurable criteria (`usually`, `sometimes`, `try`, `consider`) | HIGH | no |
| Negative-only instruction (`don't`, `never`, `do not`) lacks the positive replacement behavior | HIGH | no |
| No clear output format for a task/prompt that asks for deliverables | HIGH | yes |
| Excessive aggressive emphasis likely to over-index the model | HIGH | yes |
| Task description lacks concrete scope: file, scenario, constraints, or acceptance criteria | HIGH | no |
| Invalid JSON inside JSON code block | HIGH | no |
| Heading hierarchy skips levels | HIGH | no |
| Redundant `think step by step` or equivalent generic chain-of-thought incantation | HIGH | no |
| Complex prompt lacks examples/few-shot contrast | MEDIUM | no |
| Examples lack good/bad contrast where pattern learning is required | MEDIUM | no |
| Important instruction buried in the middle instead of top/bottom anchoring | MEDIUM | no |
| Instruction lacks rationale where violating it is plausible | MEDIUM | no |
| No priority order among competing instructions | MEDIUM | no |
| Requests JSON output without schema or example | MEDIUM | no |
| Task lacks verification criteria: tests, expected output, screenshot, or scenario | MEDIUM | no |
| Investigation prompt does not point to likely sources or evidence types | MEDIUM | no |
| Code block language tag likely mismatches content | MEDIUM | no |
| Complex prompt lacks XML/tagged structure | LOW | no |
| Example count outside 2-5 where examples exist | LOW | no |
| Overly prescriptive phase list may block better reasoning | LOW | no |
| Prompt exceeds roughly 2500 tokens without retrieval/chunking need | LOW | no |

## CLAUDE.md / AGENTS.md analyzer

Scope: project memory and project instruction files named `CLAUDE.md`, `AGENTS.md`, or equivalent top-level agent memory.

| Check | Certainty | autoFix |
|---|---|---|
| Required project memory file absent when user explicitly asked to enhance project memory | HIGH | no |
| No critical rules / priority rules section | HIGH | no |
| No architecture, project structure, or where-things-live section | HIGH | no |
| No commands/scripts section despite package/test/build commands existing | HIGH | no |
| References a file path that does not exist | HIGH | no |
| Documents a package script or command that does not exist | HIGH | no |
| Hardcoded `.claude/` path for runtime state instead of repo-relative/environment-aware path | HIGH | no |
| File is long enough that high-priority rules are likely ignored (>150 lines or similar) | HIGH | no |
| Duplicates README content instead of carrying agent-only constraints | MEDIUM | no |
| Exceeds recommended quick-reference token budget | MEDIUM | no |
| Instructions are too verbose for retrieval during tool use | MEDIUM | no |
| Rules lack WHY/context where misuse is likely | MEDIUM | no |
| Uses Claude-specific terminology where AGENTS-compatible wording is needed | MEDIUM | no |
| `CLAUDE.md` omits `AGENTS.md` compatibility note when the repo uses both surfaces | MEDIUM | no |
| Includes information the agent can infer cheaply from reading manifests/code | MEDIUM | no |
| Critical rules lack emphasis markers (`MUST`, `NEVER`, `CRITICAL`) | MEDIUM | no |
| Too many inline examples for a memory file | LOW | no |
| Deep nesting (>3 heading/list levels) | LOW | no |
| Contains self-evident generic practices that should be deleted | LOW | no |

## Hooks analyzer

Scope: hook config files, hook markdown definitions, shell snippets, JS/Python hook scripts, and hook references in plugin manifests.

| Check | Certainty | autoFix |
|---|---|---|
| Hook definition file missing/unreadable | HIGH | no |
| Hook markdown missing frontmatter | HIGH | no |
| Hook frontmatter missing `name` | HIGH | no |
| Hook frontmatter missing `description` | HIGH | no |
| Dangerous command pattern: `rm -rf`, `sudo`, `chmod -R 777`, `chown -R`, destructive `git reset --hard`, force push, or kill-all style command | HIGH | no |
| Shell command interpolates untrusted input without quoting | HIGH | no |
| Hook writes outside repo or declared state directory | HIGH | no |
| Hook runs network/deployment command without explicit user-facing gate | HIGH | no |
| Hook references tool/command not declared in plugin config | HIGH | no |
| Hook has side effects but lacks clear trigger event and scope | HIGH | no |
| Hook swallows errors (`|| true`, empty catch, broad redirect) around validation logic | MEDIUM | no |
| Hook has no timeout, bounded input, or failure mode for long-running work | MEDIUM | no |
| Hook emits noisy output on every prompt/tool call | MEDIUM | no |
| Hook duplicates a rule already present in project memory | MEDIUM | no |
| Hook script has no comments for non-obvious policy decisions | LOW | no |

## Cross-file analyzer

Scope: relationships among plugin manifests, agents, skills, prompts, commands, hooks, docs, and project memory.

| Check | Certainty | autoFix |
|---|---|---|
| Tool consistency: prompt/agent mentions a tool not declared in frontmatter or plugin config | MEDIUM | no |
| Tool consistency: declared tool is never used or justified in body | MEDIUM | no |
| Workflow references a non-existent agent, command, skill, hook, or file | MEDIUM | no |
| Workflow phase transitions are incomplete: later phase references missing earlier artifact | MEDIUM | no |
| Agent ↔ skill mismatch: skill describes capabilities not present in any related agent/prompt body | MEDIUM | no |
| Agent ↔ skill mismatch: agent performs behavior the owning skill/manifest does not describe | MEDIUM | no |
| Skill allowed-tools differs from prompt/tool usage | MEDIUM | no |
| Duplicate rules: same critical instruction appears across files with high token/Jaccard overlap | MEDIUM | no |
| Contradiction: one file says `always/must/required`; another says `never/must not/forbidden` for overlapping token set | MEDIUM | no |
| Rule drift: same named command/agent has different trigger semantics in manifest, docs, and prompt | MEDIUM | no |
| Agent/prompt/command not referenced anywhere and not documented as standalone | MEDIUM | no |
| Docs mention plugin/agent/skill capability missing from manifest or source config | MEDIUM | no |
| Marketplace/README claims a command exists but command file is absent | HIGH | no |
| Two command or agent names collide case-insensitively | HIGH | no |
| Local reference points outside the repo or outside its own skill/plugin directory without explicit rationale | HIGH | no |

## Detection notes

- XML imbalance: count same-named open/close tags for simple XML-like blocks; ignore Markdown autolinks and HTML void tags. Certainty HIGH only when a concrete tag is opened and not closed.
- Duplicate/contradiction overlap: normalize to lowercase tokens, remove stopwords, require Jaccard overlap ≥0.65 for duplicate-rule candidates and ≥0.45 plus opposing modal verbs for contradiction candidates. Treat as MEDIUM unless names collide or a required file is absent.
- Tool overexposure: unrestricted `Bash`, wildcard file/network tools, or no `tools` field on an agent are HIGH because the configured boundary is directly observable.
- Bloat: LOW unless it hides required rules, contradicts frontmatter, or crosses the CLAUDE.md/AGENTS.md length gate.
- Auto-fix yes rows must still be minimal: add missing delimiters/strict schema/heading increments/version sync/output-format scaffold only. Do not invent names, descriptions, policies, or tool scopes.
