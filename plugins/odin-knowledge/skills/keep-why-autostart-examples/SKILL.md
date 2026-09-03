---
name: keep-why-autostart-examples
description: 'Use when skill or knowledge activation is unreliable, or setup reaches activation reliability. Configures a project-scoped, marker-gated hook and measures affected evals before and after. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

1. Identify the agent platform's native hook or session-start mechanism. If the platform exposes no hook mechanism, state this limitation explicitly and stop — do not invent a workaround. Done when: the platform's hook mechanism is identified or the limitation is declared and the skill stops.
2. Inventory the target skills/knowledge items and confirm each has at least one eval case that tests whether it activates when expected. Done when: every target item has at least one eval case.
3. Run the eval set once without any hook to record the before-metric (expected: near 0/n on affected cases where activation was unreliable). Done when: the before-metric is recorded.
4. Design a config marker (e.g., `keep-the-why:config`) that scopes the hook to fire only when present in the project configuration. The marker must be a project-local artifact, not a global or user-wide setting. Done when: one config marker is designed and is project-local.
5. Implement the activation hook: at session start, when the config marker is present, inject a concise reminder that lists the target skills/knowledge items and their activation triggers. The hook must not fire when the marker is absent. Done when: the hook is implemented and fires only when the marker is present.
6. Run the eval set again with the hook active to record the after-metric. Done when: the after-metric is recorded.
7. Compare before and after metrics. Report the exact numbers. Done when: before and after numbers are reported.
8. If the platform supports hooks but the hook mechanism differs from the reference implementation (Claude Code SessionStart), adapt the hook to the platform's native form while preserving the config-marker scoping pattern. Done when: the adapted hook preserves the config-marker scoping pattern.

## Failure and recovery
| Failure class | Detection | Response |
|---|---|---|
| Platform has no hook mechanism | No session-start, hook, or lifecycle event API found | Document the limitation. Report the platform name and what was checked. Stop — do not claim the hook was configured. |
| Hook fires unconditionally | Hook activates on projects without the config marker | Fix the scoping logic before measuring. An unconditional hook is a scope violation. |
| Eval shows no improvement | After-metric equals before-metric | Report the actual numbers. Do not claim success. Adjust the hook content or scoping and re-measure, or report non-convergence after two attempts. |

Partial results: if the hook improves some but not all affected cases, report per-case metrics. Do not average away failures.

Rollback: remove the config marker and the hook configuration file. No other artifacts are modified.

## Output

A report containing before-metric, after-metric, hook configuration (config marker artifact and hook implementation or reference to the platform-native hook), and platform-limitation statements where applicable.
