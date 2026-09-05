---
name: rust-security
description: 'Use when auditing Rust dependencies for vulnerabilities, enforcing license and source policies with cargo-deny, reviewing RUSTSEC advisories, or fuzzing and testing unsafe code for security.'
---

# Rust security

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Rust supply chain, dependency auditing, `cargo-audit`, `cargo-deny`, RUSTSEC, safe FFI, or fuzzing for security. |
| Authority | Read-only. Chat output only. No remote mutation. |
| Side effect | Emits a security audit report with findings and recommendations; does not modify source files. |
| Done | A report is emitted that lists vulnerabilities, policy violations, FFI risks, and recommended tools. |

## Inputs

1. **Audit target** (required): the Cargo project path or dependency list.
2. **Tool** (required): `cargo-audit`, `cargo-deny`, `cargo-fuzz`, Miri, or manual review.
3. **Policy context** (optional): license allowlist, banned crates, allowed sources, CI environment.

## Procedure

1. **Run `cargo-audit`.** Install `cargo-audit 0.22.2` with `cargo install cargo-audit --locked`, then run `cargo audit`. Use `cargo audit --deny warnings`, `cargo audit --file Cargo.lock`, or `cargo audit --json` for CI. The `--format json` and `--format sarif` options are also available. Done when: the audit output lists advisories or reports none.
2. **Run `cargo-deny`.** Install `cargo-deny 0.20.2` with `cargo install cargo-deny --locked`, run `cargo deny init` for a template, then run `cargo deny check [advisories|licenses|bans|sources|all]`. Configure `deny.toml` as shown below. Done when: the check runs and any policy violation is reported.

```toml
[advisories]
yanked = "deny"
unmaintained = "workspace"
ignore = [
    "RUSTSEC-2021-0145",
]

[licenses]
allow = [
    "MIT",
    "Apache-2.0",
    "Apache-2.0 WITH LLVM-exception",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "ISC",
]

[bans]
multiple-versions = "warn"
wildcards = "deny"
deny = [
    { crate = "openssl", use-instead = "rustls" },
]

[sources]
unknown-registry = "deny"
unknown-git = "deny"
allow-git = [
    "https://github.com/my-org/private-crate",
]
```

3. **Check the RUSTSEC database.** Use `cargo audit` or browse `https://rustsec.org/`. Classify advisories as `vulnerability`, `unmaintained`, or `unsound`. Done when: the advisory list and categories are known.
4. **Review FFI boundaries.** For each `extern "C"` function, validate pointer and length arguments, document the C invariant, and prefer safe wrapper crates. Done when: each FFI entry point has explicit validation.
5. **Fuzz for security bugs.** Install `cargo-fuzz` with `cargo install cargo-fuzz`, run `cargo fuzz init`, `cargo fuzz add <target>`, and `cargo fuzz run --sanitizer address <target>`. Reproduce crashes with `cargo fuzz run <target> <artifact>`. Done when: a fuzz target runs or a crash is reproduced.
6. **Confirm soundness with Miri.** Run `cargo +nightly miri test` on unsafe code. Use `MIRIFLAGS="-Zmiri-disable-isolation -Zmiri-backtrace=full"` when needed. Done when: Miri reports UB or completes cleanly.
7. **Harden the supply chain.** Keep `Cargo.lock` for binaries, run `cargo fetch --locked`, review duplicates with `cargo tree -d`, consider `cargo vet` for peer-reviewing new dependencies, and use `cargo-machete` to find unused dependencies. Done when: the supply-chain state is reported.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `cargo-audit` reports a vulnerability | Upgrade, ignore with a rationale, or replace the dependency. |
| `cargo-deny` policy violation | Edit `deny.toml` or resolve the license, banned crate, or source issue. |
| FFI input cannot be validated | Add checks or change the C contract to require valid pointers and lengths. |
| Fuzz target finds no bugs | Let it run longer, add a seed corpus, or add a dictionary. |
| Miri reports unsupported FFI | Stub the foreign function under `#[cfg(miri)]`. |

## Output

1. A security report with vulnerabilities, advisories, policy violations, and FFI risks.
2. Recommended commands and configuration files.
3. A fuzzing and Miri test plan.
4. A prioritized remediation list.
