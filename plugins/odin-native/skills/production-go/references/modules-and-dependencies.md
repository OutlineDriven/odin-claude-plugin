# Modules, Dependencies & Versioning

Go modules are a **manifest-plus-build-list anchor**, not a lockfile: `go.mod` records *minimums*, MVS derives a deterministic build list from them, and `go.sum` is an integrity log, not a resolver output. The `go` line is now operational (a hard floor + feature gate + semantics selector), tools are first-class deps (`tool` directive), and cross-module dev belongs in `go.work`, not scattered `replace` lines.

> Verified against Go **1.26.4** (stable, 2026-06) + **1.27 RC** notes. Version tags `[1.N]` mark the release a claim applies to. Baseline 1.22. Triangulated from two deep-research reports + primary sources (go.dev/ref/mod, release notes).

## TL;DR: the modern deltas (read first)

- The `tool` directive [1.24] (`go get -tool` + `go tool x`) replaces the `tools.go` blank-import hack. Tools are normal `// indirect` deps, version-pinned in `go.mod`, tracked in `go.sum`, shared by every contributor + CI. `go.mod edit -tool` does *not* add the require edge: use `go get -tool`.
- `GONOSUMCHECK` does not exist: it's the #1 model hallucination. Real knobs: `GOPRIVATE` (umbrella), `GONOSUMDB`, `GONOPROXY`, `GOSUMDB`, `GOINSECURE`, `GOVCS`, `GOFLAGS`. To skip the checksum DB for a path use `GOPRIVATE`/`GONOSUMDB`; globally `GOSUMDB=off`.
- The `go` line is a hard minimum [1.21], not advisory: a toolchain *refuses* to build a module declaring a newer Go. It also gates language features, default GODEBUGs, and module-system semantics (pruning).
- `GOTOOLCHAIN=auto` [1.21] auto-downloads the toolchain named by the `go`/`toolchain` line (fetched as a `golang.org/toolchain` module, sumdb-verified, run from the cache, *not* installed in PATH). Toolchain downloads do **not** appear in `go.sum`; `GOSUMDB=off` breaks them.
- Module graphs are pruned [1.17] for `go 1.17+` main modules; assuming a full transitive graph is wrong. `go.mod` therefore lists an explicit `require` for *every* transitively-imported package.
- `GOPROXY` separators differ: `,` advances only on **404/410**; `|` advances on **any error** (timeout, 5xx, DNS). Idiomatic: `https://corp.proxy|https://proxy.golang.org,direct`.
- `go mod vendor` errors under an active workspace [1.22]: use `go work vendor` or `GOWORK=off`.

## Table of Contents
1. [go.mod Anatomy](#1-gomod-anatomy)
2. [go.sum & Checksum Database](#2-gosum--checksum-database)
3. [Minimum Version Selection (MVS)](#3-minimum-version-selection-mvs)
4. [Semantic Import Versioning](#4-semantic-import-versioning)
5. [Workspaces](#5-workspaces-go-118)
6. [Private Modules](#6-private-modules)
7. [Vendoring](#7-vendoring)
8. [Essential Commands](#8-essential-commands)
9. [Multi-Module Monorepos](#9-multi-module-monorepos)
10. [Toolchain Management & GOTOOLCHAIN](#toolchain)
11. [govulncheck & Supply Chain](#govulncheck)
12. [Troubleshooting](#10-troubleshooting)
13. [Tooling status](#tooling-status)
14. [Version map 1.16→1.27](#versions)
15. [What models get wrong](#anti-patterns)

---

## 1. go.mod Anatomy {#1-gomod-anatomy}

Every directive, with exact min-version and the trap models miss:

| Directive | Min Go | Purpose / trap |
|---|---|---|
| `module` | all | Module path. v0/v1 = repo URL; **v2+ must end `/vN`** (see §4). |
| `go` | all | **Hard minimum [1.21]**: gates features, default GODEBUGs, pruning semantics. Accepts full `1.N.P` [1.21]. |
| `toolchain` | 1.21 | *Suggested* toolchain ≥ `go` line; advisory for working on the module, **not** for consumers. |
| `godebug` | 1.21 | GODEBUG defaults for the module's main packages. `default=go1.X` meta-setting; block form OK. Ignored in deps. |
| `require` | all | Minimum dep version. `// indirect` = not directly imported by this module's packages. |
| `replace` | all | Swap source/version. **Main-module-only: ignored when your module is a dependency.** |
| `exclude` | all | Block a specific version; MVS picks the next. Main-module-only. |
| `retract` | 1.16 | Mark *your own* published versions unsuitable; hidden from `@latest`/`go get -u` (still fetchable explicitly). |
| `tool` | 1.24 | Build-time executable dep. Replaces `tools.go`. Add via `go get -tool`. |
| `ignore` | 1.25 | Excludes dirs from `./...`/`all` pattern matching; **still included in the module zip**. |

```go
module github.com/org/myservice

go 1.25.0          // full patch version is valid [1.21]; bump fixes via go get go@1.25.3
toolchain go1.26.4 // optional; suggests a newer toolchain than the go line
godebug default=go1.24 // pin GODEBUG defaults to an older release's behavior

require github.com/go-chi/chi/v5 v5.1.0
require golang.org/x/sync v0.8.0 // indirect

tool golang.org/x/tools/cmd/stringer

replace github.com/broken/lib => github.com/fixed/lib v1.0.1
exclude github.com/vuln/pkg v0.3.0
retract [v1.0.0, v1.0.3] // broken auth flow
ignore ./node_modules
```

**`tool` directive [1.24]: before/after.** The `tools.go` blank-import pattern (paired with a Makefile that `go install …@latest`, causing version drift between contributors) is superseded:

```go
// WRONG [pre-1.24] — drift-prone, not pinned in go.sum:
//go:build tools
package tools
import _ "golang.org/x/tools/cmd/stringer"
```

```bash
# RIGHT [1.24+]:
go get -tool golang.org/x/tools/cmd/stringer   # adds tool + indirect require
go tool stringer -type=State ./internal/...     # runs the PINNED version (cached after first build [1.24])
go get tool                                      # upgrade ALL module tools (meta-pattern, NOT a flag)
go get -tool x@v1.2.3 | x@latest | x@none        # pin / bump / remove one
go install tool                                  # install every module tool into GOBIN [1.24]
//go:generate go tool stringer -type=…           # generate uses the pinned version
```

`go tool` (bare) lists built-in toolchain tools (`vet`, `cover`, `pprof`, `cgo`…) **plus** the module's; `go list tool` lists only the module's. **Limitation:** Go-built tools only, not `eslint`/`jq`. Isolate heavy tool deps from the main graph with a separate modfile: `go mod init -modfile=go.tool.mod …` then `go get -tool -modfile=…`. [1.25] ships fewer prebuilt tool binaries; non-build/test tools compile on demand.

---

## 2. go.sum & Checksum Database {#2-gosum--checksum-database}

Two entries per version, the module zip hash and the `go.mod`-only hash:

```
golang.org/x/net v0.21.0 h1:AQYk1IE...=       # hash of the module zip (all files)
golang.org/x/net v0.21.0/go.mod h1:bIjVDf...= # hash of go.mod alone — read during graph construction
```

`h1:` = SHA-256, base64. The `/go.mod` entry lets Go verify metadata without the full zip (essential to lazy loading). `go.sum` is **not a lockfile**: it constrains *integrity*, not *selection*; MVS over `go.mod` decides versions.

**`go.sum` scope is version-keyed.** `go mod tidy` records sums for the Go version **one below** the `go` line by default: a `go 1.17` module keeps 1.16's full-graph sums; a `go 1.18+` module keeps only pruned-graph sums. Override with `go mod tidy -compat=1.16`. This is why a tidy on a newer baseline can *delete* go.sum lines an older toolchain needs.

**Checksum DB:** `GOSUMDB=sum.golang.org` (default) is an append-only transparency log over `proxy.golang.org`; unknown hashes are checked against it, and sums persist even after a module is yanked. Disable globally with `GOSUMDB=off` (discouraged: the classic misconfig is copying it into a Dockerfile that *does* have network). Scope-exclude with `GOPRIVATE`/`GONOSUMDB`. `go mod verify` checks the **cache** against `go.sum`. Resolve merge conflicts with `git checkout --theirs go.sum && go mod tidy`; never hand-edit.

---

## 3. Minimum Version Selection (MVS) {#3-minimum-version-selection-mvs}

MVS selects, for each module, the **highest of the required minimums**, *never* "latest". The build list is recomputed deterministically on every module-aware command; it does **not** drift because upstream published a new version.

```
Main requires A>=1.2, B>=1.2 │ A1.2 requires C>=1.3 │ B1.2 requires C>=1.4
→ selected: A1.2, B1.2, C1.4   (minimum satisfying both ≥1.3 and ≥1.4)
```

| Aspect | Go MVS | npm/pip/Cargo |
|---|---|---|
| Version selected | **Minimum** satisfying constraints | Latest satisfying constraints |
| Lockfile | None: `go.mod` is the build-list anchor | Required (package-lock, etc.) |
| Algorithm | Linear graph traversal | NP-complete SAT solver |
| New upstream release | **No effect** until explicit `go get` | May auto-update |

**Module graph pruning [1.17]** (keyed on the *main module's* `go` line): the graph includes only the *immediate* requirements of each `go 1.17+` dependency, not its full transitive closure. Soundness comes from `go.mod` now listing an explicit `require` for every transitively-imported package (in the `// indirect` block). Consequence: a pruned-out module appears in `go list -m all` but you **cannot** `go build`/`go test` a package from it until you `go get` it to promote it to an explicit dep. **Lazy loading [1.17]:** the go command loads only the main module's `go.mod` first and pulls the rest of the graph on demand.

```bash
# WRONG — conflating the graph with the build list:
go mod graph        # the full requirement DAG (every edge)
# RIGHT — the build list (what MVS selected to build) is a different, smaller set:
go list -m all                # selected versions
go mod graph -go=1.16         # the graph AS an older Go version (pre-pruning) would see it
go mod why -m golang.org/x/text   # why a module is retained
```

**Upgrade/downgrade:** `go get x@v1.5.0` sets a new minimum + re-runs MVS (may move transitive deps to stay consistent); `go get x@none` removes; `go get -u` / `-u=patch` bump minors/patches *with intent* (MVS can still move siblings). Surface changes without mutating files: **`go mod tidy -diff` [1.25]** (prints the diff, exits non-zero if changes are needed, an ideal CI gate). No MVS algorithm changes 1.23→1.27 beyond toolchain-as-MVS-input [1.21].

---

## 4. Semantic Import Versioning {#4-semantic-import-versioning}

v0/v1: `github.com/foo/bar`. **v2+: the import path carries the suffix**: `github.com/foo/bar/v2`. Go treats `bar` and `bar/v2` as **different modules**; one binary can import both. Pre-modules tags without a `go.mod` get the `+incompatible` suffix (e.g. `v2.0.0+incompatible`).

**Creating a v2 (subdir approach, recommended):** create `v2/`, `go mod init github.com/foo/bar/v2`, then rewrite **all internal import paths** to `/v2` (the #1 error). Tag `v2.0.0`. **Monorepo/submodule tags are subdir-prefixed:** a module at `./api` releases as `api/v1.2.3`, not `v1.2.3` (see §9). **Pseudo-versions** (`v0.0.0-20240115120000-abcdef123456`) encode a base version + commit timestamp + 12-char hash, sortable by MVS.

---

## 5. Workspaces [Go 1.18+] {#5-workspaces-go-118}

A workspace makes several **local** modules the *main modules* of one MVS computation: develop across them with no `replace` churn and no tag-and-push round-trips.

```bash
go work init ./api ./worker ./shared   # writes go.work
go work use -r ./services              # add modules recursively
go work sync                           # MVS over the union → rewrite each member's go.mod
go work vendor                         # workspace-wide vendor/ [1.22]
go env GOWORK                          # off | <path>/go.work | (empty = search upward)
```

`go.work` carries its own `go`, `toolchain`, `godebug`, `use`, and `replace`. **Resolution:** `GOWORK=off` → single-module mode; unset → search cwd upward; explicit `*.work` path → that workspace. Checksums for workspace-only deps live in `go.work.sum`.

```go
go 1.25.0
use (
    ./api
    ./worker
    ./shared
)
replace example.com/x => ./forks/x   // go.work replaces OVERRIDE member replaces; member-vs-member conflicts are illegal unless resolved here
```

**Sharp edges experts still hit:**
- `go.work` is gitignored by convention. The Go reference calls checking it in *generally inadvisable* (it can override a parent workspace locally and make CI test the wrong selection). Commit only for a tightly-coupled repo developed as a closed unit, and still validate releases with `GOWORK=off`.
- These subcommands always act on **one** main module even inside a workspace: `go mod init/why/edit/tidy/vendor`, `go get`.
- `go mod vendor` is disallowed under an active workspace [1.22]: use `go work vendor` (its contents can legitimately differ from a single module's) or `GOWORK=off`. In workspace mode `-mod` may only be `readonly` (or `vendor` when a workspace vendor dir exists).
- Member `godebug` directives are ignored in workspace mode [1.23]: only `go.work` godebugs apply.
- The **`work` package pattern [1.25]** matches all packages across workspace members (or the single main module), formerly the unnamed "main modules" concept.

---

## 6. Private Modules {#6-private-modules}

```bash
go env -w GOPRIVATE=github.com/my-org/*,gitlab.internal.corp/*  # umbrella: GONOPROXY+GONOSUMDB inherit
go env -w GOPROXY='https://athens.corp|https://proxy.golang.org,direct'
```

| Variable | Effect | Default |
|---|---|---|
| `GOPRIVATE` | Skip proxy **and** sumdb for matching paths | empty |
| `GONOPROXY` | Skip proxy only | = `GOPRIVATE` |
| `GONOSUMDB` | Skip sumdb only | = `GOPRIVATE` |
| `GOINSECURE` | Permit HTTP/no-TLS fetch, but **does NOT skip the checksum DB** | empty |
| `GOVCS` | Which VCS clients are allowed per path | `public:git\|hg,private:all` |
| ~~`GONOSUMCHECK`~~ | **Does not exist**: hallucination; use `GOPRIVATE`/`GONOSUMDB`/`GOSUMDB=off` | n/a |

All path vars take comma-separated globs (`*` matches a path segment). **`GOINSECURE` is not a trust override**: per `go help environment` it only allows insecure transport; to bypass sumdb use `GOPRIVATE`/`GONOSUMDB`. **`GOVCS` default** is `public:git|hg,private:all`: public paths fetch over git/hg only; private paths (matching `GOPRIVATE`) may use any known VCS.

**GOPROXY separators: the trap:**

| Sep | Advances to next entry on |
|---|---|
| `,` (comma) | **HTTP 404/410 only**: timeouts, DNS failures, 5xx are **fatal** (chain stops) |
| `\|` (pipe) | **Any error** |

Idiomatic: `GOPROXY=https://corp.proxy|https://proxy.golang.org,direct`: pipe falls through if the corp proxy is *down*; the comma before `direct` keeps private paths from leaking to the public proxy on a mere 5xx. A private proxy that should *not* fall back must return a non-404/410 status for unknown private paths.

**`GOAUTH` [1.24]**: first-class credential pipeline for `go-import` discovery + HTTPS mirror fetches; **semicolon-separated**, processed in reverse (earlier = higher priority), default `netrc`:

```bash
go env -w GOAUTH='netrc; git /abs/path/to/worktree'   # netrc fallback + reuse git credential helper
```

Built-ins: `off` (must be sole entry), `netrc` (`~/.netrc`; `~/_netrc` on Windows), `git <abs-dir>` (`git credential fill` from that worktree), or a custom command that emits `https://`-URL-prefix lines + a blank line + HTTP header lines. On any **4xx** the go command re-invokes the command **once** with the URL as an arg and the HTTP response on stdin. `GOAUTH` authenticates *the go command's HTTPS requests*, nothing to do with runtime `x/oauth2` (a common conflation). **CI:** BuildKit secret mounts (`RUN --mount=type=secret,id=netrc,target=/root/.netrc go mod download`) or a token-vending `GOAUTH` command; rewrite git URLs with a token + set `GOPRIVATE`.

---

## 7. Vendoring {#7-vendoring}

`go mod vendor` copies only imported `.go` files (no tests, no nested vendors) into `vendor/` + writes `vendor/modules.txt`. A present `vendor/` with a `go 1.14+` directive makes builds behave as **`-mod=vendor` automatically**. Since [1.17] vendored deps' own `go.mod`/`go.sum` are **omitted** and each dep's `go` version is recorded in `modules.txt`; a stale manifest **errors** until regenerated.

```bash
go mod vendor         # always vendors everything needed to build+test the main module (no partial vendoring)
go build -mod=vendor  # default when vendor/ present
go build -mod=mod     # ignore vendor, use the module cache (default outside vendoring: -mod=readonly [1.16])
go work vendor        # workspace-wide [1.22]; go mod vendor errors under a workspace
```

| Vendor | Don't vendor |
|---|---|
| Air-gapped / hermetic / audited source-in-VCS | Library modules (consumers ignore your `vendor/`) |
| CI with slow/unreliable proxy | Repo-size sensitive; reliable proxy available |

**Trap:** vendoring is a **main-module build mode only**. Version-suffixed `go install pkg@v` / `go run pkg@v` have no main module and **ignore `vendor/` entirely**: they won't honor your vendored tree or `replace`/`exclude`.

---

## 8. Essential Commands {#8-essential-commands}

| Command | Purpose |
|---|---|
| `go mod tidy` | Add missing / drop unused deps; normalize `go.mod`/`go.sum` |
| `go mod tidy -diff` [1.25] | Print what tidy *would* change; non-zero exit if dirty: **CI gate** |
| `go mod tidy -compat=1.X` | Keep go.sum entries an older Go needs |
| `go get go@1.X` / `go get toolchain@go1.X.Y` [1.21] | Bump the `go`/`toolchain` line (**preferred over `go mod tidy -go=`**) |
| `go get x@v` / `@latest` / `@patch` / `@none` | Pin / upgrade / patch-only / remove a dep |
| `go mod graph [-go=1.X]` | Requirement DAG (as that Go version sees it) |
| `go mod why -m <mod>` | Import chain that retains a module |
| `go mod verify` | Cache matches `go.sum` |
| `go mod download` | Pre-fetch to cache (bare form does **not** save new sums to `go.sum` [1.17]) |
| `go list -m all` / `-m -versions <mod>` | Build list / available versions |
| `go version -m <bin>` / `-m -json` [1.25] | Embedded `BuildInfo` (versions, VCS, settings), a practical SBOM source |

`go get <mod>@<v>` vs **`go install <mod>@<v>` [1.16]**: `go get` mutates *the current module's* graph; `go install pkg@v` installs a binary to GOBIN **ignoring** the current `go.mod` (no main module, ignores vendor). The `go get`-to-install-a-binary workflow is deprecated; `-insecure` on `go get` is gone (use scoped `GOINSECURE`).

---

## 9. Multi-Module Monorepos {#9-multi-module-monorepos}

| Scenario | Recommendation |
|---|---|
| Tightly coupled, releases together | **Single module** (simplest tagging/CI) |
| Independent release cadence / separately consumable surface | **Multiple modules** |

Each module gets its own `go.mod` (`module github.com/org/repo/services/api`) and **subdir-prefixed tags** (`services/api/v1.2.3`). [1.25] also supports a **repo subdirectory as a module root** via `<meta name="go-import" content="root-path vcs repo-url subdir">`, simplifying hosting. **Local dev = `go.work`** (gitignored); **`replace` only** for forks/patches that must persist for *direct* consumers (remember: `replace` in a dependency is ignored downstream).

```bash
# Release flow for a shared lib in a monorepo:
git tag libs/auth/v0.4.0 && git push --tags
go mod edit -require example.com/repo/libs/auth@v0.4.0   # in each consumer
go mod edit -dropreplace example.com/repo/libs/auth      # drop the dev-time replace
go mod tidy
# CI: build each module with GOWORK=off; detect changed modules via git diff against dirs containing go.mod
```

---

## 10. Toolchain Management & GOTOOLCHAIN {#toolchain}

A Go distribution = a `go` command + a bundled toolchain. **`GOTOOLCHAIN` [1.21]** governs auto-switching:

| Value | Behavior |
|---|---|
| `auto` (default) | Auto-switch *and download* the toolchain named by `go`/`toolchain` (fetched as a `golang.org/toolchain` module, sumdb-verified, run from cache) |
| `local` | No auto-download: build **fails** if local < required |
| `go1.X.Y` | Force a version |
| `go1.X.Y+auto` | Floor, then allow upward switches |

The `toolchain` directive suggests a version ≥ the `go` line. `go get go@1.X` / `toolchain@go1.X.Y` manage the lines (`toolchain@none` strips it). **[1.25] raising the `go` line no longer auto-adds a `toolchain` line** (the release notes and older toolchain docs are in tension here; trust the live toolchain for current behavior; `[verify]` if generating policy that depends on implicit insertion). `GODEBUG=toolchaintrace=1` [1.24] traces selection. **CI hardening:** `GOTOOLCHAIN=local` + an explicit official Go install validated against the published SHA-256 removes the auto-download supply-chain surface. Because toolchain downloads are sumdb-verified but **absent from `go.sum`**, `GOSUMDB=off` makes them fail.

**`go mod init` default-version churn:** [1.26.0] changed `go mod init` to write `go 1.(N-1).0` (RCs `1.(N-2).0`) to favor compatibility, a controversial change **reverted in [1.26.1]** (#77653 → backport #77860) to the prior current-version default. The published 1.26 release-notes page still describes the lowered behavior (not yet updated for the revert). **Net for 1.26.1+: `go mod init` again writes the current toolchain's version.** Don't hardcode either; pin with `go get go@<version>` when it matters.

---

## 11. govulncheck & Supply Chain {#govulncheck}

```bash
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...                 # call-graph aware: reports only vulns REACHABLE from your code
govulncheck -mode binary ./app    # scan a built binary; also -json, SARIF, -test
```

`govulncheck` is the **official** scanner, fed by the curated Go vuln DB (OSV) at vuln.go.dev; the go command does **not** run it automatically. Call-graph analysis cuts noise versus manifest-only scanners. **Provenance:** `go version -m -json` [1.25] emits `runtime/debug.BuildInfo` as JSON: the practical first-party SBOM source (no first-party SPDX/CycloneDX generator ships as of 1.27 RC `[verify]`; teams feed third-party tools from BuildInfo). `go build` stamps the main module's VCS tag/commit with a `+dirty` suffix on uncommitted changes [1.24]; disable with `-buildvcs=false`.

**FIPS [1.24]:** the Go Cryptographic Module implements FIPS 140-3 algorithms transparently; `GOFIPS140=v1.0.0` selects the module version at build, the `fips140` GODEBUG (`off`/`on`/`only`) enables it at runtime. [1.26] adds module v1.26.0 + `crypto/fips140.WithoutEnforcement`/`Enforced` to relax strict checks under `fips140=only`.

---

## 12. Troubleshooting {#10-troubleshooting}

| Error | Cause | Fix |
|---|---|---|
| `ambiguous import: found in multiple modules` | A package provided by both v1 and `/v2` | Pick one major; `go mod why` to trace |
| `module declares its path as X but was required as Y` | Fork's `go.mod` keeps the original path | `replace`, or fix the fork's `module` line |
| `go.mod requires go >= 1.X (running 1.Y)` | `go` line floor exceeds local toolchain | Upgrade Go, or `GOTOOLCHAIN=go1.X+auto` to auto-download |
| `checksum mismatch` | Content changed (supply-chain or cache corruption) | `go clean -modcache && go mod download`; investigate if it recurs |
| `410 Gone` on a private module | Private path hit the public proxy/sumdb | Set `GOPRIVATE=<pattern>` |
| `missing go.sum entry` | Sum not recorded for the selected version | `go mod download <mod>` or `go mod tidy` |
| `cannot be run in workspace mode` | `go mod vendor` under an active `go.work` [1.22] | `go work vendor`, or `GOWORK=off` |
| `package … is not in std / no required module provides package` | Missing dep, or a pruned-out module | `go get <module>` then `go mod tidy` |
| `go.sum` merge conflict | Generated-file conflict | `git checkout --theirs go.sum && go mod tidy` |

Debug toolkit: `go mod graph | grep <mod>`, `go mod why -m <mod>`, `go list -m -versions <mod>`, `go list -m all`, `GODEBUG=toolchaintrace=1`.

---

## 13. Tooling status {#tooling-status}

| Item | Kind | Status [2026] | Notes |
|---|---|---|---|
| `tool` directive | go.mod | **Default** [1.24] | Replaces `tools.go` blank imports |
| `ignore` directive | go.mod | **Current** [1.25] | Excludes dirs from patterns; kept in module zip |
| `go` directive | go.mod | **Hard minimum** [1.21] | Gates features + semantics |
| `replace`/`exclude` | go.mod | Current, **main-module-only** | Ignored in deps; local-dev use superseded by workspaces |
| `tools.go` + blank imports | pattern | **Superseded** [1.24] | Migrate to `tool` |
| `GOPRIVATE` | env | **Default** for private deps [1.13] | Umbrella for `GONOPROXY`+`GONOSUMDB` |
| `GOAUTH` | env | **Current** [1.24] | `off`/`netrc`/`git <dir>`/`<command>`; default `netrc` |
| `GOTOOLCHAIN` | env | **Current** [1.21] | `auto`/`local`/`go1.X.Y`/`+auto` |
| `GONOSUMCHECK` | env | **Does not exist** | Hallucination |
| `GO111MODULE` | env | **Legacy/no-op** | Modules always on; GOPATH-mode `go get` removed [1.22] |
| `go work vendor` | command | **Current** [1.22] | `go mod vendor` errors under a workspace |
| `go mod tidy -diff` | command | **Current** [1.25] | Non-mutating CI gate |
| `golang.org/x/mod` | library | Active (v0.37.x, 2026-06) | Programmatic `go.mod`/version editing |
| `golang.org/x/vuln` (`govulncheck`) | tool | Active (v1.5.x, 2026-06) | Official vuln scanner; not auto-run |
| `honnef.co/go/tools` (`staticcheck`) | tool | Active (v0.7.x) | Supplementary lint beyond `go vet` |
| `gopls` | tool | Active (v0.22.x stable) | Integrated vulncheck + modernizers |
| `cmd/doc` / `go tool doc` | command | **Deleted** [1.26] | Use `go doc` (same flags/behavior) |

---

## 14. Version map 1.16→1.27 {#versions}

| Ver | Modules/dependency-relevant |
|---|---|
| **1.16** | `-mod=readonly` default; `retract`; `go install pkg@v` as the install path (split from `go get`); `go get pkg@v` for binaries on the way out |
| **1.17** | Module graph pruning + lazy loading (`go 1.17+` main modules); `go.sum` scope tied to the `go` line; vendored deps' `go.mod`/`go.sum` omitted; bare `go mod download` stops saving sums |
| **1.18** | Workspaces (`go.work`); generics (drives `/v2` consumers); `go mod download` no longer updates `go.mod` |
| **1.21** | `go` line is a **hard minimum**; `toolchain` directive + `GOTOOLCHAIN` auto-switch/download; full `1.N.P` in `go`/`toolchain`; `go get go@`/`toolchain@` |
| **1.22** | GOPATH-mode `go get` removed; `go work vendor`; `GOFLAGS` honored more broadly in workspaces |
| **1.24** | **`tool` directive** + `go get -tool`/`go tool`/`go install tool`; cached `go tool`/`go run` builds; **`GOAUTH`**; `GOFIPS140`; VCS `+dirty` stamp; `toolchaintrace`; `stdversion` under `go vet` |
| **1.25** | **`ignore` directive**; `go mod tidy -diff`; `work` package pattern; `go version -m -json`; repo-subdir module roots; raising `go` line no longer auto-adds `toolchain`; fewer prebuilt tool binaries; `waitgroup`/`hostport` vet checks |
| **1.26** | `go mod init` lowered default `go` version (1.26.0) → **reverted in 1.26.1**; `cmd/doc`/`go tool doc` deleted; FIPS module v1.26.0 + `WithoutEnforcement`/`Enforced`; `go fix` modernizers (unrelated to modules but ships here) |
| **1.27 (RC)** | `go mod tidy` merges duplicate `require` blocks (≤2: one direct, one indirect, comments preserved) for `go 1.27+`; **bzr fetch support removed**; `stdversion` under `go test`; `waitgroup`→`waitgroupgo`; removed-GODEBUGs (`asynctimerchan`) accepted in `go.mod` only at their final default. Treat as draft until GA. |

---

## What models get wrong {#anti-patterns}

1. **`tools.go` blank imports** for tool deps: superseded by the `tool` directive [1.24] (`go get -tool`; tools are pinned + tracked in `go.sum`). `go mod edit -tool` alone doesn't add the require edge.
2. **Inventing `GONOSUMCHECK`**: it doesn't exist. Use `GOPRIVATE`/`GONOSUMDB`, or `GOSUMDB=off` globally.
3. **Treating the `go` line as advisory**: it's a hard minimum since [1.21]; a newer requirement makes an older toolchain refuse to build (or auto-download under `GOTOOLCHAIN=auto`).
4. **Assuming a full transitive module graph**: pruned for `go 1.17+` main modules; you can't build a package from a pruned-out module without `go get`-ing it first.
5. **Confusing the build list with the module graph**: `go list -m all` (build list) ≠ `go mod graph` (full DAG); `go mod graph -go=1.16` shows pruned-out edges.
6. **Modeling MVS as "lockfile + semver ranges"**: Go picks the *minimum*, has no SAT solver, and `go.sum` is not a lockfile; builds don't drift on upstream releases.
7. **`GOPROXY` separator confusion**: `,` advances only on 404/410; `|` on any error. A timeout with `,` is fatal.
8. **`go mod vendor` under a workspace**: errors since [1.22]; use `go work vendor` or `GOWORK=off`.
9. **`GOINSECURE` to skip the checksum DB**: it only permits insecure transport; use `GOPRIVATE`/`GONOSUMDB`.
10. **Committing `go.work`**: generally inadvisable (overrides parent workspaces locally, makes CI test the wrong selection); gitignore it and validate releases with `GOWORK=off`.
11. **`replace ../sibling` as a publish-time mechanism**: `replace` is main-module-only and not transitive to consumers; use `go.work` for local dev, real tags for published boundaries.
12. **Root-style `v1.2.3` tags for a submodule**: monorepo submodules need subdir-prefixed tags (`api/v1.2.3`).
13. **`go get pkg@latest` to install a binary**: use `go install pkg@v` (ignores the current `go.mod`, has no main module, ignores vendor).
14. **Expecting vendoring to affect `go install pkg@v` / `go run pkg@v`**: version-suffixed installs ignore `vendor/` entirely.
15. **`go mod tidy -go=1.X` as the bump path**: still works, but `go get go@1.X` / `toolchain@go1.X.Y` is the preferred form [1.21].
16. **Forgetting `go.sum` is version-keyed**: tidy on a newer baseline can delete entries an older Go needs; use `-compat`.
17. **`GOSUMDB=off` in a networked CI/Dockerfile**: disables a supply-chain control unnecessarily, and breaks toolchain auto-download.
18. **Hardcoding `go mod init`'s default `go` version**: churned in 1.26.0 → reverted 1.26.1; pin explicitly with `go get go@`.

---

## See Also {#see-also}
- [modern-go.md](modern-go.md#tooling): `go fix` modernizers, `tool` directive in the version matrix
- [supply-chain-security.md](supply-chain-security.md): sumdb, GODEBUG, provenance, SBOM
- [platform-and-build.md](platform-and-build.md#versioning): `-ldflags`, `debug.ReadBuildInfo`, build stamping
- [project-patterns.md](project-patterns.md): project layout, multi-module structure
- [errors-and-resilience.md](errors-and-resilience.md#versions): the timer/GODEBUG version specifics referenced above

## Sources {#sources}
- go.dev/ref/mod (Module graph pruning, MVS, GOPROXY/GOPRIVATE/GOVCS, vendoring, `go.sum` scope); go.dev/doc/modules/gomod-ref; go.dev/doc/modules/major-version
- go.dev/doc/toolchain (GOTOOLCHAIN, `go get go@`/`toolchain@`); release notes go.dev/doc/go1.16-go1.27
- go.dev/doc/go1.26 (`go mod init` lowered default, `cmd/doc` deleted, FIPS v1.26.0); issue #77653 → backport #77860 (revert in 1.26.1)
- go.dev/doc/go1.27 (require-block merge, bzr removal, `stdversion` under `go test`), RC, subject to change
- research.swtch.com/vgo-mvs (MVS design); go.dev/design/25530-sumdb; pkg.go.dev/cmd/go (GOAUTH grammar)
- pkg.go.dev/golang.org/x/{mod,tools,vuln}; honnef.co/go/tools; vuln.go.dev
