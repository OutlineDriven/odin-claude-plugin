---
name: spec-first
description: Spec-First Development Skill using Quint for formal specifications
---

# Spec-First Development Skill

## Description

This skill enables formal specification-driven development using Quint (formal specification language for distributed systems). It guides you through defining state machines, writing invariants, verifying properties, and generating implementation stubs.

## When to Use

- Building distributed systems or protocols
- Implementing complex concurrent systems
- Ensuring correctness through formal verification
- Defining system behavior before implementation
- Preventing subtle bugs in critical systems
- Documenting system invariants and properties

## Capabilities

1. **Precondition Validation**
   - Check Quint installation and version
   - Detect existing `.qnt` specification files
   - Verify project setup

2. **Specification Development**
   - Guide state machine definition
   - Help write invariants and temporal properties
   - Structure specifications into modules

3. **Verification**
   - Run property verification with multiple seeds
   - Execute specification tests
   - Type check specifications

4. **Implementation Mapping**
   - Generate language-specific stubs
   - Map spec invariants to runtime assertions
   - Create property-based tests from specifications

## Workflow

```nomnoml
[<start>Start] -> [Validate Preconditions]
[Validate Preconditions] -> [Quint Available?]
[Quint Available?] no -> [Install Quint]
[Quint Available?] yes -> [Detect Specs]
[Install Quint] -> [Detect Specs]
[Detect Specs] -> [Specs Exist?]
[Specs Exist?] no -> [Create New Spec]
[Specs Exist?] yes -> [Analyze Existing]
[Create New Spec] -> [Define State Machine]
[Analyze Existing] -> [Define State Machine]
[Define State Machine] -> [Write Invariants]
[Write Invariants] -> [Write Actions]
[Write Actions] -> [Verify Properties]
[Verify Properties] -> [Verification OK?]
[Verification OK?] no -> [Fix Violations]
[Fix Violations] -> [Verify Properties]
[Verification OK?] yes -> [Run Tests]
[Run Tests] -> [Tests OK?]
[Tests OK?] no -> [Refine Tests]
[Refine Tests] -> [Run Tests]
[Tests OK?] yes -> [Generate Stubs]
[Generate Stubs] -> [<end>Complete]
```

## Exit Codes

| Code | Meaning | Remediation |
|------|---------|-------------|
| 0 | Success | Continue to implementation |
| 11 | Quint not installed | `npm install -g @informalsystems/quint` |
| 12 | Invalid specification | Check syntax, run `quint typecheck` |
| 13 | Specification violation | Review invariants, fix state transitions |
| 14 | Property verification failed | Strengthen properties or fix spec |
| 15 | Mapping incomplete | Complete stub generation |

## Language Support

### Rust
```bash
# Generate property tests with proptest
# Map Quint invariants to runtime assertions
# Use derive(Debug, PartialEq) for state
```

### Python
```bash
# Generate property tests with hypothesis
# Map invariants to assert statements
# Use dataclasses for state representation
```

### TypeScript
```bash
# Generate property tests with fast-check
# Map invariants to type guards
# Use strict types for state
```

### Go
```bash
# Generate property tests with gopter
# Map invariants to panic checks
# Use structs for state
```

### Java
```bash
# Generate property tests with jqwik
# Map invariants to assert statements
# Use records for immutable state
```

### C#
```bash
# Generate property tests with FsCheck
# Map invariants to Code Contracts
# Use records for state
```

### C++
```bash
# Generate property tests with rapidcheck
# Map invariants to assert macros
# Use const correctness for state
```

## Commands

### Basic (≤40 chars)
```bash
quint verify --main=Module spec.qnt
quint test spec.qnt
quint typecheck spec.qnt
```

### Intermediate (≤80 chars)
```bash
quint verify --main=Module --seed=$RANDOM --verbose spec.qnt
quint test --verbose --coverage spec.qnt
```

### Advanced (≤120 chars)
```bash
quint verify --main=Module --seed=$RANDOM --verbose --max-steps=100 --invariant=prop spec.qnt
quint test --verbose --seed=$RANDOM --coverage --timeout=60 spec.qnt
```

## Example: Distributed Counter

### Specification

```quint
module DistributedCounter {
  type NodeId = str
  type Message = { sender: NodeId, value: int }

  var nodes: Set[NodeId]
  var counters: NodeId -> int
  var messages: Set[Message]

  pure def init = {
    nodes' = Set("node1", "node2", "node3") and
    counters' = nodes'.mapBy(n => 0) and
    messages' = Set()
  }

  action node_increment(node: NodeId): bool = {
    node.in(nodes) and
    counters' = counters.set(node, counters.get(node) + 1) and
    messages' = messages.union(
      nodes.exclude(Set(node)).map(n => {
        sender: node,
        value: counters.get(node) + 1
      })
    )
  }

  action node_receive(node: NodeId, msg: Message): bool = {
    msg.in(messages) and
    node.in(nodes) and
    counters' = counters.set(node, max(counters.get(node), msg.value)) and
    messages' = messages.exclude(Set(msg))
  }

  val all_counters_non_negative =
    nodes.forall(n => counters.get(n) >= 0)

  val messages_bounded =
    messages.size() <= nodes.size() * 100

  temporal eventually_consistent =
    eventually(nodes.forall(n1 =>
      nodes.forall(n2 =>
        counters.get(n1) == counters.get(n2)
      )
    ))
}
```

### Verification Commands

```bash
# Type check
quint typecheck distributed_counter.qnt

# Verify invariants
quint verify --main=DistributedCounter \
  --invariant=all_counters_non_negative \
  --invariant=messages_bounded \
  --seed=$RANDOM \
  --verbose \
  distributed_counter.qnt

# Run tests
quint test --verbose --coverage distributed_counter.qnt
```

### Generated Implementation (Rust)

```rust
use std::collections::{HashMap, HashSet};

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct NodeId(String);

#[derive(Debug, Clone)]
pub struct Message {
    sender: NodeId,
    value: i32,
}

pub struct DistributedCounter {
    nodes: HashSet<NodeId>,
    counters: HashMap<NodeId, i32>,
    messages: Vec<Message>,
}

impl DistributedCounter {
    pub fn new(node_ids: Vec<String>) -> Self {
        let nodes: HashSet<_> = node_ids.into_iter().map(NodeId).collect();
        let counters: HashMap<_, _> = nodes.iter()
            .map(|n| (n.clone(), 0))
            .collect();

        let instance = Self {
            nodes,
            counters,
            messages: Vec::new(),
        };

        instance.assert_invariants();
        instance
    }

    pub fn node_increment(&mut self, node: &NodeId) {
        assert!(self.nodes.contains(node), "node not in system");

        let current = *self.counters.get(node).unwrap();
        self.counters.insert(node.clone(), current + 1);

        for other_node in &self.nodes {
            if other_node != node {
                self.messages.push(Message {
                    sender: node.clone(),
                    value: current + 1,
                });
            }
        }

        self.assert_invariants();
    }

    pub fn node_receive(&mut self, node: &NodeId, msg: Message) {
        let msg_idx = self.messages.iter()
            .position(|m| m.sender == msg.sender && m.value == msg.value)
            .expect("message not found");

        self.messages.remove(msg_idx);

        let current = *self.counters.get(node).unwrap();
        self.counters.insert(node.clone(), current.max(msg.value));

        self.assert_invariants();
    }

    fn assert_invariants(&self) {
        // all_counters_non_negative
        for value in self.counters.values() {
            assert!(*value >= 0, "Invariant violated: counter negative");
        }

        // messages_bounded
        let max_messages = self.nodes.len() * 100;
        assert!(
            self.messages.len() <= max_messages,
            "Invariant violated: too many messages"
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    #[test]
    fn test_init_satisfies_invariants() {
        let counter = DistributedCounter::new(vec![
            "node1".into(),
            "node2".into(),
        ]);
        // If we reach here, invariants hold
    }

    proptest! {
        #[test]
        fn test_operations_preserve_invariants(
            node_count in 1usize..5,
            op_count in 0usize..50
        ) {
            let nodes: Vec<_> = (0..node_count)
                .map(|i| format!("node{}", i))
                .collect();
            let mut counter = DistributedCounter::new(nodes.clone());

            for i in 0..op_count {
                let node_id = NodeId(nodes[i % nodes.len()].clone());
                counter.node_increment(&node_id);
            }
            // If we reach here, invariants always held
        }
    }
}
```

## Best Practices

1. **Start Simple**: Begin with minimal state, add complexity incrementally
2. **Invariants First**: Write invariants before actions
3. **Multiple Seeds**: Verify with 3-5 different random seeds
4. **Type Safety**: Use Quint's type system to prevent invalid states
5. **Modular Specs**: Break large specs into composable modules
6. **Document Mappings**: Link spec elements to implementation
7. **Runtime Assertions**: Include invariant checks in production code
8. **Property Tests**: Generate property-based tests from spec

## Common Issues

### Issue: Verification Timeout
```bash
# Increase max steps
quint verify --main=Module --max-steps=200 spec.qnt
```

### Issue: Non-Determinism
```bash
# Use explicit nondet with seed
quint verify --seed=12345 spec.qnt
```

### Issue: Complex Invariants
```bash
# Break into smaller invariants
# Verify each separately
```

### Issue: Implementation Divergence
```bash
# Regenerate stubs from updated spec
# Run property tests to catch mismatches
```

## Integration Points

### With TDD
1. Write Quint specification
2. Verify specification
3. Generate test cases from spec
4. Follow Red-Green-Refactor TDD
5. Ensure implementation satisfies spec

### With CI/CD
```yaml
# Example GitHub Actions
- name: Verify Specification
  run: |
    npm install -g @informalsystems/quint
    quint verify --main=Module spec.qnt
```

### With Documentation
- Specifications serve as executable documentation
- Invariants document system properties
- Actions document valid state transitions

## Resources

- [Quint Documentation](https://github.com/informalsystems/quint)
- [Quint Tutorial](https://github.com/informalsystems/quint/tree/main/tutorials)
- [TLA+ (Inspiration for Quint)](https://lamport.azurewebsites.net/tla/tla.html)
- [Formal Methods Overview](https://en.wikipedia.org/wiki/Formal_methods)

## Invocation

To use this skill in Claude Code:

```
Use the spec-first skill to develop a distributed counter system
```

Or directly:

```
/spec-first DistributedCounter counter_spec.qnt
```

The agent will guide you through the entire specification-first development workflow.
