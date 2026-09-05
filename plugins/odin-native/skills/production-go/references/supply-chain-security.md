# Supply Chain Security in Go

Go's supply-chain story is unusually strong by default: the `go` command verifies every dependency against `go.sum` and a public **transparency log** (`sum.golang.org`) before a single byte compiles. The delta you own is the rest; proving *reachability* of vulns (`govulncheck`, not version-matching), keeping `go.sum` honest in CI, generating an **SBOM** (no first-party tool exists), and signing/attesting your *own* artifacts. This file is the supply-chain layer; module mechanics live in [modules-and-dependencies.md](modules-and-dependencies.md), app-level crypto/auth in [security.md](security.md).

> Verified against Go **1.26.x** (stable) + **1.27 RC** notes, 2026-06. Tool versions: `govulncheck` **v1.3.0**, `cosign` v2.x, `syft` v1.x. Version tags `[1.N]` mark the Go release a claim applies to. No research corpus; written from expert knowledge, verified against primary sources; `[verify]` marks anything you should re-check before relying on it.

## TL;DR: the modern deltas (read first)

- `govulncheck` is reachability-based, not version-matching. It does *static call-graph analysis* and reports a vuln only if your code can actually reach the vulnerable **symbol**. This is the single biggest reason to prefer it over Dependabot/`osv-scanner` alerts, which fire on the *presence* of a version. Far lower false-positive rate.
- `GONOSUMCHECK` does not exist: it never did. It's the #1 hallucinated env var. The checksum DB is bypassed per-path via `GOPRIVATE`/`GONOSUMDB`, or globally (don't) via `GOSUMDB=off`. See [modules-and-dependencies.md](modules-and-dependencies.md#6-private-modules).
- `go.sum` is not a lockfile and not a trust root: it's a *consistency* check (these exact bytes, again). The trust root is the **checksum database** (`sum.golang.org`), a Merkle transparency log that makes a tampered version globally detectable. `go.sum` pins; the sumdb attests.
- There is no first-party SBOM tool. `go version -m` / `debug.ReadBuildInfo` give you the *embedded manifest*; turning that into CycloneDX/SPDX needs `cyclonedx-gomod` or `syft`.
- `-mod=readonly` is the default since [1.16]: a build that would change `go.mod`/`go.sum` *fails* instead of silently editing them. `GOFLAGS=-mod=mod` re-enables auto-edit; don't, in CI.
- Pin GitHub Actions by commit SHA, not tag. A tag (`@v4`) is mutable; an attacker who compromises an action can re-point it. The `tj-actions/changed-files` compromise (2025) is the canonical example; it poisoned thousands of pipelines via a moved tag.

## Table of Contents
1. [Built-in protections: the trust chain](#built-in-protections)
2. [go.sum + the checksum database (sumdb)](#sumdb)
3. [govulncheck: reachability, not versions](#govulncheck)
4. [The embedded manifest: debug.ReadBuildInfo](#sbom)
5. [SBOM generation (no first-party tool)](#sbom-gen)
6. [Reproducible builds](#reproducible-builds)
7. [GODEBUG and backward compatibility](#godebug)
8. [Dependency auditing & minimal trust](#dependency-auditing)
9. [Capability analysis (capslock)](#capslock)
10. [CI pipeline integration](#ci-integration)
11. [GitHub Actions hardening](#actions-hardening)
12. [Provenance & signing (SLSA, cosign)](#provenance)
13. [Tooling status](#tooling)
14. [Version map 1.16→1.27](#versions)
15. [What models get wrong](#stale)

---

## Built-in protections: the trust chain {#built-in-protections}

Three Google-run services, default since [1.13], form the chain. Knowing *which does what* is the whole game:

| Service | Role | Failure = |
|---|---|---|
| `proxy.golang.org` | Immutable module **mirror** ; once a version is fetched, those bytes never change | availability, not trust |
| `sum.golang.org` | Checksum **transparency log** (Merkle tree), the trust root | tamper-evidence |
| `index.golang.org` | Append-only **feed** of newly-published versions | discovery |

The flow on `go get`/`go build`: resolve version → fetch from `GOPROXY` → compute the hash → check it against `go.sum`; if absent from `go.sum`, verify against **`GOSUMDB`** (the sumdb) and *write* the verified hash into `go.sum`. A hash that disagrees with `go.sum` is a **hard security error**, not a warning: the build stops. This is why a poisoned mirror can't hurt you: the bytes are checked against an independent log.

The delta vs. other ecosystems: npm/PyPI trust the registry; Go trusts a *transparency log* the registry can't silently rewrite; you trust only that the sumdb's Merkle log is consistent (the `go` command cross-checks consistency proofs), not the proxy. `GOPRIVATE`/`GONOSUMDB`/`GOINSECURE`/`GOVCS`/`GOPROXY` separators/`GOAUTH` are module-mechanics: see [modules-and-dependencies.md](modules-and-dependencies.md#6-private-modules).

---

## go.sum + the checksum database (sumdb) {#sumdb}

`go.sum` holds **two** hashes per dependency version:

```
example.com/mod v1.2.3 h1:<hash of the file tree>
example.com/mod v1.2.3/go.mod h1:<hash of just the go.mod>
```

The `/go.mod` hash lets MVS verify the dependency *graph* without downloading every module's full source. Both are `h1:` (SHA-256, base64). `go.sum` is **additive and append-only in practice** ; entries accumulate; `go mod tidy` prunes unused ones. Never hand-edit it.

```bash
go mod verify   # recompute hashes of cached modules, compare to go.sum → "all modules verified"
```

`GOSUMCHECK` / `GONOSUMCHECK` are myths. The real knobs:

```bash
GOSUMDB=sum.golang.org      # default; the transparency log
GOSUMDB=off                 # disable sumdb ENTIRELY — new modules trusted on first use, NO log check
GONOSUMDB=corp.example.com/* # skip sumdb for matching paths (private code); public deps still checked
GOPRIVATE=corp.example.com/*  # umbrella: implies GONOPROXY + GONOSUMDB for those paths
```

The distinction models blur: `GOSUMDB=off` is a *global* trust downgrade: a *new* dependency is then recorded on first sight with **no transparency-log check** (trust-on-first-use). `GONOSUMDB`/`GOPRIVATE` are *scoped*: only matching private paths skip the log, which is correct (the public sumdb can't see private code). **Wrong instinct:** `GOSUMDB=off` to "fix" a private-module error. **Right:** `GOPRIVATE=<prefix>`, sumdb on for everything else. For air-gapped builds, run a private sumdb proxy; `-mod=readonly` (default) + a committed `go.sum` is the reproducibility floor.

---

## govulncheck: reachability, not versions {#govulncheck}

The headline: `govulncheck` builds a **call graph** and reports a vuln only when a vulnerable *symbol* (not just module) is reachable from your code. A CVE in a function you never call is silently dropped. This is categorically better signal than presence-based scanners.

```bash
go install golang.org/x/vuln/cmd/govulncheck@latest   # v1.3.0 [verify: latest]

govulncheck ./...                       # source scan (default) — full call stacks
govulncheck -mode binary ./bin/app      # scan a compiled binary (no source needed)
govulncheck -mode extract ./bin/app > app.blob   # tiny blob for offline/air-gapped scan
govulncheck -mode binary app.blob       # ...analyze the blob later
```

It queries the **Go vulnerability database** at `https://vuln.go.dev` (curated by the Go security team from CVEs, GHSA, and Go-specific reports; IDs look like `GO-2024-1234`). Requests send only *module paths already known to the DB*: not your code. Use `-db <url>` for a mirror.

| Flag | Purpose |
|------|---------|
| `-mode source\|binary\|extract` | source (default, most precise) / binary (symbol table) / extract |
| `-scan symbol\|package\|module` | granularity (default `symbol` = reachability; coarser = more findings) |
| `-format text\|json\|sarif\|openvex` | output; **non-text formats always exit 0** |
| `-show traces,verbose,color` | full call stacks / progress / color |
| `-test` | include test files; `-tags` for build tags |

Exit codes (the CI-critical bit): `0` = no vulns; **`3`** = vulns affecting your code (text mode). But with `-json`/`-format sarif`/`-format openvex` it **always exits 0** ; so a CI step that only checks `$?` on JSON output will *never* fail. Either gate on the text-mode exit code, or parse the structured output yourself.

```bash
# WRONG — JSON mode exits 0 even with vulns; this gate never trips:
govulncheck -format json ./... ; if [ $? -ne 0 ]; then exit 1; fi

# RIGHT — text mode returns 3 on findings; let it fail the step:
govulncheck ./...        # exit 3 fails the job naturally
# ...or produce SARIF for Code Scanning AND a separate failing gate:
govulncheck -format sarif ./... > results.sarif   # exit 0 (upload artifact)
govulncheck ./... > /dev/null                      # exit 3 = the gate
```

Limitations (verbatim-faithful to the docs): function-pointer and interface calls are analyzed **conservatively** (possible false positives / imprecise stacks); calls via `reflect` are **invisible** (false negatives); `unsafe` may cause false negatives. **Binary mode omits call stacks** (no source) and reports for *all* modules when symbols can't be extracted; binaries built pre-[1.18] yield stdlib-only findings. There is **no way to silence a finding** yet ([go.dev/issue/61211](https://go.dev/issue/61211)), triage out-of-band.

IDE/gopls: `"go.diagnostic.vulncheck": "Imports"` (fast, import-based; false positives) vs. the reachability code-lens on `go.mod`. CI granularity should stay `symbol`.

---

## The embedded manifest: debug.ReadBuildInfo {#sbom}

Every Go binary embeds its own dependency manifest: no external file needed. Read it at runtime:

```go
import "runtime/debug"

bi, ok := debug.ReadBuildInfo()   // ok=false only if built without module info
if ok {
    fmt.Println(bi.GoVersion)              // e.g. "go1.26.4"
    fmt.Println(bi.Main.Path, bi.Main.Version)
    for _, dep := range bi.Deps {          // []*debug.Module — transitive deps + versions + sums
        fmt.Println(dep.Path, dep.Version, dep.Sum)
    }
    for _, s := range bi.Settings {        // []debug.BuildSetting — build flags + VCS info
        fmt.Println(s.Key, s.Value)        // vcs.revision, vcs.time, vcs.modified, -trimpath, GOARCH...
    }
}
```

The CLI view of the same data:

```bash
go version -m ./bin/app        # GoVersion, all deps + h1: sums, build settings, VCS stamp
```

This is the *ground truth* for what shipped; versions and checksums baked into the artifact, immune to a later `go.mod` edit. It's the input to SBOM tools and the thing to embed a build version into via `-ldflags="-X main.version=..."`. **Trap:** `dep.Replace` is non-nil for `replace`d modules: an SBOM that ignores it misreports the real source. `vcs.modified=true` means the tree was dirty at build (see reproducibility below).

---

## SBOM generation (no first-party tool) {#sbom-gen}

Go ships the *manifest* (`go version -m`) but **no SBOM generator** ; you convert. Two maintained tools, different sweet spots:

```bash
# cyclonedx-gomod — Go-native, most precise; `app` evaluates build constraints
go install github.com/CycloneDX/cyclonedx-gomod/cmd/cyclonedx-gomod@latest
cyclonedx-gomod app -json -output sbom.json ./cmd/app   # ONLY modules actually compiled in
cyclonedx-gomod mod -json -output sbom.json             # whole module graph (incl. unused)
cyclonedx-gomod bin -json -output sbom.json ./bin/app   # from a compiled binary

# syft (Anchore) — multi-ecosystem; CycloneDX *or* SPDX, source or binary
syft scan dir:.        -o cyclonedx-json=sbom.cdx.json
syft scan file:./bin/app -o spdx-json=sbom.spdx.json
```

Choosing: `cyclonedx-gomod app` is the most accurate for a Go *application*; it evaluates build tags and includes *only what's compiled in* (not test-only/unimported deps), resolving licenses via go-license-detector. `mod` includes the full, noisier graph. Use `syft` for SPDX, multi-language, or container images. CycloneDX vs. SPDX is a *consumer-driven format* choice (CycloneDX is vuln/VEX-friendly; SPDX license/compliance-friendly). Scan the result with `osv-scanner --sbom=sbom.json` for *non-Go* components, but keep `govulncheck` as the Go gate; attach the SBOM as a build attestation (below).

---

## Reproducible builds {#reproducible-builds}

Byte-identical rebuilds let a third party confirm a binary came from the claimed source. Go is *close* to reproducible by default; two things leak environment in:

```bash
CGO_ENABLED=0 go build -trimpath -buildvcs=false \
  -ldflags="-s -w -X main.version=v1.0.0 -buildid=" -o app ./cmd/app
```

| Flag / env | Why | Min Go |
|------|-----|--------|
| `-trimpath` | strips absolute `$GOPATH`/home paths from the binary | [1.13] |
| `CGO_ENABLED=0` | removes host C toolchain + libc paths from metadata | all |
| `-buildvcs=false` | drops the VCS stamp (`vcs.revision/time/modified`) | [1.18] |
| `-ldflags="-s -w"` | strip symbol table + DWARF (smaller; not required for reproducibility) | all |

The `vcs.modified` trap: since [1.18] the build stamps VCS state; a dirty working tree sets `vcs.modified=true`, which **changes the binary** and breaks byte-identity. For *reproducible release* artifacts either build from a clean checked-out tag or set `-buildvcs=false`. Don't disable it in dev; you'd lose the useful `go version -m` provenance.

Requirements for byte-identical output: same Go *toolchain* version (pin via `GOTOOLCHAIN`/`go.mod` `toolchain` directive: see [modules-and-dependencies.md](modules-and-dependencies.md#toolchain)), `CGO_ENABLED=0`, `-trimpath`, deterministic injected values (no `time.Now()` in `-X`), identical `GOOS`/`GOARCH`/`GOAMD64`. **GoReleaser:** set `mod_timestamp: "{{ .CommitTimestamp }}"` (not build time) and the flags above; details in [platform-and-build.md](platform-and-build.md#releases).

---

## GODEBUG and backward compatibility {#godebug}

Go's compatibility promise [1.21+]: when a release changes runtime/library behavior, a **GODEBUG** setting restores the old behavior, and the *default* is pinned to the **`go` directive** in your `go.mod`. Build a `go 1.22` module with the 1.26 toolchain and GODEBUG-gated changes from 1.23-1.26 keep **1.22** semantics until you bump the directive. This is the mechanism that makes upgrading the toolchain low-risk; relevant to supply chain because it lets you adopt security fixes in the toolchain without behavior drift.

```
// go.mod
go 1.22
godebug (                 // [1.23+] explicit per-setting override; toolchains <1.23 reject this
    asynctimerchan=1
    tlsmlkem=0
)
```

```go
//go:debug panicnil=1     // [1.21+] source directive, before `package` (main package only)
package main
```

```bash
GODEBUG=httpmuxgo121=1 ./app   # runtime override (highest precedence)
```

Only the **main module's** `go.mod` is consulted for defaults. Settings are kept for a **minimum of two years (≈4 releases)**; some indefinitely. Recent security-relevant knobs: `tls10server`/`tls10client` (min TLS raised), `tlsmlkem` (post-quantum key exchange), `fips140` ([1.24], `off`/`on`/`only`), `x509sha1`, `containermaxprocs` ([1.25]). Full crypto context in [security.md](security.md#post-quantum); GC/scheduler GODEBUGs in [debugging-and-diagnostics.md](debugging-and-diagnostics.md#godebug).

---

## Dependency auditing & minimal trust {#dependency-auditing}

```bash
go mod graph                          # full module dependency graph (one edge per line)
go mod why -m github.com/pkg/foo      # WHY is this module here? shortest import path
go mod verify                         # cached modules still match go.sum
go list -m -u all                     # which deps have newer versions
go mod tidy && git diff --exit-code go.mod go.sum   # CI: fail if not tidy
```

Minimal-trust hygiene (the delta over "it compiles"):
- Pin, don't float. `go.mod` records exact versions and **MVS picks the minimum** satisfying constraints. Go has no build-time "latest" resolution, itself a supply-chain feature. Review every `go.mod`/`go.sum` diff like code.
- Audit before adding. Check `go mod why`, the dep's own dep count, last commit, and *capabilities* (next section). Fewer, smaller, maintained deps beat convenience.
- Update deliberately. `go get -u ./...` (bulk) is an anti-pattern; update in reviewable batches, `go test` after each. Filippo Valsorda's guidance: `govulncheck` + periodic deliberate updates over chasing every Dependabot bump.

License gating (a supply-chain *compliance* concern):

```bash
go install github.com/google/go-licenses@latest
go-licenses check ./...     # nonzero exit on forbidden/unknown licenses → CI gate
go-licenses report ./...    # CSV of every dep's license
```

---

## Capability analysis (capslock) {#capslock}

`govulncheck` answers "is known-bad code reachable?"; **capslock** (Google, BSD-3) answers a *different* question: "what can this dependency *do*?" It classifies a package's **capabilities** by following transitive calls to privileged stdlib operations (network, exec, file write, unsafe, reflect, etc.), the Principle of Least Privilege applied to dependencies.

```bash
go install github.com/google/capslock/cmd/capslock@latest
capslock                       # capabilities of packages in the current module
capslock -output=json          # machine-readable, for diffing in CI
```

The supply-chain use: **alert on capability *changes* across a dependency upgrade.** A logging library that suddenly gains `CAPABILITY_NETWORK` between minor versions is a red flag a vuln scanner won't catch (no CVE yet). Capslock is a *signal*, not a gate; combine with `govulncheck` and human review. Caveats: capabilities are coarse and conservative (reflection/`unsafe` widen them); a high-capability package isn't necessarily malicious. `[verify]` exact capability category names against the current README before scripting on them.

---

## CI pipeline integration {#ci-integration}

```yaml
name: Go Supply Chain
on:
  push:
  pull_request:
  schedule: [{ cron: '0 6 * * 1' }]   # weekly — new CVEs land against pinned deps

permissions:
  contents: read            # least privilege; widen per-job only when needed

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1 — pinned by SHA
      - uses: actions/setup-go@0c52d547c9bc32b1aa3301fd7a9cb496313a4491  # v5.0.0
        with: { go-version: stable, check-latest: true }
      - run: go mod verify
      - run: go mod tidy && git diff --exit-code go.mod go.sum   # fail if not tidy
      - uses: golang/govulncheck-action@v1                        # exits nonzero on findings
        with: { go-version-input: stable, go-package: ./... }
```

Add SARIF for GitHub Code Scanning: run `govulncheck -format sarif ./... > results.sarif` (exits 0: keep a separate text-mode step as the failing gate) then `github/codeql-action/upload-sarif@v3`.

Automated updates: Dependabot (`.github/dependabot.yml`: `package-ecosystem: "gomod"`, weekly) and Renovate (`renovate.json`: `"extends": ["config:recommended"]`, `"postUpdateOptions": ["gomodTidy"]`, native gomod support) both raise PRs. Configure Renovate/Dependabot to **also bump GitHub Actions** (`package-ecosystem: "github-actions"`) so pinned SHAs stay current; otherwise SHA-pinning rots. Expert note: Dependabot *security* alerts have poor signal for Go (presence-based); let `govulncheck` be the merge gate and use the update bots for *freshness*, not vuln triage.

---

## GitHub Actions hardening {#actions-hardening}

CI *is* part of your supply chain: a compromised action runs with your secrets. Three rules:

- Pin actions by full commit SHA, never a tag. `@v4` is a *moving pointer*; a SHA is immutable. The `tj-actions/changed-files` incident (2025) moved tags to malicious commits and dumped secrets from thousands of repos. SHA-pinned users were unaffected. Renovate/Dependabot can keep SHAs updated with a comment showing the version.

```yaml
# WRONG — mutable tag; an attacker who re-points it runs in your pipeline:
- uses: actions/checkout@v4
# RIGHT — immutable SHA (keep the version in a comment for humans + bots):
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
```

- Least-privilege `GITHUB_TOKEN`. Set top-level `permissions: { contents: read }` and widen *per job* only where needed (`id-token: write` for OIDC signing, `attestations: write` for provenance). The default token is over-scoped.
- Don't expose secrets to untrusted code. Avoid `pull_request_target` + checkout of fork code; never interpolate untrusted input into `run:` (script injection). Pin reusable workflows by SHA too.

---

## Provenance & signing (SLSA, cosign) {#provenance}

Provenance answers "was this artifact built from the source it claims, on a trusted builder?": the layer *above* checksums.

SLSA v1.0 build levels:

| Level | Requirement | Buys you |
|---|---|---|
| L1 | provenance exists (how it was built) | basic visibility |
| L2 | hosted builder + **signed** provenance | tamper-resistance after build |
| L3 | hardened, isolated builder; unforgeable provenance | resists most adversaries |

Go's proxy + sumdb already give *module-distribution* SLSA-like guarantees; but for *modules you consume*. For *artifacts you produce* (binaries, containers), you generate provenance yourself.

GitHub artifact attestations (≈SLSA Build L2; L3 with hardened reusable workflows), keyless, OIDC-backed, no key management:

```yaml
permissions: { id-token: write, contents: read, attestations: write }
steps:
  - uses: actions/checkout@<sha>
  - run: go build -trimpath -o app ./cmd/app
  - uses: actions/attest-build-provenance@v3    # signs provenance via Sigstore [verify: latest major]
    with: { subject-path: app }
```

```bash
gh attestation verify app -o my-org    # verify provenance (gh >= 2.49.0)
```

Sigstore / cosign for container images (and blobs), keyless signing binds the signature to an OIDC identity, recorded in the Rekor transparency log (no long-lived keys to leak):

```bash
cosign sign --yes ghcr.io/myorg/app:v1.0.0      # keyless; --yes for non-interactive CI
cosign verify ghcr.io/myorg/app:v1.0.0 \
  --certificate-identity=https://github.com/myorg/repo/.github/workflows/release.yml@refs/tags/v1.0.0 \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com
```

Verification is the point: signing without consumers verifying identity *and* issuer is theater. Always pin `--certificate-identity` and `--certificate-oidc-issuer`; a bare `cosign verify` accepts any valid signature.

---

## Tooling status {#tooling}

| Tool | Status [2026] | Use for |
|---|---|---|
| `go` (sumdb, `go.sum`, `go mod verify`) | **Built-in, default** | The trust chain; nothing to install |
| `govulncheck` v1.3.0 | **Default vuln gate** (Go team) | Reachability-based CVE scan in CI/IDE |
| `go version -m` / `debug.ReadBuildInfo` | **Built-in** | Embedded dependency manifest |
| `cyclonedx-gomod` | Active (CycloneDX) | Go-native SBOM; `app` = compiled-in only |
| `anchore/syft` | Active | Multi-ecosystem SBOM (CycloneDX/SPDX), images |
| `google/osv-scanner` | Active | Presence-based scan incl. non-Go SBOM components |
| `google/capslock` | Active (Google) | Capability analysis; alert on capability drift |
| `google/go-licenses` | Active | License compliance gate |
| `sigstore/cosign` v2.x | **Standard** | Keyless artifact/container signing |
| `actions/attest-build-provenance` | Active (GitHub) | SLSA provenance attestations |
| `GoReleaser` | Active | Reproducible release builds + signing + SBOM |
| `slsa-framework/slsa-github-generator` | Active | SLSA L3 provenance via reusable workflows `[verify]` |

---

## Version map 1.16→1.27 {#versions}

| Ver | Supply-chain-relevant |
|---|---|
| **1.16** | `-mod=readonly` becomes the **default** (build fails instead of editing `go.mod`/`go.sum`) |
| **1.18** | Binaries embed **VCS stamp** (`vcs.revision/time/modified`) + build settings in `ReadBuildInfo`; `govulncheck` requires 1.18+ for full binary analysis |
| **1.21** | **GODEBUG** compatibility mechanism formalized (`//go:debug`, defaults pinned to `go` directive); `GOTOOLCHAIN` |
| **1.23** | `godebug` directive in `go.mod` (per-setting overrides); toolchains <1.23 reject it |
| **1.24** | `fips140` GODEBUG + `GOFIPS140` (FIPS 140-3 mode); `GOAUTH` credential pipeline; `tool` directive in `go.mod` (track tool deps in the module) |
| **1.25** | `containermaxprocs` GODEBUG (GOMAXPROCS from cgroup quota); `embedfollowsymlinks` |
| **1.26** | Green Tea GC default (unrelated to supply chain, but a toolchain bump to plan for); GODEBUG churn continues |
| **1.27 (RC)** | `encoding/json/v2` GA; no headline supply-chain change; treat as draft until GA (~Aug 2026) |

---

## What models get wrong {#stale}

1. Inventing `GONOSUMCHECK` (and `GOSUMCHECK`), they don't exist. Use `GOPRIVATE`/`GONOSUMDB` (scoped) or `GOSUMDB=off` (global, last resort).
2. Conflating `go.sum` with the trust root: `go.sum` is a *consistency* check; the **sumdb transparency log** is the trust root.
3. `GOSUMDB=off` to fix a private-module error: that's a global trust downgrade; the fix is `GOPRIVATE=<prefix>`.
4. Treating `govulncheck` like a version scanner: it's *reachability-based*; a vuln in an uncalled function is (correctly) not reported.
5. Gating CI on `govulncheck -format json`'s exit code: JSON/SARIF/openvex modes **always exit 0**; only **text mode exits 3** on findings.
6. Claiming Go ships an SBOM generator: it ships the *manifest* (`go version -m`); SBOM needs `cyclonedx-gomod`/`syft`.
7. Using `cyclonedx-gomod mod` when `app` is wanted: `mod` includes the whole graph; `app` includes only what's compiled into the binary.
8. Ignoring `vcs.modified` breaking byte-identical reproducibility (dirty tree → different binary).
9. Forgetting `-trimpath`/`CGO_ENABLED=0` for reproducible builds, or disabling `-buildvcs` in dev (loses provenance).
10. Pinning GitHub Actions by tag (`@v4`) instead of commit SHA; tags are mutable (the `tj-actions/changed-files` class of attack).
11. `cosign verify` without `--certificate-identity` + `--certificate-oidc-issuer`: accepts any valid signature; signing without verifying identity is theater.
12. `go get -u ./...` (bulk update): update in reviewable batches, test after each.
13. Skipping `go mod tidy` + `git diff --exit-code` in CI; drift hides added/removed deps.
14. Assuming `GOINSECURE` bypasses the checksum DB: it only permits insecure *transport*; sumdb still applies (use `GOPRIVATE`/`GONOSUMDB`).
15. Treating Dependabot security alerts as the Go vuln gate: presence-based, noisy for Go; `govulncheck` is the gate, bots are for freshness.

---

## See Also {#see-also}
- [modules-and-dependencies.md](modules-and-dependencies.md#6-private-modules), `GOPRIVATE`/`GONOSUMDB`/`GOVCS`/`GOPROXY`/`GOAUTH`, `go.sum` anatomy, vendoring, `GOTOOLCHAIN`
- [security.md](security.md#static-analysis), app security: input validation, TLS, crypto, secrets, FIPS, static analysis
- [platform-and-build.md](platform-and-build.md#releases), GoReleaser, cross-platform reproducible release automation
- [debugging-and-diagnostics.md](debugging-and-diagnostics.md#godebug), runtime GODEBUG (GC/scheduler trace)

## Sources {#sources}
- go.dev/ref/mod (checksum database, `GOSUMDB`/`GOPRIVATE`/`GOINSECURE`, `-mod=readonly`); go.dev/blog/supply-chain; go.dev/doc/modules/managing-dependencies
- pkg.go.dev/golang.org/x/vuln/cmd/govulncheck (v1.3.0; usage, exit codes, limitations); go.dev/security/vuln; vuln.go.dev; go.dev/issue/61211 (no-silencing)
- pkg.go.dev/runtime/debug#ReadBuildInfo; `go help build`/`go version -m`; go.dev/doc/godebug
- github.com/CycloneDX/cyclonedx-gomod (`app`/`mod`/`bin` subcommands); github.com/anchore/syft; github.com/google/osv-scanner
- github.com/google/capslock (capability analysis); github.com/google/go-licenses
- slsa.dev (v1.0 build levels); docs.sigstore.dev + github.com/sigstore/cosign; docs.github.com; artifact attestations (`actions/attest-build-provenance`)
