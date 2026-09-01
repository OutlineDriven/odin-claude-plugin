# Surfaces and reachable states

Loaded for spec and harden modes.

## Surface rules

- S-01 Every surface names its primary task. A surface that cannot state the one task it exists for is merged, split, or cut.
- S-02 States are enumerated, not discovered. For each surface, enumerate: first-run empty, cleared empty, loading, partial data, recoverable error, fatal error, permission-denied, offline or stale, and success. Each gets a defined rendering or a named reason it cannot occur.
- S-03 Every state transition names its trigger. For each state, name the event that enters it and the event that leaves it. A state with no exit trigger is a trap.
- S-04 Async actions show pending, success, and failure. An action with no pending rendering looks dead; one with no failure rendering lies when it breaks.
- S-05 Every surface answers orientation. Where am I, what can I do here, what happens next. A surface that fails any of the three fails the trunk test.
- S-06 Modal only for focused single decisions. A modal interrupts; it earns that interruption only for a decision that must be resolved before anything else. Content flows, multi-step work, and reference material belong on pages or inline.

## Reachable-state checklist

For shape, spec, and harden modes, walk every state below for each surface in scope and mark it reachable or unreachable. Every reachable state must have a defined rendering (S-02); every unreachable state must carry the reason it cannot occur.

| State | Question that decides reachability |
|---|---|
| First-run empty | Can a user arrive with no data ever created? |
| Cleared empty | Can all data be deleted or filtered to nothing? |
| Loading | Is any data fetched or computed asynchronously? |
| Partial data | Can some fields or items fail while others succeed? |
| Recoverable error | Can an operation fail in a way the user can retry or fix? |
| Fatal error | Can the surface fail in a way that blocks the primary task entirely? |
| Permission-denied | Can a user reach the surface without rights to its data or actions? |
| Offline or stale | Can the data be absent or outdated when rendered? |
| Success (ideal) | The fully populated, everything-worked rendering. |
| Bulk or overflow | Can the data exceed the layout's designed capacity? |
