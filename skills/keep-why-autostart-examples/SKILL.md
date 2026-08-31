---
name: keep-why-autostart-examples
description: 'Use when a user asks to make skill or knowledge activation more reliable in their agent tool, or first-run wizard reaches the activation-reliability question. Configures a project-scoped activation hook that measurably improves activation on affected eval cases. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Keep why autostart examples

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to make skill/knowledge activation more reliable in their agent tool, or first-run wizard reaches the activation-reliability question. |
| Authority | reversible-local: write only named local hook configuration artifacts; rollback by removing the hook config and its marker. |
| Side effect | Project-scoped activation hook configured. Reference implementation: Claude Code SessionStart hook that injects a reminder only when a `keep-the-why:config` marker is present — measured 0/10 to 10/10 on affected eval cases. |
| Done | Activation measured improved via before/after eval on affected cases; hook scoped by config-marker presence (not unconditional); honest limits stated for tools without a hook mechanism. |

## Inputs

1. **Agent platform** (required): the agent tool whose activation mechanism is being improved (e.g., Claude Code, Cursor, Windsurf). Must be supplied.
2. **Target skills or knowledge items** (required): the set of skills or knowledge entries whose activation reliability is the goal. Must be supplied.
3. **Existing eval cases** (optional): prior activation eval results to establish the before baseline. If absent, run the eval set once before configuring the hook.

## Procedure

1. Identify the agent platform's native hook or session-start mechanism. If the platform exposes no hook mechanism, state this limitation explicitly and stop — do not invent a workaround.
2. Inventory the target skills/knowledge items and confirm each has at least one eval case that tests whether it activates when expected.
3. Run the eval set once without any hook to record the before-metric (expected: near 0/n on affected cases where activation was unreliable).
4. Design a config marker (e.g., `keep-the-why:config`) that scopes the hook to fire only when present in the project configuration. The marker must be a project-local artifact, not a global or user-wide setting.
5. Implement the activation hook: at session start, when the config marker is present, inject a concise reminder that lists the target skills/knowledge items and their activation triggers. The hook must not fire when the marker is absent.
6. Run the eval set again with the hook active to record the after-metric.
7. Compare before and after metrics. Report the exact numbers.
8. If the platform supports hooks but the hook mechanism differs from the reference implementation (Claude Code SessionStart), adapt the hook to the platform's native form while preserving the config-marker scoping pattern.

## Failure and recovery
| Failure class | Detection | Response |
|---|---|---|
| Platform has no hook mechanism | No session-start, hook, or lifecycle event API found | Document the limitation. Report the platform name and what was checked. Stop — do not claim the hook was configured. |
| Hook fires unconditionally | Hook activates on projects without the config marker | Fix the scoping logic before measuring. An unconditional hook is a scope violation. |
| Eval shows no improvement | After-metric equals before-metric | Report the actual numbers. Do not claim success. Adjust the hook content or scoping and re-measure, or report non-convergence after two attempts. |

Partial results: if the hook improves some but not all affected cases, report per-case metrics. Do not average away failures.

Rollback: remove the config marker and the hook configuration file. No other artifacts are modified.

## Output
A report containing:
- Before-metric: activation rate on affected eval cases without the hook.
- After-metric: activation rate on affected eval cases with the hook active.
- Hook configuration: the config marker artifact and the hook implementation or reference to the platform-native hook.
- Platform-limitation statements: explicit declaration if the platform lacks a hook mechanism, or if any aspect of the reference pattern could not be replicated.

## Provenance

- Origin: https://github.com/oliver-zehentleitner/keep-the-why
- Pinned revision: c01597a506efa24652d7ecb9e18b6a8ccc97b175
- License: MIT (Copyright (c) 2026 Oliver Zehentleitner. Retain the copyright notice and this permission notice in all copies or substantial portions of the Software.)
- Source paths: `references/autostart.md`, `references/setup.md`
- Adaptation: clean-room adaptation of the delegate-to-platform and measure-before-claiming mechanisms. No third-party expression copied.
