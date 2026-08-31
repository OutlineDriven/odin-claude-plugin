---
name: setup-repo-skills
description: 'Use when the user wants one-time repository setup for tracker, triage labels, and domain conventions. Don''t use for ongoing triage, issue creation, or multi-repo setup.'
disable-model-invocation: true
---

# Setup repo skills

## Contract

| Field | Bound contract |
|---|---|
| Trigger | One-time repository setup for tracker and domain conventions. |
| Authority | Explicit human invocation only. Preview the complete write set and its consequence, and take each configuration section as one separately confirmed answer, before any file is written. |
| Side effect | Tracker, domain, label, and single steering-file configuration. Exactly four write targets: `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, `docs/agents/domain.md`, and one steering-file edit. Nothing else is created or modified. |
| Done | Dependent workflows can read complete repository-local configuration: every confirmed `docs/agents/` file exists with the chosen conventions, and the steering file carries the `## Agent skills` block naming them. |

## Inputs

- **Required**: a repository working tree and the human, present to confirm one section at a time.
- **Optional**: prior output under `docs/agents/` (updated in place); an existing steering file (`CLAUDE.md` or `AGENTS.md`); monorepo signals (they decide whether the multi-context domain layout is offered).

## Procedure

1. **Preview and explore.** State the four write targets named in the contract and that nothing else changes. Then read the repository without mutating it: `git remote -v` (GitHub, GitLab, or none); whether a root `CLAUDE.md` or `AGENTS.md` exists and whether it already carries an `## Agent skills` block; root `CONTEXT.md` and `CONTEXT-MAP.md`; `docs/adr/` and any `src/*/docs/adr/`; prior output in `docs/agents/`; `.scratch/` (a local-markdown tracker may already be in use); monorepo signals: `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or a populated `packages/*` with its own `src/`. Record findings; assume nothing.

2. **Section A — issue tracker.** Lead with the recommendation so the human can accept it in a word: GitHub when a remote points at GitHub, GitLab when it points at GitLab. Otherwise offer GitHub (`gh` CLI), GitLab (`glab` CLI), local markdown under `.scratch/`, or other: for other, ask for a one-paragraph workflow description and record it as freeform prose in `docs/agents/issue-tracker.md`. One section, one confirmed answer, then the next section.

3. **Section B — triage labels.** Ask exactly one question: keep the five default triage labels? The defaults, each string equal to its role name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. On yes, write them as-is. On no, usually because the tracker already uses other names, collect the existing string for each role so the mapping reuses existing labels instead of creating duplicates.

4. **Section C — domain docs.** Default single-context (one `CONTEXT.md` plus `docs/adr/` at the root); write it without a question. Offer multi-context (a root `CONTEXT-MAP.md` pointing at per-context `CONTEXT.md` files) only when step 1 found monorepo signals, and confirm that choice.

5. **Show drafts for editing.** Present the `## Agent skills` steering block and the three `docs/agents/` drafts built from the seeds below. Nothing is written until the human approves the drafts.

   Steering block (fill the three one-liners from the confirmed sections):

   ```markdown
   ## Agent skills

   ### Issue tracker
   <one-line summary of where issues are tracked>. See `docs/agents/issue-tracker.md`.

   ### Triage labels
   <one-line summary of the label vocabulary>. See `docs/agents/triage-labels.md`.

   ### Domain docs
   <one-line summary: single-context or multi-context>. See `docs/agents/domain.md`.
   ```

   `docs/agents/issue-tracker.md` seed for GitHub:

   ```markdown
   # Issue tracker: GitHub

   Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations; it infers the repo from `git remote -v` inside a clone.

   - Create: `gh issue create --title "..." --body "..."` (heredoc for multi-line bodies)
   - Read: `gh issue view <number> --comments`, fetching labels
   - List: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`, with `--label` and `--state` filters
   - Comment: `gh issue comment <number> --body "..."`
   - Labels: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
   - Close: `gh issue close <number> --comment "..."`

   PRs as a request surface: **no** (flip to yes in this file only if external PRs are triaged as feature requests). When yes, PRs run through the same labels and states via the `gh pr` equivalents: `gh pr view <number> --comments`, `gh pr diff <number>`, list open PRs keeping only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE`, and `gh pr comment` / `gh pr edit --add-label`/`--remove-label` / `gh pr close`. GitHub shares one number space across issues and PRs, so resolve a bare `#42` with `gh pr view 42`, falling back to `gh issue view 42`.

   - "Publish to the issue tracker" — create a GitHub issue.
   - "Fetch the relevant ticket" — `gh issue view <number> --comments`.

   Map and tickets: the map is a single issue labelled `effort:map` holding the Notes / Decisions-so-far / Fog body; each ticket is a child issue linked as a GitHub sub-issue — where sub-issues are unavailable, add the child to a task list in the map body and put `Part of #<map>` at the top of the child — labelled `effort:<type>` (`research`/`prototype`/`grilling`/`task`); once claimed, a ticket is assigned to the driving dev. Blocking uses GitHub's native issue dependencies, the UI-visible gate: `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, with the blocker's numeric database id from `gh api repos/<owner>/<repo>/issues/<n> --jq .id` (not the `#number` or `node_id`); where dependencies are unavailable, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed (`issue_dependencies_summary.blocked_by` counts open blockers only). Frontier: the map's open children with no open blocker and no assignee, first in map order. Claim: `gh issue edit <n> --add-assignee @me`, the session's first write. Resolve: comment the answer, close, then append a context pointer to the map's Decisions-so-far.
   ```

   `docs/agents/issue-tracker.md` seed for GitLab:

   ```markdown
   # Issue tracker: GitLab

   Issues and specs for this repo live as GitLab issues. Use the `glab` CLI for all operations; it infers the repo from `git remote -v` inside a clone.

   - Create: `glab issue create --title "..." --description "..."` (heredoc for multi-line descriptions; `--description -` opens an editor)
   - Read: `glab issue view <number> --comments`; `-F json` for machine-readable output
   - List: `glab issue list -F json` with `--label` filters
   - Comment: `glab issue note <number> --message "..."` (GitLab calls comments notes)
   - Labels: `glab issue update <number> --label "..."` / `--unlabel "..."` (comma-separated or repeated flags)
   - Close: `glab issue close <number>`; closing accepts no comment, so post the explanation as a note first

   Merge requests are GitLab's pull requests: `glab mr create`, `glab mr view`, `glab mr note`, and so on — `mr` in place of `pr`, `note`/`--message` in place of `comment`/`--body`. MRs as a request surface: **no** (flip to yes in this file only if external MRs are triaged as feature requests). When yes, MRs run through the same labels and states via the `glab mr` equivalents: `glab mr view <number> --comments`, `glab mr diff <number>`, list open MRs keeping only non-member authors, and `glab mr note` / `glab mr update --label`/`--unlabel` / `glab mr close`. Issues and MRs number separately, so `#42` is unambiguous once the surface is known.

   - "Publish to the issue tracker" — create a GitLab issue.
   - "Fetch the relevant ticket" — `glab issue view <number> --comments`.

   Map and tickets: the map is a single issue labelled `effort:map` holding the Notes / Decisions-so-far / Fog body (a native epic may hold it on tiers with epics; a labelled issue works everywhere); each ticket carries `Part of #<map>` at the top of its description plus an `effort:<type>` label (`research`/`prototype`/`grilling`/`task`); once claimed, a ticket is assigned to the driving dev. Blocking uses GitLab's native blocking link, added with the `/blocked_by #<n>` quick action posted as a note — a Premium/Ultimate feature; on the free tier, fall back to a `Blocked by: #<n>, #<n>` line at the top of the description. A ticket is unblocked when every blocker is closed. Frontier: the map's open children with no open blocker and no assignee, first in map order. Claim: `glab issue update <n> --assignee @me`, the session's first write. Resolve: post the answer as a note, close, then append a context pointer to the map's Decisions-so-far.
   ```

   `docs/agents/issue-tracker.md` seed for local markdown:

   ```markdown
   # Issue tracker: local markdown

   Issues and specs for this repo live as markdown files under `.scratch/`.

   - One feature per directory: `.scratch/<feature-slug>/`
   - Spec: `.scratch/<feature-slug>/spec.md`
   - Tickets: one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`; never one combined tickets file
   - Triage state: a `Status:` line near the top of each issue file, using the role strings from `docs/agents/triage-labels.md`
   - Conversation: appended at the bottom of the file under a `## Comments` heading

   - "Publish to the issue tracker" — create a new file under `.scratch/<feature-slug>/`, creating the directory if needed.
   - "Fetch the relevant ticket" — read the file at the referenced path; the caller passes the path or number.

   Map and tickets: the map is `.scratch/<effort>/map.md` holding the Notes / Decisions-so-far / Fog body; each ticket is `.scratch/<effort>/issues/NN-<slug>.md` with a `Type:` line (`research`/`prototype`/`grilling`/`task`) and a `Status:` line (`claimed`/`resolved`). Blocking is a `Blocked by: NN, NN` line near the top; a ticket is unblocked when every file it lists is `resolved`. Frontier: scan `.scratch/<effort>/issues/` for open, unblocked, unclaimed files; lowest number first. Claim: set `Status: claimed` and save before any work. Resolve: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer to the map's Decisions-so-far in `map.md`.
   ```

   `docs/agents/triage-labels.md` seed:

   ```markdown
   # Triage labels

   Workflows speak in five canonical triage roles; this file maps each role to the label string this tracker actually uses.

   | Canonical role | Label in this tracker | Meaning |
   |---|---|---|
   | `needs-triage` | `needs-triage` | Maintainer needs to evaluate this issue |
   | `needs-info` | `needs-info` | Waiting on the reporter for more information |
   | `ready-for-agent` | `ready-for-agent` | Fully specified, ready for an AFK agent |
   | `ready-for-human` | `ready-for-human` | Requires human implementation |
   | `wontfix` | `wontfix` | Will not be actioned |

   When a workflow mentions a role, apply the string in the middle column. Edit that column to match the tracker's real vocabulary; the left column never changes.
   ```

   `docs/agents/domain.md` seed:

   ```markdown
   # Domain docs

   How workflows consume this repo's domain documentation when exploring the codebase.

   Before exploring, read, when present: `CONTEXT.md` at the root; otherwise `CONTEXT-MAP.md`, which points at one `CONTEXT.md` per context (read each one relevant to the topic); and `docs/adr/` for decisions touching the area — multi-context repos also check `src/<context>/docs/adr/` for context-scoped decisions. Missing files are neither flagged nor created upfront; the domain-documentation workflow creates them lazily when a term or decision actually resolves.

   Layouts. Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. Multi-context: a root `CONTEXT-MAP.md`, shared `docs/adr/` at the root, and a `CONTEXT.md` plus `docs/adr/` inside each `src/<context>/`.

   Name domain concepts with the glossary's exact terms; never drift to synonyms the glossary avoids. A missing term is a signal: either invented language the project does not use (reconsider) or a real gap (record it for the domain-documentation workflow).

   If output contradicts an existing ADR, surface the conflict explicitly instead of silently overriding — name the ADR and state why it may be worth reopening.
   ```

6. **Write after approval.** Steering file: edit `CLAUDE.md` when it exists, else `AGENTS.md`; when neither exists, ask the human which to create and never pick for them; never create both; update an existing `## Agent skills` block in place rather than appending a duplicate, and leave surrounding sections untouched. Then write the three `docs/agents/` files from the approved seeds; for an other tracker, write `docs/agents/issue-tracker.md` from the human's description instead of a seed. The PRs/MRs-as-request-surface flag stays off and is not raised; a human who wants external requests triaged flips it in the file later.

7. **Report completion.** Name each written file and the convention it records; state that the `docs/agents/` files are edited directly later and this setup re-runs only to switch trackers or restart from scratch.

## Failure and recovery
- **Section unanswered or declined**: stop at that section and write nothing for it. Files already approved and written stand as a partial result, reported as partial; done is not claimed.
- **No git remote**: never guess a hosted tracker; the GitHub and GitLab seeds are unusable without their host. Offer local markdown or a freeform tracker and continue only on a confirmed answer.
- **Steering-file ambiguity**: neither file exists — ask, never choose. A block already exists — update it in place, preserve every surrounding user edit, and report the exact change.
- **Write fails mid-batch**: report exactly which files landed. Recover by reverting the steering-file edit and deleting only the `docs/agents/` files this run wrote; all four writes are reversible local writes.
- Errors are surfaced, never swallowed, and done is never claimed while a confirmed file is missing.

## Output
Four artifacts: `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, `docs/agents/domain.md`, and the steering-file `## Agent skills` block, plus a terminal report naming every written file and its chosen convention. Terminal classification: complete, partial (some confirmed files written), or blocked (nothing written, with the reason).

## Provenance

Adapted from mattpocock/skills (revision `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`), MIT licensed, Copyright (c) 2026 Matt Pocock. Adaptation: renamed to `setup-repo-skills`; the five source support docs (`domain.md`, `issue-tracker-github.md`, `issue-tracker-gitlab.md`, `issue-tracker-local.md`, `triage-labels.md`) are inlined as seeds so the skill is self-contained; peer-skill routing was removed — the label section no longer gates on another skill's installation, consumer skills are described by function rather than name, and the `wayfinder:` label prefix was genericized to `effort:`; per-section human confirmation was retained and preview-before-write made explicit. License obligation — retain the copyright and permission notice — is recorded in the root `PROVENANCE.md`.
