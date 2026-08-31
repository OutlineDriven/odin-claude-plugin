---
name: wayfinder
description: 'Use when a greenfield project or large feature build will not fit in a single agent session. Charts a route by naming the destination, mapping the fog, and graduating decision tickets on the frontier. Don''t use for implementation, remote credential changes, or work that fits in one session.'
disable-model-invocation: true
---

# Wayfinder

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A greenfield project or a large feature build will not fit in a single agent session. |
| Authority | Human-only. Require explicit human invocation; preview the target and consequence before creating remote issues, local map files, or firing research subagents. |
| Side effect | Creates the map and decision tickets on the supported remote tracker or in .outline/wayfinder locally, and fires research subagents. |
| Done | The route is clear: no decision remains before someone builds — the map is complete at the handoff edge with decision tickets on the frontier. |

## Inputs

- Idea or request (required): the loose idea, project brief, or feature request too big for one session. Supplied by the human at invocation.
- Existing map reference (optional): a GitHub issue URL, issue number, or local .outline/wayfinder/map.md path. When present, the skill enters work-through mode instead of charting a new map.

## Procedure

### Mode selection

1. If an existing map reference is supplied, skip to step 8 (Work through the map). Otherwise, proceed to step 2 (Chart the map). Done when: mode is selected.

### Chart the map

2. Name the destination. Conduct an interactive interview with the human to pin down the target spec, decision, or state change that defines completion. Ask one question at a time; prefer single-select for directional choices. Continue until the destination is concrete enough that every subsequent decision can be tested against it. Done when: destination is concrete enough to test decisions against.
3. No-fog early exit. If the interview reveals that the route is already clear and the work fits in a single session, stop. Ask the user how they wish to proceed instead of creating an unnecessary map. Done when: early exit is taken or the route is confirmed to need a map.
4. Map the frontier. Conduct a breadth-first interview to surface open decisions and immediate first steps. Record every question that can be phrased precisely right now as a candidate ticket. Record questions that cannot yet be phrased precisely as fog items. Done when: all currently specifiable questions are recorded as candidate tickets and unspecifiable ones as fog items.
5. Create the map. Determine tracker storage automatically based on repository context: GitHub repository with a remote → create a single GitHub issue labeled wayfinder:map; otherwise → create .outline/wayfinder/map.md. Fill in ## Destination (what reaching the end looks like) and ## Notes (domain and preferences). Leave ## Decisions so far empty. Sketch the fog in ## Not yet specified. Record out-of-scope items in ## Out of scope. Done when: map is created with all sections populated.
6. Create tickets. For each candidate ticket from step 4, create a child issue (GitHub) or local ticket file (.outline/wayfinder/tickets/<id>.md). Each ticket contains: ## Question (the decision or investigation this ticket resolves), ## Blocked by (tickets that must close before this ticket is on the frontier), a wayfinder:<type> label (GitHub) or local type field (valid types: research, prototype, grilling, task). Local tickets prepend YAML frontmatter: type, claimed_by: null, status: open. Wire blocking edges in a second pass once ticket IDs exist. Done when: all candidate tickets are created with blocking edges wired.
7. Fire research subagents. For every research ticket created, launch a parallel subagent to resolve it immediately. Research tickets are the one exception to the single-ticket-per-session rule. Stop — initial charting completes the session. Done when: all research subagents are dispatched and initial charting is complete.

### Work through the map

8. Load the map. Read the map body to review the destination, notes, and decisions so far. Query the tracker for open tickets dynamically — open tickets are not listed in the map body. Done when: map is loaded and open tickets are queried.
9. Select and claim a ticket. Choose a ticket from the frontier (all open, unblocked, unclaimed tickets) or take the ticket specified by the human. Claim it by assigning the GitHub issue to the driver, or setting the local claimed_by field. Never resolve more than one ticket per session except research tickets. Done when: one ticket is selected and claimed.
10. Resolve the decision. Access closed ticket details as needed. For grilling tickets, conduct batched single-select interview rounds. For prototype tickets, build a rough concrete artifact and link it as an asset. For task tickets, complete prerequisites sized to unblock a decision, not to build the destination. Done when: decision is resolved with evidence or artifact linked.
11. Record and close. Record the resolution as a GitHub comment or local closing entry, linking any created assets. Close the issue on GitHub; locally, set status: closed and clear claimed_by. Append a one-line summary with link to ## Decisions so far in the map body. Done when: resolution is recorded and ticket is closed.
12. Graduate fog. Move specifiable items from ## Not yet specified into new tickets. Move any invalidated or out-of-scope items to ## Out of scope. Out-of-scope items never graduate; close the ticket and record why it was ruled out. Done when: fog is graduated and invalidated items are moved to out-of-scope.

### Rules

- **Refer by name.** In all user-facing prose, refer to tickets by title, never by bare issue numbers, IDs, or slugs. The link wraps the name (e.g. [Define authentication schema](#12)).
- **Planning by default.** Each ticket resolves a decision. The map is done when nothing remains to decide before someone builds. The pull to implement signals that the map has reached its edge and it is time to hand off. An effort's Notes section can override this rule and carry execution into the map itself. Without that instruction, produce decisions, not deliverables.
- **Fog of war.** The map is deliberately incomplete. Beyond the live tickets lies the fog — decisions that are clearly approaching but cannot yet be specified because they depend on open questions. Resolving a ticket clears the fog ahead, graduating newly specifiable items into fresh tickets. Test whether a question can be phrased precisely right now: ticket when it can, fog when it cannot.

## Failure and recovery
- No tracker available: if no GitHub remote exists and the local filesystem is not writable, stop and report the blocker. Do not create a partial map.
- No destination named: if the human cannot name a destination after the interview, stop. Do not proceed with an ambiguous map.
- Map already exists: if a wayfinder:map issue or .outline/wayfinder/map.md already exists for this effort, load it and enter work-through mode. Do not create a duplicate map.
- Ticket resolution requires implementation: if resolving a decision requires building the destination rather than making a decision, stop at the decision boundary and hand off. The map is planning, not execution, unless the Notes section explicitly overrides.
- Research subagent fails: if a research subagent returns no usable result, mark the ticket as blocked with the failure reason. Do not invent evidence.
- Out-of-scope discovery: if a live ticket turns out to sit past the destination, close it, record it in ## Out of scope with a one-line explanation, and keep it out of ## Decisions so far.

Partial-result rule: the map and any completed tickets are kept on failure. Never claim the route is clear when open decisions remain.

## Output
A map (GitHub issue labeled wayfinder:map or .outline/wayfinder/map.md with destination, notes, decisions so far, fog items, and out-of-scope items), decision tickets (GitHub child issues or local files with type, question, blocking edges, and resolution), research results in ticket comments or closing entries, and a handoff artifact when the route is clear.
