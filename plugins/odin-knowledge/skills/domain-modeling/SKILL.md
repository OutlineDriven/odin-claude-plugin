---
name: domain-modeling
description: 'Use when pinning down domain terminology, maintaining the domain model, or when a term conflicts or needs sharpening.'
---

# Domain modeling

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Pinning down domain terminology, maintaining the domain model, or a term conflict/sharpening need |
| Authority | Reversible local: writes only the named glossary artifacts, `CONTEXT.md` at the repository root, `CONTEXT-MAP.md`, and per-context `CONTEXT.md` files beside their context source; rollback is version control or undo. No remote mutation. |
| Side effect | Lazily creates or updates `CONTEXT.md` / `CONTEXT-MAP.md` glossaries and per-context `CONTEXT.md` files; no other file, VCS, credential, or remote change. |
| Done | Each resolved term recorded in `CONTEXT.md` with rejected synonyms; glossary stays canonical and implementation-free. |

## Inputs

Required: the term, conflict, or fuzzy usage to resolve from the current design conversation, plus the human ruling when a conflict needs one. Optional: an existing `CONTEXT.md` or `CONTEXT-MAP.md` (absence is normal; files are created lazily) and the implementation source behind a term (when absent or unreadable, skip and report the code cross-check). Scope is limited to terms in the current design work unless the invocation requests a repository-wide glossary sweep.

## Procedure

1. **Load the layout.** Check the repository root for `CONTEXT.md` and `CONTEXT-MAP.md`. `CONTEXT.md` at the root means one context and one glossary. `CONTEXT-MAP.md` at the root means several contexts: each context's `CONTEXT.md` sits beside that context's source, and `CONTEXT-MAP.md` maps them. Read the applicable glossary before judging any term. If neither exists, create nothing yet. Done when: the layout is determined and the applicable glossary is read (or confirmed absent).
2. **Challenge conflicting terms.** Compare each term used in the current design work against the glossary. The moment a use contradicts a glossary entry, state both meanings and ask which one is correct before continuing, for example, a glossary that defines cancellation as ending an Order versus a use that changes one Line Item. Done when: every conflicting term is surfaced with both meanings and the human ruling is requested.
3. **Sharpen fuzzy terms.** When a name is vague or overloaded, pick the single domain term that owns the rule; every other name becomes a rejected synonym. Done when: each fuzzy term has one canonical owner and its rejected synonyms are named.
4. **Stress-test relationships.** Construct an edge case that exposes a relationship boundary. For example, if one Order is split across two shipments, when may Billing issue the invoice? Resolve which term owns each side of the boundary. Done when: each relationship boundary is resolved with an edge case that exposes it.
5. **Check claims against code.** Read the implementation behind each term under resolution. Surface any contradiction between the model and the code, then rule which is authoritative. When the code wins, correct the model term. This skill never edits code. If the implementation is unreadable or absent, skip the cross-check and mark it not performed. Done when: each term's code cross-check is completed or marked not performed with any contradiction surfaced and ruled.
6. **Record each resolution immediately.** The moment a term resolves, write an entry to the applicable glossary file with exactly three parts: the canonical term, a one-line definition, and its rejected synonyms. Create `CONTEXT.md` (one context) or `CONTEXT-MAP.md` plus the per-context `CONTEXT.md` (several contexts) only at this first write: never before there is something to record. Done when: each resolved term has a glossary entry with canonical term, one-line definition, and rejected synonyms.
7. **Keep the glossary pure.** Entries contain definitions and rejected synonyms only. Refuse implementation details, specification content, and scratch notes in glossary files; put them in their own artifacts or drop them. Done when: every glossary entry contains only definitions and rejected synonyms.

## Failure and recovery
- Unresolvable conflict. Neither the design conversation, the human ruling, nor the code settles which meaning owns the rule: record nothing, leave the glossary unchanged, and report the term as unresolved. Do not pick a winner to force closure.
- Implementation unavailable. Step 5 cannot run: record the term only if the design conversation resolved it, mark its code cross-check as not performed, and say so in the report. Never claim code agreement that was not observed.
- Purity pressure. A resolution only makes sense together with implementation detail or specification content: write the glossary entry without that content and route it to its own artifact.
- Partial results. A session may resolve some terms and not others; only resolved terms are written, and unresolved terms stay out of the files.
- Rollback. Revert the glossary edit; delete a lazily created file that ended the session with no surviving entry.
- Blocked result. The terminal failure output names each unresolved or unrecorded term with its reason. Never present Done while a resolved term lacks its entry or its rejected synonyms.

## Output
Updated or newly created glossary files in the layout chosen at step 1, with every resolved term appearing once with a one-line definition and its rejected synonyms, plus a terminal report listing terms resolved and recorded, conflicts surfaced, model-versus-code contradictions with the ruling, entries whose code cross-check was not performed, and terms left unresolved with reasons.
