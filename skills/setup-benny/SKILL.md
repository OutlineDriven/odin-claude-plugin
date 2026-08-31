---
name: setup-benny
description: 'Use when the user asks to install or configure the Benny agent automation pack: copies the adapted pack, validates settings, and creates two automations that pass thread-safety checks while disabled before the user enables them. Don''t use for automated or unattended runs; every repository write and live automation change requires explicit human approval.'
disable-model-invocation: true
---

# Set up Benny

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Install or configure the Benny agent automation pack. |
| Authority | human-only-external-or-irreversible: explicit human invocation starts setup. Preview every target and consequence, and obtain explicit approval immediately before changing repository files or any live automation. The user performs or explicitly directs every Automations editor save and enable action. |
| Side effect | Copies the adapted pack to `.cursor/automations/benny/`, edits or validates `.cursor/settings.json`, and creates or updates two automations. It may later open a draft pull request while `benny-reproduce` runs. No credential, paid action, publication, deployment, merge, deletion, or unrelated remote mutation is authorized. |
| Done | Both automations pass all seven thread-safety checks while disabled before the user enables them. |

## Inputs

The user must supply:

- target repository path and repository URL;
- repository default branch;
- source Slack channel ID;
- Slack user ID of the trusted triage identity;
- repository-relative path of a committed, secret-free Benny configuration outside `.cursor/automations/benny/`;
- tracker type, team, project, intake status, and label names;
- exact names, as displayed by Cursor, of connected tracker actions for search, read, create, update, source-link/recurrence update, and compensation by cancel, close, or delete;
- exact names, as displayed by Cursor, of connected Slack actions for channel/thread read, thread reply, and file download;
- exact names, as displayed by Cursor, of connected repository actions for source/history read and draft pull-request creation;
- exact names, as displayed by Cursor, of connected browser actions for launch, user interaction, read-only inspection, screenshot, recording start/stop, and cleanup;
- repository-relative path of a completed, committed feature map outside `.cursor/automations/benny/`;
- model slugs shown in the user's Cursor model picker for triage, reproduction, code, and media review.

Optional inputs are an operations Slack channel ID and its post/edit action, a committed routing-map path, status emoji, pull-request URL format, artifact retention, and polling, follow-up, reproduction, rejection, and fix budgets.

Secrets must remain in Cursor's connected integrations, a secret manager, or environment variables. They must not enter repository files, prompts, receipts, logs, or artifacts.

## Procedure

1. **Bind scope and approval.** Resolve the target repository to one local root and display the repository URL, branch, files that may change, two automation names, connected integrations, and the consequences of saving disabled automations. Obtain approval before the first repository write. Treat approval to write repository files, approval to save each disabled automation, and approval to enable each automation as three separate decisions. Do not infer one from another.

2. **Acquire the pinned source without a preinstalled pack.** In disposable scratch space, fetch `https://github.com/cursor/plugins/archive/68836ddaf5697224520f1847d90cdb90ca8babaa.tar.gz` over HTTPS and extract only `pstack/automations/benny/`. Reject absolute paths, `..` components, links, devices, and entries outside that subtree. The source repository need not exist locally. Verify each extracted regular file by computing the Git blob ID as SHA-1 of `blob `, the decimal byte length, a NUL byte, and the exact file bytes. Require this manifest:

   | Relative source path | Git blob ID |
   |---|---|
   | `FOR_AGENTS.md` | `e732156e9b88b463e4a40c0f51596bca4aedcdb4` |
   | `README.md` | `76804c8c566aae1a70734725416ae2f251a7ae30` |
   | `skills/reproduce-and-fix-issues/SKILL.md` | `effa5f0a38d2cfe7d948a71ff51827e2e2017257` |
   | `skills/reproduce-and-fix-issues/references/control-adapter.md` | `3399491eddbc458f3a7ceb6fd62b8f89266b07ef` |
   | `skills/reproduce-and-fix-issues/references/feature-map.example.md` | `620ddedba3c13d603974b1d78754e36946dacf81` |
   | `skills/reproduce-and-fix-issues/references/verify-existing-fix.md` | `e3cda3c06a48432fd932b32318ade4e6178ef4ed` |
   | `skills/triage-issue-reports/SKILL.md` | `d691672d00fb8f8f07fc17290d00ae49d1fd119b` |
   | `skills/triage-issue-reports/references/routing.example.md` | `d71aea768c7d9452270ca4f11091a47e5750038c` |
   | `templates/configuration.example.yaml` | `8616f5fcced0ac57964467dd537a6ba80560a271` |
   | `templates/reproduce-automation-prompt.md` | `5c66c922d69f7323d0c78461480baaf45d7b1284` |
   | `templates/triage-automation-prompt.md` | `939e5e15c09f57d17cee00c9ed58b3679a268e0f` |

   A missing file, extra source dependency, hash mismatch, unsafe archive member, network failure, or moving revision is `BLOCKED`. Never fall back to an unpinned branch, local plugin cache, remembered text, or another installed skill.

3. **Build the adapted pack entirely in scratch.** Use LF newlines and UTF-8. A section replacement includes its start heading and ends immediately before the next named heading. Require each start and next heading exactly once and in order. A literal replacement must match exactly once. Any mismatch is `BLOCKED`; do not guess. Produce these destination files:

   - `README.md`: replace the source file with:

     ```markdown
     # Benny

     Benny provides two repository-bound Cursor automations for Slack issue reports. `benny-triage` classifies and files clear new bugs. `benny-reproduce` reproduces trusted reports through connected browser actions and may prepare a bounded draft fix.

     Runtime instructions live in the two committed operational files under `skills/`. Configuration, feature maps, routing maps, and secrets remain outside this pack. Setup uses the human-guided Cursor Automations editor; it never calls an automation backend directly. Keep both automations disabled until all seven thread-safety checks pass.
     ```

   - `FOR_AGENTS.md`: replace the source file with:

     ```markdown
     # Benny automation intent

     Install this directory at `.cursor/automations/benny/` in the target repository. The two automation prompts read their exact committed operational files directly. They use only the connected Slack, tracker, repository, and browser actions named in the committed Benny configuration. No plugin, discovered command, peer skill, source checkout, cache path, or session context is a runtime dependency.

     `benny-triage` handles one new top-level source-channel report, freezes its source coordinates, reads the thread and attachments, classifies and deduplicates it, creates only a clear new bug, and posts exactly one thread reply ending in one configured marker.

     `benny-reproduce` waits for a marker by the configured triage identity in the same thread, reproduces the discriminating symptom twice through real UI actions, verifies an existing fix without authoring over it, and may open one bounded draft pull request after before-and-after proof.

     Neither automation may post a root message in the source channel. Workers receive no Slack credentials or Slack write actions. Both automations fail closed when coordinates, capabilities, configuration, or preflight evidence are missing.
     ```

   - `skills/setup-benny/SKILL.md`: copy this complete setup document verbatim. It is provenance-bearing installation material, not a runtime dependency of either automation.

   - `skills/triage-issue-reports/SKILL.md`: start from the verified source file, then apply all of these exact transformations:

     1. Replace the section from `## Hard safety rules` through immediately before `## 1. Freeze source coordinates` with:

        ```markdown
        ## Hard safety rules

        - The source channel and root thread coordinates are immutable.
        - Never post a root message in the source channel, another channel, a DM, or a replacement thread, and never broadcast a reply.
        - Preflight the source parent before every tracker write and immediately before the one verdict post. A missing, deleted, inaccessible, mismatched, or uncertain parent produces no Slack or tracker write.
        - Post one substantive verdict and no progress narration.
        - The coordinator is the only Slack writer. A delegated worker is read-only, receives no Slack credential or write action, and returns findings only. Every worker request explicitly forbids all Slack writes. If the available worker boundary cannot enforce this, the coordinator performs the work.
        - Never create an issue without a stable source-thread permalink and a configured compensation action.
        - Separate immutable source coordinates from all mutable analysis and status state before concurrent work starts.
        - Lead the final verdict with the decision, retain only evidence needed by the reporter, and remove repetition before posting.
        ```

     2. Replace the section from `## 3. Trace cause before routing` through immediately before `## 4. Classify` with:

        ```markdown
        ## 3. Trace cause before routing

        Use the configured connected repository source and history actions for one bounded pass before choosing an owner or destination:

        1. Trace the reported user action through the likely code path to the observed result.
        2. Decide whether the visible symptom belongs to that path or a dependency below it.
        3. Inspect recent history when the report appears to be a regression or touches defensive code.
        4. Search open and merged pull requests and commits for the same symptom or cause.
        5. Record confirmed facts separately from hypotheses and name evidence that would distinguish competing hypotheses.

        A complete root cause is not required. The pass must be sufficient to avoid routing a surface symptom to a contradicted owner. If source or history access is unavailable, do not guess an owner; classify conservatively and state that cause tracing was unavailable.
        ```

     3. Replace the section from `## 6. Use the issue-tracker adapter` through immediately before `## 7. Dedupe` with:

        ```markdown
        ## 6. Use connected tracker actions

        Use only the exact connected Cursor tracker actions named in the configuration. Before any write, resolve and capability-check the configured actions for:

        - searching by text, state, label, source URL, and date range;
        - reading an issue and its links;
        - creating an issue with title, body, status, labels, and source URL;
        - updating an issue without replacing unrelated fields;
        - adding a source link and recurrence note;
        - compensating for a verdict-post failure by canceling, closing, or deleting an issue created by this run.

        Resolve the configured team, project, status, and labels at runtime. Never invent an ID, create a label, assign an owner, or set priority unless the configuration explicitly requires it. If an action is absent, ambiguous, disconnected, or lacks the needed operation, fail closed for that write.
        ```

     4. Replace exact text `The adapter can compensate if the verdict post fails.` with `The configured compensation action is available if the verdict post fails.`
     5. Replace exact text `use the adapter's compensation action` with `run the configured compensation action`.

   - `skills/reproduce-and-fix-issues/SKILL.md`: start from the verified source file, then apply all of these exact transformations:

     1. Replace the section from `## Hard safety rules` through immediately before `## 1. Freeze source coordinates` with:

        ```markdown
        ## Hard safety rules

        - Freeze the source channel and root thread coordinates before any concurrent work. Only the coordinator may write to Slack.
        - Never post a root message in the source channel. Before every source-channel reply, read and validate the immutable parent; a failed preflight produces no post.
        - Delegated analysis workers are read-only and receive no Slack credential or write action. A fix worker may edit only in an environment that provably excludes every Slack credential and write action. Every worker request explicitly forbids all Slack writes and external posting. If isolation cannot enforce this, the coordinator performs the work.
        - A person owns the fix only after explicitly accepting implementation work. Evidence summaries, log lookup, diagnosis requests, and bot-authored hypotheses do not establish ownership.
        - The discriminating symptom must appear twice through real UI interaction. Read-only inspection may confirm an observation; it must not inject or force the result.
        - No confirmed reproduction means no authored fix. An existing pull request or commit switches the run to verification and must not be edited or competed with.
        - Captures, recordings, logs, and tokens remain outside source control.
        - Keep delegated questions narrow, preserve only evidence needed for the decision, sequence work into verifiable units, eliminate competing causes before editing, fix the root cause, and require runtime before-and-after proof.
        ```

     2. Replace the section from `## 5. Load and check the control adapter` through immediately before `## 6. Study the report` with:

        ```markdown
        ## 5. Load and check connected browser actions

        Read the completed map at `browser.feature_map_path`. Find the section matching the reported user path before controlling the app. If no section covers it, stop as blocked rather than inventing a path, action, or selector.

        Resolve only the exact connected Cursor browser actions named in configuration. Capability-check all seven groups before reproduction:

        1. Launch the requested repository revision in the configured safe test environment and distinguish it from a similar window, shell, or production instance.
        2. Perform real user actions: click, type, key press, scroll, drag, resize, and navigation through app controls.
        3. Drive the feature-map actions and applicable documented states, using safe fixture data or supported test controls only for preconditions.
        4. Inspect accessibility, DOM or view hierarchy, process state, logs, network status, or app-exposed debug state without mutation.
        5. Capture a screenshot that includes enough app identity to prove the tested surface.
        6. Start and stop a recording that contains the full path and discriminating final state.
        7. Stop created processes and sessions and remove only disposable profiles, fixtures, tunnels, and expired captures created by this run.

        Prefer roles, labels, accessible names, ARIA relationships, stable component markers, and purpose-named data attributes. Use coordinates only after a fresh screenshot. Never use generated classes, dynamic hashes, child indexes, brittle DOM position, hidden app methods, direct storage writes, DOM injection, or state mutation to manufacture the symptom.

        Before enabling the automation, run one harmless capability check: launch the app, confirm its stable marker, load one completed feature-map section, navigate by its user path, exercise one disposable mapped state, inspect it read-only, capture a screenshot, record a short clip, and clean up. Any missing, ambiguous, disconnected, unsafe, or unsuccessful capability leaves `benny-reproduce` disabled.
        ```

     3. Replace the section from `## 6. Study the report` through immediately before `## 7. Reproduce` with:

        ```markdown
        ## 6. Study the report

        Read the full source thread and tracker issue when present. Capture the exact action path, expected behavior, observed behavior, discriminating divergence, frequency, version, environment, platform, attachments, errors, and signatures.

        Use the configured repository source and history actions to trace the user action to the observed result. Inspect screenshots and video at useful resolution. Search code, tests, history, merged changes, and open pull requests in parallel when useful. For apparent regressions or defensive code, inspect the reason and invariant behind the relevant change rather than removing it blindly. Form competing cause hypotheses and name evidence that would separate them.

        A delegated worker receives one narrow read-only question, no Slack credential or write action, and the explicit Slack-write prohibition.
        ```

     4. Replace every exact occurrence of `control adapter` with `connected browser action set`, every exact occurrence of `control-adapter` with `browser-action`, and every exact occurrence of `adapter's cleanup capability` with `configured browser cleanup action`. Apply these replacements after the section replacements and require at least one match for each phrase that remains in the source-derived text.
     5. Replace the section from `## 12. Root-cause and implement` through immediately before `## 13. Prove the fix` with:

        ```markdown
        ## 12. Root-cause and implement

        The coordinator owns every Slack post, final diff review, commit, and pull request. Read-only workers may trace code and history, propose tests, map blast radius, review a diff, or review media; they do not edit, run external writes, post status, or own the fix. A tightly scoped code edit may be delegated only when the worker environment provably has no Slack credential or write action and its request carries the explicit Slack-write prohibition. Otherwise the coordinator edits.

        Confirm the mechanism with runtime evidence and eliminate competing hypotheses before editing. Fix the root cause with the smallest justified change. When a cheap local behavioral test can reproduce the defect, write it first and observe it fail for the defect before applying the fix. When such a test is expensive, unclear, or integration-heavy, state that reason and rely on the required real-UI before-and-after proof. Keep unrelated cleanup out. Stop if the work exceeds the configured effort or risk budget.
        ```

     6. Replace the exact line `- Run the pull request text and all Slack updates through pstack's \`unslop\` skill.` with `- Make the pull-request text and Slack updates concise, concrete, and free of repetition before publishing.`

   - Omit `skills/reproduce-and-fix-issues/references/control-adapter.md`; its complete runtime capability contract is now section 5 of the reproduction operational file. No installed file may reference the omitted path.

   - `skills/reproduce-and-fix-issues/references/feature-map.example.md`: start from the verified source and replace every exact occurrence of `control adapter` with `connected browser actions`, `adapter action` with `browser action`, `control.feature_map_path` with `browser.feature_map_path`, and `adapter actions` with `browser actions`.

   - `skills/reproduce-and-fix-issues/references/verify-existing-fix.md`: start from the verified source and replace exact text `Through the configured control adapter:` with `Through the configured connected browser actions:`.

   - `skills/triage-issue-reports/references/routing.example.md`: copy the verified source bytes unchanged.

   - `templates/configuration.example.yaml`: replace the source file with this complete literal:

     ```yaml
     schema_version: 2

     automations:
       triage_name: "benny-triage"
       reproduce_name: "benny-reproduce"

     slack:
       source_channel_id: "SOURCE_CHANNEL_ID"
       operations_channel_id: ""
       triage_identity_user_id: "TRIAGE_IDENTITY_USER_ID"
       thread_read_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       thread_reply_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       file_download_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       operations_post_or_edit_action: ""
       allow_source_root_posts: false
       allow_worker_slack_writes: false

     repository:
       url: "https://github.com/example-org/example-repo"
       default_branch: "main"
       source_read_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       history_read_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       draft_pull_request_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       pull_request_url_format: "https://github.com/{owner}/{repo}/pull/{number}"
       draft_only: true

     tracker:
       type: "TRACKER_TYPE"
       search_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       read_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       create_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       update_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       source_link_or_recurrence_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       compensation_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       team: "TEAM"
       project: "PROJECT"
       labels:
         bug: "BUG_LABEL"
         performance: "PERFORMANCE_LABEL"
         intake: "INTAKE_LABEL"
         needs_repro: "NEEDS_REPRO_LABEL"
       status: "INTAKE_STATUS"
       source_link_title: "Slack report"

     routing:
       map_path: ".cursor/benny/routing.md"
       owner_pings_default: false
       allow_feature_owner_ping: false
       allow_confirmed_regression_author_ping: false

     browser:
       launch_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       interact_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       inspect_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       screenshot_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       recording_start_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       recording_stop_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       cleanup_action: "EXACT_CONNECTED_CURSOR_ACTION_NAME"
       feature_map_path: ".cursor/benny/feature-map.md"
       environment: "SAFE_TEST_ENVIRONMENT"
       artifact_directory: "/tmp/benny-artifacts"
       artifact_retention_hours: 24

     verdict_markers:
       bug: "[benny:bug]"
       performance: "[benny:performance]"
       other: "[benny:other]"
       tracker_attribute: "tracker"

     status_emoji:
       seen: "👀"
       reproducing: "🔎"
       reproduced: "✅"
       could_not_reproduce: "⚪"
       blocked: "⛔"
       fixing: "🛠️"
       fix_failed: "❌"
       pull_request_opened: "🔗"

     budgets:
       poll_seconds: 45
       verdict_wait_minutes: 45
       triage_follow_up_minutes: 10
       triage_total_minutes: 30
       repro_minutes: 60
       rejection_window_minutes: 10
       fix_minutes: 90
       operations_follow_up_minutes: 45

     models:
       triage: "MODEL_SLUG_FROM_CURSOR_PICKER"
       reproduce: "MODEL_SLUG_FROM_CURSOR_PICKER"
       code: "MODEL_SLUG_FROM_CURSOR_PICKER"
       media_review: "MODEL_SLUG_FROM_CURSOR_PICKER"
     ```

   - `templates/triage-automation-prompt.md`: write the exact triage prompt in step 9.
   - `templates/reproduce-automation-prompt.md`: write the exact reproduction prompt in step 9.

   After transformation, scan every candidate text file. Require no occurrence of the pinned source plugin's shared-skill namespace, its individual shared-skill invocations, `adapter_skill_name`, `skill_name`, `control.feature_map_path`, the omitted control reference path, a built-in automation-creation handoff, a slash-command handoff, `AGENTS.md`, a system prompt, a rule file, a session-history dependency, a plugin cache path, or an instruction to invoke, load, discover, or route through another skill. Operational files may call only the connected actions named by the committed configuration. A failed scan is `BLOCKED`.

4. **Preflight a lossless install.** The source-managed destination set is exactly the files listed in step 3. Preserve every destination-only file. For each source-managed path, classify it as absent, byte-identical to the candidate, or conflicting. A conflicting path is `BLOCKED` before any write; show its diff and require the user to preserve or relocate local edits before a later run. Never overwrite or automatically merge an existing differing file. User-owned configuration, feature maps, and routing maps remain outside the pack and are never pack-managed.

5. **Prepare transaction-safe rollback.** Immediately before writing, record for every candidate path and `.cursor/settings.json`: whether it exists, its exact bytes, mode, and hash. After each successful write, record the exact post-write hash. On failure, consider only paths written by this run. Restore a prior file or remove a newly created file only when its current hash still equals this run's recorded post-write hash. If a path changed afterward, preserve it and report a rollback conflict. Never use repository-wide reset, checkout, clean, stash, or deletion, and never discard a user's intervening edit.

6. **Install the pack and merge settings.** After a final file-change preview and approval, create `.cursor/automations/benny/` as needed and write the scratch candidates atomically. For `.cursor/settings.json`, parse existing JSON or JSONC without erasing comments. This self-contained pack requires no plugin entry, so its exact merge object is `{}`: preserve every existing key and byte when the file exists and is valid; create the file as `{}\n` only when absent. Reject malformed JSON/JSONC rather than rewriting it. Do not add, enable, disable, or load any plugin. Re-read every written file and require its hash to equal the staged candidate.

7. **Create user-owned configuration.** Copy `templates/configuration.example.yaml` to the user-supplied repository-relative configuration path outside the pack only when that path is absent. Copy the feature-map example to the supplied path only when absent. Never overwrite either. Replace every uppercase placeholder with the user's exact value or connected action name; an empty operations channel and action are allowed. Copy and complete the routing example only when routing is requested. Require all paths to be repository-relative, inside the target repository, outside `.cursor/automations/benny/`, and free of traversal. Reject secret values. Validate YAML and require no unresolved placeholder.

8. **Fail-closed capability matrix.** Resolve every configured name against actions actually exposed by Cursor in the target repository. Do not invent an endpoint, action, parameter, or fallback. Record `present`, `authenticated`, `scope`, and one harmless read/check result for each row:

   | Surface | Required before triage save | Required before reproduction save |
   |---|---|---|
   | Slack | source channel/thread read; attachment download; reply with explicit `channel` and nonempty `thread_ts` | source thread read; reply with explicit `channel` and nonempty `thread_ts`; optional operations post/edit only when configured |
   | Tracker | search, read, create, update, source-link/recurrence update, and compensation | read and update/link when configured by the operational path |
   | Repository | source and history read | source/history read, isolated baseline and patched workspaces, repository checks, and draft pull-request creation |
   | Browser | none | launch, real user interaction, mapped-state setup, read-only inspection, screenshot, recording start/stop, reset, and cleanup |

   Triage remains disabled unless every triage cell passes. Reproduction remains disabled unless every reproduction cell passes, the harmless nine-step browser check in its operational file passes, and the completed feature map covers every allowed reproduced feature. A missing or ambiguous capability is not replaced with a skill, shell command, token, undocumented API, or guessed action.

9. **Prepare the exact live prompts.** Substitute only the bracketed values from the completed configuration. The committed operational file and configuration path remain repository-relative. Write these same literals to the two prompt template files during step 3.

   **`benny-triage` prompt:**

   ```text
   Handle each new top-level Slack message in source channel [SOURCE_CHANNEL_ID]. For every run, first read and follow `.cursor/automations/benny/skills/triage-issue-reports/SKILL.md`, then read the committed configuration at [BENNY_CONFIG_PATH]. Use only the connected Slack, tracker, and repository actions named there.

   Take the event channel as SOURCE_CHANNEL_ID and require it to equal [SOURCE_CHANNEL_ID]. Set SOURCE_THREAD_TS to the event thread timestamp when present, otherwise the event message timestamp. Require both values, freeze them, read the root by those exact coordinates, and obtain its permalink. If coordinates are missing or mismatched, the parent is deleted or inaccessible, configuration is incomplete, or a required action is unavailable, stop with no Slack or tracker write.

   Read the entire source thread and relevant attachments. Classify the report, trace the likely cause with bounded repository source and history reads, apply the optional routing map, and search the configured tracker for duplicates. Create a tracker issue only for a clear new bug or performance defect and only when the configured compensation action is available. The coordinator alone may write to Slack. Every worker is read-only, receives no Slack credential or write action, and must be explicitly forbidden from every Slack write.

   Immediately before any tracker write and immediately before the final reply, re-read and validate the immutable source parent. Post no progress messages and never post a root message in the source channel. Post exactly one substantive reply with channel=SOURCE_CHANNEL_ID and thread_ts=SOURCE_THREAD_TS. End it with exactly one configured [benny:bug], [benny:performance], or [benny:other] marker; a bug or performance marker may include tracker=<URL>. Re-read the same thread and verify the reply is under SOURCE_THREAD_TS. If a newly created issue loses its Slack handoff, run and verify the configured compensation action. Do not retry at the root.
   ```

   **`benny-reproduce` prompt:**

   ```text
   Handle each new top-level Slack message in source channel [SOURCE_CHANNEL_ID] for repository [REPOSITORY_URL] on default branch [DEFAULT_BRANCH]. For every run, first read and follow `.cursor/automations/benny/skills/reproduce-and-fix-issues/SKILL.md`, then read the committed configuration at [BENNY_CONFIG_PATH] and completed feature map at [FEATURE_MAP_PATH]. Use only the connected Slack, tracker, repository, and browser actions named there.

   Take the event channel as SOURCE_CHANNEL_ID and require it to equal [SOURCE_CHANNEL_ID]. Set SOURCE_THREAD_TS to the event thread timestamp when present, otherwise the event message timestamp. Require both values, freeze them, and validate the root by those exact coordinates. If coordinates are missing or mismatched, the parent is deleted or inaccessible, configuration or feature coverage is incomplete, or a required action is unavailable, stop without a source-channel post.

   Wait up to the configured verdict budget for exactly one marker reply under SOURCE_THREAD_TS authored by trusted triage identity [TRIAGE_IDENTITY_USER_ID]. Continue only for the configured bug or performance marker. Stop silently for other, absent, conflicting, untrusted, or timed-out markers. The coordinator alone may write to Slack. Every worker receives no Slack credential or write action and must be explicitly forbidden from every Slack write. Never post a root message in the source channel.

   Stop when a person explicitly owns the fix. When an open pull request or merged commit plausibly fixes the symptom, verify its baseline and patched behavior without editing it or opening a competing pull request. Otherwise reproduce the exact discriminating symptom twice through mapped real UI actions, without injecting state, and capture a screenshot, full-path recording, and read-only state cross-check. No two-run reproduction means no authored fix. After confirmed reproduction and the operational fix gate, attempt at most one bounded root-cause fix, prove the same real UI path before and after, run the repository's required focused checks, and open only a draft pull request when all proof passes. Preflight SOURCE_CHANNEL_ID and SOURCE_THREAD_TS immediately before any source reply and verify every reply remains under SOURCE_THREAD_TS.
   ```

10. **Use the human-guided Automations editor.** Never call an automation backend, automation tool, private endpoint, protocol deep link, or URL carrying draft fields. Never inspect or update an existing automation by creating a replacement. For each automation, show a draft table containing name, new-versus-existing status, trigger channel/event, repository/branch, model, connected actions, complete prompt, disabled state, and consequences. Obtain explicit approval for that automation. Then direct the user to open Cursor's Automations editor through the normal Cursor UI and guide these exact actions:

    1. Select the existing automation with the exact name, or choose the editor's normal new-automation action when none exists.
    2. Set the name to `benny-triage` or `benny-reproduce`.
    3. Select the trigger for each new top-level message in the configured source Slack channel; do not select replies, schedules, or another channel.
    4. Select the configured repository and default branch.
    5. Select the approved model slug from the editor's model picker.
    6. Connect only the approved actions from the capability matrix. Give workers no Slack connection or credential.
    7. Paste the corresponding complete prompt from step 9 without paraphrase.
    8. Keep the automation disabled, review every field against the draft table, then obtain separate approval before the user saves it.

    Complete and save the disabled triage automation before beginning reproduction. For an existing automation, change only fields that differ from the approved table. Record prior and saved values for those fields so the user can restore only unchanged, setup-owned edits if recovery is needed.

11. **Commit boundary.** Require `.cursor/settings.json`, `.cursor/automations/benny/`, the completed Benny configuration, feature map, and optional routing map to be committed on the exact branch used by both automation checkouts. Do not commit unless separately asked. Confirm that each saved prompt names the exact committed operational and configuration paths. A dirty, uncommitted, wrong-branch, absent, or differently rooted file leaves both automations disabled.

12. **Prove all seven thread-safety checks while disabled.** Use a test channel wired with the same action scopes or one harmless test report in the configured source channel. Capture the root channel and timestamp before either run. Exercise both saved prompts without enabling normal traffic. Require all seven checks:

    1. Triage stores the root `thread_ts` and posts exactly one verdict as a reply to it.
    2. The verdict contains exactly one configured marker.
    3. Reproduction accepts the marker only when its author is the configured triage identity.
    4. Reproduction retains the same immutable source channel and root timestamp for every source read and reply.
    5. No source-channel root message appears from either automation.
    6. A delegated worker cannot access or invoke any Slack write action.
    7. Missing coordinates, a deleted parent, or a failed immediate preflight produces no Slack post and no tracker issue; when triage had created an issue before a final-post failure, compensation is verified.

    Record the event coordinates, action audit evidence, resulting thread, tracker result, and pass/fail for each check. Any missing evidence or failure keeps both automations disabled. Do not weaken prompts, broaden permissions, or substitute an operations-channel result for a source-thread check.

13. **Enable only by a final human decision.** Present the seven-check receipt and the exact two disabled automation names. Ask separately whether to enable `benny-triage`, then `benny-reproduce`. The user enables each through its normal Cursor editor. If approval is absent or any check failed, finish `BLOCKED` with both disabled.

## Failure and recovery

| Class | Result |
|---|---|
| Target repository or required input absent | `BLOCKED`; list the exact missing values and make no change. |
| Pinned fetch, archive safety, blob verification, or deterministic transformation fails | `BLOCKED`; delete disposable scratch only and make no target change. |
| Existing source-managed destination differs | `BLOCKED`; preserve it, show the conflicting path, and make no target change. |
| Malformed settings or configuration | `BLOCKED`; report the exact parse or validation error and do not rewrite it. |
| Required connected action absent, ambiguous, unauthenticated, or insufficiently scoped | `BLOCKED`; keep the affected automation disabled and name the failed matrix cell. |
| Browser capability or feature-map coverage fails | `BLOCKED`; keep reproduction disabled. |
| Editor approval or save is declined or interrupted | `NON_CONVERGED`; do not save further automations and keep saved automations disabled. |
| Any thread-safety check lacks evidence or fails | `BLOCKED`; keep both automations disabled and name the failed check. |
| Draft pull-request creation fails during a later run | The reproduction run must not claim success, merge, deploy, or post a root message; preserve the isolated branch state in run output and report `Fix did not land`. |

On any setup failure, roll back only repository paths written by this run whose current hashes still equal this run's recorded post-write hashes. Restore each such prior byte sequence and mode, or remove it when it did not previously exist. Preserve and report every path changed after setup wrote it. Never discard user edits. Live automation recovery is human-guided: keep the automation disabled, compare each setup-changed field with its recorded saved value, and ask the user to restore only fields still equal to that value. Never call a backend or delete an automation. Always remove disposable acquisition scratch and clean up browser processes, sessions, profiles, fixtures, tunnels, and expired captures created by this run; preserve user work and retained evidence allowed by policy.

## Output

Return one receipt containing:

- target repository URL, path, and branch;
- pinned source revision and every verified source blob ID;
- installed, unchanged, blocked, and rolled-back paths;
- `.cursor/settings.json` validation or creation result;
- committed configuration, feature-map, routing-map, operational-file, and prompt paths;
- capability-matrix results with exact connected action names;
- prior and saved field values for each human-approved disabled automation;
- all seven thread-safety checks with evidence;
- final state of `benny-triage` and `benny-reproduce`: `disabled`, `enabled by user`, or `not saved`;
- terminal classification: `DONE` only when both were saved, all seven checks passed, and the user enabled both; otherwise `BLOCKED` or `NON_CONVERGED` with the exact stopping condition.

## Provenance

Origin: `https://github.com/cursor/plugins`, path `pstack/automations/benny/`, pinned revision `68836ddaf5697224520f1847d90cdb90ca8babaa`.

Candidate: `source:source-cursor:cursor-setup-benny`. Module: `odin-agent`. Slug: `setup-benny`.

License: MIT. License evidence is `pstack/LICENSE` blob `6b5400237fdf6545be0b8fae370d6f2fcff8fb25` (1067 bytes); pstack is authored by Lauren Tan (poteto). Copyright (c) Lauren Tan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Adaptation: the pinned MIT source supplies the dormant Benny workflow and verified base files. This document deterministically replaces dependency-bearing installation, tracker, control, and automation-creation handoffs with complete repository-bound procedures, explicit connected Cursor action contracts, exact live prompts, fail-closed capability checks, human-approved editor steps, seven thread-safety proofs, and compare-before-restore rollback. No preinstalled source pack, peer skill, plugin, external instruction file, automation backend, or session context is required at execution time.
