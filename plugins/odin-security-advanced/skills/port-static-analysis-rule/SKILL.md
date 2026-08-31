---
name: port-static-analysis-rule
description: 'Use when an existing static-analysis rule must be ported to another language or analyzer, producing an independently validated rule with vulnerable, safe, and edge-case parity tests. Use this for cross-language rule porting, not for authoring a new rule from a vulnerability description (use semgrep-rule-authoring) or for running scans (use semgrep-security-scan).'
---

# Port a static-analysis rule

Porting takes a rule that detects a defect class in one language and rebuilds it for another language or analyzer, then proves the port catches the same defect class. The proof is a graded test matrix: vulnerable cases the rule must flag, safe cases it must not flag (including the safe form that is idiomatic in the target language), and edge cases. Tests exist before the ported rule does; a port that only compiles is not a port.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user has an existing static-analysis rule and wants independently validated ports for one or more target languages or analyzers. |
| Authority | Reversible-local: write only to the user-specified output directory. No remote mutation, no credential use, no changes outside the named output tree, and the skill never installs tooling. Roll back by deleting the output directory created by this run. |
| Side effect | Per-language subdirectories, each containing one translated rule file and one annotated test file. The source rule is never modified. |
| Done | Every requested language has an explicit applicability verdict, and every applicable port passes its graded vulnerable/safe/edge matrix under the analyzer version pinned at the start of the run. |

## Inputs

| Input | Required | Meaning |
|---|---|---|
| Source rule | Yes | Path to the existing rule file. Must be readable and parse in the source analyzer's format. |
| Source analyzer | Yes | The tool the source rule runs under, with its version. The version is recorded at start and held constant for every validation round in this run. |
| Target languages | Yes | List of target languages, one entry per language. `"Go and Java"` is two entries, not one. |
| Target analyzer | No | Defaults to the source analyzer when it supports the target language; otherwise the analyzer this project uses for that language. The mechanism the port targets must already be installed. |
| Output directory | No | Where per-language subdirectories are written. Defaults to the current working directory. |

## Procedure

### Pre-flight

1. Confirm the source rule file resolves and is readable; stop if not. **Done when:** the source rule is confirmed readable.
2. Record the target analyzer's version (`<analyzer> --version` or equivalent). This version is held constant for all validation rounds. Confirm the target language list is non-empty and has no duplicates. **Done when:** the version is recorded and the language list is validated.
3. Confirm the output directory is writable or can be created. **Done when:** the output directory is confirmed writable.
4. Parse the source rule; stop if it does not parse. Extract the original rule id. **Done when:** the rule parses and the original id is extracted.
5. For each target language, determine the file extension and rule-language key the target analyzer associates with it. Stop if any language is unknown to the installed analyzer. **Done when:** every language has a confirmed extension.

### Per-language cycle

Run all four phases for each language before moving to the next. Do not batch a phase across languages.

**Phase 1: Applicability analysis**

6. Read the source rule. Identify its detection mode (taint flow from named sources to sinks, or structural pattern matching) and, for taint rules, the sources, sinks, and sanitizers. **Done when:** the detection mode and, where present, the taint elements are identified.
7. For the target language answer three questions: Does the defect class exist in the target language? Do equivalent constructs exist for each source, sink, sanitizer, or pattern anchor? Would the ported rule detect real risk rather than a surface syntax resemblance? **Done when:** all three questions are answered for the language.
8. Assign a verdict: `APPLICABLE` (pattern translates with minor syntax adjustments), `APPLICABLE_WITH_ADAPTATION` (pattern requires significant changes; document each adaptation), or `NOT_APPLICABLE` (defect class is absent or no equivalent construct exists). **Done when:** the verdict is assigned.
9. If the verdict is `NOT_APPLICABLE`, independently check whether the analyzer can parse the target language at all (for Semgrep: `semgrep --dump-ast -l <lang>` on a minimal snippet). Report the result explicitly; a language the analyzer cannot analyze is reported as ungradeable, not silently skipped. **Done when:** the analyzability check is run and reported for every `NOT_APPLICABLE` verdict.
10. Record the verdict and reasoning. A `NOT_APPLICABLE` language produces no directory. **Done when:** the verdict and reasoning are recorded.

**Phase 2: Test creation (before the rule)**

11. Write the test file first, at `<outputDir>/<original-id>-<lang>/<original-id>-<lang>.<ext>`. **Done when:** the test file path is created.
12. Include at least two vulnerable cases annotated with the catch marker and at least two safe cases annotated with the no-match marker, each annotation on the line immediately above the code it grades. An annotation followed by a blank line or by another annotation grades the wrong line. **Done when:** the annotations are present and correctly placed.
13. Include the safe form that is idiomatic in the target language for doing the thing correctly. This is the false positive a port most often invents. **Done when:** the idiomatic safe form is included.
14. Include at least one edge case or variation, and one nested occurrence inside a class, closure, loop, or try/catch. The test file extension must match the language key confirmed in step 5. **Done when:** edge and nested cases exist and the extension is confirmed correct.

**Phase 3: Translation**

15. Dump the parse tree for the target language with the analyzer's dump mechanism (for Semgrep: `semgrep --dump-ast -l <lang> <test-file>`). **Done when:** the parse-tree dump is produced.
16. Translate against the actual tree shape, not against source-text resemblance. **Done when:** the translation is done against the tree.
17. Change the rule id to `<original-id>-<lang>`, set the language key to the target language, and add metadata linking the port to its origin:
    ```yaml
    metadata:
      original-rule: <original-id>
      ported-from: <original-id>
    ```
    Write a message that states the defect and the fix concisely, using metavariables the pattern actually captures. **Done when:** the id, language key, metadata, and message are updated.
18. Write the translated rule to `<outputDir>/<original-id>-<lang>/<original-id>-<lang>.yaml`. **Done when:** the translated rule file is written.

**Phase 4: Validation and parity proof**

19. Run the analyzer's rule-test harness in JSON mode (for Semgrep: `semgrep --test --config <rule-path> <test-file-path> --json`) with the exact version recorded in step 2. **Done when:** the test command is executed.
20. Parse the JSON verdict. Text output can claim "All tests passed" over a rule the analyzer skipped or a test file whose extension it did not associate with the rule's language; the JSON verdict is authoritative. **Done when:** the JSON verdict is parsed.
21. If any test fails, fix the rule to satisfy the test specification and re-run step 19. Stop when the JSON verdict reports zero failures, or after three retry rounds. **Done when:** zero failures, or three rounds exhausted with a failure report naming the language and the remaining failures.
22. A language whose graded matrix does not pass is unfinished; never report it as done. **Done when:** each language is confirmed done or unfinished.

### Reporting

23. After all languages complete, report each language by verdict: which passed, which failed validation (with retry-round counts), which were not applicable, and which the analyzer cannot analyze. State the analyzer version held constant for the run. **Done when:** the per-language report is emitted.

## Failure and recovery

| Failure | Result |
|---|---|
| Source rule missing, unreadable, or unparsable | Stop; no output produced. |
| Empty or duplicate target language list | Stop; no output produced. |
| Target analyzer not installed | Stop and report; this skill never installs tooling. |
| Analyzer version unreadable | Stop; no output produced; the version pin is mandatory. |
| Validation fails after three rounds | That language is unfinished; report the failures and stop retrying it. |
| A port passes under a different analyzer version | Invalid; the version pinned in step 2 is authoritative for this run. |
| Text output says tests passed but JSON shows zero graded tests | Invalid; the JSON verdict is authoritative. |
| Language is `NOT_APPLICABLE` | No directory written; verdict recorded in the report. |
| `APPLICABLE` or `APPLICABLE_WITH_ADAPTATION` but the analyzer cannot parse the language | Directory written; language marked ungradeable in the report. |

Rollback: delete the output directory created by this run. Writes are confined to that directory, one subdirectory per language.

## Output

For each language with verdict `APPLICABLE` or `APPLICABLE_WITH_ADAPTATION`, one subdirectory under the output directory containing the translated rule and its annotated test file; a report naming every language with its final verdict; a language is done only when its graded vulnerable/safe/edge matrix passes under the pinned analyzer version.
