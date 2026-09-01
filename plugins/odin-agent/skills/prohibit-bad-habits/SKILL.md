---
name: prohibit-bad-habits
description: 'Use when a user wants to define patterns the agent should not do; result is structured project docs or agent-rule files listing each prohibited pattern. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Prohibit bad habits

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Human requests that specific agent behavior patterns be documented as prohibited in a structured project document or agent-rule file rather than in AGENTS.md. |
| Authority | reversible-local: write only the named local artifact; rollback by deleting the written file only if it did not exist before and the human has not confirmed it. No remote, credential, paid, or irreversible mutations. |
| Side effect | Local file write: creates or updates one structured project document or agent-rule file that enumerates prohibited agent behavior patterns. |
| Done | A structured artifact exists at the agreed target path and contains at least one prohibited-habit entry with a non-empty name and description, verified by the human. |

## Inputs

- Prohibited patterns: required. For each pattern, the human supplies a short name, a concrete description of the behavior to avoid, the negative consequence of that behavior, and optionally a category and a workaround or alternative. If the human cannot supply a concrete description, stop rather than invent one.
- Target location: optional. The human may specify the exact file path. Default: `docs/prohibited-habits.md` for shared project docs; `agent-rules/prohibited-habits.yaml` for agent-rule locations.
- Authority confirmation: the human confirms or revises the target path before the write occurs.

## Procedure

1. Gather prohibited patterns. Ask the human to list each pattern to prohibit. For each, collect: name (short identifier), description (concrete behavior to avoid), consequence (what goes wrong when the agent does this), and optionally category and workaround. If the human cannot supply a concrete description, stop without writing. Done when: every pattern the human listed has a name and a concrete description, and any pattern lacking a description is named as blocked rather than invented.
2. Confirm target location. Accept the human's specified path, or use `docs/prohibited-habits.md` for a shared-project location or `agent-rules/prohibited-habits.yaml` for an agent-rules location. Present the chosen path to the human and wait for confirmation before proceeding. Done when: the human has confirmed or revised the path, and the path is recorded for the write.
3. Choose format. Use Markdown (`*.md`) if the target is under `docs/` or the human requests it. Use YAML (`*.yaml`) if the target is under `agent-rules/` or multiple agent-rule files already exist in the project. Otherwise default to Markdown. Done when: the format matches the target path extension, or the default is chosen and the path extension agrees with it.
4. Draft file content. Write the following structure to the confirmed path:

   - Markdown format:
     ```markdown
     # Prohibited Habits

     ## <Pattern Name>

     **What to avoid:** <concrete description of the behavior>
     **When it happens:** <negative consequence of the behavior>
     **Workaround:** <alternative or mitigation, if provided>
     ```
   - YAML format:
     ```yaml
     prohibited_habits:
       - name: <short name>
         description: <concrete behavior to avoid>
         consequence: <what goes wrong>
         category: <category, if provided>
         workaround: <alternative or mitigation, if provided>
     ```

   Done when: the drafted content contains one entry per gathered pattern, each entry carries name, description, and consequence, and the structure matches the chosen format.
5. Write the file. Create or overwrite the confirmed target path with the drafted content. If a pre-existing file at that path contains content the human has not reviewed in this session, stop and report the conflict rather than overwriting silently. Done when: the file exists at the confirmed path and its contents match the draft, or the pre-existing-conflict stop condition fired and no write occurred.
6. Present to the human. Show the written file path and content. The human confirms acceptance or requests revision. If the human declines to review, report the partial result and stop without claiming done. Done when: the human has confirmed acceptance of the written content, or the human declined to review and the result is recorded as partial.

## Failure and recovery

- Non-concrete input: if the human cannot describe a pattern concretely, stop and return `blocked: non-concrete-description`. Do not substitute a generic warning.
- Unreviewed pre-existing file conflict: if the target file exists with unreviewed content, stop and return `blocked: unreviewed-file-exists`. Do not overwrite.
- Human declines review: return `partial: file-written` with the file path. The done predicate does not hold until the human confirms acceptance.
- Rollback: delete the written file only if (a) the file did not exist before this session and (b) the human has not confirmed the content. If the file existed before, restore it from the original content if possible. Rollback does not apply after human confirmation.

## Output

- `done: prohibited-habits-documented` with the file path. The human confirmed the written artifact. - `partial: file-written` with the file path. The file was written but the human declined to review. - `blocked: non-concrete-description`: the human could not describe a prohibited pattern concretely. - `blocked: unreviewed-file-exists`: a pre-existing file at the target path was not reviewed in this session.
