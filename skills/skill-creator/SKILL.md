---
name: skill-creator
description: 'Use when the user runs /skill-creator to codify a prior /scrape result into a permanent, tested browser-skill directory that is installed and validated. Not for general skill authoring — use skill-writer; not for plan-first builds — use skill-plan-first-builder.'
---

# Skill creator

## Contract

| Field | Bound contract |
|---|---|
| Trigger | the user runs /skill-creator to create a skill |
| Authority | reversible-local: write only the new skill directory under the gstack browser-skills tree; rollback is discarding the staged temp dir or removing the committed skill with `$B skill rm` |
| Side effect | a new skill directory authored under gstack conventions |
| Done | the new skill is installed and validated |

## Inputs

Required: a prior successful `/scrape` invocation in the current conversation whose JSON result the user did not invalidate. The scrape must have been bounded: an identifiable intent line and trailing JSON output.

Optional: the user may rename the proposed skill or choose project tier instead of global.

## Procedure

1. **Provenance guard.** Walk back through the conversation, at most 10 agent turns, for the most recent `/scrape` invocation that was bounded and whose JSON result the user did not subsequently invalidate. If none is found, refuse: "No recent /scrape result found in this conversation. Run /scrape <intent> first, then say /skillify." Stop. Do not synthesize from chat fragments or from a match-path result (matched skills are already codified). If the candidate is several turns back and the user is discussing something unrelated, ask once to confirm before proceeding. Done when: a bounded `/scrape` result is found or the refusal is issued.

2. **Propose name and triggers.** From the prototype intent, extract a short skill name (lowercase letters/digits/dashes, ≤32 chars, starts with a letter, no consecutive dashes), 3–5 trigger phrases mixing the canonical phrase with paraphrases, and the target hostname. Ask the user to confirm the name and tier (global or project). Before asking, run `$B skill list` and check for an existing skill at the same name; if found, warn about tier-shadowing (a higher tier shadows a lower one) or same-tier collision. Done when: the user confirms name and tier, or a collision is surfaced.

3. **Synthesize the script.** Use only the final-attempt `$B` calls that produced the accepted JSON plus the user's intent string. Drop failed selector attempts, unrelated commands, and all conversation prose. The script imports the browse client from a sibling `_lib/browse-client` copy and exports `parseFromHtml` as a pure parser (HTML in, parsed rows out), so tests exercise it against the fixture without the daemon. Keep all `$B` calls in `main()`; extract parsing into pure helpers. Done when: the script is synthesized with a pure parser and `main()` entry point.

4. **Capture the fixture.** Navigate to the target URL and save the HTML to a fixture file named `fixtures/<host-with-dashes>-<YYYY-MM-DD>.html` using today's date. Read the file contents for staging. Done when: the fixture file exists and its contents are read.

5. **Write the test.** The test must include at least one assertion that parsed output has the expected shape AND non-empty key fields, not a smoke test that only checks the parser does not throw. Load the fixture, call the pure parser, assert item count > 0 and every required field has the correct type. Done when: the test file is written with shape and non-empty-field assertions.

6. **Resolve and read the canonical SDK.** Resolve the gstack install directory from the bundled `hackernews-frontpage` skill path in `$B skill list` or from `~/.claude/skills/gstack/`. Read the canonical `browse-client.ts` contents for staging as `_lib/browse-client.ts` byte-identical so each skill is self-contained with no version drift. Done when: `browse-client.ts` is read and staged as `_lib/browse-client.ts`.

7. **Stage atomically.** Call the `stageSkill` helper from `browse/src/browser-skill-write.ts` with a file map containing `SKILL.md`, `script.ts`, `script.test.ts`, `_lib/browse-client.ts`, and the fixture. The generated `SKILL.md` follows the gstack frontmatter contract: name, description, host, `trusted: false`, `source: agent`, version, and triggers. Capture the returned staged directory path. Done when: the staged directory path is captured.

8. **Run the test gate.** Run `$B skill test "<name>" --dir "<stagedDir>"` (or fall back to `bun test script.test.ts` inside the staged dir). If the test fails with a fixable parser bug, rewrite the script and test in the staged dir and retry at most twice, showing the diff before each retry. If still failing after two retries or the failure is environmental (SDK import, daemon connection), discard the staged dir, report the failure, show the staged `script.ts` for reference, and stop. No on-disk artifact. Done when: the test passes, or the staged dir is discarded on failure.

9. **Approval gate.** After the tests pass, ask the user whether to commit, inspect the script first, or discard. If the user chooses to inspect, print the staged `SKILL.md` and `script.ts` (not the fixture or `_lib/`), then re-ask without the inspect option. Done when: the user chooses commit, inspect (and then commit/discard), or discard.

10. **Commit or discard.** On approval, call `commitSkill` with the name, tier, and staged dir. If `commitSkill` throws "already exists" (tier collision the user dismissed in step 2), report and ask whether to rename, remove the existing skill and retry, or discard. On rejection, call `discardStaged` and report that no skill was written to disk. Done when: the skill is committed or discarded.

11. **Verify.** After commit, run `$B skill list | grep <name>` and `$B skill run <name>`. If the post-commit run does not match the prototype output, show the discrepancy to the user. Do not silently roll back. End with: "Skill '<name>' committed at <tier>. Future /scrape calls matching '<canonical-trigger>' will run in ~200ms." Done when: the skill is verified in the list and by a run, or a discrepancy is surfaced.

## Failure and recovery
- **No scrape found:** refuse with the exact message in step 1; stop. Do not synthesize from fragments.
- **Test failure (fixable parser bug):** rewrite in the staged dir, retry at most twice with diff shown. After two retries, discard the staged dir and stop.
- **Test failure (environmental: SDK import, daemon connection):** discard the staged dir, report, and stop. No partial artifact.
- **Tier collision at commit:** report and ask to rename, remove-then-retry, or discard. Do not overwrite silently.
- **Post-commit output mismatch:** surface to the user; do not silently roll back. The user may remove and retry.
- **Partial-result rule:** there is no "almost shipped" state. The staged temp dir is removed entirely on any failure. The skill lands on disk only on test pass plus explicit user approval.

## Output
A committed, self-contained browser-skill directory at the chosen tier path (`~/.gstack/browser-skills/<name>/` for global, `<project>/.gstack/browser-skills/<name>/` for project), containing `SKILL.md`, `script.ts`, `script.test.ts`, `_lib/browse-client.ts`, and a fixture — verified by `$B skill list` and `$B skill run`.

## Provenance

Origin: https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69, file `skillify/SKILL.md`. License: MIT, Copyright (c) 2026 Garry Tan. Clean-room adaptation: expressive prose and procedure re-derived from the source mechanism; no third-party expression copied wholesale. The iron contract (temp-dir stage, test gate, approval gate, atomic commit or discard) and the pure-parser-with-fixture-test pattern are preserved as the distinguishing source mechanisms.
