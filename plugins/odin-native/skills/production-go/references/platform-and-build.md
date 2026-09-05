# Platform, Build, and Distribution

Go's build system is a *constraint solver over files*: `GOOS`/`GOARCH`/build-tags pick which `.go` files compile, and the toolchain cross-compiles to any of ~45 targets with **zero** extra setup. The static `CGO_ENABLED=0` binary is the deployment superpower. The modern moves: **stamp version metadata via VCS (`runtime/debug.ReadBuildInfo`), not `-X`**; `-trimpath` + pinned toolchain for **reproducible** builds; reach for `plugin` almost never.

> Verified against Go **1.26.4** (stable) + **1.27 RC** notes, 2026-06. Version tags `[1.N]` mark the release a claim applies to. Baseline assumed: **1.22**.

## TL;DR: the modern deltas (read first)

- **Prefer VCS stamping over `-X` for version info.** `go build` already embeds `vcs.revision`/`vcs.time`/`vcs.modified` [1.18], readable via `runtime/debug.ReadBuildInfo()`; no `-ldflags` plumbing, no stale tags. Use `-X` only for a human-friendly *semver tag* the VCS doesn't carry.
- **`//go:build` [1.17] is the only constraint syntax you should write.** The old `// +build` is legacy; `gofmt` keeps them in sync but you never author it new. **Exactly one `//go:build` line per file**, before the package clause, followed by a blank line.
- **`CGO_ENABLED=0` is the default *only when cross-compiling***; on a native build with a C toolchain present, cgo is **on by default**. Set it explicitly for a guaranteed-static binary.
- `//go:linkname` to stdlib-internal symbols is now blocked [1.23] unless the definition opts in. Old corpus usages are grandfathered; *new* ones fail to link. Escape hatch: `-ldflags=-checklinkname=0`.
- `plugin` is a near-anti-pattern: Linux/FreeBSD/macOS only, cannot be unloaded, and crashes unless host + every plugin share the *exact* toolchain/tags/flags/dependency source. Prefer `os/exec` + RPC (`hashicorp/go-plugin`).
- `-pgo=auto` is the default [1.21]: a `default.pgo` in the main package dir is applied automatically; commit it.

## Table of Contents
1. [Build Tags and Conditional Compilation](#build-tags)
2. [Cross-Compilation](#cross-compile)
3. [Microarchitecture levels (GOAMD64 et al.)](#microarch)
4. [Linker flags: -ldflags, -X, -s -w](#ldflags)
5. [Build metadata via ReadBuildInfo](#versioning)
6. [Reproducible builds & -trimpath](#reproducible)
7. [Build modes (c-shared, pie, plugin)](#buildmodes)
8. [GOFLAGS, GODEBUG defaults, env](#goflags)
9. [PGO (default.pgo)](#pgo)
10. [go:generate](#generate)
11. [//go:linkname danger](#linkname)
12. [Embedding Files](#embed)
13. [Windows-Specific Patterns](#windows)
14. [Docker Builds](#docker)
15. [ko; Dockerless Container Builds](#ko)
16. [Release Automation](#releases)
17. [go fix Modernizers](#go-fix)
18. [WebAssembly](#wasm)
19. [Flag/feature status table](#status)
20. [Version map 1.17→1.27](#versions)
21. [What models get wrong](#stale)

---

## Build Tags and Conditional Compilation {#build-tags}

A file compiles into a build iff its constraints are satisfied. Two mechanisms, **AND-ed together**:

1. The `//go:build` line [1.17]; a boolean expression over tags (`&&`, `||`, `!`, parens):

```go
//go:build (linux || darwin) && amd64 && !cgo

package app
```

Rules: at most **one** `//go:build` line; it must sit **above** the `package` clause with a **blank line** after it (else it's read as doc, not a constraint). `gofmt` auto-adds a matching `// +build` for pre-1.17 toolchains; never hand-write that legacy form.

2. File-name suffixes; implicit constraints from the name, after stripping `.go` and a `_test` suffix:

| Pattern | Example | Implies |
|---|---|---|
| `*_GOOS` | `signal_windows.go` | `//go:build windows` |
| `*_GOARCH` | `asm_amd64.go` | `//go:build amd64` |
| `*_GOOS_GOARCH` | `mmap_linux_arm64.go` | `//go:build linux && arm64` |

These are *additive* to any explicit `//go:build`. The idiom for OS-specific code is **separate files** (`store_unix.go` / `store_windows.go`), each with the same package + same exported API; no `runtime.GOOS` branching in shared files.

Tags satisfied during a build (verified, `go help buildconstraint`): the target `GOOS`; the target `GOARCH`; each `GOARCH.feature` (e.g. `amd64.v2`); **`unix`** if the OS is Unix-like; the compiler (`gc`/`gccgo`); **`cgo`** when cgo is enabled; **a `go1.N` term for every major release through the current** (`go1.1`, `go1.12`, …; *no* beta/minor tags, and these are **lower-bound only**, so `//go:build go1.24` means "1.24+"); and anything from `-tags`. Custom tags gate optional builds:

```go
//go:build integration
```
```bash
go test -tags=integration ./...          # opt-in heavyweight tests
go build -tags='netgo osusergo' ./...    # force pure-Go net/user resolvers
```

`GOOS=android` also matches `linux` files/tags; `ios`→`darwin`; `illumos`→`solaris`. `//go:build ignore` (any never-satisfied word) excludes a file from all builds; the convention for `go:generate` helper programs.

See also: [modules-and-dependencies.md](modules-and-dependencies.md) for module-level `go` directive vs the `go1.N` build tag (different mechanisms).

---

## Cross-Compilation {#cross-compile}

Set two env vars; no toolchain install needed (the stdlib is recompiled on demand):

```bash
GOOS=linux   GOARCH=amd64 go build -o myapp        ./cmd/myapp
GOOS=windows GOARCH=amd64 go build -o myapp.exe     ./cmd/myapp   # .exe matters on Windows
GOOS=darwin  GOARCH=arm64 go build -o myapp-mac     ./cmd/myapp
GOOS=linux   GOARCH=arm   GOARM=7 go build -o myapp-pi ./cmd/myapp

go tool dist list            # every supported GOOS/GOARCH pair
go tool dist list -json      # machine-readable, includes CgoSupported/FirstClass
```

**`CGO_ENABLED` is the trap.** It defaults to `1` on a **native** build (so a leaf C dependency silently links libc and breaks `scratch`/distroless and musl-vs-glibc portability), and `0` when `GOOS`/`GOARCH` differ from the host. For a guaranteed-static, fully-portable binary, set it explicitly:

```bash
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o myapp ./cmd/myapp
```

If you genuinely need cgo when cross-compiling you must supply a cross C toolchain (`CC=...`); see [cgo-and-interop.md](cgo-and-interop.md#cross-compile) (`zig cc`, xgo). Prefer pure-Go alternatives first: `modernc.org/sqlite` (SQLite, no cgo), `golang.org/x/image` (image codecs). cgo also forces dynamic-libc linking unless you add `-tags='netgo osusergo' -ldflags='-extldflags "-static"'`, which is fragile; `CGO_ENABLED=0` is the clean path.

---

## Microarchitecture levels (GOAMD64 et al.) {#microarch}

By default `GOARCH=amd64` targets the **v1** baseline (runs on any x86-64). Opt into newer CPU instructions for speed (SIMD, BMI, FMA) at the cost of dropping old hardware. Verified feature levels (`go help buildconstraint`):

| GOARCH | Env var | Levels |
|---|---|---|
| `amd64` | `GOAMD64` | `v1` (default), `v2`, `v3`, `v4` |
| `arm64` | `GOARM64` | `v8.0` (default) … `v8.9`, `v9.0`…`v9.5` |
| `arm` | `GOARM` | `5`, `6`, `7` |
| `386` | `GO386` | `sse2` (default), `387` |
| `riscv64` | `GORISCV64` | `rva20u64`, `rva22u64`, `rva23u64` |
| `ppc64` | `GOPPC64` | `power8`, `power9`, `power10` |
| `wasm` | `GOWASM` | `satconv`, `signext` |

```bash
GOAMD64=v3 go build ./...     # AVX2/BMI/FMA — typical for modern cloud (Haswell+, 2013+)
```

Levels are **cumulative**: `GOAMD64=v2` sets `amd64.v1` *and* `amd64.v2` build tags, so v2 code keeps compiling when v4 ships. Gate fallback code with **negation**: `//go:build !amd64.v2`. `v4` requires AVX-512; common on servers, absent on many laptops; default to `v1` for redistributables, raise it only for a known fleet. (Cross-checks: `runtime/debug` records the chosen level under the `GOAMD64`/`GOARM64`/… BuildSetting key.)

---

## Linker flags: -ldflags, -X, -s -w {#ldflags}

`-ldflags` passes args to `go tool link` (use `'pattern=flags'` to scope in a multi-package build; bare applies to the main package):

```bash
go build -ldflags="-s -w -X 'main.version=v1.4.2'" -o myapp ./cmd/myapp
```

- **`-X importpath.name=value`** sets a **package-level `string` var** at link time. Only `string`, only an initialized var (not a const), full import path required (`-X main.version=...` or `-X github.com/me/app/build.Commit=...`). Quote values with spaces. Silently no-ops on a typo'd path; verify in CI.
- **`-s`** strips the symbol table; **`-w`** strips DWARF debug info. Together ~20-30% smaller, but they **break `go tool pprof` symbolization and `dlv`**. Ship `-s -w` for size-sensitive release artifacts; keep symbols for anything you'll profile in prod.

```go
var version = "dev"   // overwritten by -X 'main.version=...'; default for `go run`/tests
```

Don't `-X` a struct field, an int, or a const; link-time injection only works on string vars. For VCS data, **don't** `-X` it at all; the toolchain already embeds it ([below](#versioning)).

---

## Build metadata via ReadBuildInfo {#versioning}

`go build` stamps module + VCS info into every binary [1.18]; read it at runtime; **no `-ldflags` needed**:

```go
import "runtime/debug"

func buildMeta() (rev, t string, dirty bool) {
    bi, ok := debug.ReadBuildInfo()       // ok=false only if built without modules
    if !ok { return }
    for _, s := range bi.Settings {       // []debug.BuildSetting{Key, Value}
        switch s.Key {
        case "vcs.revision": rev = s.Value
        case "vcs.time":     t = s.Value             // RFC3339
        case "vcs.modified": dirty = s.Value == "true"
        }
    }
    return
}
// bi.Main.Version is the module version ("(devel)" outside a tagged release);
// bi.GoVersion is the toolchain ("go1.26.4").
```

Verified `BuildSetting` keys (Go 1.26 `runtime/debug`): `vcs`, `vcs.revision`, `vcs.time`, `vcs.modified`; `-buildmode`, `-compiler`, `-trimpath` (as `-tags`/flags); `CGO_ENABLED` (+ `CGO_*FLAGS`); `GOOS`, `GOARCH`, and the arch level (`GOAMD64`/`GOARM`/`GO386`/…); **`DefaultGODEBUG`** (the build-time GODEBUG defaults); **`GOFIPS140`** (frozen FIPS module version, if any).

```bash
go version -m ./myapp        # dump a built binary's full BuildInfo from the CLI
```

`-buildvcs` controls stamping (verified): default `auto` stamps VCS info **only when the main package, its module, and the cwd are in the same repo**; `=false` omits it (use in Docker builds that `COPY` source without `.git`, else the build *errors*); `=true` forces it (errors if the VCS tool is missing). The standard pattern: rely on `vcs.*` for commit/dirty, inject **only** the semver *tag* via `-X` (Git tags aren't otherwise in BuildInfo):

```bash
go build -ldflags="-X 'main.version=$(git describe --tags --always --dirty)'" ./cmd/myapp
```

This survives `go install module@version` (which can't run your shell pipeline) because the commit/dirty bits come from `vcs.*` automatically.

---

## Reproducible builds & -trimpath {#reproducible}

Bit-for-bit reproducibility (supply-chain verification, cache hits) requires eliminating every environment-dependent input:

```bash
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
  go build -trimpath -ldflags="-s -w -buildid=" -o myapp ./cmd/myapp
```

- **`-trimpath`** removes absolute filesystem paths from the binary, replacing them with `module@version` (or import path for stdlib/GOPATH). Without it, `/home/alice/...` leaks into panics and defeats reproducibility. **The single highest-value reproducibility flag.**
- **Pin the toolchain**: the Go version is part of the output; use the `toolchain` directive in `go.mod` [1.21] (see [modules-and-dependencies.md](modules-and-dependencies.md#toolchain)) so collaborators/CI build with the identical compiler.
- **Pin deps** via `go.sum`; avoid `-X` of timestamps (`date` is non-deterministic; prefer `vcs.time`, which is the *commit* time).
- `-ldflags=-buildid=` clears the action-graph build ID for environments that compare it; usually unnecessary.

Go's build cache + module checksums make this largely automatic; `-trimpath` and a pinned toolchain are the two manual pieces. Deeper coverage (SBOM, signing, rebuild verification): [supply-chain-security.md](supply-chain-security.md#reproducible-builds).

---

## Build modes (c-shared, pie, plugin) {#buildmodes}

`-buildmode` selects the artifact kind (verified, `go help buildmode`):

| Mode | Output | Notes |
|---|---|---|
| `exe` (default) | executable | |
| `pie` | position-independent executable | ASLR hardening; **default on some platforms** (Windows, Android, some Linux distros' Go); small perf cost |
| `c-archive` | `.a` + header | C calls Go; **exactly one `main` pkg**; only `//export`ed cgo funcs are callable |
| `c-shared` | `.so`/`.dll`/`.dylib` + header | embed Go in a C/Python/Java app; same `//export` rule; **on `wasip1` builds a WASI reactor**, callable via `//go:wasmexport` |
| `plugin` | `.so` loaded via `plugin` pkg | see the hard limits below |
| `archive` / `shared` | `.a` / shared lib of non-main pkgs | `shared` pairs with `-linkshared` |

```bash
go build -buildmode=pie -o myapp ./cmd/myapp                # hardened binary
go build -buildmode=c-shared -o libfoo.so ./cmd/libfoo      # FFI target
```

`c-archive`/`c-shared` interop specifics (the cgo `//export`/`//go:wasmexport` contract, header generation, pointer rules) live in [cgo-and-interop.md](cgo-and-interop.md).

`plugin`; read before you reach for it. Verified limitations (`pkg.go.dev/plugin`): supported **only on Linux, FreeBSD, and macOS**: a loaded plugin **"is only initialized once, and cannot be closed"** (no unload, no version swap without process restart); and *"Runtime crashes are likely to occur unless all parts of the program … are compiled using **exactly the same version of the toolchain, the same build tags, and the same values of certain flags and environment variables**,"* plus all shared dependencies *"built from exactly the same source code."* The docs themselves conclude it's usually *"simpler … to generate Go source files that blank-import the desired set of plugins and … compile a static executable."* For real extensibility prefer **out-of-process plugins over RPC** (`hashicorp/go-plugin`, gRPC); see [project-patterns.md](project-patterns.md#plugins). Use the `plugin` package only when host and plugins are built together by one pipeline and you accept the no-unload constraint.

---

## GOFLAGS, GODEBUG defaults, env {#goflags}

**`GOFLAGS`** (verified) is a **space-separated** list of `-flag=value` settings applied to every `go` command that knows the flag; values must not contain spaces; command-line flags override it. Use it to make a project default sticky:

```bash
export GOFLAGS='-mod=vendor -trimpath'     # every build vendors + trims
go env -w GOFLAGS='-mod=readonly'          # persist in the go env config file
```

Build-time `GODEBUG` defaults. `GODEBUG` toggles runtime/stdlib compatibility behaviors. The key modern fact: a binary's *default* GODEBUG is pinned by the **`go` line in `go.mod`** [1.21]; bumping `go 1.22` → `go 1.25` can flip behaviors (e.g. default TLS, loop-var semantics already settled). Override per-binary with a top-of-`main` directive, which is recorded in `DefaultGODEBUG` BuildInfo:

```go
//go:debug http2client=0      // must precede the package clause in the main package
```

Override at runtime via the `GODEBUG` env var (`GODEBUG=http2client=0 ./myapp`). The full default-selection rule and the `//go:debug` directive are in [modules-and-dependencies.md](modules-and-dependencies.md#1-gomod-anatomy). Note `GODEBUG` and `GOENV` **cannot** be set via `go env -w`.

---

## PGO (default.pgo) {#pgo}

Profile-Guided Optimization [1.21 GA] feeds a runtime CPU profile back to the compiler for inlining/devirtualization decisions (typically a few % throughput). **`-pgo=auto` is the default** (verified): if a file named **`default.pgo`** exists in a `main` package's directory, the compiler applies it to that package's transitive deps automatically.

```bash
go test -cpuprofile=cpu.pprof -bench=. ./...   # capture a representative profile
cp cpu.pprof ./cmd/myapp/default.pgo           # commit it next to main
go build ./cmd/myapp                            # auto-applied; or -pgo=/path, -pgo=off
```

Commit `default.pgo` so CI/`go install` pick it up. Refresh it periodically from production profiles; a *stale* profile is harmless (worst case: no benefit). Detail + measurement: [performance.md](performance.md#pgo).

---

## go:generate {#generate}

`//go:generate` declares a command run **only** by an explicit `go generate ./...`; **never** during `go build`/`go test`. Output is committed source, so consumers need no codegen tools.

```go
//go:generate stringer -type=Status
//go:generate mockgen -source=repo.go -destination=mock_repo.go -package=app
```

```bash
go generate ./...    # runs every directive; CI should `go generate` then `git diff --exit-code`
```

The generator binary itself is often kept as a `//go:build ignore` file or pinned via a `tool` directive in `go.mod` [1.24] (see [modules-and-dependencies.md](modules-and-dependencies.md#1-gomod-anatomy)). Common helper env: `$GOFILE`, `$GOPACKAGE`, `$GOLINE`. Keep generators deterministic; non-deterministic output churns diffs.

---

## //go:linkname danger {#linkname}

`//go:linkname localname importpath.name` aliases a local symbol to a private symbol in another package; bypassing the type system and export rules. It needs an `import _ "unsafe"`. It is a **last resort**: it couples you to *unexported* runtime internals that change without notice and have no compatibility promise.

```go
import _ "unsafe"

//go:linkname nanotime runtime.nanotime   // FRAGILE — runtime-private, may break any release
func nanotime() int64
```

[1.23] hardening (verified, go1.23 release notes): the linker *"now disallows using a `//go:linkname` directive to refer to internal symbols in the standard library (including the runtime) that are not marked with `//go:linkname` on their definitions."* Pre-1.23 usages found in a large open-source corpus are grandfathered; **any new reference to a stdlib-internal symbol fails to link.** Escape hatch for debugging only: `go build -ldflags=-checklinkname=0`. Practical rule: never introduce a new `//go:linkname` into stdlib internals; find a supported API; if none exists, file a proposal. (The "push" form; linkname *on the definition* to expose your own symbol to another of your packages; remains allowed.)

---

## Embedding Files {#embed}

`//go:embed` bakes files into the binary at compile time (needs `import "embed"`, even when unused for the `embed.FS` form):

```go
import "embed"

//go:embed version.txt
var version string                 // string OR []byte: single file's contents

//go:embed all:static templates/*.html migrations/*.sql
var assets embed.FS                // directory tree; `all:` includes _-/._-prefixed files

mux.Handle("/static/", http.FileServerFS(assets))   // [1.22] FS-native handler
data, _ := assets.ReadFile("templates/index.html")
```

Gotchas: patterns are **relative to the source file** and can't escape it (no `..`, no absolute, no symlinks); by default files starting with `.` or `_` are **excluded** unless prefixed `all:`; a `//go:embed` directive must sit immediately above its `var`. `embed.FS` satisfies `fs.FS`/`io/fs`, so it composes with `fs.WalkDir`, `template.ParseFS`, `http.FS`. See also [file-io.md](file-io.md#embed).

---

## Windows-Specific Patterns {#windows}

Paths: use `path/filepath` (OS-aware separators), never `path` (forward-slash only; breaks on Windows). `os.UserConfigDir()` → `%APPDATA%` vs `~/.config`; `os.TempDir()` is portable. `filepath.ToSlash`/`FromSlash` bridge when a slash form is required (URLs, archives).

Shell out with the right interpreter:

```go
var cmd *exec.Cmd
if runtime.GOOS == "windows" {
    cmd = exec.CommandContext(ctx, "cmd", "/c", command)
} else {
    cmd = exec.CommandContext(ctx, "sh", "-c", command)
}
```

Hide the console window for a child process (`syscall.SysProcAttr` is OS-specific; keep it in a `*_windows.go` file behind `//go:build windows`):

```go
cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000} // CREATE_NO_WINDOW
```

Services & signals: `golang.org/x/sys/windows/svc` (`svc.IsWindowsService()` to detect, `svc.Run` to host); Windows has no `SIGHUP`/`SIGUSR*`; only `os.Interrupt`/`SIGTERM` are portable, so gate extra signals with build tags. Other deltas: case-insensitive filenames, no Unix `chmod` model, `\r\n` line endings, named pipes (`\\.\pipe\name`) instead of Unix sockets. Portable file locking: `github.com/gofrs/flock`. Process-exec patterns: [cli-and-config.md](cli-and-config.md#process-exec).

---

## Docker Builds {#docker}

```dockerfile
FROM golang:1.26 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download                       # cached layer until go.mod/go.sum change
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -buildvcs=false -o /app ./cmd/server

FROM gcr.io/distroless/static-debian12 AS final
COPY --from=build /app /app
USER nonroot:nonroot                       # never run as root
ENTRYPOINT ["/app"]
```

Key points: **`CGO_ENABLED=0`** so the binary runs on `scratch`/distroless (no glibc); **`-buildvcs=false`** because the build context usually lacks `.git` (otherwise the build *errors* under `auto`); or `COPY .git` and keep stamping; download deps in a separate cached layer. Image sizes: `golang:*` ~800 MB (build only) → `alpine` ~5 MB + binary → `distroless/static` ~2 MB + binary → `scratch` (nothing but your binary; hardest to debug, needs CA certs + tzdata copied in if used). Canonical Dockerfile + cache tuning: [ecosystem-and-tooling.md](ecosystem-and-tooling.md#docker).

---

## ko: Dockerless Container Builds {#ko}

**Agent: use this to build Go container images without a Dockerfile or Docker daemon when cgo is not required.** ko runs `go build` locally, layers the binary onto a minimal base (`cgr.dev/chainguard/static`), and pushes an OCI image.

```bash
go install github.com/google/ko@latest
export KO_DOCKER_REPO=ghcr.io/my-org/my-repo
ko build ./cmd/myapp                                    # build + push
ko build --local ./cmd/myapp                            # no push
ko build --platform=linux/amd64,linux/arm64 ./cmd/myapp # multi-arch, no buildx
```

| | ko | Docker multi-stage |
|---|---|---|
| Dockerfile / daemon | not needed | required |
| cgo / OS packages | not supported | fully supported |
| Multi-platform | `--platform` flag | needs buildx |
| Kubernetes | native (`ko apply -f k8s/`) | separate workflow |

**Use ko** for pure-Go (cgo-free) services; **use Docker** when you need C libs, OS packages, or non-Go components.

---

## Release Automation {#releases}

GoReleaser orchestrates cross-platform build + archive + checksum + publish from a git tag:

```yaml
# .goreleaser.yaml
version: 2
builds:
  - main: ./cmd/myapp
    env: [CGO_ENABLED=0]
    flags: [-trimpath]
    goos: [linux, windows, darwin]
    goarch: [amd64, arm64]
    ldflags: ["-s -w -X main.version={{.Version}} -X main.commit={{.Commit}}"]
archives:
  - format_overrides: [{ goos: windows, format: zip }]
checksum: { name_template: 'checksums.txt' }
```

```bash
goreleaser release --snapshot --clean    # local dry-run
git tag v1.0.0 && git push --tags        # CI (GoReleaser Action) does the real release
```

`{{.Version}}`/`{{.Commit}}` come from the tag, so `-X` is consistent across all artifacts. Also: [ecosystem-and-tooling.md](ecosystem-and-tooling.md#releases).

---

## go fix Modernizers {#go-fix}

**Agent: run this after every toolchain upgrade to apply automated modernizations.** `go fix` was rewritten [1.26] with ~two dozen analyzers that rewrite code to newer language/stdlib idioms.

```bash
go fix ./...          # apply
go fix -diff ./...    # preview (dry-run)
```

| Analyzer | Rewrite | Min Go |
|---|---|---|
| `any` | `interface{}` → `any` | 1.18 |
| `minmax` | if/else → `min()`/`max()` | 1.21 |
| `rangeint` | `for i:=0;i<n;i++` → `for range n` | 1.22 |
| `stringscut` | `strings.Index` dance → `strings.Cut` | 1.18 |
| `errorsastype` | `var x; errors.As(err,&x)` → `errors.AsType[T]` | 1.26 |

Library authors: annotate a deprecated wrapper with `//go:fix inline` so consumers auto-migrate when they run `go fix`:

```go
// Deprecated: use Pow(x, 2).
//
//go:fix inline
func Square(x int) int { return Pow(x, 2) }   // call sites rewrite Square(5) → Pow(5, 2)
```

Run from a clean git tree; run **twice** (some fixes unlock others). Cross-ref: [modern-go.md](modern-go.md#tooling).

---

## WebAssembly {#wasm}

WASM compilation (`GOOS=js`/`GOOS=wasip1`, `//go:wasmexport` [1.24], TinyGo) is covered in **[wasm-and-embedded.md](wasm-and-embedded.md)**. Note the cross-link: `-buildmode=c-shared` on `wasip1` produces a WASI reactor (a long-lived library instance) rather than a command; see [buildmodes](#buildmodes).

---

## Flag/feature status table {#status}

| Flag / feature | Status [2026] | Use when |
|---|---|---|
| `//go:build` | **Default** [1.17] | All constraints; never hand-write `// +build` |
| `CGO_ENABLED=0` | **Default for portable builds** | Static binary, scratch/distroless, cross-compile |
| `-trimpath` | **Recommended for releases** | Reproducibility + no path leakage |
| `runtime/debug.ReadBuildInfo` | **Default for version info** | Commit/dirty/module version without `-X` plumbing |
| `-ldflags=-X` | Keep, **narrowly** | Inject the semver *tag* only |
| `-ldflags=-s -w` | Conditional | Size-sensitive artifacts you won't profile |
| `-pgo=auto` (`default.pgo`) | **Default** [1.21] | Commit a profile; free throughput |
| `-buildmode=pie` | Situational | Hardened binaries (some platforms default it) |
| `-buildmode=c-shared`/`c-archive` | Situational | FFI / embed in C/Python/Java |
| `-buildmode=plugin` | **Avoid** | Only one-pipeline, no-unload cases; prefer RPC plugins |
| `//go:linkname` (to stdlib) | **Avoid** [blocked 1.23] | Never new; find a supported API |
| `GOFLAGS` | Useful | Project-sticky build defaults |

---

## Version map 1.17→1.27 {#versions}

| Ver | Platform/build-relevant |
|---|---|
| **1.17** | `//go:build` constraint syntax (supersedes `// +build`) |
| **1.18** | VCS stamping (`vcs.*` in BuildInfo); `ParseBuildInfo`; generics (affects buildmodes only indirectly) |
| **1.20** | PGO **preview**: multi-error build of stdlib |
| **1.21** | **PGO GA + `-pgo=auto`/`default.pgo`**; `toolchain` directive + GODEBUG defaults keyed to `go.mod` `go` line; `//go:debug` directive; `GOEXPERIMENT` loopvar settled |
| **1.22** | range-over-int (`rangeint`); `http.FileServerFS`/`http.ServeFileFS`; baseline for this doc |
| **1.23** | **`//go:linkname` to stdlib-internal symbols blocked** (`-checklinkname=0` escape); `GORISCV64` levels; timers GC'd unreferenced |
| **1.24** | `tool` directive in `go.mod`; `//go:wasmexport`; FIPS 140-3 module (`GOFIPS140`); `os.Root` |
| **1.25** | `GODEBUG` additions; flight recorder; `GOARM64`/microarch refinements |
| **1.26** | **`go fix` rewritten** (~24 modernizers, `//go:fix inline`); `errorsastype` modernizer; `GOFIPS140` BuildSetting |
| **1.27 (RC)** | Generic methods; `encoding/json/v2` GA; treat as draft until GA (~Aug 2026) |

---

## What models get wrong {#stale}

1. Claiming `CGO_ENABLED=0` is *always* the default; it's `1` on **native** builds; a stray C dep then breaks scratch/distroless. Set it explicitly.
2. Hand-writing `// +build` lines; legacy; author only `//go:build` [1.17] (one line, blank line after, above `package`).
3. Plumbing `-X` for commit/build-time when `runtime/debug.ReadBuildInfo` already has `vcs.revision`/`vcs.time`/`vcs.modified` [1.18]. Use `-X` only for the semver tag.
4. `-X` of a non-string/const/int, or a wrong import path; silently no-ops. Only initialized package-level `string` vars.
5. Forgetting **`-trimpath`** for reproducible/clean builds (absolute paths leak into the binary).
6. Forgetting `-buildvcs=false` in a Docker build without `.git` → the build **errors** under default `auto`.
7. Reaching for `-buildmode=plugin`: Linux/FreeBSD/macOS-only, **cannot unload**, crashes on any toolchain/tag/flag/dep mismatch. Prefer out-of-process RPC plugins.
8. New `//go:linkname` into runtime/stdlib internals; **blocked at link [1.23]**: no compat guarantee even where grandfathered.
9. Treating `//go:build go1.24` as "exactly 1.24"; it's a **lower bound** (1.24+); no beta/minor tags exist.
10. Hardcoding `GOAMD64=v4` for redistributables; needs AVX-512, absent on many machines; default to `v1`, gate fallbacks with `//go:build !amd64.v2`.
11. Expecting `//go:generate` to run during `go build`; it runs **only** on explicit `go generate`.
12. `path` instead of `path/filepath` for OS paths (breaks on Windows); putting `syscall.SysProcAttr` in a shared file instead of `*_windows.go`.
13. Shipping `-s -w` on a binary you then try to profile strips symbols/DWARF, breaking `pprof` and `dlv`.
14. Not committing `default.pgo`; `-pgo=auto` [1.21] only helps if the profile is in the main package dir.
15. `embed` patterns with `..`/absolute paths, or expecting dotfiles without the `all:` prefix.

---

## See Also {#see-also}
- [cgo-and-interop.md](cgo-and-interop.md); cgo `//export`, c-shared/c-archive contracts, cross-compiling with a C toolchain
- [modules-and-dependencies.md](modules-and-dependencies.md); `toolchain` directive, GODEBUG defaults, `tool` directive, vendoring
- [supply-chain-security.md](supply-chain-security.md#reproducible-builds); reproducibility verification, SBOM, signing
- [cloud-native.md](cloud-native.md); container deployment, GOMAXPROCS/cgroups
- [performance.md](performance.md#pgo); PGO measurement
- [wasm-and-embedded.md](wasm-and-embedded.md); `GOOS=wasip1`/`js`, `//go:wasmexport`

## Sources {#sources}
- go.dev `cmd/go` reference: `go help buildconstraint`, `go help buildmode`, `go help environment`, build flags (`-trimpath`/`-buildvcs`/`-pgo`/`-ldflags`)
- pkg.go.dev/runtime/debug@go1.26.4 (`BuildInfo`/`BuildSetting` defined keys); pkg.go.dev/plugin (drawbacks/limitations); pkg.go.dev/embed
- go.dev/doc/go1.23 (`//go:linkname` linker restriction, `-checklinkname`); go.dev/doc/go1.21 (PGO GA, GODEBUG defaults); go.dev/doc/go1.26 (`go fix`)
- go.dev/ref/mod (`toolchain`/`tool` directives, GODEBUG selection); go.dev/blog/pgo; ko.build; goreleaser.com
