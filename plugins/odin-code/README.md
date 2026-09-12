# ODIN Code

ODIN workflows for writing, changing, and simplifying code.

38 skills, category Coding. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-code@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-code@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-code/skills/<skill> \
  --agent <agent> --scope user
```

`<agent>` is `claude-code`, `codex`, `cursor`, `grok`, or `kimi-cli`.

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-code:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| api-and-interface-design | Use when asked to design or change a public API, route, CLI flag, or module boundary. |
| architect | Use when non-trivial code needs a design, codebase design or architecture needs improving, or one module needs targeted interface narrowing, seams, or testability. |
| ast-grep | Use when asked to run AST-based structural search, lint, or rewrite of code when regex is too fragile. |
| breaking-driven | Use when bloated code needs clean re-derivation, or the user says "this module is bloated" or "break it and rebuild". |
| clean-clean-cut | Use when asked to run /clean-clean-cut to cut accumulated records and residue. |
| code-simplification | Use when the user asks to simplify, clean, or refine code. |
| constraint-driven-development | Use when asked to implement under non-negotiable constraints: performance budgets, platform limits, legal or API rules. |
| contract-driven | Use when crossing a public API boundary, guarding complex invariants, or hardening untrusted input or integration seams. |
| deprecate-and-migrate | Use when asked to remove old code, migrate consumers, or decide whether to maintain or sunset a system. |
| deps-upgrade | Use when dependency upgrades need batching for CVEs, a major release, forced compatibility, a scheduled or vulnerability-triggered sweep. |
| design-it-twice | Use when asked to design a module interface, seam, or testable boundary. |
| deslop | Use when the user says deslop, debloat, tidy, simplify, clean a diff, cleanup codebase, or deslop branch diff, or remove dead code or config. |
| dimensional-analysis | Use when code mixes units, fixed-point precisions, scaling factors, rates, prices, shares, or conversions. |
| document-api-endpoint | Use when reconciling an API endpoint's generated OpenAPI schema and declared response types with its actual runtime response. |
| explore | Use when asked to explore the codebase to map structure, symbols, and dependencies. |
| extremely-optimize | Use when asked to run a performance campaign against a measured floor. |
| fastopt | Use when optimizing suspected hot paths without waiting for benchmarks. |
| fastopt-extreme | Use when optimizing estimated hot and complexity-neutral cold paths while refusing complexity theater. |
| fromzero | Use when replacing a greenfield attempt with a clean pad of verified requirements. |
| guillotine | Use when dead, duplicate, superseded, or generated residue must leave more than one artifact class of a repo or subsystem, preserving behavior. |
| incremental-implementation | Use when implementing a multi-file change, building a feature from a breakdown, or writing a large amount of code. |
| minimalism-driven | Use when writing or restructuring code, before adding a helper, wrapper, config key, or dependency, or when the user asks for minimal or DRY code. |
| no-comments | Use when asked to audit comments in code files and propose structural replacements or deletions with per-candidate approval. |
| offense | Use when a human says "overhaul", "rebuild this subsystem", or "rewrite it from scratch". |
| optimize | Use when asked to optimize code, speed up a path, reduce allocations, repair a regression, or profile a target. |
| principles | Use when a request names a working principle (subtract before you add, idempotent operations, never block on the human) or asks which principle applies. |
| refactor-break-compat | Use when modernizing APIs, removing compat shims, killing feature flags, or rewriting a subsystem cleanly. |
| reproduce-and-fix-issues | Use when a trusted bug or performance report needs reproduction and fix. |
| restart-keeping-lessons | Use when an implementation has more workarounds than structure and another patch will not pay. |
| simplify | Use when the user says "simplify this diff" or asks for a compression pass over a change-set. |
| slicing-code-context | Use when an exact symbol, path, entrypoint, or line range can bound a focused code question or patch proposal under a fixed source budget. |
| source-driven | Use when writing or verifying framework-specific code, boilerplate, or a documented, correct implementation. |
| spec-driven-implementation | Use when a feature begins or specs are checked in: author or update behavioral specs and keep them current with what ships. |
| strike-the-root | Use when a bug, failure, flake, regression, review finding, or ticket needs the core fixed so it cannot recur. |
| to-greenfield | Use when the user says greenfield this or rescue this codebase, names a field (dark, red, blue, or brown), or diagnoses a subsystem. |
| type-driven | Use when modeling a domain, encoding a state machine, hardening APIs, making invalid states unrepresentable, or parsing instead of validating. |
| universal-invariant-baseline | Use when invoked to apply an invariant-first, fail-fast, special-case-eliminating baseline. |
| unleak-abstraction | Use when an abstraction leak must be sealed as a module seam, configuration option, or explicit override, or exposed as a named boundary. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
