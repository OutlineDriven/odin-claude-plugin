# Library helpers

Branch-specific reference for the wizard template library. The `scripts/wizard-template.sh` library is project-owned, shared identically across all wizards, and never hand-edited. Use these helpers by contract when authoring a wizard script (procedure step 3).

## Helpers

- `stage`: clear the screen and start one focused task.
- `say`: print a plain instruction.
- `step`: print one action for the human.
- `note`: print supporting detail.
- `warn`: print a warning.
- `open_url`: open the target page.
- `ask`: capture a public value.
- `ask_secret`: capture a hidden value.
- `write_env`: persist one value to `.env`.
- `set_secret`: write a GitHub Actions secret.
- `set_var`: write a GitHub Actions variable.
- `pause`: wait for the human to finish a manual action.
- `confirm`: gate an irreversible action.
- `banner`: show the opening summary.
- `finish`: show what was written and what remains.

## Usage rules

Open a URL before asking for its value. Use `ask_secret` for secrets. Call `write_env` for every persisted value. Call `set_secret` only for values CI needs. Call `confirm` before an irreversible action. A `stage` clears the screen, so keep it to one focused task or the human loses the instructions that scrolled away.
