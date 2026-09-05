# File I/O and Streaming

Go's I/O is composable: `io.Reader`/`io.Writer` are the universal interfaces; stack them like Unix pipes. Program against `io/fs` (not `*os.File`) so code is testable; reach for `os.Root` [1.24] on any user-controlled path; and treat *durability* (`Sync` + atomic rename) as a deliberate protocol, not a side effect of `Write`.

> Verified against Go **1.26.x** (stable) + **1.27 RC** notes, 2026-06. Version tags `[1.N]` mark the release a claim applies to. API signatures checked against pkg.go.dev/{os,io,bufio,io/fs} and the go1.16-1.27 release notes.

## TL;DR: the modern deltas (read first)

- `io/ioutil` is deprecated [1.16]: `os.ReadFile`/`os.WriteFile`/`os.MkdirTemp`/`os.CreateTemp`/`io.ReadAll`/`io.Discard` replace it 1:1. No new code should import `ioutil`.
- `os.WriteFile` / `os.Rename` are NOT durable on their own. A successful write can vanish on power loss until you `f.Sync()` *and* fsync the **parent directory** after the rename. The atomic-write recipe below is the only safe pattern.
- `os.Root` [1.24] is the traversal-safe primitive: it rejects `..` *and* symlinks that escape the directory, enforced by the OS (not string checks). Expanded to a near-complete `os` mirror in [1.25] (`Chmod`, `Chown`, `MkdirAll`, `Link`, nested `OpenRoot`, …). Use it for every user-supplied path.
- `io.Copy` already picks the fast path: it calls `src.WriteTo` or `dst.ReadFrom` when available (e.g. `*os.File` → `*os.File` uses `sendfile`/`copy_file_range`). Don't hand-roll a read/write loop "for speed."
- `bufio.Scanner` silently caps tokens at 64 KiB (`MaxScanTokenSize`) and **returns `bufio.ErrTooLong`** on a longer line; easy to miss because you must check `scanner.Err()`. Size `Buffer`, or use `bufio.Reader.ReadString('\n')` for unbounded lines.
- `path` vs `path/filepath` is not interchangeable: `filepath` for OS paths (handles `\` on Windows), `path` for slash-only paths. URLs, `embed.FS`, and **every `fs.FS` name**.
- There is no portable file lock in the stdlib. `flock`/`LockFileEx` are OS-specific and advisory; use `github.com/gofrs/flock` if you need one.

## Table of Contents
1. [File Operations](#file-ops)
2. [io.Reader/Writer Composition](#composition)
3. [Buffered I/O](#buffered-io)
4. [Stream Processing & line scanning](#streaming)
5. [Atomic & durable writes](#durability)
6. [Path Handling](#paths)
7. [Directory-Scoped I/O (os.Root)](#os-root)
8. [fs.FS: Filesystem Abstraction](#fs-fs)
9. [File Watching: fsnotify](#fsnotify)
10. [File Embedding](#embed)
11. [File locking](#locking)
12. [Library landscape & status](#libraries)
13. [Version map 1.16→1.27](#versions)
14. [Anti-Patterns](#anti-patterns)
15. [What models get wrong](#stale)

---

## File Operations {#file-ops}

```go
data, err := os.ReadFile("config.yaml")          // [1.16] whole file → memory (small files only)
err := os.WriteFile("out.txt", data, 0o644)      // [1.16] create/truncate; perm masked by umask

f, err := os.Open("data.csv")                    // O_RDONLY — large files, streaming, seeking
if err != nil { return err }
defer f.Close()

f, err := os.Create("out.json")                  // O_RDWR|O_CREATE|O_TRUNC, perm 0o666 (&^ umask)
f, err := os.OpenFile("app.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644) // explicit flags
```

Permissions & umask. The `perm` argument is the *requested* mode; the OS masks it with the process umask, so `0o666` typically lands as `0o644`. To force an exact mode regardless of umask, `os.Chmod` after creation. Octal literals use the `0o` prefix [1.13], write `0o644`, not `0644` (legacy) or `644` (a bug: decimal 644 = `1204` octal).

Temp files & dirs [1.16] (the pattern names are guaranteed-unique; `*` in the pattern is where randomness goes):

```go
f, err := os.CreateTemp("", "prefix-*.json")  // "" → os.TempDir(); file mode 0o600
if err != nil { return err }
defer os.Remove(f.Name())                      // caller owns cleanup
defer f.Close()

dir, err := os.MkdirTemp("", "workdir-*")      // dir mode 0o700
defer os.RemoveAll(dir)
```

`os.CreateTemp` opens with `O_EXCL`, so it never races onto an existing file; that exclusivity is exactly what makes it the staging half of an atomic write ([Atomic & durable writes](#durability)).

---

## io.Reader/Writer Composition {#composition}

Stack readers/writers; each layer transforms the stream, nothing buffers the whole payload.

```go
// Read: file → decrypt → decompress → parse
file, _ := os.Open("data.gz.enc")
defer file.Close()
gz, err := gzip.NewReader(cipher.StreamReader{S: stream, R: file})
if err != nil { return err }
defer gz.Close()
if err := json.NewDecoder(gz).Decode(&result); err != nil { return err }

// Write: encode → compress → encrypt → file
file, _ := os.Create("data.gz.enc")
defer file.Close()
gw := gzip.NewWriter(cipher.StreamWriter{S: stream, W: file})
if _, err := io.Copy(gw, src); err != nil { return err } // streams; no full-payload buffer
if err := gw.Close(); err != nil { return err }          // Close FLUSHES — check its error
```

**Composition interfaces & adapters:**

| Interface / Adapter | Adds / Purpose |
|---|---|
| `io.Reader` / `io.Writer` | `Read`/`Write([]byte)(int,error)` ; any source/sink |
| `io.ReadCloser` / `io.WriteCloser` | + `Close()` . HTTP bodies, files |
| `io.ReadSeeker` | + `Seek()` ; files, `bytes.Reader` |
| `io.ReaderFrom` / `io.WriterTo` | the **fast-path** hooks `io.Copy` looks for |
| `io.LimitReader(r,n)` | cap reads to N bytes; bound untrusted input (OOM/zip-bomb defense) |
| `io.TeeReader(r,w)` | tap: data read from `r` is mirrored to `w` (e.g. hash while copying) |
| `io.MultiReader` / `io.MultiWriter` | concatenate sources / fan out to sinks |
| `io.Pipe()` | in-process streaming between goroutines (synchronous, no buffer) |
| `io.NopCloser(r)` | give a `Reader` a no-op `Close` |

`io.Copy` and its fast paths: per the docs: *"If src implements `WriterTo`, the copy is implemented by calling `src.WriteTo(dst)`. Otherwise, if dst implements `ReaderFrom`, … `dst.ReadFrom(src)`."* For `*os.File`→`*os.File` this dispatches to kernel `copy_file_range`/`sendfile` ; zero userspace copies.

```go
// RIGHT — let io.Copy choose the optimal path; pass a buffer only to control allocation.
n, err := io.Copy(dst, src)               // 32 KiB internal buffer if no fast path
n, err := io.CopyBuffer(dst, src, buf)    // reuse your own buffer (pool it in hot loops)

// WRONG — a manual loop defeats WriteTo/ReaderFrom (loses sendfile) and is easy to get wrong.
buf := make([]byte, 32*1024)
for { n, err := src.Read(buf); /* ... */ }
```

Critical rules. `defer f.Close()` on every open; but for files you *write*, also check `Close`'s error (a deferred-only `Close` can swallow a final flush failure; see [durability](#durability)). Drain HTTP bodies fully (`io.Copy(io.Discard, resp.Body)`) before `Close` to enable connection reuse. On `Read`, process `n > 0` **before** the error: the final chunk can arrive together with `io.EOF`.

---

## Buffered I/O {#buffered-io}

Unbuffered I/O is one syscall per `Write` ; murder for many small writes. `bufio` batches into a 4 KiB (default) buffer.

```go
bw := bufio.NewWriter(file)        // or NewWriterSize(file, 64<<10) to tune
for _, line := range lines {
    fmt.Fprintln(bw, line)
}
if err := bw.Flush(); err != nil { // MUST flush — buffered tail is lost otherwise
    return err
}

br := bufio.NewReader(file)        // fewer syscalls for many small reads
line, err := br.ReadString('\n')   // unbounded line length (grows as needed)
```

`defer bw.Flush()` hides errors. A deferred `Flush` whose error you ignore can silently drop the last buffer on a full disk. In write paths, `Flush()` explicitly and check the error before you consider the write done (and before `f.Sync()`):

```go
// WRONG — flush error swallowed; truncated file looks like success.
bw := bufio.NewWriter(f); defer bw.Flush()

// RIGHT
bw := bufio.NewWriter(f)
// ... writes ...
if err := bw.Flush(); err != nil { return err }
```

Sizing. 4 KiB default suits line work; 64 KiB-1 MiB cuts syscalls for bulk copies. Past ~1 MiB returns diminish: prefer `io.Copy`'s fast path over a giant buffer.

---

## Stream Processing & line scanning {#streaming}

```go
// Line/token scanning — bufio.Scanner. DEFAULT max token = 64 KiB (bufio.MaxScanTokenSize).
sc := bufio.NewScanner(r)
sc.Buffer(make([]byte, 0, 1<<20), 1<<20)   // raise cap AND max to 1 MiB if lines can be long
for sc.Scan() {
    process(sc.Bytes())                    // Bytes() avoids a copy; Text() allocates a string
}
if err := sc.Err(); err != nil {           // ErrTooLong surfaces HERE, not from Scan()
    return err
}
```

The token-size trap. `Scanner.Scan` returns `false` both at EOF *and* on error. A line longer than the buffer's max stops the scan and stores `bufio.ErrTooLong` ("bufio.Scanner: token too long"), invisible unless you check `sc.Err()`. `Buffer(buf, max)` sets the initial buffer **and** the ceiling; the effective max is `max(max, cap(buf))`. For genuinely unbounded lines (logs, NDJSON with huge records), skip `Scanner` and use `bufio.Reader.ReadString('\n')` / `ReadBytes`, which grow without limit.

```go
// WRONG — long line silently truncates the stream; loop just ends early.
sc := bufio.NewScanner(r)
for sc.Scan() { process(sc.Text()) }       // no Err() check → ErrTooLong swallowed

// RIGHT for unbounded lines — ReadString grows as needed.
br := bufio.NewReader(r)
for {
    line, err := br.ReadString('\n')
    if len(line) > 0 { process(line) }
    if err == io.EOF { break }
    if err != nil { return err }
}
```

Chunked / large-file streaming: fixed buffer, process before checking error:

```go
buf := make([]byte, 32*1024)
for {
    n, err := r.Read(buf)
    if n > 0 { processChunk(buf[:n]) }     // handle data first
    if err == io.EOF { break }
    if err != nil { return err }
}
```

Stream: never `os.ReadFile` ; anything that can be large or attacker-sized; wrap untrusted readers in `io.LimitReader` so a hostile payload can't exhaust memory.

---

## Atomic & durable writes {#durability}

`os.WriteFile` is *not* atomic (a reader can see a half-written file) and *not* durable (the bytes may live only in the page cache). Crash-safe replacement = **write a sibling temp file → `Sync` it → `Rename` over the target → `Sync` the parent directory.**

```go
// AtomicWriteFile replaces path crash-atomically and durably.
func AtomicWriteFile(path string, data []byte, perm os.FileMode) (err error) {
    dir := filepath.Dir(path)
    tmp, err := os.CreateTemp(dir, ".tmp-*")   // SAME directory → rename stays on one filesystem
    if err != nil { return err }
    tmpName := tmp.Name()
    defer func() { if err != nil { _ = os.Remove(tmpName) } }() // clean up on any failure

    if _, err = tmp.Write(data); err != nil { tmp.Close(); return err }
    if err = tmp.Sync(); err != nil { tmp.Close(); return err } // (1) data → stable storage
    if err = tmp.Close(); err != nil { return err }             //     check Close's error too
    if err = os.Chmod(tmpName, perm); err != nil { return err } // CreateTemp made it 0o600
    if err = os.Rename(tmpName, path); err != nil { return err }// (2) atomic swap (same FS)

    d, err := os.Open(dir)                                      // (3) fsync the DIRECTORY
    if err != nil { return err }
    defer d.Close()
    return d.Sync()                                            // makes the rename itself durable
}
```

Why each step: **`tmp.Sync()`**: `os.File.Sync` "commits the current contents of the file to stable storage"; skip it and a crash leaves the renamed file present but truncated/empty. **`os.Rename`** is atomic only *within one filesystem* (`rename(2)`); across mounts it errors `EXDEV` ; hence the temp must share the target's directory, not `os.TempDir()`. **fsync the parent directory** : the rename only updates a directory entry, itself buffered, so without `dir.Sync()` a power loss can lose the *rename* even with the data on disk. **Rename alone is not durable** : the step models almost always miss.

`Sync` is a real disk flush; batch it (write N records, `Sync` once at a checkpoint), and note macOS `F_FULLFSYNC` is slow. `os.CopyFS` [1.23] copies an `fs.FS` tree to disk (symlinks via `io/fs.ReadLinkFS` [1.25]) but does not fsync; wrap critical results above.

---

## Path Handling {#paths}

```go
import "path/filepath"   // OS paths — handles "\" on Windows, volume names, cleaning

p := filepath.Join("data", "users", "export.csv") // OS separator; also Cleans the result
dir, base, ext := filepath.Dir(p), filepath.Base(p), filepath.Ext(p)

abs, err := filepath.Abs("../config.yaml")
real, err := filepath.EvalSymlinks(abs)            // resolve symlinks (use BEFORE trusting a path)

matched, _ := filepath.Match("*.go", "main.go")    // single-element glob → true
matches, _ := filepath.Glob("testdata/*.golden")
```

Walking trees: `filepath.WalkDir` [1.16] reads `fs.DirEntry` (lazy `Info()`), so it's markedly faster than the legacy `filepath.Walk` (eager `os.FileInfo` per entry). Use `WalkDir`; return `filepath.SkipDir` to prune a subtree, `filepath.SkipAll` [1.20] to stop early.

```go
err := filepath.WalkDir("./data", func(path string, d fs.DirEntry, err error) error {
    if err != nil { return err }            // surfaced per-entry (e.g. permission denied)
    if d.IsDir() { return nil }
    return process(path)
})
```

`filepath` vs `path`. `path/filepath` = OS filesystem (separators, `Clean`, volumes). `path` = always-`/` paths: URLs, `embed.FS`, and **all `fs.FS` names**. Using `filepath.Ext`/`Join` on an `fs.FS` name breaks on Windows (backslashes) and on archive/embed contents. Path-traversal defense (sanitizing user input, `filepath.Rel` checks, why string cleaning is insufficient) lives in [security.md](security.md#injection-exec), prefer [`os.Root`](#os-root) over manual validation.

---

## Directory-Scoped I/O (`os.Root`) [Go 1.24+] {#os-root}

`os.Root` confines every operation to a directory. Unlike `filepath.Clean` + prefix checks (which TOCTOU and symlinks defeat), the confinement is enforced by the OS at each syscall, and **symlinks that point outside the root are rejected too**.

```go
root, err := os.OpenRoot("/var/data/uploads")   // [1.24]
if err != nil { return err }
defer root.Close()

f, err := root.Open("user/doc.pdf")              // OK
_, err = root.Open("../../etc/passwd")           // error: path escapes root
_, err = root.Open("link-to-etc/passwd")         // error too, if the link escapes

f, err = root.Create("exports/report.csv")
info, err := root.Stat("user/doc.pdf")
err = root.Remove("tmp/scratch.tmp")

sub, err := root.OpenRoot("user")                // [1.25] nested root, still confined
fsys := root.FS()                                // adapt to fs.FS (implements ReadLinkFS [1.25])
```

The [1.24] set mirrors the common `os` calls (`Open`, `Create`, `Mkdir`, `Stat`, `Lstat`, `Remove`, `OpenFile`, …). [1.25] rounds it out to a near-complete mirror: `Chmod`, `Chown`, `Chtimes`, `Lchown`, `Link`, `MkdirAll`, `RemoveAll`, `ReadFile`, `WriteFile`, `Readlink`, `Symlink`, nested `OpenRoot`, and `Rename`. For a one-shot open without keeping a `*Root`, `os.OpenInRoot(dir, name)` [1.24]. Use `os.Root` for **every** user-controlled path; upload handlers, template/static serving, archive extraction (each entry through `root.Create`).

---

## fs.FS: Filesystem Abstraction [Go 1.16+] {#fs-fs}

`io/fs.FS` is the universal **read-only** filesystem interface. Accept `fs.FS` in library code and the same function works over a real directory, embedded assets, a zip, or an in-memory test FS: no disk, no globals.

```go
import (
    "io/fs"
    "path"   // NOT path/filepath — fs.FS names are ALWAYS forward-slash
)

func CountGoFiles(fsys fs.FS) (int, error) {
    count := 0
    err := fs.WalkDir(fsys, ".", func(p string, d fs.DirEntry, err error) error {
        if err != nil { return err }
        if !d.IsDir() && path.Ext(p) == ".go" { count++ }
        return nil
    })
    return count, err
}
```

```go
count, _ := CountGoFiles(os.DirFS("/path/to/project")) // real directory as fs.FS

//go:embed templates/*
var templates embed.FS
count, _ := CountGoFiles(templates)                     // embedded files — embed.FS IS an fs.FS
```

Testable file access with `fstest.MapFS` [1.16], no temp dirs, deterministic, fast:

```go
import "testing/fstest"

testFS := fstest.MapFS{
    "main.go":     {Data: []byte("package main")},
    "lib/util.go": {Data: []byte("package lib")},
    "readme.txt":  {Data: []byte("hello")},
}
got, _ := CountGoFiles(testFS)   // 2
// fstest.TestFS(testFS, "main.go") additionally checks your FS impl obeys the fs.FS contract.
```

**Key interfaces & helpers in `io/fs`:**

| Interface | Method | Use |
|---|---|---|
| `fs.FS` | `Open(name)(File,error)` | base; open any file |
| `fs.ReadFileFS` | `ReadFile(name)([]byte,error)` | one-call read (impl may optimize) |
| `fs.ReadDirFS` | `ReadDir(name)([]DirEntry,error)` | list a directory |
| `fs.StatFS` | `Stat(name)(FileInfo,error)` | metadata |
| `fs.SubFS` | `Sub(dir)(FS,error)` | scoped subtree |
| `fs.ReadLinkFS` [1.25] | `ReadLink`/`Lstat` | symlink-aware filesystems |

Free functions `fs.WalkDir`, `fs.Glob`, `fs.ReadFile`, `fs.ReadDir`, `fs.Stat`, `fs.Sub` work on **any** `fs.FS`. `fs.FS` is read-only by design; there is no `fs.WriteFS`; for writes use `*os.File`/`os.Root`. `fs.WalkDir` uses slash paths; reach for `path`, never `path/filepath`.

```go
// WRONG — OS separators corrupt fs.FS names on Windows / inside archives.
if filepath.Ext(name) == ".go" { /* ... */ }
// RIGHT
if path.Ext(name) == ".go" { /* ... */ }
```

---

## File Watching: fsnotify {#fsnotify}

No stdlib file watcher; `github.com/fsnotify/fsnotify` is the de-facto choice (kqueue/inotify/ReadDirectoryChangesW under one API).

```go
import "github.com/fsnotify/fsnotify"

w, err := fsnotify.NewWatcher()
if err != nil { return err }
defer w.Close()
if err := w.Add("/etc/myapp"); err != nil { return err } // non-recursive

for {
    select {
    case ev, ok := <-w.Events:
        if !ok { return nil }
        if ev.Has(fsnotify.Write) || ev.Has(fsnotify.Create) || ev.Has(fsnotify.Rename) {
            reloadConfig(ev.Name)   // editors rename+create instead of writing in place
        }
    case err, ok := <-w.Errors:
        if !ok { return nil }
        slog.Warn("watcher error", slog.Any("err", err))
    }
}
```

Rules. It does **not** recurse: `filepath.WalkDir` the tree on startup and `Add` each directory (and add newly-created dirs as you see them). Atomic-save editors (and the [atomic write recipe](#durability) above) fire `Rename`/`Create`, not `Write` ; watch all three for config reload. **Debounce** bursty events (a single save can emit several) with a short `time.AfterFunc` (~100 ms) before acting.

---

## File Embedding {#embed}

`//go:embed` [1.16] compiles files into the binary as a string, `[]byte`, or `embed.FS` (which is an `fs.FS`, so everything in [fs.FS](#fs-fs) applies).

```go
import "embed"

//go:embed templates/*.html static/*
var assets embed.FS                       // directory tree → fs.FS (slash paths only)

//go:embed VERSION
var version string                        // single file → string ([]byte also works)

tmpl := template.Must(template.ParseFS(assets, "templates/*.html"))
http.Handle("/static/", http.FileServerFS(assets))  // [1.22] serve embedded files directly
```

Gotchas: the directive comment must sit **immediately above** the var (no blank line) and the var must be package-level; patterns are slash-separated and rooted at the source file's package dir; `embed` ignores files starting with `.` or `_` unless you prefix the pattern with `all:`. Full build-side detail in [platform-and-build.md](platform-and-build.md#embed).

---

## File locking {#locking}

The stdlib has no portable file lock. `syscall.Flock` (Unix, advisory) and `LockFileEx` (Windows) are OS-specific, and advisory locks are ignored by processes that don't also lock. For cross-platform advisory locking use `github.com/gofrs/flock`:

```go
import "github.com/gofrs/flock"

fl := flock.New("/var/run/myapp.lock")
locked, err := fl.TryLock()              // non-blocking; or fl.Lock() to wait
if err != nil { return err }
if !locked { return errors.New("another instance holds the lock") }
defer fl.Unlock()
```

Caveats that bite: advisory locks don't stop a non-cooperating writer; locks are **per-file-descriptor** on some platforms (closing *any* fd to the file can drop the lock); they don't work reliably over NFS. For real mutual exclusion across machines prefer a coordinator (DB row lock, Redis, etcd) over a filesystem lock.

---

## Library landscape & status {#libraries}

| Need | Use | Status [2026] |
|---|---|---|
| Read/write/temp files, paths, walk | stdlib `os`/`io`/`bufio`/`io/fs`/`path/filepath` | **Default** |
| Old `ioutil` helpers | `os.*` / `io.*` equivalents | `io/ioutil` **deprecated [1.16]** |
| Traversal-safe rooted I/O | stdlib `os.Root` [1.24] | **Default** : prefer over manual checks |
| Testable filesystem | stdlib `testing/fstest` (`MapFS`, `TestFS`) | **Default** |
| Embed assets | stdlib `embed` [1.16] | **Default** |
| File watching | `github.com/fsnotify/fsnotify` | Active, de-facto standard |
| Advisory file lock | `github.com/gofrs/flock` | Active (no stdlib equivalent) |
| In-memory / abstracted FS (read+write) | `github.com/spf13/afero` | Active; when you need a writable abstraction `fs.FS` can't give |

---

## Version map 1.16→1.27 {#versions}

| Ver | File/IO-relevant |
|---|---|
| **1.16** | `io/fs` (`fs.FS`, `WalkDir`, `Glob`); `embed`; `os.ReadFile`/`WriteFile`/`CreateTemp`/`MkdirTemp`; `io.ReadAll`/`io.Discard`; `io/ioutil` **deprecated** |
| **1.17** |; (no major file/IO additions) |
| **1.20** | `filepath.SkipAll` / `fs.SkipAll`; multierror-friendly `errors.Join` for batch I/O failures |
| **1.21** | `log/slog` (structured logging for I/O errors) |
| **1.22** | `http.FileServerFS` / `http.ServeFileFS` (serve `fs.FS` / `embed.FS`); range-over-int |
| **1.23** | `os.CopyFS` (copy an `fs.FS` to disk); timer-leak rules change (relevant to debounced watchers) |
| **1.24** | **`os.Root`** / `os.OpenRoot` / `os.OpenInRoot` ; traversal- & symlink-safe rooted I/O |
| **1.25** | `os.Root` expanded (`Chmod`,`Chown`,`Chtimes`,`Lchown`,`Link`,`MkdirAll`,`RemoveAll`,`ReadFile`,`WriteFile`,`Symlink`,`Readlink`, nested `OpenRoot`); `io/fs.ReadLinkFS`; `os.DirFS`/`Root.FS` implement it |
| **1.26** | I/O surface stable; broader stdlib changes (see errors-and-resilience.md) |
| **1.27 (RC)** | `encoding/json/v2` GA (affects streaming JSON decoders over readers). Treat as draft until GA (~Aug 2026) `[verify]`. |

---

## Anti-Patterns {#anti-patterns}

| Anti-Pattern | Problem | Fix |
|---|---|---|
| `os.ReadFile` on large/untrusted input | loads all into memory. OOM / zip-bomb | stream via `os.Open` + `Scanner`/`io.Copy`; wrap in `io.LimitReader` |
| `os.WriteFile` for important data | not atomic, not durable; torn/empty file on crash | [atomic write recipe](#durability): temp → `Sync` → `Rename` → dir `Sync` |
| `os.Rename` and assuming durable | dir entry is buffered; rename can be lost on power loss | fsync the **parent directory** after rename |
| Temp file in `os.TempDir()` then rename to data dir | cross-filesystem `Rename` → `EXDEV` | `os.CreateTemp(dir, …)` in the **target** directory |
| `defer bw.Flush()` / `defer f.Close()` on writes, error ignored | final flush failure swallowed → silent truncation | `Flush()`/`Close()` explicitly and **check the error** before `Sync` |
| `bufio.Scanner` without `Err()` check | long line → `ErrTooLong`, scan ends early, data lost | check `sc.Err()`; size `Buffer`; or `ReadString('\n')` for unbounded |
| Manual read/write loop "for speed" | defeats `WriteTo`/`ReaderFrom` (no `sendfile`) | `io.Copy` / `io.CopyBuffer` |
| `path` vs `path/filepath` mixed up | wrong separator on Windows; breaks on `embed`/archives | `path/filepath` for OS; `path` for URLs, `embed.FS`, all `fs.FS` names |
| Checking `err` before `n > 0` on `Read` | drops the last chunk (EOF can arrive with data) | handle `n > 0` first, then the error |
| User-controlled path without `os.Root` | path traversal: `../../etc/passwd`, escaping symlinks | `os.OpenRoot`/`os.OpenInRoot` [1.24]; see [security.md](security.md#injection-exec) |
| `defer f.Close()` inside a loop | fd exhaustion (defers fire at function return) | extract the body to a function so `Close` runs per iteration |
| `io/ioutil.ReadFile`/`ReadAll` | deprecated since [1.16] | `os.ReadFile` / `io.ReadAll` |
| Library takes `*os.File` not `fs.FS` | untestable; forces real disk | accept `fs.FS`; callers pass `os.DirFS`/`embed.FS`/`fstest.MapFS` |
| `filepath.Ext`/`Join` on `fs.FS` names | OS separators corrupt slash paths | `path.Ext`/`path.Join` |
| Watching only `Write` (fsnotify) | atomic-save editors rename+create | handle `Write`+`Create`+`Rename`; debounce |
| Hand-rolled `flock` for cross-machine locking | advisory, per-fd, broken on NFS | DB/Redis/etcd lock; `gofrs/flock` only for local advisory |

---

## What models get wrong {#stale}

1. Treating `os.WriteFile`/`os.Rename` as durable; they are not without `f.Sync()` **and an fsync of the parent directory**.
2. Putting the temp file in `os.TempDir()` then renaming into the data dir → cross-FS `EXDEV`. Temp must be in the **target directory**.
3. Forgetting to fsync the **directory** after `Rename` (the single most-missed durability step).
4. `defer bw.Flush()` / `defer f.Close()` on a write path with the error ignored; masks a truncated write as success.
5. Using `bufio.Scanner` for long lines and not checking `sc.Err()` ; silent `ErrTooLong` at the 64 KiB default; data lost.
6. Importing `io/ioutil` ; deprecated since [1.16]; use `os.*`/`io.*`.
7. Hand-rolling a read/write loop instead of `io.Copy` ; loses the `WriteTo`/`ReaderFrom`/`sendfile` fast path.
8. `path` vs `path/filepath` confusion; using `filepath` on `fs.FS`/`embed.FS` names breaks on Windows and in archives.
9. Checking the error before `n > 0` on `Read` ; drops a final chunk delivered with `io.EOF`.
10. Validating user paths with `filepath.Clean` + prefix checks (TOCTOU- and symlink-vulnerable) instead of `os.Root` [1.24].
11. Assuming `os.Root` is 1.24-complete: `Chmod`/`MkdirAll`/`Link`/nested `OpenRoot` etc. arrived in [1.25].
12. `defer f.Close()` in a loop → fd leak; extract a per-iteration function.
13. Accepting `*os.File` in library APIs instead of `fs.FS` ; untestable; can't pass `fstest.MapFS`/`embed.FS`.
14. Expecting a stdlib portable file lock; there isn't one; advisory locks are OS-specific and per-fd.
15. `0644` (legacy octal) or `644` (decimal!) for permissions instead of `0o644` [1.13]; and forgetting umask masks the requested mode.

---

## See Also {#see-also}

- [security.md](security.md#injection-exec), path traversal & command injection, why `os.Root` beats string sanitizing
- [encoding-and-serialization.md](encoding-and-serialization.md), JSON/CSV streaming decoders over `io.Reader`
- [platform-and-build.md](platform-and-build.md#embed), `//go:embed` build mechanics, directory trees
- [performance.md](performance.md#allocation-reduction), buffer reuse, `sync.Pool` for I/O, `CopyBuffer`
- [errors-and-resilience.md](errors-and-resilience.md), handling/wrapping I/O errors, `errors.Join` for batch failures
- [advanced-patterns.md](advanced-patterns.md#file-io), `io.Reader`/`Writer` composition pipelines

---

## Sources {#sources}

- pkg.go.dev/{[os](https://pkg.go.dev/os), [io](https://pkg.go.dev/io), [bufio](https://pkg.go.dev/bufio), [io/fs](https://pkg.go.dev/io/fs), [embed](https://pkg.go.dev/embed), [testing/fstest](https://pkg.go.dev/testing/fstest), [path/filepath](https://pkg.go.dev/path/filepath)}
- go.dev/doc/go1.16 (`io/fs`, `embed`, `os.ReadFile`/`WriteFile`, `ioutil` deprecation); go1.23 (`os.CopyFS`); go1.24 (`os.Root`); go1.25 (`os.Root` method expansion, `io/fs.ReadLinkFS`)
- `os.File.Sync`, `io.Copy` (WriteTo/ReaderFrom fast path), `bufio.MaxScanTokenSize`/`ErrTooLong` ; package docs, verified 2026-06
- `github.com/fsnotify/fsnotify`, `github.com/gofrs/flock`, `github.com/spf13/afero` repos
- LWN/POSIX `rename(2)` + `fsync(2)` durability semantics (directory fsync requirement)
