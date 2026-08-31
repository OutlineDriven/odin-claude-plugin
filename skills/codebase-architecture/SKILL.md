---
name: codebase-architecture
description: 'Use when asked to design a module, deepen a structure, harden code with guardrails, locate a seam, or make code testable. Produces shared vocabulary, seam and interface decisions, and guardrail tooling for the target code. Don''t use for tasks that require source or remote-system changes.'
---

# Codebase architecture

## Contract

| Field | Bound contract |
|---|---|
| Trigger | design this module, deepen this structure, harden with guardrails, where is the seam, make code testable |
| Authority | read-only: no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | chat-output: design guidance and concrete recommendations; modifies code only after the user applies them |
| Done | produces shared vocabulary, seam/interface decisions, and guardrail tooling for the target code |

## Inputs

- Target code: the module, file, or subsystem under design. Must be supplied and readable.
- Design question: one of the five trigger predicates: design a module, deepen a structure, add guardrails, locate a seam, improve testability. Must be supplied; if ambiguous, ask before proceeding.
- Optional: existing tests, existing interface definitions, and stated constraints (performance, compatibility, dependency limits).

## Procedure

1. Read the target code. Identify the module boundary, the interface surface (what callers depend on), and the implementation body (what the interface hides). If the target is unreadable or absent, stop and report what is missing.
2. Establish shared vocabulary for the target code: name the module, its interface, its implementation, its depth (the gap between interface complexity and implementation complexity), its seams (points where behavior can be substituted or tested in isolation), adapters, leverage, and locality. Use these terms consistently in every recommendation.
3. For "design this module": propose a deep module: a narrow interface over a wide implementation. Name each interface operation and state what it hides. Reject wide-interface, narrow-implementation designs as shallow.
4. For "deepen this structure": identify shallow modules, then propose moves that push complexity behind a narrower interface: collapsing special cases into the general case, hiding machinery, and widening the implementation gap.
5. For "where is the seam": locate the points where a caller can substitute an alternate implementation or inject a test double. If no seam exists, propose the smallest interface introduction that creates one without widening the public surface.
6. For "make code testable": identify the concrete dependencies that block isolated testing, then propose seams (interface extraction or dependency injection) that make those dependencies substitutable. Prefer a seam that does not change production behavior.
7. For "harden with guardrails": recommend tooling that enforces the decisions: type-level constraints that make invalid states unrepresentable, lint or analysis rules that fail on violation, boundary checks, or tests that fail when an invariant breaks. Name the invariant each guardrail protects.
8. Stop at recommendations. Do not edit, create, move, or delete any file. Mark any recommendation not grounded in the read code as inference.

## Failure and recovery
- Target code unreadable or absent: report what is missing and stop. Do not infer structure from names alone.
- Ambiguous design question: ask which of the five predicates applies before proceeding. Do not guess and do not run all five.
- Conflicting constraints: surface the conflict and the tradeoff explicitly. Do not silently pick one side.
- Partial result: return only the vocabulary and decisions grounded in read code. Mark ungrounded recommendations as inference and state what reading would ground them.
- Non-mutation rule: no files are modified at any step. Recovery is the user applying or rejecting the recommendations; this skill never applies them.
- Blocked result: a report naming the missing input or unresolved ambiguity, with no design decisions asserted.

## Output
A design report containing: shared vocabulary for the target code (module, interface, implementation, depth, seams, adapters, leverage, locality); seam and interface decisions with rationale; and guardrail tooling recommendations, each tied to the invariant it protects. Ungrounded recommendations are marked as inference.

## Provenance

Origin: mblode/agent-skills, pinned revision e97a3b383f5944f90d41eb92b24b4fb3b917a7f9. License: MIT (Copyright (c) 2026 Matthew Blode; preserve the copyright notice and license text in copies). Adaptation: clean-room — the deep-module vocabulary and design procedure were re-derived; no third-party expression was copied.
