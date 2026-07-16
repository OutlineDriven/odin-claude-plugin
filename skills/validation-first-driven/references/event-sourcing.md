# Event Sourcing Integration

When state machines guard event-sourced aggregates:
1. Command arrives -> validate against current aggregate state machine
2. If transition valid -> emit immutable event
3. State rebuilt from event replay
4. Invalid transitions rejected before events created -- impossible to corrupt event log
