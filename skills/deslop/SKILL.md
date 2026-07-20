---
name: deslop
description: Use when the user says "deslop", "remove debug code", "find placeholders or stub code", or "remove dead code".
metadata:
  short-description: Certainty-graded slop cleanup
---

# deslop: restore the no-slop invariant, preserve behavior

Restore the invariant that production code has no debug leftovers, placeholder bodies, swallowed errors, hardcoded credentials, or formatter noise. Classify every finding by certainty; apply only HIGH-certainty mechanical fixes; MEDIUM and LOW are report-only unless the user explicitly asks for a separate manual refactor.

The detailed pattern catalog lives in `references/slop-catalog.md`, indexed by behavioral category; within a category, rows are keyed by language, or by `Any` where the signal is language-independent. Load it when choosing an exact pattern recipe for a language, or when deciding whether a finding is fixable. Skip it when you are only classifying certainty or picking an autofix strategy — the contract and strategy vocabulary below are complete on their own.

## When to Apply / NOT

Apply when the request names AI slop, debug-code cleanup, placeholder/stub cleanup, empty error handlers, hardcoded secrets, dead code, or a pre-PR hygiene sweep.

Do **not** apply for broad architecture simplification, ordinary lint formatting, security audit beyond hardcoded credential patterns, or behavior-changing cleanup. Do not use this to justify deleting code whose purpose is unclear.

## Certainty Contract

| Level | Source | Action |
|---|---|---|
| **HIGH** | Deterministic regex/AST match in non-test, non-fixture, non-generated code | Eligible for mechanical fix, then repo tests |
| **MEDIUM** | Reasoned structural signal or codegraph/context signal | Report only; cite evidence; no auto-fix |
| **LOW** | Optional external CLI heuristic, if tool already exists | Report only; no install; no auto-fix |

Certainty is not severity. A hardcoded token is HIGH certainty and high severity, but still usually `flag-only` because the safe fix is secret rotation plus replacement by an environment read. A trailing-space match is HIGH certainty and low severity, but safe to remove.

## Workflow

1. **Scope files.** Prefer changed files when the user did not request a full sweep. Exclude tests, fixtures, mocks, examples, generated output, vendored code, lockfiles, build artifacts, and minified bundles:
   - `**/test/**`, `**/tests/**`, `**/__tests__/**`, `*.test.*`, `*.spec.*`, `*_test.*`, `*Test.java`
   - `**/fixtures/**`, `**/mocks/**`, `**/testdata/**`, `**/examples/**`, `**/benches/**`
   - `dist/**`, `build/**`, `target/**`, `coverage/**`, `vendor/**`, `node_modules/**`, `*.min.*`, generated/protobuf/openapi outputs
   - keep Markdown out of whitespace cleanup because trailing spaces can be semantic line breaks.

2. **Phase 1: HIGH deterministic scan.** Use `search` for line patterns and `ast-grep` where syntax shape matters. Record `{file, line, pattern, certainty: HIGH, strategy}`. Categories:
   - Debug output: the language's mechanism for writing to standard streams (console methods, print statements, debug macros, formatted-output calls, shell tracing), left behind after debugging. Exclude output that is the product — CLIs, loggers, and entrypoints that print by design.
   - Placeholder or unimplemented body: the language's mechanism for declaring a callable whose body was never written (empty block, no-op statement, not-yet-implemented throw or abort, TODO-marked panic).
   - Swallowed failure: the language's mechanism for intercepting a failure (catch/except/rescue block, error-return check, error match arm, signal trap) used to discard it, so the unhappy path continues with invalid state.
   - Crash-on-failure shortcut: the language's mechanism for asserting a fallible value succeeded (forced unwrap, unchecked cast or type assertion, abort-on-error) applied where the failure is recoverable. Opposite behavior to a swallowed failure and opposite remediation — error-propagation design, not a narrower handler. Flag HIGH for presence; never rewrite automatically.
   - Hardcoded credential: provider-issued secret literals — `sk-`, `ghp_`/`github_pat_`, `AKIA`, `Bearer <token>`, JWT-looking strings, private-key blocks, Slack/Stripe/NPM/Twilio/SendGrid/Discord token forms. These are keyed to identity providers, not languages. Flag only.
   - Placeholder text: filler left in code comments or string literals — lorem ipsum, `asdf asdf`, `foo bar baz`, `replace this`, `TODO: implement`.
   - Privilege and supply-chain hazard: commands that grant blanket permissions or execute remotely-fetched code (`chmod 777`, piping a download straight into a shell). Flag only; these need a permission or supply-chain decision, not an edit.
   - Whitespace artifact: mixed tabs+spaces on one indentation prefix, trailing whitespace outside Markdown.

3. **Phase 1b: MEDIUM contextual scan.** Use codegraph first when indexed; otherwise combine `ast-grep`, `search`, and direct reads of the narrow files. Report only:
   - Comment bloat: doc-to-code ratio >3 for a real function with at least 3 code lines, or verbosity ratio >2 comments per code line inside a function; filler/hedging/buzzword comments.
   - Dead or unreachable code: statements after `return`, `throw`, `break`, or `continue` that are not a language-required fallthrough case.
   - Commented-out code: a block of consecutive comment lines whose content is code rather than prose.
   - Mutable global state: a module-level binding named as a constant but declared mutable, or a mutable global collection outside settings/constants.
   - Missing safety justification: an escape-hatch construct entered without the adjacent comment its convention requires (an unsafe block with no safety rationale).
   - Suppression escape: a warning or type-check suppression applied instead of fixing the finding it hides.
   - Over-engineering indicators: file/export ratio >20, lines/export >500, directory depth >4 without real module boundaries.
   - Unsubstantiated capability claim: claims like "production-ready", "secure", "enterprise-grade", "scalable" with fewer than two concrete supporting code signals.
   - Infrastructure without implementation: `Client`, `Connection`, `Pool`, `Service`, `Provider`, `Manager`, `Factory`, `Repository`, `Gateway`, `Queue`, `Cache`, or `Store` values created but never used beyond setup/export.
   - Stub return values: a function whose only significant body line returns `0`, `null`, `undefined`, `None`, `nil`, `false`, `true`, `[]`, `{}`, `""`, empty collections, `Default::default()`, or `Optional.empty()`. Escalate attention when adjacent TODO/FIXME/STUB text exists, but keep auto-fix disabled.

4. **Phase 2: LOW optional CLI scan.** Findings in the catalog's `Residual: external tool signals` category. Run only tools already available in the repo or PATH; never install. Record findings as LOW and `flag-only`:
   - `jscpd` for duplication.
   - `madge` for cycles.
   - The linter the project already declares, derived from its manifest or project config rather than assumed (`eslint`, `clippy`, `golangci-lint`, `ruff`, `ktlint`, `rubocop`, `phpstan`, and their equivalents).
   - If absent, write `missing: <tool>` in the report and continue.

5. **Prioritize.** Sort HIGH before MEDIUM before LOW; then severity; then scope proximity to changed files; then fix strategy. Keep a separate `fixes` list containing only HIGH findings with `remove-line`, `remove-block`, `replace-whitespace`, or `add-comment` strategies. Exclude every `flag-only` finding from automatic edits.

6. **Fix HIGH only.** Apply the smallest edit that removes the deterministic slop:
   - `remove-line`: debug prints, trailing whitespace, isolated commented-out code blocks.
   - `replace-whitespace`: convert mixed indentation to the file's dominant indentation style; strip trailing spaces.
   - `add-comment`: empty catch/except blocks only when the correct behavior is intentionally swallowing the error and the surrounding code proves that intent. Otherwise flag; do not invent logging.
   - `remove-block`: placeholder block only when it is unreachable/dead and removal cannot change API behavior. Stubs on live API surfaces are report-only.
   - `flag-only`: hardcoded secrets, crash-on-failure shortcuts, placeholder implementations, dead code requiring control-flow judgment, architectural smells.

7. **Verify.** Run the repo's own test command after fixes. Derive it from manifests in this order: package script (`test`, then `check`, then `typecheck`), `cargo test`, `go test ./...`, `pytest`, `mvn test`, `gradle test`, or the project's documented command. If no command exists, run the narrowest parser/type check available and state the limitation.

8. **Rollback on regression.** If verification fails after applying fixes, immediately restore every changed file from the cleanup attempt with `git restore -- <file...>` and rerun the same verifier to confirm the baseline is back. Report the failed fix group as blocked, with file/line and failing command. Never suppress tests, rewrite expectations, or keep a partial cleanup after regression.

## Anti-patterns

- **Formatting the repo.** Do not turn slop cleanup into style normalization.
- **Secret deletion as remediation.** Removing a token from source is not enough; require rotation and replacement with environment/config access.
- **Deleting placeholder APIs.** A stub that is part of public surface is a product gap, not dead code.
- **Counting tests/fixtures/generated files.** They intentionally contain fake tokens, placeholders, console output, and fixture weirdness.

## Validation Gates

| Gate | Pass Criteria | Blocks |
|---|---|---|
| Scope gate | Tests/fixtures/generated/vendored files excluded | Any auto-fix touching excluded files |
| Certainty gate | Only HIGH deterministic findings enter `fixes` | MEDIUM/LOW edit attempt |
| Strategy gate | Every fix has `remove-line`, `replace-whitespace`, `add-comment`, `remove-block`, or `flag-only` | Unclassified edit |
| Behavior gate | Repo verifier passes after fixes | Keep no cleanup; run rollback |
| Rollback gate | `git restore -- <file...>` restores changed files after regression and verifier confirms baseline | Any failed verification with retained edits |

Deliver a compact report: changed files, HIGH fixes applied, MEDIUM/LOW findings left for manual inspection, verifier command and result, rollback action if any.
