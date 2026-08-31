---
name: semgrep-rule-authoring
description: 'Use when a vulnerability or code pattern and a target language need a new custom static-analysis detection rule. Produces one validated, tested rule with a graded vulnerable/safe/edge/nested test matrix. Not for porting an existing rule to another language — use port-static-analysis-rule. Not for running scans with existing rules — use semgrep-security-scan.'
---

# Semgrep rule authoring

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user supplies a vulnerability, bug, or code pattern and target language and asks for a new custom Semgrep detection. |
| Authority | Reversible-local: write only the single new rule directory and the two files inside it; run only local Semgrep commands; roll back by deleting the rule directory. |
| Side effect | Exactly one rule directory containing one YAML rule and one annotated language test file; executes Semgrep validation, tests, AST dump, and final scan. |
| Done | The rule is specific, uses taint mode when data flow warrants it, all vulnerable/safe/edge/nested tests pass before and after optimization, YAML validates, and final output has no uninterpolated metavariables. |

## Not for

- Porting an existing rule to another language or analyzer — use port-static-analysis-rule.
- Running a security scan with existing rules — use semgrep-security-scan.

## Inputs

Required: a description of the vulnerability, bug, or code pattern to detect, and the target language. Optional: vulnerable and safe code samples, framework or library names, a preferred rule identifier, and known taint sources, sanitizers, and sinks when the defect depends on data flow. If the pattern or the language is missing, stop before writing any file and request the missing input. Semgrep must be installed and on PATH; this skill never installs tooling.

## Procedure

1. Bound scope: the run produces exactly one rule directory named `<rule-id>/` containing exactly one YAML rule file `<rule-id>.yaml` and one annotated test file `<rule-id>.<ext>` matching the target language extension. Decline requests for rule packs, multiple rules, or extra languages. Each YAML file contains exactly one Semgrep rule; never use `languages: generic`. **Done when:** scope is bounded to one rule directory with two files.

2. Confirm the target language is supported by the installed Semgrep binary by running `semgrep --dump-ast --lang <lang> <snippet-file>` on a minimal snippet. If the language is unsupported or Semgrep is missing, stop and report without writing files. **Done when:** the language is confirmed supported or the blockage is reported.

3. Write the annotated test file first. Include at least: one clear vulnerable example (annotated `# ruleid: <rule-id>` on the line immediately before the code), one clear safe example (annotated `# ok: <rule-id>`), one edge case or variation, one sanitized or validated input (annotated `# ok: <rule-id>`), one unrelated code block (annotated `# ok: <rule-id>`), and one nested occurrence inside a class, closure, loop, or try/catch. The annotation line must contain only the comment marker and annotation with no other text. Never use `todook` or `todoruleid` annotations. **Done when:** the test file is written with all required annotation cases.

4. Write the smallest concrete rule that matches the vulnerable example. Required fields: `id`, `languages`, `severity`, `message`, and either `pattern`/`patterns`/`pattern-either` for search mode or `mode: taint` with `pattern-sources` and `pattern-sinks` (plus `pattern-sanitizers` when a sanitizer exists) when the defect depends on data flowing from source to sink. Prioritize taint mode for injection and data-flow vulnerabilities; switch to pattern matching only when taint does not apply. Keep the rule specific: anchor on the dangerous API or construct, constrain metavariables with `metavariable-regex` or `metavariable-pattern` instead of bare `$ANYTHING` catch-alls. Reject the rationalization that taint mode is overkill when data actually flows from untrusted source to dangerous sink. **Done when:** the rule YAML is written with all required fields.

5. Validate YAML: `semgrep --validate --config <rule-id>.yaml` must pass before any test run. **Done when:** validation passes.

6. Verify the pattern against the parse tree: run `semgrep --dump-ast --lang <lang> <rule-id>.<ext>` and adjust the pattern so it matches the AST nodes actually produced, not the source text. Reject the rationalization that the AST dump is too complex to inspect. **Done when:** the pattern matches the actual AST nodes.

7. Run the tests from inside the rule directory: `semgrep --test --config <rule-id>.yaml <rule-id>.<ext>`. Resolve every missed line (false negative), incorrect line (false positive), and unexpected match until all vulnerable, safe, edge, and nested expectations pass. This is the pre-optimization gate. Reject the rationalization that matching the vulnerable case is sufficient; safe cases must also pass. **Done when:** all test expectations pass.

8. Optimize once the gate is green: remove patterns differing only in quote style, remove patterns that are subsets of ellipsis patterns, consolidate similar patterns using `metavariable-regex`, and simplify nested `pattern-either`. Rewrite the message to state the defect and fix concisely. Re-run validation and the full test suite after each optimization; tests must still pass. Reject the rationalization that premature optimization is acceptable; correct patterns come first. **Done when:** optimization is complete and all tests still pass.

9. Run the final scan on the user's real target or the supplied sample: `semgrep --config <rule-id>.yaml <target>`. Inspect every reported finding and its message. A literal `$NAME` in the message that Semgrep did not interpolate means the message references a metavariable the pattern never captures; fix the message or pattern and rerun from step 7. **Done when:** the final scan runs with no uninterpolated metavariables in any message.

10. Stop rather than widen scope: never add a second rule, touch files outside the rule directory, or execute code from the test corpus; Semgrep only parses it. **Done when:** scope is confirmed unchanged.

## Failure and recovery

- Missing pattern or language: stop before any write; the exact result is a request for the missing input.
- Semgrep missing or the language unsupported: blocked; report the missing binary or unsupported language; no files written.
- `--validate` fails or `--dump-ast` cannot parse the construct: fix the rule or reduce the snippet to the minimal reproducing form; if the language version itself fails to parse, report blocked citing the parse error.
- Tests cannot be made green (persistent missed or incorrect results after bounded retries): roll back by deleting the rule directory and report the failing expectation class; a rule with any failing expectation is never reported as done.
- Final scan shows an uninterpolated metavariable: treat as a failing done-check; fix message or pattern and rerun the test gate; do not ship the rule with the defect.

Partial results are never reported as success. The rollback path is deleting the rule directory, which restores the pre-run state because the run writes nothing else.

## Output

The rule directory containing `<rule-id>.yaml` (one rule) and `<rule-id>.<ext>` (annotated test file), plus a run report stating: validation pass, the test matrix (vulnerable, safe, edge, nested) green before and after optimization, AST dump used to confirm the pattern, final scan target and finding count, and confirmation that no message contains an uninterpolated metavariable; terminal states: done (all checks passed) or blocked (named failure class, artifacts rolled back or the exact failing check stated).
