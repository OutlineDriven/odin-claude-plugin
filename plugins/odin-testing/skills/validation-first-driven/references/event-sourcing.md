# Event sourcing integration

When a state machine guards an event-sourced aggregate:
1. Validate each incoming command against the aggregate's current state.
2. If the transition is valid, emit an immutable event.
3. Rebuild state by replaying events.
4. Reject invalid transitions before creating events so they cannot corrupt the event log.
