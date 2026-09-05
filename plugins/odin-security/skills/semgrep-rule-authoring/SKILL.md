---
name: semgrep-rule-authoring
description: 'Use when a vulnerability or pattern and target language need a new Semgrep rule, or an existing rule needs porting to another language. Not for running scans: use semgrep-security-scan.'
---

# Semgrep rule authoring

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user supplies a vulnerability, bug, or code pattern and target language and asks for a new custom Semgrep detection (author mode), or supplies an existing static-analysis rule to port to another language (port mode). |
| Authority | Reversible local: writes only the single new rule directory (author) or the user-specified output directory (port); rollback is deleting the directory created by the run. Runs only local analyzer commands and never installs tooling. No remote mutation. |
| Side effect | Author mode: exactly one rule directory containing one YAML rule and one annotated language test file. Port mode: one subdirectory under the output directory containing the translated rule and its annotated test file; the source rule is never modified. Both modes execute Semgrep validation, tests, AST dump, and scan. |
| Done | Author mode: the rule is specific, uses taint mode when data flow warrants it, all vulnerable/safe/edge/nested tests pass before and after optimization, YAML validates, and final output has no uninterpolated metavariables. Port mode: the target language has an explicit applicability verdict and, when applicable, the port passes its graded vulnerable/safe/edge matrix under the pinned analyzer version. |

## Not for

- Running a security scan with existing rules: use semgrep-security-scan.

## Inputs

Required: a mode, `author` (default) or `port`.

Author mode: a description of the vulnerability, bug, or code pattern to detect, and the target language. Optional: vulnerable and safe code samples, framework or library names, a preferred rule identifier, and known taint sources, sanitizers, and sinks when the defect depends on data flow. If the pattern or the language is missing, stop before writing any file and request the missing input.

Port mode: the path to the existing source rule (readable, parses in the source analyzer's format), the source analyzer with its version (recorded at start and held constant for every validation round), and one target language. Each port targets one language at a time; never batch several languages into one run. Optional: the target analyzer (defaults to the source analyzer when it supports the target language) and the output directory (defaults to the current working directory).

Both modes: Semgrep, or the named analyzer, must be installed and on PATH; this skill never installs tooling.

## Procedure

1. Bound scope: author mode produces exactly one rule directory named `<rule-id>/` containing exactly one YAML rule file `<rule-id>.yaml` and one annotated test file `<rule-id>.<ext>` matching the target language extension. Port mode produces exactly one subdirectory `<outputDir>/<original-id>-<lang>/` containing the translated rule and its test file. Decline requests for rule packs, multiple rules, or extra languages. Each YAML file contains exactly one Semgrep rule; never use `languages: generic`. **Done when:** scope is bounded to one directory with two files.

2. Confirm the target language is supported by the installed Semgrep binary by running `semgrep --dump-ast --lang <lang> <snippet-file>` on a minimal snippet. If the language is unsupported or Semgrep is missing, stop and report without writing files. **Done when:** the language is confirmed supported or the blockage is reported.

Author mode continues at step 3. Mode `port`: run steps P1-P5 instead of steps 3-9, then step 10.

3. Write the annotated test file first. Include at least: one clear vulnerable example (annotated `# ruleid: <rule-id>` on the line immediately before the code), one clear safe example (annotated `# ok: <rule-id>`), one edge case or variation, one sanitized or validated input (annotated `# ok: <rule-id>`), one unrelated code block (annotated `# ok: <rule-id>`), and one nested occurrence inside a class, closure, loop, or try/catch. The annotation line must contain only the comment marker and annotation with no other text. Never use `todook` or `todoruleid` annotations. **Done when:** the test file is written with all required annotation cases.

4. Write the smallest concrete rule that matches the vulnerable example. Required fields: `id`, `languages`, `severity`, `message`, and either `pattern`/`patterns`/`pattern-either` for search mode or `mode: taint` with `pattern-sources` and `pattern-sinks` (plus `pattern-sanitizers` when a sanitizer exists) when the defect depends on data flowing from source to sink. Prioritize taint mode for injection and data-flow vulnerabilities; switch to pattern matching only when taint does not apply. Keep the rule specific: anchor on the dangerous API or construct, constrain metavariables with `metavariable-regex` or `metavariable-pattern` instead of bare `$ANYTHING` catch-alls. Reject the rationalization that taint mode is overkill when data actually flows from untrusted input to a dangerous sink. **Done when:** the rule file is written with all required fields.

5. Validate YAML: `semgrep --validate --config <rule-id>.yaml` must pass before any test run. **Done when:** validation passes.

6. Verify the pattern against the parse tree: run `semgrep --dump-ast --lang <lang> <rule-id>.<ext>` and adjust the pattern so it matches the AST nodes actually produced, not the source text. Reject the rationalization that the AST dump is too complex to inspect. **Done when:** the pattern matches the actual AST nodes.

7. Run the tests from inside the rule directory: `semgrep --test --config <rule-id>.yaml <rule-id>.<ext>`. Resolve every missed line (false negative), incorrect line (false positive), and unexpected match until all vulnerable, safe, edge, and nested expectations pass. This is the pre-optimization gate. Reject the rationalization that matching the vulnerable case is sufficient; safe cases must also pass. **Done when:** all test expectations pass.

8. Optimize once the gate is green: remove patterns differing only in quote style, remove patterns that are subsets of ellipsis patterns, consolidate similar patterns using `metavariable-regex`, and simplify nested `pattern-either`. Rewrite the message to state the defect and fix concisely. Re-run validation and the full test suite after each optimization; tests must still pass. Reject the rationalization that premature optimization is acceptable; correct patterns come first. **Done when:** optimization is complete and all tests still pass.

9. Run the final scan on the user's real target or the supplied sample: `semgrep --config <rule-id>.yaml <target>`. Inspect every reported finding and its message. A literal `$NAME` in the message that Semgrep did not interpolate means the message references a metavariable the pattern never captures; fix the message or pattern and rerun from step 7. **Done when:** the final scan runs with no uninterpolated metavariables in any message.

10. Stop rather than widen scope: never add a second rule, port a second language in the same run, touch files outside the rule or output directory, or execute code from the test corpus; Semgrep only parses it. **Done when:** scope is confirmed unchanged.

### Mode `port`

P1. Pre-flight: confirm the source rule file resolves, is readable, and parses in the source analyzer's format; extract the original rule id. Record the target analyzer's version (`<analyzer> --version` or equivalent) and hold it constant for all validation rounds. Confirm the output directory is writable or can be created. Determine the file extension and rule-language key the analyzer associates with the target language; stop if the language is unknown to the installed analyzer. **Done when:** the source rule parses, the original id is extracted, the version is pinned, and the target language has a confirmed extension.

P2. Applicability analysis: read the source rule and identify its detection mode (taint flow from named sources to sinks, or structural pattern matching) and, for taint rules, the sources, sinks, and sanitizers. Answer three questions for the target language: does the defect class exist there, do equivalent constructs exist for each source, sink, sanitizer, or pattern anchor, and would the ported rule detect real risk rather than a surface syntax resemblance. Assign a verdict: `APPLICABLE` (pattern translates with minor syntax adjustments), `APPLICABLE_WITH_ADAPTATION` (pattern requires significant changes; document each adaptation), or `NOT_APPLICABLE` (defect class is absent or no equivalent construct exists). For `NOT_APPLICABLE`, independently check whether the analyzer can parse the target language at all (`semgrep --dump-ast -l <lang>` on a minimal snippet) and report the result; a language the analyzer cannot analyze is reported as ungradeable, not silently skipped. A `NOT_APPLICABLE` language produces no directory. **Done when:** the verdict and reasoning are recorded.

P3. Test creation before the rule: write the test file first at `<outputDir>/<original-id>-<lang>/<original-id>-<lang>.<ext>`. Include at least two vulnerable cases annotated with the catch marker and at least two safe cases annotated with the no-match marker, each annotation on the line immediately above the code it grades; an annotation followed by a blank line or by another annotation grades the wrong line. Include the safe form that is idiomatic in the target language for doing the thing correctly; this is the false positive a port most often invents. Include at least one edge case or variation and one nested occurrence inside a class, closure, loop, or try/catch. **Done when:** the test file exists with all required cases correctly annotated.

P4. Translation: dump the parse tree for the target language (`semgrep --dump-ast -l <lang> <test-file>`) and translate against the actual tree shape, not against source-text resemblance. Change the rule id to `<original-id>-<lang>`, set the language key to the target language, and add metadata linking the port to its origin:
   ```yaml
   metadata:
     original-rule: <original-id>
     ported-from: <original-id>
   ```
   Write a message that states the defect and the fix concisely, using metavariables the pattern actually captures. Write the translated rule to `<outputDir>/<original-id>-<lang>/<original-id>-<lang>.yaml`. **Done when:** the translated rule file is written with the new id, language key, metadata, and message.

P5. Validation and parity proof: run the analyzer's rule-test harness in JSON mode (`semgrep --test --config <rule-path> <test-file-path> --json`) under the exact version recorded in P1. Parse the JSON verdict: text output can claim "All tests passed" over a rule the analyzer skipped or a test file whose extension it did not associate with the rule's language; the JSON verdict is authoritative. If any test fails, fix the rule to satisfy the test specification and re-run, up to three retry rounds. A port whose graded matrix does not pass is unfinished; never report it as done. **Done when:** the JSON verdict reports zero failures, or three rounds are exhausted with a failure report naming the remaining failures.

## Failure and recovery

- Missing pattern or language: stop before any write; the exact result is a request for the missing input.
- Semgrep missing or the language unsupported: blocked; report the missing binary or unsupported language; no files written.
- `--validate` fails or `--dump-ast` cannot parse the construct: fix the rule or reduce the snippet to the minimal reproducing form; if the language version itself fails to parse, report blocked citing the parse error.
- Tests cannot be made green (persistent missed or incorrect results after bounded retries): roll back by deleting the rule directory and report the failing expectation class; a rule with any failing expectation is never reported as done.
- Final scan shows an uninterpolated metavariable: treat as a failing done-check; fix message or pattern and rerun the test gate; do not ship the rule with the defect.
- Source rule missing, unreadable, or unparsable (port): stop; no output produced.
- Target analyzer not installed or its version unreadable (port): stop and report; the version pin is mandatory and this skill never installs tooling.
- Validation fails after three rounds (port): the port is unfinished; report the failures and stop retrying.
- A port passes under a different analyzer version (port): invalid; the version pinned in P1 is authoritative for the run.
- Text output says tests passed but JSON shows zero graded tests (port): invalid; the JSON verdict is authoritative.
- `NOT_APPLICABLE` verdict (port): no directory written; the verdict is recorded in the report.

Partial results are never reported as success. The rollback path is deleting the directory created by the run, which restores the pre-run state because the run writes nothing else.

## Output

Author mode: the rule directory containing `<rule-id>.yaml` (one rule) and `<rule-id>.<ext>` (annotated test file), plus a run report stating: validation pass, the test matrix (vulnerable, safe, edge, nested) green before and after optimization, AST dump used to confirm the pattern, final scan target and finding count, and confirmation that no message contains an uninterpolated metavariable.

Port mode: for a verdict of `APPLICABLE` or `APPLICABLE_WITH_ADAPTATION`, one subdirectory `<original-id>-<lang>/` under the output directory containing the translated rule and its annotated test file; a report naming the language's final verdict (`APPLICABLE`, `APPLICABLE_WITH_ADAPTATION`, `NOT_APPLICABLE`, ungradeable, or unfinished with retry-round count) and the analyzer version held constant for the run.

Terminal states: done (all checks passed) or blocked (named failure class, artifacts rolled back or the exact failing check stated).
