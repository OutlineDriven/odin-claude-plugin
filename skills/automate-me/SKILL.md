---
name: automate-me
description: 'Use when asked to create or refresh a personal mode skill and open a reviewable PR for it. Mines recent session history for a recurring manual workflow, drafts a self-contained skill file, and opens a PR with the evidence. Don''t use for shared repo skills, remote credential changes, or tasks that skip human approval.'
disable-model-invocation: true
---

# Automate me

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Create or refresh a personal mode skill. |
| Authority | Human-only. Require explicit human invocation; preview the target file, skill content, and PR consequence before any write, push, or remote publish. |
| Side effect | Creates or edits one personal mode skill file in a local working copy and opens a reviewable PR. No other files, credentials, or remote state are touched. |
| Done | Evidence-backed personal mode skill in a reviewable PR. |

## Inputs

- A personal workflow to encode, supplied either as a direct description by the human or as a pointer to recent session or conversation history to mine for a repeated manual task pattern. At least one of these must be present.
- Target skill slug and file path. Optional; derive a slug from the workflow if the human does not supply one, and confirm it before writing.
- Repository and base branch to open the PR against. Must be supplied or determinable from the current working copy; if neither, stop and ask.

## Procedure

1. Require explicit human invocation. Confirm the human intends to author or refresh a personal mode skill and open a remote PR for it; do not proceed on inferred intent.
2. Identify the recurring personal workflow. If the human supplied a description, use it. Otherwise mine recent session or conversation history for a task the human performs manually more than once, and name the repeated pattern and the sessions it appears in as evidence.
3. Stop and report no candidate if no recurring workflow can be evidenced from history or description. Do not invent a workflow or fabricate history evidence.
4. Draft the personal mode skill as a self-contained skill file: a name, a trigger predicate, a short procedure, and the inputs it needs. The skill must not depend on another skill, module, or external rule file.
5. Preview to the human: the target file path, the full skill content, the branch name, and the consequence of opening a PR. Wait for explicit approval before any mutation.
6. On approval, create a new branch in the local working copy and create or edit the skill file at its target path. Write only that one file.
7. Commit the change with a message naming the personal workflow encoded.
8. Push the branch and open a reviewable PR whose description states the workflow encoded, the history evidence used, and the skill file path.
9. Capture the PR URL as the success evidence.

## Failure and recovery
- No recurring workflow found: stop, report no candidate, mutate nothing.
- Human declines the preview: do not write, commit, or push; leave the working copy unchanged.
- Skill file is malformed after drafting: correct frontmatter and sections before pushing; never push a skill that fails its own format.
- Push or PR open fails (authentication, network, protected base, permission): stop, report the exact error, and leave the local branch in place for retry. Do not force-push or rewrite an unrelated branch.
- Partial result rule: if the file is written and committed but the PR cannot be opened, report the local commit as the partial result and the blocking error; the done predicate is not met until a PR URL exists.

## Output
A reviewable PR URL plus the skill file path and a one-line summary of the personal workflow encoded, backed by the history evidence or description used. Terminal classification is done only when the PR URL exists; otherwise it is blocked with the named failure class.

## Provenance

Origin: cursor/plugins (pstack/skills/automate-me/SKILL.md), pinned revision 68836ddaf5697224520f1847d90cdb90ca8babaa. License: MIT (pstack authored by Lauren Tan, poteto). Adaptation: clean-room rewrite preserving the history-mined personal skill authoring to remote PR mechanism; no third-party expression copied.
