---
name: document-generate
description: 'Use when the user runs /document-generate. Produces reviewed user-facing documentation files and diagrams saved at the requested location. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Document generate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | the user runs /document-generate |
| Authority | write only named local documentation files and diagrams inside the working repository; delete any partial file to roll back |
| Side effect | local writes to user-facing documentation files and diagrams at the requested target path |
| Done | generated documentation is reviewed by the human and saved at the target path |

## Inputs

- Required: the documentation subject and the target output path inside the working repository.
- Required: the intended audience and the output format (markdown, plain text, or a diagram source).
- Optional: existing documentation to update, diagram type, and length limit.

## Procedure

1. Confirm the subject, target path, audience, and format. Reject the request if the target path is outside the working repository or would overwrite a protected file.
2. Bound the scope to the requested subject. Do not generate content for topics, modules, or audiences not named in the request.
3. Draft the documentation prose or diagram source from the subject and audience, deriving structure from the requested format. Re-derive the wording; do not copy source expression from upstream material.
4. Present the draft to the human for review before writing any file.
5. On human approval, write the documentation file or diagram source to the target path. If a diagram requires rendering, write the source and state the render command without executing it unless asked.
6. Confirm the saved file exists at the target path and report the path.

## Failure and recovery
- Missing subject or target path: stop and request the missing input; write nothing.
- Target outside the working repository or protected: stop before writing; report the rejected path.
- Human review rejects the draft: revise against the feedback and re-present; do not save until approved.
- Generation produces empty or invalid output: discard the draft, report the failure, write nothing.
- Partial write failure: delete any partial file written at the target path and report the rollback.
- Blocked or non-converged result: report the exact missing input or rejected target; do not claim the done predicate holds.

## Output
One or more reviewed documentation files or diagram sources saved at the requested target path, plus a report listing each saved path.

## Provenance

Origin https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69, MIT license (Copyright (c) 2026 Garry Tan). Clean-room adaptation: the documentation and diagram generation procedure is re-derived from the source mechanism; no source expression is copied.
