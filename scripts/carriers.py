"""The external harness carriers, named once.

These files live outside the repository, in the home directory of whoever runs the
harness, so git cannot enumerate them and every gate that touches them has to name them.
Two gates do: `check-voice.py` holds them to the voice contract, and `check-carriers.py`
holds them to the canonical doctrine. Naming them twice meant one copy hardcoded an
absolute path carrying a specific username, which silently resolved to nothing on any
other machine, so that gate's carrier targets vanished without a word.

`Path.home()` is the only correct spelling here. A gate that needs a different location
should take it as an argument rather than adding a third copy of this list.
"""

from pathlib import Path

CARRIERS = (
    Path.home() / ".codex" / "AGENTS.md",
    Path.home() / ".omp" / "agent" / "AGENTS.md",
)
