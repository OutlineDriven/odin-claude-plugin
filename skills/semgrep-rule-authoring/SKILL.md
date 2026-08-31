---
name: semgrep-rule-authoring
description: 'Use when the user supplies a vulnerability, bug, or code pattern and target language and asks for a new custom Semgrep detection. Produces one rule directory containing one validated, test-passed Semgrep rule and its annotated test file, with a final scan free of uninterpolated metavariables. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Semgrep rule authoring

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user supplies a vulnerability, bug, or code pattern and target language and asks for a new custom Semgrep detection. |
| Authority | Reversible-local: write only the single new rule directory and the two files inside it; run only local Semgrep commands; roll back by deleting the rule directory. |
| Side effect | Exactly one rule directory containing one YAML rule and one annotated language test file; executes Semgrep validation, tests, AST dump, and final scan. |
| Done | The rule is specific, uses taint mode when data flow warrants it, all vulnerable/safe/edge/nested tests pass before and after optimization, YAML validates, and final output has no uninterpolated metavariables. |

## Inputs

Required: a description of the vulnerability, bug, or code pattern to detect, and the target language. Optional: vulnerable and safe code samples, framework or library names, a preferred rule identifier, and known taint sources, sanitizers, and sinks when the defect depends on data flow. If the pattern or the language is missing, stop before writing any file and request the missing input. Semgrep must be installed and on PATH; this skill never installs tooling.

## Procedure

1. Bound scope: the run produces exactly one rule directory named `<rule-id>/` containing exactly one YAML rule file `<rule-id>.yaml` and one annotated test file `<rule-id>.<ext>` matching the target language extension. Decline requests for rule packs, multiple rules, or extra languages. Each YAML file contains exactly one Semgrep rule; never use `languages: generic`.

2. Confirm the target language is supported by the installed Semgrep binary by running `semgrep --dump-ast --lang <lang> <snippet-file>` on a minimal snippet. If the language is unsupported or Semgrep is missing, stop and report without writing files.

3. Write the annotated test file first. Include at least: one clear vulnerable example (annotated `# ruleid: <rule-id>` on the line immediately before the code), one clear safe example (annotated `# ok: <rule-id>`), one edge case or variation, one sanitized or validated input (annotated `# ok: <rule-id>`), one unrelated code block (annotated `# ok: <rule-id>`), and one nested occurrence inside a class, closure, loop, or try/catch. The annotation line must contain only the comment marker and annotation with no other text. Never use `todook` or `todoruleid` annotations.

4. Write the smallest concrete rule that matches the vulnerable example. Required fields: `id`, `languages`, `severity`, `message`, and either `pattern`/`patterns`/`pattern-either` for search mode or `mode: taint` with `pattern-sources` and `pattern-sinks` (plus `pattern-sanitizers` when a sanitizer exists) when the defect depends on data flowing from source to sink. Prioritize taint mode for injection and data-flow vulnerabilities; switch to pattern matching only when taint does not apply. Keep the rule specific: anchor on the dangerous API or construct, constrain metavariables with `metavariable-regex` or `metavariable-pattern` instead of bare `$ANYTHING` catch-alls. Reject the rationalization that taint mode is overkill when data actually flows from untrusted input to a dangerous sink.

5. Validate YAML: `semgrep --validate --config <rule-id>.yaml` must pass before any test run.

6. Verify the pattern against the parse tree: run `semgrep --dump-ast --lang <lang> <rule-id>.<ext>` and adjust the pattern so it matches the AST nodes actually produced, not the source text. Reject the rationalization that the AST dump is too complex to inspect.

7. Run the tests from inside the rule directory: `semgrep --test --config <rule-id>.yaml <rule-id>.<ext>`. Resolve every missed line (false negative), incorrect line (false positive), and unexpected match until all vulnerable, safe, edge, and nested expectations pass. This is the pre-optimization gate. Reject the rationalization that matching the vulnerable case is sufficient; safe cases must also pass.

8. Optimize once the gate is green: remove patterns differing only in quote style, remove patterns that are subsets of ellipsis patterns, consolidate similar patterns using `metavariable-regex`, and simplify nested `pattern-either`. Rewrite the message to state the defect and fix concisely. Re-run validation and the full test suite after each optimization; tests must still pass. Reject the rationalization that premature optimization is acceptable; correct patterns come first.

9. Run the final scan on the user's real target or the supplied sample: `semgrep --config <rule-id>.yaml <target>`. Inspect every reported finding and its message. A literal `$NAME` in the message that Semgrep did not interpolate means the message references a metavariable the pattern never captures; fix the message or pattern and rerun from step 7.

10. Stop rather than widen scope: never add a second rule, touch files outside the rule directory, or execute code from the test corpus; Semgrep only parses it.

## Failure and recovery
- Missing pattern or language: stop before any write; the exact result is a request for the missing input.
- Semgrep missing or the language unsupported: blocked; report the missing binary or unsupported language; no files written.
- `--validate` fails or `--dump-ast` cannot parse the construct: fix the rule or reduce the snippet to the minimal reproducing form; if the language version itself fails to parse, report blocked citing the parse error.
- Tests cannot be made green (persistent missed or incorrect results after bounded retries): roll back by deleting the rule directory and report the failing expectation class; a rule with any failing expectation is never reported as done.
- Final scan shows an uninterpolated metavariable: treat as a failing done-check; fix message or pattern and rerun the test gate; do not ship the rule with the defect.

Partial results are never reported as success. The rollback path is deleting the rule directory, which restores the pre-run state because the run writes nothing else.

## Output
The rule directory containing `<rule-id>.yaml` (one rule) and `<rule-id>.<ext>` (annotated test file), plus a run report stating: validation pass, the test matrix (vulnerable, safe, edge, nested) green before and after optimization, AST dump used to confirm the pattern, final scan target and finding count, and confirmation that no message contains an uninterpolated metavariable. Terminal states: done (all checks passed) or blocked (named failure class, artifacts rolled back or the exact failing check stated).

## Provenance

Origin: Trail of Bits semgrep-rule-creator, https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3 (source paths: plugins/semgrep-rule-creator/commands/semgrep-rule.md, plugins/semgrep-rule-creator/README.md, plugins/semgrep-rule-creator/skills/semgrep-rule-creator/SKILL.md, plugins/semgrep-rule-creator/skills/semgrep-rule-creator/references/quick-reference.md, plugins/semgrep-rule-creator/skills/semgrep-rule-creator/references/workflow.md). License: CC-BY-SA-4.0. This file is a modified adaptation; Trail of Bits attribution and source link are preserved, the adaptation is licensed under CC-BY-SA-4.0 (ShareAlike), no trademark rights are claimed, and trail-of-bits-mark.svg is never used as branding.
