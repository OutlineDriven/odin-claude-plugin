---
name: scheduler
description: 'Use when asked to set a personal reminder or run a lightweight local task at a specific date/time or interval. Installs a confirmed named scheduled item with action, trigger, and delivery method. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Scheduler

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to set a personal reminder or run a lightweight local task at a specific date/time or interval. |
| Authority | reversible-local: write only the scheduler entries this skill installs and their metadata records under `~/.odin/scheduler/`; user-level scheduling only, no admin elevation; no credentials, paid, published, deployed, or remote mutation; every mutation has a stated rollback path (remove the entry and its metadata record). |
| Side effect | Creates, pauses, unpauses, deletes, or updates one named local-scheduled item per confirmed request; never modifies unrelated system schedules. |
| Done | The user receives a confirmed scheduled item with name, action, human-readable trigger, and delivery method, and can list or manage it. |

## Inputs

- Action: the reminder message, or the exact command to run. Required.
- Schedule: an absolute time, a relative delay, or a recurrence pattern. Required.
- Delivery method: notification, terminal output, or background command execution. Required before install — ask when unspecified.
- Timezone: defaults to the user's local timezone. Optional.
- Name: defaults to a generated kebab-case name. Optional.

## Procedure

1. Parse the request into intent (reminder vs task), action, schedule, and delivery method. When reminder vs task is unclear, assume reminder and say so. Ask before scheduling when anything is ambiguous: vague times ("tomorrow morning"), unclear timezone, or an unclear action.
2. If the delivery method is unspecified, ask (notification, terminal output, or background command). Never assume one. If the requested mechanism is unavailable on this system or needs credentials, network services, or remote delivery, explain the limitation, offer the nearest local alternative, and wait for the user's choice: never silently downshift delivery.
3. Normalize the schedule into a human-readable rule, whether an absolute timestamp, relative delay, or recurrence, in the user's local timezone unless stated otherwise. Confirm this normalized schedule with the user before installing anything.
4. Generate a stable kebab-case name from the action ("review PRs" → `review-prs`); on collision append a numeric suffix. A destructive or irreversible action requires the user's explicit confirmation of that exact action before step 5.
5. Install at user level with the OS-native backend: macOS — a `launchd` job, notifications via `osascript`; Linux — a `systemd` user timer when available, otherwise a `crontab` entry, notifications via `notify-send` with terminal output as fallback; Windows — a Task Scheduler task, notifications via a PowerShell toast. Convert formats internally (for example to a cron expression) while preserving the confirmed schedule. Write the entry plus a metadata record (name, type, backend location, schedule, delivery, status) under `~/.odin/scheduler/` so every item stays isolated and inspectable.
6. Confirm to the user: name, what will happen, when it will happen in human-readable local time, and how it is delivered or executed.
7. On "list", report every item with a metadata record: name, type, schedule, delivery, status. On pause, unpause, update, or delete: resolve the item by name, ask when the reference is ambiguous, confirm before deleting, and update the metadata record with the state change.

## Failure and recovery
- Ambiguous schedule, timezone, action, or delivery method: ask the one blocking question and stop; nothing is scheduled.
- Requested mechanism unavailable or outside authority: state the limitation and the local alternatives; wait for the decision; no install.
- Backend install fails: remove any partially created entry and its metadata record, report the failure, and never claim the item is scheduled.
- Destructive action without explicit confirmation: do not install; ask for confirmation of the exact action.
- Rollback for every mutation: delete the OS scheduler entry and its metadata record under `~/.odin/scheduler/`. Any failure before install leaves the system unchanged.
- The item counts as scheduled only when the backend entry and its metadata record both exist and the step-6 confirmation was shown; otherwise return `blocked` naming the exact missing decision or failing step.

## Output
One of: a confirmation block (name, action, human-readable trigger in local time, delivery method); a list report (name, type, schedule, delivery, status per item); a state transition (paused, active, updated, deleted) with the updated record; or a terminal `blocked` classification naming the exact unresolved question or failing step.
