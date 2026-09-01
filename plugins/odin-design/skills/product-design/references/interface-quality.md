# Interface quality

Loaded for review and harden modes. These rules judge whether an interface's decisions survive contact with use.

- IQ-01 Every interactive element renders its full state set. Hover, focus, active, disabled, and loading where applicable. A control that goes silent in any of these states hides the interface's own state from the user.
- IQ-02 Touch targets are at least 44px on touch surfaces. Smaller targets convert precision into luck.
- IQ-03 Color is never the sole carrier of state. Pair color with text, icon, or shape. A status visible only to users who can distinguish the color is a status that does not exist for the rest.
- IQ-04 Motion has purpose and a budget. Every animation names what it communicates; entrances are slower than exits; durations stay in the 50-700ms band; prefers-reduced-motion is honored.
- IQ-05 Text fits by design. Truncation, wrapping, and overflow are decided per surface. Text that overflows its container was not designed; it was discovered.
- IQ-06 Feedback within 100ms or a pending indicator. Every action produces a visible response inside 100ms or shows pending state. Silence after input reads as breakage.
- IQ-07 Forms preserve input and localize errors. Validate inline at the field when the answer is known, summarize at submit, and never clear entered data on error.
