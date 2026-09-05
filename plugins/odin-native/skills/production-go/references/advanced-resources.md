# Advanced Resources: Authoritative Pointers & Staying Current

A curated map of the **primary sources** for Go: the spec, the memory model, the Google style guide, the blog, release notes, the proposal process, and `pkg.go.dev`: plus the landmark talks/articles that still hold up and how an AI agent should keep its Go knowledge fresh. This is a **pointer file**: light on code, heavy on annotated links. When a topic has a dedicated reference in this skill, this file points there rather than duplicating it.

> Source horizon: verified against Go **1.26** (stable) + **1.27 RC** notes, 2026-06, before general availability. Go 1.27 has since gone GA (2026-08-19, current pin in SKILL.md). Every URL below was checked against the live source or is a stable canonical `go.dev`/`pkg.go.dev` path. Items marked `[verify]` could not be fully confirmed at write time: check before citing.

## TL;DR: how to not cite stale Go (read first)

- Default to the canonical five. The [spec](https://go.dev/ref/spec), the [memory model](https://go.dev/ref/mem), [Effective Go](https://go.dev/doc/effective_go), the [Google Go Style Guide](https://google.github.io/styleguide/go/), and [`pkg.go.dev`](https://pkg.go.dev). These supersede *any* blog post or tutorial when they disagree.
- Anything pre-modules is suspect. Go modules became the default in **1.16** (Aug 2021). Tutorials that use `GOPATH`, `dep`, `glide`, `$GOPATH/src` layouts, or `go get` for installing tools (now `go install pkg@version` / `go get -tool` [1.24]) are stale on their toolchain even if the language advice survives.
- Pin every claim to a version. "Go does X" is meaningless without a release. Use the [release notes](https://go.dev/doc/devel/release) as the source of truth for *when* a feature landed; see [modern-go.md](modern-go.md) for the per-version delta map this skill maintains.
- A talk's age is not its expiry. Pike's 2012 concurrency talk and Cheney's error taxonomy are still canonical; a 2019 "how to structure a Go project" post probably isn't. Judge by whether the *toolchain* it assumes is current.
- Date-stamp date-sensitive facts. "Latest Go" and "newest GC" rot fast. State the version you mean.

## Table of Contents
1. [The canonical primary sources](#canonical)
2. [Standard library & package discovery](#pkg-discovery)
3. [The Go blog & release notes](#blog-releases)
4. [The proposal & design process](#proposals)
5. [Style & code-review references](#style)
6. [Landmark talks & articles that still hold up](#landmarks)
7. [Compiler / runtime internals (deep dives)](#3-assembly-ssa-and-compiler-optimization)
8. [High-quality libraries by domain](#libraries)
9. [Books about Go](#books)
10. [How an AI agent keeps Go knowledge current](#staying-current)
11. [What models get wrong](#stale)

---

## The canonical primary sources {#canonical}

These are the documents that *define* Go. When a third-party source conflicts with one of these, the third-party source is wrong.

| Source | URL | Why it matters |
|---|---|---|
| **The Go Programming Language Specification** | https://go.dev/ref/spec | The single source of truth for syntax and semantics: settles every "is this legal Go?" question. |
| **The Go Memory Model** | https://go.dev/ref/mem | Defines happens-before; the only authority on what concurrent reads may observe. Current version dated **June 6, 2022** (covers `sync/atomic`'s sequential consistency). |
| **Effective Go** | https://go.dev/doc/effective_go | The foundational idiom guide; the Google style guide assumes you've read it. Predates generics/modules, so pair it with newer sources for those. |
| **Go 1 Compatibility Promise** | https://go.dev/doc/go1compat | Why upgrading rarely breaks you, and the contract behind `GODEBUG`-gated changes. |
| **GODEBUG history** | https://go.dev/doc/godebug | How behavior changes are made opt-out-able: essential for understanding "why did upgrade change X." |
| **Go FAQ** | https://go.dev/doc/faq | Authoritative answers to the recurring "why does Go do it this way" design questions. |

---

## Standard library & package discovery {#pkg-discovery}

| Source | URL | Why it matters |
|---|---|---|
| **pkg.go.dev** | https://pkg.go.dev | The official package index, docs, and version browser: *the* place to check an API, its version, and its license before depending on it. |
| **Standard library index** | https://pkg.go.dev/std | The full stdlib surface; check here before reaching for a dependency (the stdlib answers more than newcomers expect). |
| **Go Modules Reference** | https://go.dev/ref/mod | Complete, authoritative modules spec: MVS, `GOPROXY`/`GOSUMDB`, `replace`/`exclude`, pseudo-versions. |
| **Managing dependencies** | https://go.dev/doc/modules/managing-dependencies | Task-oriented `go get`/`go mod tidy`/`replace`/tool-directive [1.24] guide; see [modules-and-dependencies.md](modules-and-dependencies.md) for this skill's deeper treatment. |
| **Command `go` reference** | https://go.dev/cmd/go/ | Every subcommand and env var (`GOFLAGS`, `GOPROXY`, `GOPRIVATE`): the definitive `go` CLI doc. |

`go doc <pkg>` and `go doc <pkg>.<Symbol>` give you the same docs offline; prefer them in an agent loop over fetching a web page.

---

## The Go blog & release notes {#blog-releases}

The core team announces and explains features on the blog; the release notes are the canonical changelog.

| Source | URL | Why it matters |
|---|---|---|
| **Release notes hub** | https://go.dev/doc/devel/release | Links to every `go1.N` release note: the authoritative "what changed and when." Start every "is X available?" check here. |
| **The Go Blog (all posts)** | https://go.dev/blog/all | Core-team posts; the place feature deep-dives and rationale appear first. |
| **go1.26 release notes** | https://go.dev/blog/go1.26 | 1.26 (Feb 2026; current stable is 1.27, Aug 2026): Green Tea GC default, reduced cgo overhead, `simd` work, `errors.AsType`. `[verify]` exact feature list at GA. |
| **2025 Go Developer Survey** | https://go.dev/blog/survey2025 | Real-world usage/sentiment data: useful for "what do Go teams actually do." |
| **Go release policy** | https://go.dev/doc/devel/release#policy | Two stable releases supported at a time; security backports: frames how aggressively to adopt new versions. |

Per release, read in this order: the go1.N release notes → any linked blog deep-dives → the relevant pkg.go.dev pages for changed packages. This skill folds the deltas into [modern-go.md](modern-go.md).

---

## The proposal & design process {#proposals}

Every notable change to the language, stdlib, or `go` command goes through a public, design-driven process. Reading it tells you *why* Go is the way it is, and what's coming.

| Source | URL | Why it matters |
|---|---|---|
| **golang/proposal repo** | https://github.com/golang/proposal | Design docs (`design/NNNN-*.md`) and the process README: the authoritative record of accepted designs. |
| **Proposal process (README)** | https://go.dev/s/proposal | How a change goes Incoming → Active → Likely Accept/Decline → Accepted/Declined; what needs a design doc. |
| **Proposal review minutes** | https://go.dev/s/proposal-minutes | Weekly meeting notes: the live pulse of what's under consideration. |
| **Issue tracker** | https://github.com/golang/go/issues | Where proposals live as issues (the `Proposal` / `Proposal-Accepted` labels). Cite the issue number for any "this was decided" claim. |
| **Go 2 / language-change process** | https://go.dev/blog/go2-here-we-come | The bar for language changes (important problem, minimal impact, clear solution). |

To cite a feature's provenance, link the **accepted issue number** (e.g. `errors.AsType` was #51945): it's stable and verifiable, unlike a blog summary.

---

## Style & code-review references {#style}

| Source | URL | Why it matters |
|---|---|---|
| **Google Go Style Guide** | https://google.github.io/styleguide/go/ | The most complete modern style reference: [Guide](https://google.github.io/styleguide/go/guide) (canonical), [Decisions](https://google.github.io/styleguide/go/decisions), [Best Practices](https://google.github.io/styleguide/go/best-practices). |
| **Go Code Review Comments** | https://go.dev/wiki/CodeReviewComments | The classic checklist of recurring review nits (error strings, receiver names, `context` first, etc.). A supplement to Effective Go. |
| **Go Test Comments** | https://go.dev/wiki/TestComments | The testing-specific companion to the above. |
| **Go Proverbs** | https://go-proverbs.github.io/ | Pike's pithy design maxims (Gopherfest SV 2015): "Clear is better than clever," "A little copying is better than a little dependency." |

This skill's own synthesis of these lives in [style-synthesis.md](style-synthesis.md).

---

## Landmark talks & articles that still hold up {#landmarks}

Old but **not** stale: these shaped how Go is written and remain accurate.

| Resource | URL | Why it matters |
|---|---|---|
| **Rob Pike. Go Concurrency Patterns** (Google I/O 2012) | https://go.dev/talks/2012/concurrency.slide | The origin of the generator/fan-in/`select`-timeout/replicated-`First` idioms. Video: youtube.com/watch?v=f6kdp27TYZs |
| **Sameer Ajmani. Advanced Go Concurrency Patterns** (2013) | https://go.dev/blog/advanced-go-concurrency-patterns | The sequel: cancellation, leak-free pipelines, `context`-shaped patterns. |
| **Pipelines and cancellation** | https://go.dev/blog/pipelines | Canonical guide to fan-out/fan-in with clean goroutine shutdown. |
| **Rob Pike. Go Proverbs** (Gopherfest 2015) | https://www.youtube.com/watch?v=PAAkCSZUG1c | The talk behind go-proverbs; the "why" of Go's taste. |
| **Dave Cheney. Don't just check errors, handle them gracefully** | https://dave.cheney.net/2016/04/27/dont-just-check-errors-handle-them-gracefully | The sentinel/typed/opaque taxonomy and "handle each error once": still the basis of [errors-and-resilience.md](errors-and-resilience.md). |
| **Russ Cox. Go Data Structures** | https://research.swtch.com/godata | How slices/strings/structs are laid out in memory: builds the right cost intuition. |
| **Russ Cox: research!rsc** | https://research.swtch.com/ | Deep posts on the GC, modules/MVS, and Go internals straight from a Go architect. |
| **Dave Cheney. Practical Go** | https://dave.cheney.net/practical-go/presentations/qcon-china.html | A long-form production-Go style/structure guide; mostly still current. |

When you cite a talk, prefer the `go.dev/talks/...` slide URL or a verifiable YouTube ID: do **not** invent a title or conference year you can't confirm.

---

## Compiler / runtime internals (deep dives) {#3-assembly-ssa-and-compiler-optimization}

For the GMP scheduler, GC, escape analysis, SSA, `unsafe`, and the assembler. **Internals shift between releases**: anchor any specific claim to a version and cross-check against [internals.md](internals.md) and [performance.md](performance.md).

| Resource | URL | Why it matters |
|---|---|---|
| **runtime/HACKING** | https://go.dev/src/runtime/HACKING.md | The authoritative G/M/P, scheduler, and allocator conventions: written by the runtime team. |
| **A Quick Guide to Go's Assembler** | https://go.dev/doc/asm | Official Plan 9 assembly reference: pseudo-registers, calling convention, directives. |
| **`unsafe` package** | https://pkg.go.dev/unsafe | The only authority on legal `unsafe.Pointer` conversions and `Add`/`Slice`/`String`. |
| **The Laws of Reflection** | https://go.dev/blog/laws-of-reflection | Official mental model for `reflect` Type/Value/Kind. |
| **Go GC guide** | https://go.dev/doc/gc-guide | Official, interactive guide to the garbage collector and `GOGC`/`GOMEMLIMIT` tuning. |
| **Eli Bendersky. Go internals articles** | https://eli.thegreenplace.net/tag/go | Careful, source-grounded walkthroughs of the compiler pipeline and AST tooling. |

For runtime *diagnostics* (pprof, trace, the flight recorder), see [debugging-and-diagnostics.md](debugging-and-diagnostics.md).

---

## High-quality libraries by domain {#libraries}

This skill tracks library status per domain; consult the dedicated file rather than trusting a stale "awesome list." General rule: **prefer the stdlib and `golang.org/x/*`**, then well-maintained domain leaders.

| Domain | Where this skill tracks it |
|---|---|
| Errors / resilience (retry, circuit breaker) | [errors-and-resilience.md](errors-and-resilience.md#libraries) |
| Concurrency (`errgroup`, `singleflight`, pools) | [concurrency.md](concurrency.md) |
| HTTP / APIs / gRPC | [http-and-apis.md](http-and-apis.md) |
| Databases / SQL / ORMs | [database.md](database.md) |
| Observability (OpenTelemetry, slog) | [observability.md](observability.md) |
| CLI & config | [cli-and-config.md](cli-and-config.md) |
| Distributed systems / consensus | [distributed-systems.md](distributed-systems.md) |
| Web frameworks & tooling | [ecosystem-and-tooling.md](ecosystem-and-tooling.md) |
| AI/LLM & agents | [mcp-and-agents.md](mcp-and-agents.md), [advanced-patterns.md](advanced-patterns.md#ai-llm) |
| AI/ML beyond LLMs (Gonum, vector DBs) | [ai-ml-beyond-llm.md](ai-ml-beyond-llm.md) |

Authoritative discovery beats curation: search [pkg.go.dev](https://pkg.go.dev), then check the repo's commit recency, open-issue triage, and whether it's `archived` before depending. **Never forbid a library outright**: judge it on maintenance and fit.

---

## Books about Go {#books}

Books date faster than the language's core ideas: prefer current editions and cross-check toolchain advice against the release notes. The two below are the safest picks; for a broader curated list see [Bitfield: Best Go Books](https://bitfieldconsulting.com/posts/best-go-books) and the [GoBooks list](https://github.com/dariubs/GoBooks).

| Book | Author(s) | Why it matters |
|---|---|---|
| **The Go Programming Language** | Donovan & Kernighan | The classic comprehensive reference; pre-generics/modules, so pair with newer sources for those. |
| **Learning Go, 2nd ed.** | Jon Bodner | The best current idiomatic-Go book: covers generics, modules, and design decisions. |
| **Let's Go / Let's Go Further** | Alex Edwards | The standard for building production web apps/JSON APIs with the stdlib. `[verify]` latest edition's Go version. |
| **Concurrency in Go** | Katherine Cox-Buday | Still the most thorough single treatment of channels/`sync`/patterns (2017; primitives unchanged). |

---

## How an AI agent keeps Go knowledge current {#staying-current}

A practical loop for staying accurate instead of confidently stale:

1. Anchor to versions, not vibes. Before asserting a feature exists, confirm the release in the [release notes](https://go.dev/doc/devel/release). State the version in the answer.
2. Verify APIs at the source. Use `go doc` locally or [`pkg.go.dev`](https://pkg.go.dev) for exact signatures: don't reconstruct an API from memory; signatures change (`math/rand/v2`, `errors.AsType`, `slices`/`maps`).
3. Trust the canonical five over blogs. Spec, memory model, Effective Go, Google style guide, `pkg.go.dev`. A blog that contradicts them is wrong or outdated.
4. Treat the toolchain as the staleness tell. `GOPATH`, `dep`, `$GOPATH/src`, `ioutil`, `interface{}` where `any`/generics fit → the source predates current Go.
5. Compile and vet before claiming correctness. `go build`, `go vet`, `go test -race`, `staticcheck` catch hallucinated APIs and stale idioms faster than re-reading docs.
6. Prefer accepted-issue numbers as citations. They're permanent and checkable; talk titles and "I recall a post" are not.
7. Lean on this skill's own references first ([modern-go.md](modern-go.md), [internals.md](internals.md), domain files): they're already version-aligned to the baseline above.

---

## What models get wrong {#stale}

1. Citing pre-modules tutorials: `GOPATH`/`dep`/`glide` workflows, `go get` to install tools (now `go install pkg@version` or `go get -tool` [1.24]). Modules are default since 1.16.
2. Hallucinating talk titles, conference years, or book editions. If you can't confirm it against a `go.dev/talks` slide, a YouTube ID, or a publisher page, omit it.
3. Inventing URLs. Reconstructing a plausible `go.dev/blog/...` slug instead of using a verified path. Link the canonical doc or nothing.
4. Stating "latest Go" / "newest GC" without a date. These rot; pin to the version (e.g. 1.26 = Green Tea GC default).
5. Trusting an "awesome-go" snapshot over current repo health: recommending archived/abandoned libraries. Check commit recency and `archived` status.
6. Quoting Effective Go as if it covers generics/modules: it predates both; supplement with the style guide and release notes.
7. Treating the memory model as folklore: it's a precise spec (dated 2022); don't paraphrase happens-before from memory.
8. Citing a feature without its provenance: prefer the accepted proposal issue number over a secondhand summary.
9. Confusing `go.dev` with the dead `golang.org` redirects, or `pkg.go.dev` with the retired `godoc.org`: use the current canonical hosts.
10. Recommending `pkg/errors`, `ioutil`, `math/rand` (v1) for new code: stdlib `errors` wrapping [1.13], `io`/`os` [1.16], and `math/rand/v2` [1.22] supersede them.

---

## See Also {#see-also}
- [modern-go.md](modern-go.md): the per-version feature delta map this skill maintains
- [internals.md](internals.md): runtime/compiler internals in depth
- [style-synthesis.md](style-synthesis.md): this skill's distilled style rules
- [modules-and-dependencies.md](modules-and-dependencies.md): modules, MVS, vendoring, workspaces
- [ecosystem-and-tooling.md](ecosystem-and-tooling.md): linters, frameworks, library landscape

## Sources {#sources}
- Canonical: go.dev/ref/spec; go.dev/ref/mem (dated 2022-06-06); go.dev/doc/effective_go; go.dev/doc/go1compat; go.dev/doc/godebug; go.dev/doc/faq
- Discovery: pkg.go.dev, pkg.go.dev/std, go.dev/ref/mod, go.dev/doc/modules/managing-dependencies, go.dev/cmd/go
- Releases/blog: go.dev/doc/devel/release; go.dev/blog/all; go.dev/blog/go1.26; go.dev/blog/survey2025
- Process: github.com/golang/proposal; go.dev/s/proposal; go.dev/s/proposal-minutes; github.com/golang/go/issues; go.dev/blog/go2-here-we-come
- Style: google.github.io/styleguide/go/{guide,decisions,best-practices}; go.dev/wiki/CodeReviewComments; go.dev/wiki/TestComments; go-proverbs.github.io
- Landmarks: go.dev/talks/2012/concurrency.slide (YouTube f6kdp27TYZs); go.dev/blog/advanced-go-concurrency-patterns; go.dev/blog/pipelines; dave.cheney.net/2016/04/27; research.swtch.com/godata; dave.cheney.net/practical-go
- Internals: go.dev/src/runtime/HACKING.md; go.dev/doc/asm; pkg.go.dev/unsafe; go.dev/blog/laws-of-reflection; go.dev/doc/gc-guide; eli.thegreenplace.net/tag/go
