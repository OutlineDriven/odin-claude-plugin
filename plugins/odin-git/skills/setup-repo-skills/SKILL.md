---
name: setup-repo-skills
description: 'Use when the user wants one-time repository setup for tracker, triage labels, and domain conventions. Not for ongoing triage, issue creation, or multi-repo setup.'
disable-model-invocation: true
---

# Setup repo skills

## Contract

| Field | Bound contract |
|---|---|
| Trigger | One-time repository setup for tracker and domain conventions. |
| Authority | Human-gated: previews the complete write set and its consequences, getting separate confirmation for each configuration section; otherwise reversible local: writes only `docs/agents/` config files and one steering-file edit; rollback is version control. No remote mutation. |
| Side effect | Tracker, domain, label, and single steering-file configuration. Exactly four write targets: `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, `docs/agents/domain.md`, and one steering-file edit. Nothing else is created or modified. |
| Done | Dependent workflows can read complete repository-local configuration: every confirmed `docs/agents/` file exists with the chosen conventions, and the steering file carries the `## Agent skills` block naming them. |

## Not for

- Ongoing triage, issue creation, or multi-repo setup.

## Inputs

- Required: a repository working tree and a human present to confirm one section at a time.
- Optional: prior output under `docs/agents/` (updated in place); an existing steering file (`CLAUDE.md` or `AGENTS.md`); monorepo signals (they decide whether the multi-context domain layout is offered).

## Procedure

1. **Preview and explore.** State the four write targets named in the contract and that nothing else changes. Then read the repository without mutating it: `git remote -v` (GitHub, GitLab, or none); whether a root `CLAUDE.md` or `AGENTS.md` exists and whether it already carries an `## Agent skills` block; root `CONTEXT.md` and `CONTEXT-MAP.md`; `docs/adr/` and any `src/*/docs/adr/`; prior output in `docs/agents/`; `.scratch/` (a local-markdown tracker may already be in use); monorepo signals: `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or a populated `packages/*` with its own `src/`. Record findings; assume nothing. **Done when:** findings are recorded.

2. **Section A: issue tracker.** Lead with the recommendation so the human can accept it in a word: GitHub when a remote points at GitHub, GitLab when it points at GitLab. Otherwise offer GitHub (`gh` CLI), GitLab (`glab` CLI), local markdown under `.scratch/`, or other. For other, ask for a one-paragraph workflow description and record it as freeform prose in `docs/agents/issue-tracker.md`. One section, one confirmed answer, then the next section. **Done when:** the tracker choice is confirmed.

3. **Section B: triage labels.** Ask exactly one question: keep the five default triage labels? The defaults, each string equal to its role name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. On yes, write them as-is. On no, usually because the tracker already uses other names, collect the existing string for each role so the mapping reuses existing labels instead of creating duplicates. **Done when:** the label set is confirmed.

4. **Section C: domain docs.** Default single-context (one `CONTEXT.md` plus `docs/adr/` at the root); write it without a question. Offer multi-context (a root `CONTEXT-MAP.md` pointing at per-context `CONTEXT.md` files) only when step 1 found monorepo signals, and confirm that choice. **Done when:** the domain layout is confirmed.

5. **Show drafts for editing.** Present the `## Agent skills` steering block and the three `docs/agents/` drafts built from the seeds below. Nothing is written until the human approves the drafts. **Done when:** the human approves or declines the drafts.

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

   - "Publish to the issue tracker": create a GitHub issue.
   - "Fetch the relevant ticket": `gh issue view <number> --comments`.

   Map and tickets: the map is a single issue labelled `effort:map` holding the Notes / Decisions-so-far / Fog body; each ticket is a child issue linked as a GitHub sub-issue, where sub-issues are unavailable, add the child to a task list in the map body and put `Part of #<map>` at the top of the child, labelled `effort:<type>` (`research`/`prototype`/`grilling`/`task`); once claimed, a ticket is assigned to the driving dev. Blocking uses GitHub's native issue dependencies, the UI-visible gate: `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, with the blocker's numeric database id from `gh api repos/<owner>/<repo>/issues/<n> --jq .id` (not the `#number` or `node_id`); where dependencies are unavailable, use a task list in the map body.
   ```

   `docs/agents/issue-tracker.md` seed for GitLab:

   ```markdown
   # Issue tracker: GitLab

   Issues and specs for this repo live as GitLab issues. Use the `glab` CLI for all operations; it infers the repo from `git remote -v` inside a clone.

   - Create: `glab issue create --title "..." --description "..."`
   - Read: `glab issue view <number> --comments`
   - List: `glab issue list`, with `--label` and `--state` filters
   - Comment: `glab issue note <number> --message "..."`
   - Labels: `glab issue update <number> --add-label "..."` / `--remove-label "..."`
   - Close: `glab issue close <number> --comment "..."`

   PRs as a request surface: **no** (flip to yes in this file only if external MRs are triaged as feature requests). When yes, MRs run through the same labels and states via the `glab mr` equivalents.

   - "Publish to the issue tracker": create a GitLab issue.
   - "Fetch the relevant ticket": `glab issue view <number> --comments`.

   Map and tickets: the map is a single issue labelled `effort:map`; each ticket is a child issue linked as a GitLab sub-issue, or a task list entry when sub-issues are unavailable, labelled `effort:<type>`.
   ```

   `docs/agents/issue-tracker.md` seed for local markdown:

   ```markdown
   # Issue tracker: local markdown

   Issues and specs for this repo live as markdown files under `.scratch/`. No CLI is required.

   - Create: write `.scratch/issues/<number>-<slug>.md` with frontmatter (title, labels, status)
   - Read: open the file
   - List: `ls .scratch/issues/`
   - Comment: append to the file under a `## Comments` heading
   - Labels: edit frontmatter
   - Close: set `status: closed` in frontmatter

   Map and tickets: the map is `.scratch/map.md`; each ticket is a file under `.scratch/issues/` labelled `effort:<type>` in frontmatter. Blocking is recorded in frontmatter as `blocked-by: [<numbers>]`.
   ```

   `docs/agents/triage-labels.md` seed:

   ```markdown
   # Triage labels

   | Label | Role |
   |---|---|
   | `needs-triage` | New issue awaiting classification |
   | `needs-info` | Missing reproduction or clarification |
   | `ready-for-agent` | Ready for autonomous work |
   | `ready-for-human` | Ready for human work |
   | `wontfix` | Closed without action |

   Apply exactly one label per issue at any time. Transition in order: `needs-triage` → `needs-info` or `ready-for-agent` or `ready-for-human` → resolved or `wontfix`.
   ```

   `docs/agents/domain.md` seed:

   ```markdown
   # Domain docs

   Single-context: one root `CONTEXT.md` holds the ubiquitous language; `docs/adr/` holds architecture decision records. Every term in `CONTEXT.md` must be defined before it is used in code or docs.

   When multi-context: a root `CONTEXT-MAP.md` points at per-context `CONTEXT.md` files under `src/<context>/CONTEXT.md` or `packages/<context>/CONTEXT.md`.
   ```

6. **Write after approval.** Steering file: edit `CLAUDE.md` when it exists, else `AGENTS.md`; when neither exists, ask the human which to create and never pick for them; never create both; update an existing `## Agent skills` block in place rather than appending a duplicate, and leave surrounding sections untouched. Then write the three `docs/agents/` files from the approved seeds; for an other tracker, write `docs/agents/issue-tracker.md` from the human's description instead of a seed. The PRs/MRs-as-request-surface flag stays off and is not raised; a human who wants external requests triaged flips it in the file later. **Done when:** all approved files are written.

7. **Report completion.** Name each written file and the convention it records; state that the `docs/agents/` files are edited directly later and this setup re-runs only to switch trackers or restart from scratch. **Done when:** the completion report is emitted.

## Failure and recovery

- Section unanswered or declined: stop at that section and write nothing for it. Files approved and written earlier remain as a partial result; report them as partial and do not claim done.
- No git remote: never guess a hosted tracker; the GitHub and GitLab seeds are unusable without their host. Offer local markdown or a freeform tracker and continue only on a confirmed answer.
- Steering-file ambiguity: neither file exists; ask, never choose. A block already exists; update it in place, preserve every surrounding user edit, and report the exact change.
- Write fails mid-batch: report exactly which files landed. Recover by reverting the steering-file edit and deleting only the `docs/agents/` files this run wrote; all four writes are reversible local writes.
- Errors are surfaced, never swallowed, and done is never claimed while a confirmed file is missing.

## Output

Four artifacts: `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, `docs/agents/domain.md`, and the steering-file `## Agent skills` block, plus a terminal report naming every written file and its chosen convention; terminal classification: complete, partial (some confirmed files written), or blocked (nothing written, with the reason).
