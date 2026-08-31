---
name: semgrep-rule-variant-creator
description: 'Use when asked to port an existing Semgrep rule to specified target languages. Takes a finished rule and one or more target languages; produces independent rule+test directories for each applicable language through a four-phase test-first cycle. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Semgrep rule variant creator

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User has an existing Semgrep rule and wants independently validated variants for one or more target languages. |
| Authority | Reversible-local: write only to the user-specified output directory; no remote mutation, credential use, or changes outside the named output tree. Roll back by deleting the output directory created by this run. |
| Side effect | Creates per-language subdirectories containing a translated rule YAML and an annotated test file; does not modify the source rule. |
| Done | Each requested language has an explicit applicability verdict; every applicable variant passes real graded ruleid and ok tests under the pinned Semgrep. |

## Inputs

| Input | Required | Meaning |
|---|---|---|
| `rulePath` | Yes | Path to the existing Semgrep rule YAML file. Must be readable and parse as YAML. |
| `languages` | Yes | List of target language identifiers, one per entry. `"Go and Java"` is two entries, not one. |
| `outputDir` | No | Directory where per-language subdirectories are written. Defaults to the current working directory. |
| `semgrep` | Yes | `semgrep` binary on PATH; version is recorded at start and held constant for all validation rounds in this run. |

## Procedure

### Pre-flight validation

1. Confirm `rulePath` resolves to a readable file; stop if it does not.
2. Record the Semgrep binary version: `semgrep --version`. Hold this exact version for every `semgrep --test` call in this run.
3. For each language in `languages`, run `semgrep --dump-ast -l <lang> probe.<ext>` where `<ext>` is the expected extension for that language. If Semgrep exits non-zero or produces no AST output, record `semgrepCanAnalyze: false` for that language; proceed but mark applicable variants as ungradeable if the verdict is not `NOT_APPLICABLE`.
4. Reject a `languages` list that is empty, contains duplicate entries, or contains a non-string entry.
5. Resolve `outputDir` to an absolute path. Create it if it does not exist.

### Per-language four-phase cycle

Run all four phases for each language before moving to the next. Do not batch a phase across languages.

**Phase 1: Applicability analysis**

6. Read the source rule YAML. Identify the detection mode (taint mode or pattern matching), and for taint rules the sources, sinks, and sanitizers.
7. For the target language, determine:
   - Does the vulnerability class exist in the target language?
   - Do equivalent constructs exist for each source, sink, and sanitizer?
   - Would the ported rule detect real risk rather than a surface syntax match?
8. Assign a verdict:
   - `APPLICABLE`: pattern translates with minor syntax adjustments.
   - `APPLICABLE_WITH_ADAPTATION`: pattern requires significant changes; document each adaptation.
   - `NOT_APPLICABLE`: vulnerability class is absent or no equivalent construct exists.
9. If the verdict is `NOT_APPLICABLE`, run `semgrep --dump-ast -l <lang> probe.<ext>` independently and apply the separate "Can Semgrep Analyze the Target at All?" check from the Reference section before finalizing the verdict. Report the result of this check explicitly.
10. Record the verdict and reasoning for the language. A language with verdict `NOT_APPLICABLE` produces no directory.

**Phase 2: Test creation**

11. Write the test file before touching the rule. Place it in `<outputDir>/<original-id>-<lang>/<original-id>-<lang>.<ext>`.
12. The test file must contain at least two `ruleid:` annotations and at least two `ok:` annotations, each on the line immediately above the code it grades. An annotation followed by a blank line or by another annotation grades the wrong line.
13. Include the safe form that is idiomatic in the target language for doing the thing correctly — this is the false-positive case the port most often invents.
14. The test file extension must match the language Semgrep associates with the rule's `languages` key.

**Phase 3: Rule translation**

15. Dump the AST for the target language: `semgrep --dump-ast -l <lang> <test-file>`.
16. Translate against the actual AST shape, not against source text resemblance.
17. Change the `id` to `<original-id>-<lang>`. Change the `languages` key to the target language. Add metadata fields:
    ```yaml
    message: |
      [... translated message ...]
    metadata:
      original-rule: <original-id>
      ported-from: <original-id>
    ```
18. Write the translated rule to `<outputDir>/<original-id>-<lang>/<original-id>-<lang>.yaml`.

**Phase 4: Validation**

19. Run `semgrep --test --config <rule-path> <test-file-path> --json` using the exact Semgrep version recorded in step 2.
20. Parse the JSON output. `semgrep --test` also prints "All tests passed" over a rule it skipped and over a test file whose extension it did not associate with the rule's language; the JSON verdict is authoritative.
21. If any test fails, fix the rule to satisfy the test specification. Re-run step 19 after each fix. Stop only when the JSON verdict reports zero failures, or after three retry rounds — if three rounds fail, stop with a failure report naming the language and the remaining failures.
22. A language whose tests do not pass is unfinished; do not report it as done.

### Reporting

23. After all languages complete, report each language by verdict: which passed, which failed validation (and how many retry rounds were attempted), which were not applicable, and which Semgrep cannot analyze. State the Semgrep version held constant for the run.

## Failure and recovery
| Failure | Result |
|---|---|
| Source rule file not found or unreadable | Stop; no output produced. |
| Empty or duplicate `languages` list | Stop; no output produced. |
| Semgrep not on PATH | Stop; no output produced. |
| Semgrep version unreadable | Stop; no output produced. |
| Phase 4 fails after three validation rounds | Language is unfinished; report failures and stop retrying that language. |
| A variant passes validation under a different Semgrep version | Invalid; the version pinned at step 2 is authoritative for this run. |
| A variant reports "All tests passed" but the JSON shows zero graded tests | Invalid; the JSON verdict is authoritative. |
| Language is NOT_APPLICABLE | No directory written for that language; verdict is recorded in the report. |
| Language has verdict APPLICABLE or APPLICABLE_WITH_ADAPTATION but Semgrep cannot analyze it | Directory written; language is marked ungradeable in the report. |

Rollback: delete the output directory created by this run. Writes are confined to that directory, and each language uses its own subdirectory.

## Output
For each language with verdict `APPLICABLE` or `APPLICABLE_WITH_ADAPTATION`, one subdirectory under `outputDir`:

```
<original-id>-<language>/
├── <original-id>-<language>.yaml   # Translated rule; id, languages, and metadata updated
└── <original-id>-<language>.<ext> # Annotated test file; annotations on the line above each graded case
```

The report names each language and its final verdict. A language is done only when its `semgrep --test` JSON verdict reports zero failures.

## Provenance

Adapted from the Trail of Bits `semgrep-rule-variant-creator` skill.

Origin: https://github.com/trailofbits/skills
Pinned revision: d1f1575cff97816e5cc08af66cd2506099c681d3
License: CC-BY-SA-4.0
Reference: [Applicability Analysis](https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3/plugins/semgrep-rule-variant-creator/skills/semgrep-rule-variant-creator/references/applicability-analysis.md); [Language Syntax Guide](https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3/plugins/semgrep-rule-variant-creator/skills/semgrep-rule-variant-creator/references/language-syntax-guide.md); [Workflow Mechanics](https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3/plugins/semgrep-rule-variant-creator/skills/semgrep-rule-variant-creator/references/workflow.md)

Adaptation rationale: Porting existing rules through per-language applicability analysis and independent test-first cycles is a distinct workflow from creating a rule from a bug-pattern description. The original's workflow script is replaced with direct agent procedure; the reference guides are embedded in the Procedure section and not called as external files.
