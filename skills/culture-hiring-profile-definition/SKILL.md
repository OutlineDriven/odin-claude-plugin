---
name: culture-hiring-profile-definition
description: 'Use when a role''s actual work and team context need translation into an ideal and acceptable Culture Index profile before interviewing, returns trait directions, tolerances, target patterns, acceptable alternatives, red flags, and interview focus areas. Don''t use for tasks that require source or remote-system changes.'
---

# Culture hiring profile definition

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A role's actual work and team context need translation into an ideal and acceptable Culture Index profile before interviewing. |
| Authority | Read-only. Produces a chat report only; no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Ideal trait directions and ranges, target pattern, acceptable alternatives, red flags, and interview focus areas emitted to chat. |
| Done | Every trait requirement carries a role-grounded rationale, tolerances are explicit for all traits, and the output avoids cloning the existing team or treating the profile as a sole hiring filter. |

## Inputs

- Role title and concrete responsibilities (required).
- Business stage — growth, consolidation, turnaround, or stability (required).
- Reporting manager's behavioral pattern, if known (optional).
- Existing team member profiles or patterns, if available (optional).

## Procedure

Culture Index measures behavioral drives, not skills or intelligence. Traits: A (Autonomy, initiative), B (Social, interaction need), C (Pace, repetition and urgency tolerance), D (Conformity, process adherence), L (Logic, detached analysis — absolute), I (Ingenuity, invention — absolute). A, B, C, and D are interpreted as direction relative to a population mean; L and I use absolute 0–10 values and are the only traits comparable directly between people.

1. Record role context: title, reports-to pattern if known, team composition if available, and business stage.
2. Answer three role-fit questions and record the implied direction: macro vs micro (macro → High A, micro → Low A); people vs problems (people → High B, problems → Low B); repetition level (high repetition → High C, low repetition → Low C).
3. Determine D direction from role demands: strict process adherence, precision criticality, and significant consequence of quality failure push High D; creative rule-breaking or challenging the status quo push Low D.
4. Map the A/B/C/D directions to an ideal pattern: Visionary/Architect (High A, Low C, Low D); Rainmaker/Persuader (High A, High B, Low C); Scholar/Specialist (Low B, High C, High D); Technical Expert (Low A, Low B, Low C, High D); Craftsman (Low A, Low B, High C, High D); Accommodator (Low A, High B, High C); Philosopher (High A, Low B, High C).
5. Define acceptable tolerance per trait using centile distance from the ideal: ±1 centile = must-have, ±2 = strongly prefer, ±3 = acceptable, beyond ±4 = hard no. Record ideal, acceptable range, and hard-no extreme for A, B, C, and D.
6. Set L and I as absolute ranges: High L (7–10) where detached analytical decisions dominate, Low L (0–3) where empathy and emotional intelligence dominate; High I (7–10) where novel problem-solving is required, Low I (0–3) where proven methods outweigh invention. Mark either as "any" when the role does not constrain it.
7. Derive role-specific red flags: independent decision-making flags Very Low A; customer interaction flags Very Low B; steady predictable work flags Very Low C; precision flags Very Low D; quick pivots flag Very High C; creative solutions flag Very High D; collaboration flags Very High A. Record each flag with the reason it would fail in this role.
8. If team profiles are available, consider dynamics: a team lacking High A lacks "gas," lacking High B lacks "glue," lacking High D lacks "brake"; an all-same-pattern team benefits from diversity; existing friction should not be intensified. Do not clone the existing team — different patterns bring valuable perspectives.
9. Compile the hiring profile: role context; ideal trait table (A, B, C, D, L, I) with position, confidence, and role-grounded reason; target pattern; acceptable alternative patterns with rationale; red flags with explanations; interview focus areas derived from required traits; and a usage note that the profile is one input among many, not a sole filter, and that CI measures drives not capabilities.

## Failure and recovery
- Missing required input (role title, responsibilities, or business stage): stop and request it; do not infer a role profile from incomplete context.
- Ambiguous role-fit answer that yields no clear A/B/C/D direction: record "normative" for that trait rather than forcing a direction, and note the ambiguity.
- No team profiles supplied: skip team-dynamics considerations and state that step was skipped; the profile remains valid for an individual role.
- Partial-result rule: emit the traits determined so far with explicit gaps marked; never present an undetermined trait as settled.
- Non-convergence: if role demands are internally contradictory (e.g., requires both strict process adherence and creative rule-breaking), report the contradiction and request clarification rather than picking one silently.

## Output
A chat report containing: role context; an ideal trait table (A, B, C, D, L, I) with position, confidence, and role-grounded rationale; target pattern; acceptable alternative patterns with rationale; red flags with explanations; interview focus areas; and a usage note stating the profile is one input among many and measures drives not capabilities.

## Provenance

Origin: https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3, source file /plugins/culture-index/skills/interpreting-culture-index/workflows/define-hiring-profile.md. License CC-BY-SA-4.0; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding. Clean-room adaptation: re-expressed as a self-contained role-profile definition procedure with no dependency on the source plugin's reference files or extraction tooling.
