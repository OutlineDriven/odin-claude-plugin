---
name: fuzzing-dictionary
description: 'Use when a parser, protocol, or file format fuzzer stalls at fixed-token validation gates. Extracts tokens from target source, headers, or binary, writes a fuzzer-parseable dictionary, and confirms tokens correspond to target parsing gates. Not for patching the SUT — use fuzzing-obstacles.'
---

# Fuzzing dictionary

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs a focused dictionary for a parser, protocol, or file format whose coverage stalls at fixed tokens. |
| Authority | Write only the named local dictionary file and fuzzer campaign configuration; rollback is deleting the dictionary file and reverting the configuration flag. |
| Side effect | Fuzzer dictionary file and campaign configuration. |
| Done | The dictionary parses in the selected fuzzer and its tokens correspond to target validation or parsing gates. |

## Not for

- Patching the system under test to bypass obstacles — use fuzzing-obstacles.
- Coverage measurement or plateau analysis — use fuzzing-coverage-analysis.
- Remote, credential, publish, deploy, or irreversible changes.

## Inputs

Required: the target source, specification, header files, or binary to extract tokens from; the selected fuzzer (libFuzzer, AFL++, or cargo-fuzz).
Optional: an existing corpus, known boundary values, and the target's `-max_len` or equivalent input-length limit.

## Procedure

1. Bound scope: name the single dictionary file path and the single fuzzer configuration flag to set. Do not edit source, harness, or corpus files. Done when: the dictionary path and config flag are named.
2. Identify the fixed tokens the target compares against: keywords, magic bytes, protocol commands, chunk types, format delimiters, and boundary values. Read them from the target source, header files, specification, or `strings` of the binary. Done when: fixed tokens are extracted from the target.
3. Write the dictionary file with one entry per line. Use `"token"` for bare strings, `kw="value"` for named entries, `#` for comments, `\\` for backslash, `\"` for embedded quotes, and `\xXX` hex escapes for non-printable bytes. Done when: the dictionary file is written with correct syntax.
4. Keep the dictionary focused. Deduplicate with `sort -u`. Drop full sentences and prose; keep atomic tokens. Done when: the dictionary has deduplicated atomic entries.
5. Wire the dictionary into the selected fuzzer with its flag: libFuzzer `-dict=./dictionary.dict`, AFL++ `-x ./dictionary.dict`, cargo-fuzz `-- -dict=./dictionary.dict`. Confirm the fuzzer loads the file without a parse error. Done when: the fuzzer loads the dictionary without error.
6. Validate effectiveness: confirm the tokens reach the target's validation or parsing gates rather than being filtered before them. Run a short campaign with and without the dictionary to observe whether the tokens reach the gates. If a token is longer than the fuzzer's max input length, shorten it or raise the limit. Done when: the dictionary parses in the selected fuzzer and its tokens correspond to target validation or parsing gates.

## Failure and recovery

- Dictionary parse error: the fuzzer reports a syntax or path error. Fix unescaped quotes, invalid `\xXX` escapes, or the file path; re-run the load check.
- Tokens do not correspond to target gates: re-extract from the target source or binary rather than guessing; replace irrelevant entries.
- Oversized dictionary: an excessive number of entries slows the fuzzer and dilutes useful tokens. Prune to the most relevant entries.
- Entries ignored: a token exceeds `-max_len`. Shorten the entry or raise the limit.
- Partial result: keep only entries that load and correspond to a gate; discard the rest.
- Non-mutation rule: on any failure, delete the dictionary file and revert the configuration flag before retrying; never leave a broken dictionary wired into the campaign.

## Output

A fuzzer-parseable dictionary file plus the single fuzzer configuration flag set to load it, with confirmation that the tokens correspond to target validation or parsing gates.
