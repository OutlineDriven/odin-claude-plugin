# Formal Specification Tools

| Tool | Strength | Use When | Status (2025) |
|------|----------|----------|---------------|
| Quint | TLA+-inspired, Apalache model checker | Distributed protocols, consensus | Production (Aztec governance verified Aug 2025) |
| TLA+ | Temporal logic, exhaustive state exploration | Concurrent algorithms, deployment coordination | Mature, Hillel Wayne's teaching resources |
| Alloy 6 | Relational logic, SAT solving | Domain modeling, "graph-like" problems | Mature, lower learning curve than TLA+ |
| XState v5 | Actor-centric, visual editor (Stately Studio) | UI state machines, workflows, React/Vue/Svelte | Production, mature ecosystem |

## Practical Guidance

- **Quint**: Modern syntax (TypeScript-like), same verification power as TLA+. Preferred for teams new to formal methods.
- **TLA+**: Standard for distributed systems verification (AWS, Azure). Steep learning curve but unmatched for temporal properties.
- **Alloy 6**: Best for domain modeling and constraint satisfaction. Lightweight -- specs can be written in hours, not weeks.
- **XState v5**: Not formal verification, but provides visual state machine editing + runtime guards. Actor model enables concurrent state management. Integrates with React, Vue, Svelte.
