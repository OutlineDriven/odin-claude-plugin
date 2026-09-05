# Detool mode: role classification and protection rules

## Role classes

Classify the whole artifact, or each section if mixed, before any edit.

| Role | Definition | Treatment |
|---|---|---|
| Durable / portable | Meant to travel across stacks | Subject to detool; neutralize incidental couplings |
| Provenance / operational | Build logs, install guides, runbooks, command transcripts, reproduction steps | Keep concrete stack nouns |
| Tool-subject claim | The named tool, vendor, model, bug, or measured limit is the subject of the sentence | Keep the name |

## What counts as incidental coupling in durable content

- Harness paths and directory conventions
- Vendor CLIs and flags
- Model or product brands used as mechanisms
- Tool-specific environment variables
- Quotas, cache homes, session files
- UI steps stated as timeless truth
- Version-pinned behavior stated as timeless truth

## Protection rules

- Provenance and operational content: build records, capsules, benchmark logs, install guides, runbooks, tool-targeted how-tos, command transcripts, and exact reproduction steps keep the stack name.
- Comparative and tool-subject claims: if the sentence is about a named tool, vendor, model, bug, prior-art source, or measured limit, the name is the subject, not incidental coupling.
- Neutral wording loses the mechanism: keep the concrete detail as an example of the mechanism instead of pretending it generalizes. Note the decision in the report.

## Verification

Re-read as a reader on a different stack: the artifact should still be true, portable, and executable where it promised action.

## Report format

Neutralized couplings with before/after pairs, deliberate keeps with their assigned role, judgment calls made during classification.
