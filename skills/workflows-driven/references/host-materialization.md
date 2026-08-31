# Host materialization

Branch-specific reference for `workflows-driven`. Detect the host environment and apply the matching fan-out primitive.

## Claude Code

Dynamic Workflows: a `/workflows` directory exists, plugins ship workflows as `.js` files. Build and run the workflow for the task at hand. Save to `.claude/workflows/` only when the workflow recurs. Default ephemeral.

## oh-my-pi

An `eval` tool with `agent()`, `parallel()`, and `pipeline()` helpers. Author the orchestration as eval code. A wave runs inline and synchronously inside the call; chain one eval call per phase.

## Neither

Run the same contract inline as sequential waves of subagent calls with the same batch context and assignments; parent owns closure.
