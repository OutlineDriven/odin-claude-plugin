# Getting started

Install two plugins, confirm the install, and run one skill. That is the whole tutorial.

## Install two plugins

The [Install section](../../README.md#install) of the root README gives the commands for your harness. Install `odin-core` first, then add `odin-code`. The README calls these two the base, and every other plugin stays uninstalled until you need it.

## Confirm the install

List your installed plugins. On Claude Code the command is `claude plugin list`, and `docs/specs/install-proof.md` records the run that proves it: the list shows each plugin with its version, scope, and status. If both plugins appear as enabled, your client resolved this tree.

## Run one skill

Type a skill invocation with a request after it:

```text
/skill:necessary-work Is this change really needed, or is the task already done?
```

`necessary-work` asks whether the work stays inside the ask, so it fits a first run: you read the answer and judge it at once.

What happened: the skill's instructions were prepended to your request, and the model answered both together. That is all an invocation does.

## Next steps

[Using skills](using-skills.md) covers the mechanics: stacking invocations, passing files, and choosing between overlapping skills. [Workflows](workflows.md) shows chains of skills that real sessions proved out.
