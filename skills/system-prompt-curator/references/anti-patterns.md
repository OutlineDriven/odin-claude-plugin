# Anti-pattern catalog

Use this table during `--improve`. Report confirmed findings with severity, evidence, risk, and fix. Fix HIGH before returning. Fix MEDIUM unless the user explicitly requested a minimal prompt. Fix LOW when it reduces entropy or hardens the harness contract.

| Failure Mode | Severity | Why It Fails | Fix |
|---|---:|---|---|
| `return complete_run immediately` or equivalent early finish | HIGH | Teaches the agent that the completion action is available before exploration, edits, or verification. | Move completion to the final phase and require evidence fields before finish. |
| `If you can answer the goal, complete` | HIGH | Conflates understanding with doing; analysis becomes an acceptable terminal state. | Add ordered phases and state that analysis/planning are never completion for action tasks. |
| Completion action has no preconditions | HIGH | The easiest valid action becomes calling finish with no artifacts. | Require non-empty artifacts: files changed, tests/citations, commit/PR/report, blocker evidence. |
| No workflow phases | HIGH | The model has no state machine; it may stop after the first plausible answer. | Add Explore → Plan → Implement → Verify → Deliver or a role-appropriate phase graph. |
| No verification gate | HIGH | Final success claims are ungrounded. | Name tests, typechecks, lint, repro, source citations, or manual QA; require observed result. |
| Tools omitted or hidden behind discovery | HIGH | Agent cannot plan with the real action surface and may spend time discovering or avoid action. | List tools upfront with descriptions and when-to-use guidance. |
| Hallucinated tools | HIGH | Agent may attempt impossible actions and then fail or fabricate progress. | Remove nonexistent tools; include only known tools and state assumptions outside the prompt. |
| Read-only completion allowed for coding task | HIGH | Agent can inspect files and deliver advice instead of changing code. | Add artifact mandate: modify/create files for implementation tasks; reading alone is not completion. |
| `Do not ask questions` without blocker/help path | HIGH | Agent may silently guess when it truly lacks required external information. | Add a separate request-help/blocker path with evidence of attempted discovery. |
| `Do not modify tests` as absolute rule | MEDIUM | Bug fixes often need regression tests; absolute ban blocks proper verification. | Replace with: do not change tests to hide failures; add/update tests when they encode desired behavior. |
| Vague identity: `focused AI agent`, `assistant`, `orchestrator` | MEDIUM | Abstract identity does not anchor behavior or deliverable ownership. | Use task-native identity: senior software engineer, technical analyst, security reviewer, etc. |
| `CRITICAL RULES`, threat blocks, penalty language | MEDIUM | Aggressive tone adds noise and can cause brittle overcompliance. | Replace with concise mandates, phase gates, and validation tables. |
| No convention discovery before coding | MEDIUM | Agent may invent libraries, layout, naming, or architecture contrary to the repo. | Require reading nearby code, manifests, tests, and existing patterns before implementation. |
| No failure recovery guidance | MEDIUM | Agent retries identical failed commands or gives up after first failure. | Add tips: inspect error, change approach, narrow command, search analogous code, verify again. |
| No worked demonstration | MEDIUM | Agent lacks an example trajectory and often copies only abstract instructions. | Add one full example with explore, failed action, recovery, implementation, verification, delivery. |
| Demonstration only shows happy path | MEDIUM | It does not teach recovery from broken commands, missing deps, flaky tests, or wrong assumptions. | Include at least one realistic failure and a changed next action. |
| Tool use described as `as needed` only | MEDIUM | Agent underuses tools and overrelies on prior knowledge. | Tie tools to phases: search/read in Explore, edit in Implement, shell/test in Verify, git/API in Deliver. |
| Completion criteria are subjective | MEDIUM | `Good answer`, `high quality`, or `best effort` cannot be validated. | Replace with observable criteria and explicit output schema. |
| No think-before-act transition | MEDIUM | Agent jumps from shallow context to edits or final answer. | Require a short plan before implementation and a pre-completion review of evidence. |
| No uncertainty handling for research | MEDIUM | Agent may overstate weak or conflicting evidence. | Require source citations, confidence, and unresolved uncertainty section. |
| Overloaded prompt mixes many roles | MEDIUM | Conflicting obligations dilute behavior and completion criteria. | Split role modes or choose the primary deliverable; keep one dominant identity. |
| Prompt relies on memory first for coding tasks | MEDIUM | Stale memory can outrank repository truth. | Make repository exploration primary; use memory only as supplementary context after current files. |
| `Ask the user if unsure` as default | MEDIUM | Agent asks instead of using available tools. | Permit questions only after tool-based discovery fails or at explicit decision gates. |
| Placeholder tool docs | MEDIUM | `{tools}` or `TODO tool list` leaves the action surface unspecified. | Fill real tool names and descriptions; if unknown, state outside the prompt that tool surface is missing. |
| No environment facts | LOW | Agent may assume wrong paths, language, package manager, or CI commands. | Add environment section: workspace path, language, build/test commands, constraints. |
| Token bloat via repeated mandates | LOW | Repetition increases cost without adding control. | Deduplicate into one mandate plus one validation gate. |
| Hidden harness expectations | LOW | Prompt asks for JSON or completion fields the harness does not validate. | Recommend harness-level validation and keep prompt schema aligned with actual tools. |
| No output truncation guidance | LOW | Agent may be overwhelmed by long command output. | Add harness or prompt rule for capped output and targeted follow-up reads/searches. |
| No empty-output handling | LOW | Agent may interpret no stdout as failure or ignore success. | Recommend harness label successful empty outputs explicitly. |
| Inconsistent naming for finish action | LOW | Multiple names (`done`, `finish`, `complete`) confuse completion path. | Use one action name and one schema. |
| Markdown-only polish without behavior change | LOW | Pretty formatting can hide unchanged weak gates. | Rewrite for invariants first; format second. |

## Findings table

Use this exact table shape in `--improve` mode:

| Severity | Principle | Evidence | Risk | Fix |
|---|---|---|---|---|
| HIGH | Completion requires evidence | `complete_run immediately` | Can finish without action | Move completion to final phase; require files/tests/PR |

## Fix discipline

- Preserve domain-specific instructions that still serve the role.
- Delete threats, duplicate rules, generic virtues, and obsolete placeholders.
- Do not remove a section without stating why in the delta.
- Replace weak prose with executable gates: phase, action, evidence, blocker path.
- When the harness can enforce a rule, recommend the harness gate separately; do not pretend prompt text alone is a validator.
