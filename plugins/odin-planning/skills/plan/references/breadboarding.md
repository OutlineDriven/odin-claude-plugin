# Breadboarding and fat-marker altitude

## Breadboard notation

Three elements, nothing else:

- Places: screens, dialogs, states a user can navigate to. Written as underlined names.
- Affordances: things a user can act on: buttons, fields, links, and copy the user reads before deciding. Listed under their place.
- Connection lines: an affordance wired to the place it leads to.

Owner. plan/SKILL.md inlines the compact notation. Do not recopy.

Worked example, "invoice autopay" bet:

```
  Invoice page                Set up autopay             Confirmation
  ------------                --------------             ------------
  invoice total               card on file (y/n)         autopay active note
  [turn on autopay] ───────►  [use card on file] ─────►  [back to invoice]
                              [enter new card] ──► New card form ──► Confirmation
```

The breadboard answers "what connects to what" and "what can the user do here". It leaves visual questions such as layout, columns, and wording open.

## Fat-marker rules

Sketch with a marker too thick for detail. If the tool lets you draw a table's columns, you are zoomed in too far. Draw one sketch per idea; a sketch that needs a legend is over-drawn.

## Altitude tests

Too concrete (over-shaped): any of these signals means raise the altitude:

- Pixel positions, spacing values, exact copy.
- Field lists or column enumerations.
- Task tickets or a work breakdown.

Too abstract (under-shaped): any of these means walk a concrete path:

- No nouns a builder could start from.
- A goal statement with no places or affordances.
- An appetite missing or phrased as "as long as it takes".

Right altitude: a builder could start tomorrow and still owns every design decision inside the lines.
