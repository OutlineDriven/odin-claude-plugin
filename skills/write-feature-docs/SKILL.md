---
name: write-feature-docs
description: 'Use when an engineer needs a first-pass docs page for a feature. Produces a markdown draft grounded in spec and codebase with verified screenshots. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Write feature docs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Engineer needs first-pass docs page for a feature. |
| Authority | reversible-local: write only named local artifacts; rollback by deleting the draft file. |
| Side effect | Local write: drafts a docs page with verified screenshots. |
| Done | Complete draft grounded in spec and codebase, outline confirmed. |

## Inputs

1. **Feature specification or PRD** (required): document describing the feature's behavior, user-facing changes, and acceptance criteria.
2. **Codebase path** (required): root or subdirectory where the feature is implemented.
3. **Docs output directory** (optional): target directory for the draft; defaults to `docs/features/<feature-name>.md`.

## Procedure

1. Read the feature specification end to end. Extract the feature name, user-facing behavior, and acceptance criteria.
2. Explore the codebase at the supplied path. Identify source files, public APIs, configuration surfaces, and CLI entry points that implement the feature. Record file paths and key symbols.
3. Draft the documentation outline: Overview, Prerequisites, Usage, API Reference, Configuration, Troubleshooting. Confirm the outline with the engineer before populating.
4. Populate each section using only information verified in the spec and codebase. Include code examples drawn from actual source or tests. Do not invent APIs, flags, defaults, or behaviors not present in the code.
5. Capture or request screenshots of the feature in action. Embed each screenshot with descriptive alt text and a caption identifying the UI state shown. If the runtime environment cannot produce screenshots, mark the slot with `<!-- screenshot: pending -->` and note the gap in Output.
6. Self-review: verify every claim traces to the spec or codebase; verify every code example compiles or runs against the current source; verify all links resolve.

## Failure and recovery
- **Incomplete spec**: stop and request the missing section from the engineer. Do not infer requirements.
- **Codebase mismatch**: if the code contradicts the spec, document the discrepancy in a `> ⚠️ Note` block and flag it for review. Do not silently align the docs to one side.
- **Screenshot unavailable**: mark the slot as pending, proceed with text-only draft, and report the gap in Output.
- **Non-convergent draft**: if after two passes the outline cannot be confirmed or the spec remains ambiguous, return the partial draft with a blocking note listing the open questions. Do not produce a final artifact from uncertain inputs.

## Output
A markdown documentation file at the target path containing all populated sections with embedded screenshots or pending markers. If screenshots are missing, the output includes a count of pending slots and the reason each could not be captured.

## Provenance

Adapted from Warp common-skills (https://github.com/warpdotdev/common-skills), revision f589e224907eda566c13755529f59db563090d14, under MIT license (Copyright (c) 2026 Denver Technologies, Inc.). Mechanisms rewritten in ODIN style with attribution. No third-party expression copied.
