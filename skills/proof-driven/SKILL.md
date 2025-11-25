---
name: proof-driven-development
description: Run proof-driven development using Lean 4 for formal verification
---

# SKILL: Proof-Driven Validation (Lean4)

Capability
- Run Lean4/Lake proof validation with tiered commands (CHECK/VALIDATE/GENERATE/REMEDIATE) and explicit exit codes.

Inputs
- Working directory with `lakefile.lean` or `.lean` sources.
- Lean4 and/or Lake installed.

Preconditions
- `(command -v lake || command -v lean) >/dev/null || exit 11`
- `fd -g 'lakefile.lean' -e lean . >/dev/null || exit 12`

Commands (≤120 chars)
- CHECK: `(command -v lake || command -v lean) >/dev/null || exit 11; fd -g 'lakefile.lean' -e lean . >/dev/null || exit 12`
- VALIDATE: `test -f lakefile.lean && lake test || fd -e lean -x lean --make {} || exit 1`
- GENERATE: `test -f lakefile.lean && lake build || fd -e lean -x lean --make {}`
- REMEDIATE: `rg -n '\\bsorry\\b' . && exit 13 || exit 0`

Success / Failure
- Pass when exit 0 and REMEDIATE finds no `sorry`.  
- Exit 13 for unsolved goals/tactic failures; 14 for coverage gaps still in logs; 11/12 for missing tool/artifacts.

Workflow
1) CHECK tools and artifacts.  
2) VALIDATE (tests or `lean --make`).  
3) GENERATE quick build-only run when tests are heavy.  
4) REMEDIATE to fail on `sorry`; repeat until clean.  
5) Surface exit codes and key warnings to caller.

Safety
- Read-only operations; no mutations.  
- Abort on exit ≥11 or if safety concerns raised (code 3).

Remediation Tips
- Replace each `sorry` with explicit tactic or term proof.  
- Use `set_option trace.tactic true` locally for stuck proofs.  
- Break goals into lemmas; leverage `simp`, `aesop`, `linarith`, `rw` with clear hypotheses.
