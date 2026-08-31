---
name: product-idea-consultation
description: 'Use when the user runs /product-idea-consultation with an idea or repository. Develop the idea into a redaction-checked design document and hand it off with a tiered closing and next-skill offer. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Product idea consultation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | the user runs /product-idea-consultation with an idea or repository |
| Authority | write only the named local design document, builder profile, and analytics records; URL opens are reads; rollback by deleting the written files |
| Side effect | the redaction-checked design document, builder profile, and analytics records; URL opens are reads |
| Done | an approved design document is saved and handed off with a tiered closing and next-skill offer |

## Inputs

An idea description or a repository path must be supplied. Optional gbrain or prior context may be supplied; absent context is gathered from the repository or idea alone.

## Procedure

1. Read the supplied idea or repository to gather context. Open any referenced URLs as reads only; never mutate a remote resource. Done when: context is gathered from the idea or repository and no remote resource is mutated.
2. Run a startup diagnostic: from the repository and idea, identify the problem, the intended audience, and the hard constraints. Done when: the problem, audience, and hard constraints are identified.
3. Run a builder brainstorm: enumerate candidate approaches, select the strongest against the diagnostic, and record the selection rationale. Done when: the strongest approach is selected with rationale recorded.
4. Draft the design document from the diagnostic and the brainstorm, covering the problem, approach, scope, and open questions. Done when: the design document is drafted covering problem, approach, scope, and open questions.
5. Redaction check: scan the draft for secrets, credentials, and private data. Remove or redact every match before any file is saved; never persist a secret. Done when: the draft is scanned and all secrets, credentials, and private data are removed or redacted.
6. Save the redaction-checked design document and the builder profile to local files, and record the analytics records for this session. Done when: the design document, builder profile, and analytics records are saved to local files.
7. Present a tiered closing: summarize the saved design, state a confidence tier, and offer the next skill for the build phase. Done when: the tiered closing is presented with summary, confidence tier, and next-skill offer.

## Failure and recovery
- Missing idea or repository: stop and request the input; write no file.
- Redaction check finds a secret: stop saving the unredacted draft, redact or request human removal, and re-run the check; never save a secret.
- Repository unreadable or a URL open fails: record the gap, proceed with available context, and mark the confidence tier down.
- Partial result: save only the completed sections, mark the incomplete sections explicitly, and never fabricate missing content.
- Rollback: delete the written design document, builder profile, and analytics records to revert to the pre-skill state.

## Output
A saved, redaction-checked design document with a builder profile and analytics records, delivered with a tiered closing summary and a next-skill offer for the build phase.

## Provenance

Origin: https://github.com/garrytan/gstack at revision 07b59e396c6be5a86619a43151cb9ed62a15ae69. License: MIT, Copyright (c) 2026 Garry Tan; retain the copyright and permission notice. Two source candidates were merged: the office-hours skill and its design-and-handoff, startup-diagnostic, and builder-brainstorm sections, plus the OpenClaw office-hours variant, which was an exact contract duplicate absorbed into this survivor. Expressive prose and procedure were re-derived clean-room rather than copied wholesale.
