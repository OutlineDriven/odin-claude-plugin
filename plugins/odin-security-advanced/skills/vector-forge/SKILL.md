---
name: vector-forge
description: 'Use when existing cryptographic implementations and a vector-consuming harness need mutation-driven, cross-implementation test-vector expansion. Produces targeted Wycheproof-style vectors and measured before/after kill-rate deltas. Not for general fuzzing — use fuzzing.'
---

# Vector forge

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Existing cryptographic implementations and a vector-consuming harness need mutation-driven, cross-implementation test-vector expansion. |
| Authority | Reversible local: writes limited to mutation campaign artifacts, new Wycheproof-style vectors, harness changes, and VECTOR_FORGE_REPORT.md in the working directory. No remote mutation, no credential mutation, no VCS mutation. |
| Side effect | Local write to working directory only: mutation logs, new Wycheproof-format JSON vectors, harness files colocated with each implementation, and VECTOR_FORGE_REPORT.md. |
| Done | Escapes are classified by fault class; each new vector targets a named fault class; negative vectors isolate one defect; vectors are independently cross-verified against two or more independent implementations; before/after kill-rate deltas plus proactive value are reported in VECTOR_FORGE_REPORT.md. |

## Inputs

Required inputs the user must supply:

- Target algorithm or protocol (e.g., ECDSA, BLS12-381, Ed25519, AES-GCM).
- Existing test vectors in Wycheproof JSON format (one file per algorithm variant).
- At least one implementation of the target algorithm in a language with an available mutation testing framework (Go, Rust, Python, JavaScript/TypeScript, Java, C/C++, C#, Ruby, PHP, Haskell).
- A test harness that reads vectors from JSON, exercises the implementation API per vector, and asserts both acceptance (deserialization succeeds, output matches expected) and rejection (invalid vectors fail or verify rejects).

Optional:

- Trailmark call graphs for each implementation (generated in Phase 4 if not pre-built).
- Existing mutation logs (skipped if not present).

## Procedure

Execute all six phases in order. Each phase is mandatory unless the contract specifies otherwise.

### Phase 1: discovery

1. Scan the working directory and any named implementation paths for source files. Classify each implementation by type:

   | Type | Mutation value | Action |
   |------|---------------|--------|
   | Pure implementation (Go, Rust, Python) | High | Use for mutation testing |
   | FFI wrapper to C/assembly | Low at binding layer | Skip for high-level mutation; use Mull for underlying C |
   | C/C++ implementation | High | Use Mull |
   | Generated code | Medium | May produce equivalent mutants; treat as medium priority |

2. For each implementation, record: language, mutation framework, pure vs FFI classification, existing test suite size.
3. Identify which API surface the test vectors exercise (deserialization, signing, verification, hashing, etc.).

**Done when:** every implementation, harness surface, and exercised API is classified.
### Phase 2: harness

1. For each pure implementation, verify a test harness exists that:
   - Reads test vectors from Wycheproof JSON files.
   - Exercises the implementation API for each vector.
   - Asserts acceptance: valid vectors deserialize and output matches expected.
   - Asserts rejection: invalid vectors are rejected or verification fails.
   - Adds roundtrip assertions for valid deserialization vectors: `serialize(deserialize(bytes)) == bytes`.
   - Reports pass/fail per vector with test IDs.
2. If no harness exists, write one colocated inside the implementation package:
   - Go: `*_test.go` in the same package.
   - Rust: integration test in `tests/`.
   - Python: pytest file in the test directory.
   - C/C++: test binary linked against the implementation.
3. If the implementation already has test vectors: plan to run mutation testing three times — with existing vectors only, new vectors only, and combined — to measure delta.

**Done when:** each pure implementation has a vector harness and the three-run comparison plan is fixed where prior vectors exist.
### Phase 3: baseline

1. Select the mutation testing framework by language:

   | Language | Framework | Command |
   |----------|-----------|---------|
   | Python | pytest-gremlins or mutmut | `uv run pytest --gremlins` or `uv run mutmut run` |
   | JavaScript/TypeScript | Stryker | `pnpm dlx stryker run` |
   | Rust | cargo-mutants | `cargo mutants --json` |
   | Go | gremlins | `gremlins unleash .` |
   | Java | PITest | `mvn org.pitest:pitest-maven:mutationCoverage` |
   | C/C++ | Mull | `mull-runner --allow-surviving --no-output --timeout=5000 ./tests` (set `ulimit -n 1024` first on macOS) |
   | C# | Stryker.NET | `dotnet stryker --reporter json` |
   | Ruby | mutant | `bundle exec mutant run --include lib` |
   | PHP | Infection | `vendor/bin/infection --show-mutations --min-msi=0` |
   | Haskell | MuCheck | `mucheck -t "cabal test" src/Module.hs` |

2. Before running, install every required framework. If installation fails after exhausting primary and alternative methods for the platform, stop and report the installation failure to the user. Do not fall back to manual mutation analysis or any equivalent that skips the tool.
3. For Mull on C/C++: determine the installed Clang/LLVM major version, download the Mull binary whose LLVM version exactly matches, install the plugin, compile with `-fpass-plugin=<plugin_path> -g -O0`, disable assembly (`--disable-asm`), and run with `--allow-surviving --no-output --timeout=5000`.
4. For large codebases, use parallel execution: `cargo mutants -j 8`, `gremlins unleash --timeout-coefficient 3`, `mutmut run --runner "pytest -x -q"`.
5. For each implementation, capture the full mutation log as JSON and record:
   - Total mutants generated.
   - Killed mutants.
   - Survived/Lived mutants (the target set for Phase 4).
   - Not covered code paths.
   - Timed out mutants (resolve before comparing baselines).
   - Efficacy percentage: Killed / (Killed + Survived).
   - Coverage percentage: (Total - Not covered) / Total.

**Done when:** each implementation has a complete baseline mutation log with resolved timeouts and recorded metrics.
### Phase 4: escape analysis

1. Build a Trailmark call graph for each implementation:
   ```bash
   uv run trailmark analyze --language <go|rust|python|javascript> --summary <targetDir>
   ```
   The graph provides caller chains for reachability, cyclomatic complexity, and blast radius.
2. Filter mutation results to only files and functions that test vectors should exercise:
   ```bash
   # cargo-mutants
   cat mutants.out/missed.txt | grep "src/relevant"
   # gremlins
   grep -E "(LIVED|NOT COVERED)" baseline.log | grep "at relevant"
   ```
3. For each escaped mutant, map it to its function in the call graph and classify:

   | Graph signal | Classification | Action |
   |-------------|---------------|--------|
   | No callers in graph | False Positive | Skip — dead code |
   | Only test callers | False Positive | Skip — test infrastructure |
   | Logging/display/formatting | False Positive | Skip — cosmetic |
   | Cross-package callers but NOT COVERED | Cross-Package Gap | Document as framework limitation; optionally add sub-package test |
   | Reachable from public API, cyclomatic complexity <= 10 | Missing Vector | Design targeted vector |
   | Reachable from public API, cyclomatic complexity > 10 | Fuzzing Target | Both vector + fuzz harness |
   | Validation or error-handling path | Negative Vector | Craft invalid input that triggers the path |
   | Optimization path (GLV, SIMD, batch) | Edge-Case Vector | Input that triggers optimization threshold |
   | `\|`→`^` after left shift (e.g., `(t<<1) \| carry`) | Equivalent Mutant | Skip — bit 0 always 0 after shift |
   | ct_eq `&`→`\|` on Montgomery limbs | API-Unreachable | Document; needs library-internal property-based tests |
   | Behavior unchanged by mutation | False Positive | Skip |

4. Prioritize by security impact:

   | Priority | Criteria | Example |
   |----------|----------|---------|
   | P0 — Critical | Weakens validation, equality, or authentication | `ct_eq`: `&`→`\|` makes equality permissive |
   | P1 — High | Deserialization flag parsing | `from_compressed`: `&`→`\|` accepts invalid flags |
   | P2 — Medium | Field arithmetic internals | `Fp::square`: `\|`→`^` corrupts computation |
   | P3 — Low | Optimization path | Endomorphism: only affects performance |
   | Skip | Formatting, display, equivalent mutation | `Debug::fmt` return value replacement |

5. Group escaped mutants by vector strategy for Phase 5.

**Done when:** every escaped mutant is classified, prioritized, and grouped by vector strategy.
### Phase 5: vector generation

1. For each escaped code path group, design test vectors targeting that path:
   - **Point deserialization**: malformed points: wrong length, invalid field elements, off-curve, wrong subgroup, identity point.
   - **Signature verification**: valid signature plus all single-bit corruptions of signature, public key, and message.
   - **Hash-to-curve**: known answer tests with edge-case inputs: empty message, single byte, maximum length.
   - **Aggregate operations**: 1 signer, many signers, duplicate signers, mixed valid/invalid.
   - **Error handling**: one vector per error path.
   - **Arithmetic edge cases**: zero, one, field modulus minus one, points at infinity.
   - **Serialization flags**: every valid flag combination plus every invalid flag combination.
   - **Roundtrip integrity**: for every valid deserialization vector, assert `serialize(deserialize(b)) == b`.
2. Design each negative vector with exactly one defect, keeping everything else valid, to isolate the specific validation check being tested. A multi-fault vector makes it impossible to determine which check rejected it.
3. Run fault simulation (limb-width reimplementation) to catch architectural bugs that local operator swaps miss:
   - Reimplement the target operation at reduced limb widths (8-bit, 16-bit, 25-bit, 32-bit, 51-bit) that differ from the production implementation.
   - Inject one fault per reimplementation from: dropped carry, off-by-one carry shift, skipped carry in multiplication inner loop, reduce modulo p+1 instead of p, skip final conditional subtraction, off-by-one reduction loop bound, truncate intermediate to limb width before carry, signed instead of unsigned limbs, return zero for input equals p minus one, accept p as valid field element.
   - Extract distinguishing inputs where the faulted output differs from the correct output.
   - Validate distinguishing inputs against the production implementation.
4. Verify every new vector against at least two independent implementations before adding it to the suite. If implementations disagree, investigate: one implementation has a bug.
5. For Wycheproof contributions: use the `vectorgen` tool (CLI or `github.com/c2sp/wycheproof/vectorgen` programmatic API) with a JSON envelope rather than formatting vector files by hand. Follow the upstream vectorgen guide for current requirements.

**Done when:** each new vector isolates one path, passes cross-implementation verification, and uses vectorgen where required.
### Phase 6: validation

1. Re-run mutation testing with new vectors included. Use per-file mutation testing for fast iteration during development; run full-crate tests only for the final before/after comparison.
2. Record the same metrics as Phase 3 for each implementation.
3. Compute the before/after delta:

   | Metric | Baseline | With New Vectors | Delta |
   |--------|----------|-----------------|-------|
   | Killed | X | Y | Y minus X |
   | Survived | A | B | A minus B (should decrease) |
   | Not Covered | C | D | C minus D (should decrease) |
   | Efficacy percent | E | F | F minus E |

4. Report both retroactive value (measurable kill-rate improvement in existing implementations) and proactive value (vectors that would catch bugs in future implementations even if they do not improve kill rates in existing ones).
5. Write the complete report to `VECTOR_FORGE_REPORT.md` in the working directory.

**Done when:** Phase 6 metrics, deltas, retroactive/proactive value, and the complete report are recorded.
## Failure and recovery
| Failure class | Response |
|--------------|----------|
| Mutation framework not installable | Stop. Report the installation failure with the specific error. Do not proceed with manual analysis, "desktop review," or any equivalent substitute. |
| Baseline times out | Increase timeout coefficients or per-mutant timeout; resolve timeouts before drawing any before/after comparison. |
| Kill rates unchanged after Phase 5 | Classify: if the implementation's own tests already cover those paths, document that the vectors provide cross-implementation semantic verification rather than new coverage. If the vectors are mis-targeted, redesign them. |
| Two implementations disagree on a vector result | Treat as a finding. One implementation has a bug. Report the disagreement in the vector and document which implementation accepts and which rejects. |
| Cross-package test gaps | Document as framework limitations. Do not treat as vector failures or vector targets. |

Partial-result rule: if the campaign stops before Phase 6 completes, return all intermediate artifacts: mutation logs, escape classifications, generated vectors, and a status report stating which phase stopped and why. Do not claim the done predicate holds without the full before/after comparison.

## Output
Write artifacts in order: `VECTOR_FORGE_REPORT.md`, Wycheproof-format JSON vectors per algorithm variant, colocated harness files, and Phase 3/6 mutation logs; change no remote, credential, or VCS state.
