---
name: culture-onboarding-plan
description: 'Use when a signed new hire has an actual Culture Index profile and team profiles that need translation into a personalized first-90-days plan. The plan returns a buddy choice, ally and friction map, manager briefing, communication preferences, 30/60/90-day actions, and success indicators grounded in the actual profile and team fit. Don''t use for tasks that require source or remote-system changes.'
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

1. Collect the signed new hire's actual Culture Index profile (primary and secondary trait scores, archetype) and the team profiles (each teammate's archetype and traits, team composition, and the hiring manager's profile). Stop and request the missing or actual assessed profile if any is absent or generic.
2. Determine the new hire's dominant primary and secondary traits and archetype from the profile; note the motivators and conversation starters that fit those traits.
3. Map the new hire against the team composition: identify allies (complementary archetypes), friction points (conflicting traits or duplicate role coverage), and gaps the hire fills.
4. Select a buddy whose archetype and traits complement the hire's and who models the team's operating norms; name a specific person, or state the archetype criteria when the person is not yet chosen.
5. Draft a manager briefing covering the hire's motivators, communication preferences, expected friction, and how the manager should adjust their style for this profile.
6. Set communication preferences derived from the hire's traits: directness level, detail level, and feedback cadence.
7. Build 30/60/90-day actions as specific milestones tied to the hire's archetype and team fit, with a named mitigation for each friction point from step 3.
8. Define success indicators measurable against the milestones and the hire's motivators; reject generic checklists that do not reference the actual profile.
9. Return the plan as chat output. Flag any section that would default to one-size-fits-all treatment as incomplete rather than filling it with boilerplate.

## Failure and recovery
- Missing profile: stop, name the missing input, and request it. Do not infer traits or archetype from role title or guesswork.
- Generic or placeholder profile: stop, request the actual assessed Culture Index profile.
- Insufficient team profiles: return a partial plan covering hire-only sections (motivators, communication preferences) and mark team-dependent sections (buddy choice, ally and friction map, manager briefing) as blocked pending team profiles.
- No rollback is required: the skill is read-only and emits chat output only. Never swallow a missing-input condition or present an incomplete plan as done.

## Output
A chat-output first-90-days plan containing: buddy choice, ally and friction map, manager briefing, communication preferences, 30/60/90-day actions with mitigations, and success indicators. Every section cites the actual profile data; any section that cannot is marked incomplete rather than filled generically.

## Provenance

Origin: https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3, source path /plugins/culture-index/skills/interpreting-culture-index/workflows/plan-onboarding.md. License CC-BY-SA-4.0. Clean-room adaptation: this skill restates the onboarding-plan mechanism in original wording, marks these modifications, licenses the adaptation ShareAlike, claims no trademark rights, and does not reuse trail-of-bits-mark.svg as branding. Preserve Trail of Bits attribution and the source link.
