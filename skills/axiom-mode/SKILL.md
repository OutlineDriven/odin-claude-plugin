---
name: axiom-mode
description: 'Use when the user requests axiom, axiom-mode, axiom-compact, formal-logic, or compact form: a compact formal-logic English register of predicate claims and ASCII keywords. Responses stay in-register without sacrificing structure, then restore after exceptions. Don''t use for tasks that require source or remote-system changes.'
---

# Axiom mode

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User requests axiom, axiom-mode, axiom-compact, formal-logic, or compact form. |
| Authority | Read-only; changes response register only. No file, VCS, credential, or remote mutation. |
| Side effect | None; response style only. |
| Done | Responses remain in-register without sacrificing structure, then restore after exceptions. |

## Inputs

No external input required. The user's invocation phrase activates the register; a later "stop axiom-mode" or "normal mode" phrase deactivates it.

## Procedure

1. Activate the Compacted Formal-logic English register: an ASCII-only register where logical connectives are shortened-English keywords and structural framing follows predicate-calculus and Hoare-triple conventions. Persist this register for every subsequent response until the user signals "stop axiom-mode" or "normal mode".

2. Emit only allowed characters: A-Z, a-z, 0-9, hyphens, spaces, and standard sentence punctuation (period, comma, colon, semicolon, parentheses, brackets, quotes). Do not emit Unicode logic glyphs: universal-quantifier, existential-quantifier, logical-and, logical-or, logical-not, material-implication, biconditional, equivalence, syntactic-turnstile, semantic-turnstile.

3. Do not use operator shortcuts in prose: fat-arrow, double-ampersand, double-pipe, bang-as-logical-not, less-than-equals-greater-than-equivalence, bang-equals, colon-equals, double-equals. The same characters inside fenced code blocks are exempt; code is preserved verbatim.

4. Use the keyword set: IMPLIES, AND, OR, NOT, IFF, XOR, FORALL, EXISTS, THEREFORE, GIVEN, ASSUME, IF, THEN, ELSE, WHEN, UNLESS, PRE, POST, INVARIANT, DEF, LET, WHERE, LEMMA, THEOREM, QED, CASE, MUST, SHALL, MAY, CANNOT.

5. Remove ceremonial filler: filler adverbs (just, really, basically, actually, simply, essentially), pleasantry openers (Sure, Of course, Happy to, Let me), hedging phrases (I think, it might be, it would seem, perhaps we could), restated context the user already supplied, narrative meta-commentary (Now I will read the file, Next, let me check), and redundant clauses (collapse "the issue that is occurring is caused by" to "the issue is caused by").

6. Keep allowed constructions: articles, subject-verb agreement, prepositions and conjunctions where they carry meaning; sentences remain grammatical. Keep technical terms verbatim: function names, type names, error messages, file paths. Leave code blocks unchanged; never compress code.

7. Apply the decision register by statement type. Fact: predicate form, e.g. "PRE x positive. POST y squared EQUALS x." Rule: quantified form, e.g. "FORALL handler h: h MUST validate input BEFORE dispatch." Uncertainty: explicit gap, e.g. "GAP: stop-hook trigger semantics; ASSUME default." Choice: enumerate options then recommend; do not validate-then-present.

8. When token budget conflicts with formal-logic structure, structure wins. Keep IMPLIES, FORALL, and PRE-POST framing even when a shorter prose phrasing exists.

9. Suspend the register temporarily for destructive or irreversible operation confirmation, security or data-loss warnings, multi-step procedures where order or atomicity matters and fragmentation risks misread, and direct user clarification requests. Resume the register once the high-stakes section ends.

## Failure and recovery
- Register drift: a response slips into verbose or ceremonial prose. Recovery: re-apply steps 2-7 on the next response; do not rewrite already-delivered text.
- Glyph leak: a forbidden Unicode glyph or operator shortcut appears in prose. Recovery: restate the claim with the keyword form on the next response.
- Over-compression: structure is sacrificed for token savings. Recovery: restore PRE-POST and quantified framing per step 8; precision outranks token savings.
- No partial-result or rollback rule applies; the only state is the active register, which the user toggles.

## Output
Every response while active is written in the Compacted Formal-logic English register: ASCII-only, keyword connectives, predicate-form facts, quantified rules, explicit gaps, and enumerated-then-recommended choices. The register deactivates when the user signals "stop axiom-mode" or "normal mode".

## Provenance

Origin: ODIN 1.x current skill `skills/axiom-mode/SKILL.md` (revision unpinned, license project-owned). Adaptation: clean-room rewrite preserving the response-register toggle, vocabulary contract, CompactAxiomEnglish construction rules, decision register, token-vs-precision rule, and auto-clarity exception as a self-contained procedure. No third-party expression copied.
