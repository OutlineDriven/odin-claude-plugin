---
name: culture-onboarding-plan
description: 'Use when a signed new hire''s Culture Index profile and team profiles need a first-90-days plan. Returns buddy choice, friction map, manager briefing, communication preferences, 30/60/90 actions, and success indicators. Not for manager coaching — use culture-manager-coaching.'
---

# Culture onboarding plan

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A signed new hire's actual Culture Index profile and team profiles need translation into a personalized first-90-days plan. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. All output is chat only. |
| Side effect | Chat output only: buddy choice, ally and friction map, manager briefing, communication preferences, 30/60/90-day actions, and success indicators. |
| Done | The plan accounts for the actual profile, team and manager fit, names specific milestones and mitigations, and avoids one-size-fits-all treatment. |

## Inputs

Required:
- The signed new hire's actual Culture Index profile: primary trait scores, secondary trait scores, and identified archetype. A generic or placeholder profile is not acceptable.
- Team profiles: each teammate's archetype and trait scores, the team composition, and the hiring manager's profile.

Optional:
- Existing onboarding checklist or role expectations, used only to anchor milestones to real deliverables.

## Procedure

1. Collect the signed new hire's actual Culture Index profile (primary and secondary trait scores, archetype) and the team profiles (each teammate's archetype and traits, team composition, and the hiring manager's profile). Stop and request the missing or actual assessed profile if any is absent or generic. Done when: the hire's profile and all team profiles are present and actual, not generic.
2. Determine the new hire's dominant primary and secondary traits and archetype from the profile; note the motivators and conversation starters that fit those traits. Done when: dominant traits, archetype, motivators, and conversation starters are recorded.
3. Map the new hire against the team composition: identify allies (complementary archetypes), friction points (conflicting traits or duplicate role coverage), and gaps the hire fills. Done when: allies, friction points, and gaps are each named with the specific teammates or traits involved.
4. Select a buddy whose archetype and traits complement the hire's and who models the team's operating norms; name a specific person, or state the archetype criteria when the person is not yet chosen. Done when: a buddy is named or the archetype criteria for selection are stated.
5. Draft a manager briefing covering the hire's motivators, communication preferences, expected friction, and how the manager should adjust their style for this profile. Done when: the briefing covers motivators, communication, friction, and manager style adjustments.
6. Set communication preferences derived from the hire's traits: directness level, detail level, and feedback cadence. Done when: directness, detail level, and feedback cadence are each set from the hire's traits.
7. Build 30/60/90-day actions as specific milestones tied to the hire's archetype and team fit, with a named mitigation for each friction point from step 3. Done when: each 30/60/90 milestone is specific to the hire's profile and each friction point has a mitigation.
8. Define success indicators measurable against the milestones and the hire's motivators; reject generic checklists that do not reference the actual profile. Done when: every success indicator is measurable and references the actual profile.
9. Return the plan as chat output. Flag any section that would default to one-size-fits-all treatment as incomplete rather than filling it with boilerplate. Done when: every section cites the actual profile or is flagged incomplete.

## Failure and recovery
- Missing profile: stop, name the missing input, and request it. Do not infer traits or archetype from role title or guesswork.
- Generic or placeholder profile: stop, request the actual assessed Culture Index profile.
- Insufficient team profiles: return a partial plan covering hire-only sections (motivators, communication preferences) and mark team-dependent sections (buddy choice, ally and friction map, manager briefing) as blocked pending team profiles.
- No rollback is required: the skill is read-only and emits chat output only. Never swallow a missing-input condition or present an incomplete plan as done.

## Output
A first-90-days plan in chat text with sections in procedure order: buddy choice, ally and friction map, manager briefing, communication preferences, 30/60/90 actions, success indicators.
