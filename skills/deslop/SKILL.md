---
name: deslop
description: 'Use when the user says deslop, remove debug code, find placeholders or stub code, or remove dead code, or when the slop skill routes code findings here. Applies only HIGH-certainty mechanical slop removal to production source files, verifies with the repo test command, and rolls back on regression while leaving MEDIUM and LOW findings flagged for manual inspection. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Deslop

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user says deslop, remove debug code, find placeholders or stub code, or remove dead code, or the slop skill routes code findings here |
| Authority | Reversible local writes to production source files for HIGH-certainty mechanical slop removal only; may run the repo verifier and `git restore` on regression |
| Side effect | Local writes to production source files; no edits to tests, fixtures, mocks, examples, generated, vendored, or lockfile/build artifacts |
| Done | No-slop invariant restored: HIGH fixes applied and verified, MEDIUM/LOW left flagged for manual inspection, verifier green or rollback confirmed |

## Inputs

- Target scope: the set of files to scan. Prefer changed files; run a full sweep only when the user explicitly requests one.
- Repo verifier: derived from manifests during the procedure; no input required.

## Procedure

1. **Bound scope.** Prefer changed files unless the user requested a full sweep. Exclude tests, fixtures, mocks, examples, generated output, vendored code, lockfiles, build artifacts, and minified bundles: `**/test/**`, `**/tests/**`, `**/__tests__/**`, `*.test.*`, `*.spec.*`, `*_test.*`, `*Test.java`, `**/fixtures/**`, `**/mocks/**`, `**/testdata/**`, `**/examples/**`, `**/benches/**`, `dist/**`, `build/**`, `target/**`, `coverage/**`, `vendor/**`, `node_modules/**`, `*.min.*`, generated/protobuf/openapi outputs. Keep Markdown out of whitespace cleanup because trailing spaces can be semantic line breaks.

2. **HIGH deterministic scan.** Use `search` for line patterns and `ast-grep` where syntax shape matters. Record `{file, line, pattern, certainty: HIGH, strategy}` for each finding. Categories:
   - Debug output: the language's stream-writing mechanism (console methods, print statements, debug macros, formatted-output calls, shell tracing) left behind after debugging. Exclude output that is the product: CLIs, loggers, entrypoints that print by design.
   - Placeholder or unimplemented body: the language's mechanism for a callable whose body was never written (empty block, no-op statement, not-yet-implemented throw or abort, TODO-marked panic).
   - Swallowed failure: the language's failure-intercept mechanism (catch/except/rescue block, error-return check, error match arm, signal trap) used to discard the failure so the unhappy path continues with invalid state.
   - Crash-on-failure shortcut: the language's assert-fallible mechanism (forced unwrap, unchecked cast or type assertion, abort-on-error) applied where failure is recoverable. Flag HIGH for presence; never rewrite automatically.
   - Hardcoded credential: provider-issued secret literals: `sk-`, `ghp_`/`github_pat_`, `AKIA`, `Bearer <token>`, JWT-looking strings, private-key blocks, Slack/Stripe/NPM/Twilio/SendGrid/Discord token forms. Flag only.
   - Placeholder text: filler in comments or string literals: lorem ipsum, `asdf asdf`, `foo bar baz`, `replace this`, `TODO: implement`.
   - Privilege and supply-chain hazard: commands granting blanket permissions or executing remotely-fetched code (`chmod 777`, piping a download into a shell). Flag only.
   - Whitespace artifact: mixed tabs+spaces on one indentation prefix, trailing whitespace outside Markdown.

3. **MEDIUM contextual scan.** Use codegraph first when indexed; otherwise combine `ast-grep`, `search`, and direct reads of the narrow files. Report only, no auto-fix:
   - Comment bloat: doc-to-code ratio >3 for a real function with at least 3 code lines, or verbosity ratio >2 comments per code line inside a function; filler/hedging/buzzword comments.
   - Dead or unreachable code: statements after `return`, `throw`, `break`, or `continue` that are not a language-required fallthrough case.
   - Commented-out code: consecutive comment lines whose content is code rather than prose.
   - Mutable global state: a module-level binding named as a constant but declared mutable, or a mutable global collection outside settings/constants.
   - Missing safety justification: an escape-hatch construct entered without the adjacent comment its convention requires (an unsafe block with no safety rationale).
   - Suppression escape: a warning or type-check suppression applied instead of fixing the finding it hides.
   - Over-engineering indicators: file/export ratio >20, lines/export >500, directory depth >4 without real module boundaries.
   - Unsubstantiated capability claim: claims like "production-ready", "secure", "enterprise-grade", "scalable" with fewer than two concrete supporting code signals.
   - Infrastructure without implementation: `Client`, `Connection`, `Pool`, `Service`, `Provider`, `Manager`, `Factory`, `Repository`, `Gateway`, `Queue`, `Cache`, or `Store` values created but never used beyond setup/export.
   - Stub return values: a function whose only significant body line returns `0`, `null`, `undefined`, `None`, `nil`, `false`, `true`, `[]`, `{}`, `""`, empty collections, `Default::default()`, or `Optional.empty()`. Escalate attention when adjacent TODO/FIXME/STUB text exists; keep auto-fix disabled.

4. **LOW optional CLI scan.** Run only tools already available in the repo or PATH; never install. Record findings as LOW and `flag-only`: `jscpd` for duplication, `madge` for cycles, and the linter the project already declares (derived from its manifest or config: `eslint`, `clippy`, `golangci-lint`, `ruff`, `ktlint`, `rubocop`, `phpstan`, `swiftlint`, the .NET analyzers, and equivalents). If a tool is absent, write `missing: <tool>` and continue.

5. **Prioritize.** Sort HIGH before MEDIUM before LOW; then severity; then scope proximity to changed files; then fix strategy. Keep a separate `fixes` list containing only HIGH findings with `remove-line`, `remove-block`, `replace-whitespace`, or `add-comment` strategies. Exclude every `flag-only` finding from automatic edits.

6. **Fix HIGH only.** Apply the smallest edit that removes the deterministic slop:
   - `remove-line`: debug prints, trailing whitespace, isolated commented-out code blocks.
   - `replace-whitespace`: convert mixed indentation to the file's dominant indentation style; strip trailing spaces.
   - `add-comment`: empty catch/except blocks only when the correct behavior is intentionally swallowing the error and the surrounding code proves that intent. Otherwise flag; do not invent logging.
   - `remove-block`: placeholder block only when it is unreachable/dead and removal cannot change API behavior. Stubs on live API surfaces are report-only.
   - `flag-only`: hardcoded secrets, crash-on-failure shortcuts, placeholder implementations, dead code requiring control-flow judgment, architectural smells.

7. **Verify.** Run the repo's own test command after fixes. Derive it from manifests in this order: package script (`test`, then `check`, then `typecheck`), `cargo test`, `go test ./...`, `pytest`, `mvn test`, `gradle test`, `dotnet test`, `bundle exec rspec` or `rake test`, `composer test` or `phpunit`, `swift test`, or the project's documented command. If no command exists, run the narrowest parser/type check available, state the limitation, and treat every fix as unverified.

8. **Rollback on regression.** If verification fails after applying fixes, immediately restore every changed file with `git restore -- <file...>` and rerun the same verifier to confirm the baseline is back. Report the failed fix group as blocked, with file/line and failing command. Never suppress tests, rewrite expectations, or keep a partial cleanup after regression.

## Failure and recovery
- **Scope violation.** An auto-fix touches an excluded file (test, fixture, generated, vendored, lockfile, build artifact). Revert that file with `git restore`; do not widen scope.
- **Certainty violation.** A MEDIUM or LOW finding is edited. Revert the edit; the finding stays report-only.
- **Behavior regression.** The repo verifier fails after fixes. Run rollback: `git restore -- <file...>` on every changed file, rerun the verifier, and report the failed fix group as blocked with file/line and the failing command. Keep no partial cleanup.
- **No verifier available.** No test command and no parser/type check exists. Treat every fix as unverified; report the limitation; do not claim the done predicate holds.
- **Partial-result rule.** HIGH fixes that verify stay applied; any fix whose verification is unconfirmed or failed is reverted and reported as blocked. Never swallow an error or pretend the done predicate holds.

## Output
A compact report: changed files, HIGH fixes applied, MEDIUM/LOW findings left for manual inspection, the verifier command and its result, and any rollback action taken.

## Provenance

Origin: ODIN 1.x current skill `skills/deslop/SKILL.md` (no pinned revision, no third-party license — project-owned). Adapted to the ODIN 2.0 self-contained literal: the external `references/slop-catalog.md` reference was folded into the inline category enumeration so the skill carries no required support file, and the section order was normalized to the ODIN 2.0 contract.
