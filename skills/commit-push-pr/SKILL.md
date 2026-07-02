---
name: commit-push-pr
description: Commit, push, and open a PR. Use when asked to ship/open a PR, or for PR-description-only flows like writing, rewriting, or describing a PR body.
---

# Git Commit, Push, and PR

**Asking the user:** When this skill says "ask the user", use the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex, `ask_question` in Antigravity CLI (`agy`), `ask_user` in Pi (requires the `pi-ask-user` extension). Fall back to presenting the question in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.

## Mode

- **Description-only** — user wants *just* a description ("write/draft a PR description", "describe this PR", or pasted a PR URL/number alone). Run Step 0, then Step 4 only; print the result. Apply only if the user asks. If a PR ref was pasted, pass it to Step 4 so Pre-A resolves the right range.
- **Description update** — user wants to refresh/rewrite an existing PR's description with no commit/push intent. If no open PR, report and stop. Otherwise run Step 0, then Step 4 (PR mode using the existing PR's URL), then Step 5 to preview, confirm, and apply via `gh pr edit`.
- **Full workflow** — otherwise. Run Steps 0-5 in order.

## Context

**On platforms other than Claude Code**, run the Context fallback below. **In Claude Code**, the labeled sections contain pre-populated data — use them directly.

**Git status:**
!`git status`

**Working tree diff:**
!`git diff HEAD`

**Current branch:**
!`git branch --show-current`

**Recent commits:**
!`git log --oneline -10`

**Remote default branch:**
!`git rev-parse --abbrev-ref origin/HEAD 2>/dev/null || echo 'DEFAULT_BRANCH_UNRESOLVED'`

**Existing PR check:**
!`gh pr view --json url,title,state 2>/dev/null || echo 'NO_OPEN_PR'`

### Context fallback

```bash
printf '=== STATUS ===\n'; git status; printf '\n=== DIFF ===\n'; git diff HEAD; printf '\n=== BRANCH ===\n'; git branch --show-current; printf '\n=== LOG ===\n'; git log --oneline -10; printf '\n=== DEFAULT_BRANCH ===\n'; git rev-parse --abbrev-ref origin/HEAD 2>/dev/null || echo 'DEFAULT_BRANCH_UNRESOLVED'; printf '\n=== PR_CHECK ===\n'; gh pr view --json url,title,state 2>/dev/null || echo 'NO_OPEN_PR'
```

---

## Step 0: Resolve the canonical PR target

Detect the target repo for the PR before composing or applying it. The working branch still
pushes to `origin` regardless (Step 3) — this step only decides where the PR itself gets filed.

- Read remotes: `git remote -v`. Pick the contribution target: `upstream` if present, else
  `origin`.
- Detect a fork relationship: `gh repo view <origin-slug> --json nameWithOwner,parent,defaultBranchRef`.
  A non-null `parent` means `origin` is itself a fork, and `parent.nameWithOwner` is the canonical
  slug candidate.
- **Ambiguity → ask.** Prompt the user for the target repo only when there is no clear single
  upstream (no `upstream` remote and ≥2 plausible non-origin candidates, or `gh`'s detected
  `parent` disagrees with the `upstream` remote) **or** `origin` has genuinely diverged from
  upstream (no common merge-base, or `origin` was re-created/renamed/renewed). Plain fork-behind —
  `origin` merely behind `upstream` with a shared merge-base — is not ambiguity and must never
  prompt.
- When `upstream` resolves as the target: the PR is filed against `<upstream-slug>` with head
  `<fork-owner>:<branch>` — fork-owner is `origin`'s actual owner (`gh repo view <origin-slug>
  --json owner --jq .owner.login`), not assumed to equal the authenticated login, since `origin`
  (the same remote Step 3 pushes to) may be a team/org fork rather than the operator's personal
  account. `gh`'s `--head <user>:<branch>` syntax only supports user-owned forks, not
  organizations — an org-owned `origin` needs a manual PR-creation path instead. Base is
  `<default>` (`upstream`'s default branch). This feeds Step 4's base-remote choice
  (`references/pr-description-writing.md`) and Step 5's `gh pr create`/`gh pr edit` calls
  ("Applying via gh" below).
- When there is no `upstream` remote: unchanged, same-repo behavior — `origin` is both the push
  target and the PR target.

## Step 1: Resolve branch and PR state

The remote default branch returns something like `origin/main`; strip the `origin/` prefix. If it returned `DEFAULT_BRANCH_UNRESOLVED` or bare `HEAD`, try `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'`. If both fail, fall back to `main`.

Branch routing:

- **Detached HEAD** — explain a branch is required and ask whether to create a feature branch. If yes, derive a name from the change content. If no, stop.
- **On default branch with work to do** (uncommitted, unpushed, or no upstream) — automatically create a feature branch (pushing the default directly is not supported). Derive a name from the change content and continue at Step 3, which handles branch creation safely. Do not ask whether to branch — committing on the default is not an option here.
- **On default branch with no work** — report no feature branch work and stop.
- **Feature branch** — continue.

Note the existing PR URL from the PR check if `state: OPEN`. Step 5 uses it to route between new-PR and existing-PR application.

## Step 2: Determine conventions

Match repo style for commit messages and PR titles (project instructions in context > recent commits > conventional commits as default). With conventional commits, default to `fix:` over `feat:` when ambiguous — adding code to remedy broken or missing behavior is `fix:`. Reserve `feat:` for capabilities the user could not previously accomplish. The user may override.

## Step 3: Commit and push

If on the default branch, branch creation needs to handle stale local `<base>`, unpushed commits on local `<base>`, and uncommitted changes that collide with the fresh remote base. Read `references/branch-creation.md` and follow its decision flow before continuing.

Scan changed files for naturally distinct concerns. If they clearly group into separate logical changes, create separate commits (2-3 max). Group at file level only — no `git add -p`. When ambiguous, one commit is fine.

Stage and commit each group. **Avoid `git add -A` and `git add .`** — they sweep in `.env`, build artifacts, and generated files:

```bash
git add file1 file2 file3 && git commit -m "$(cat <<'EOF'
commit message here
EOF
)"
```

Then push:

```bash
git push -u origin HEAD
```

If the working tree is clean and all commits are already pushed, this step is a no-op.

## Step 4: Compose the PR title and body

**You MUST read `references/pr-description-writing.md`** in full — the core principle at the top governs every step. The only input it needs from this skill is the PR ref, if one was identified by mode dispatch (description-only with a pasted URL, or description update).

**Evidence decision** before composition. Modern harnesses provide their own browser, screenshot, terminal recording, and artifact capture tools. Treat evidence as user-supplied context or as validation prose, not as a separate skill dispatch.

1. **User supplied evidence** (URL, markdown image/embed, local artifact path they want referenced) — incorporate it into the PR body as `## Demo`, `## Screenshots`, or `## Evidence`, matching the artifact type. Do not invent or upload evidence.
2. **User explicitly asks to include evidence but has not supplied it** — ask for the URL/markdown/path, or tell them to use the current harness's capture flow and return with the artifact. Do not launch another skill.
3. **Agent judgment on authored changes** — if you authored the commits and know the change is non-observable (internal plumbing, type-only, backend refactor without user-facing effect, docs/markdown/changelog/CI/test-only, pure refactors), skip evidence handling without asking.

Otherwise, if the branch diff changes observable behavior (UI, CLI output, API behavior with runnable code, generated artifacts, workflow output), include a concise validation note in the PR body describing what was exercised and how it behaved. If no real run was possible because of unavailable credentials, paid services, deploy-only infrastructure, hardware, or missing local setup, say that plainly in the validation section.

Do not block PR creation solely because no visual artifact exists. Test output and manual validation notes are acceptable validation evidence, but do not label test output as "Demo" or "Screenshots."

Then continue with the rest of the reference (Steps A through G) to compose the title and body.

## Step 5: Apply and report

**Description-only mode** — print the title and body. Stop unless the user asks to apply.

**New PR** (full workflow, no existing PR from Step 1) — apply per "Applying via gh" below using `gh pr create`. Report the URL.

**Existing PR** (full workflow, found in Step 1) — the new commits are already on the PR from Step 3. Report the PR URL, then ask whether to rewrite the description.

- **No** — done.
- **Yes** — run Step 4 if not already done, then preview and apply (see below).

**Description update mode, or existing-PR rewrite confirmed** — preview before applying. Ask: "New title: `<title>` (`<N>` chars). Summary leads with: `<first two sentences>`. Total body: `<L>` lines. Apply?" If declined, the user may pass focus text back for a regenerate; do not apply. If confirmed, apply per "Applying via gh" below using `gh pr edit` and report the URL.

---

## Applying via gh

The body **must** be written to a temp file and passed via `--body-file <path>`. Never use `--body-file -`, stdin pipes, heredoc-to-stdin, or `--body "$(cat ...)"` — wrappers and stdin handling can silently produce an empty PR body while `gh` still exits 0 and returns a URL.

```bash
WORK_DIR=$(mktemp -d "${TMPDIR:-/tmp}/odin-pr.XXXXXX")
BODY_FILE="$WORK_DIR/odin-pr-body.md"
cat >> "$BODY_FILE" <<'__ODIN_PR_BODY_END__'
<the composed body markdown goes here, verbatim>
__ODIN_PR_BODY_END__
```

The quoted sentinel keeps `$VAR`, backticks, and any literal `EOF` inside the body from being expanded.

For `<TITLE>`: substitute verbatim. If it contains `"`, `` ` ``, `$`, or `\`, escape them or switch to single quotes.

When Step 0 resolved `upstream` as the target, `gh pr create` gains `--repo <upstream-slug> --base
<default> --head <fork-owner>:<branch>`, and `gh pr edit` gains `--repo <upstream-slug>` (`gh pr
edit` has no `--head` equivalent — an existing PR's head is fixed at creation, not retargeted —
and its implicit branch-to-PR resolution isn't guaranteed unambiguous across forks, so the
explicit, documented `--repo` flag disambiguates which repository's PR gets edited). The existing
same-repo case (no `upstream` remote) is unchanged for both.

```bash
gh pr create --title "<TITLE>" --body-file "$BODY_FILE"   # new PR, same-repo (no upstream remote)
gh pr create --title "<TITLE>" --body-file "$BODY_FILE" --repo <upstream-slug> --base <default> --head <fork-owner>:<branch>   # new PR, upstream resolved as target
gh pr edit   --title "<TITLE>" --body-file "$BODY_FILE"   # existing PR, same-repo (no upstream remote)
gh pr edit   --title "<TITLE>" --body-file "$BODY_FILE" --repo <upstream-slug>   # existing PR, upstream resolved as target
```
