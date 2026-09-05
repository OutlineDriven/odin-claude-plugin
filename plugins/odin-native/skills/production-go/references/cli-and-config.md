# CLI Design and Configuration

A CLI's contract is its surface: flags, env, files, exit codes, stdout/stderr split, signal behavior. Get the **precedence** (defaults < file < env < flags), the **process boundary** (one signal owner, one exit-code mapping, defers that actually run), and **testability** (inject args + IO, never reach for globals) right. The framework choice is secondary.

> Verified against Go **1.26.4** (stable) + **1.27 RC** notes, 2026-06. Library versions verified on pkg.go.dev. Version tags `[1.N]` mark the Go release a claim applies to. Deepened from multi-source research.

## TL;DR: the modern deltas (read first)

- `os.Exit` / `log.Fatal*` skip every `defer`: the #1 CLI bug. Wrap logic in `func run(...) error`, call `os.Exit` **once** in `main`. The Go-2 "`main() int`" proposal (#24869) was declined, so this idiom is permanent.
- `signal.NotifyContext` [1.16] is the signal idiom; the raw `signal.Notify(make(chan,1), …)` channel is only for the **second** Ctrl-C (force-quit) and SIGHUP reload. The channel **must be buffered**: the runtime does a non-blocking send and silently drops to an unbuffered channel.
- `srv.Shutdown` needs a *fresh* context: passing the already-cancelled signal context shuts down with a dead deadline. Derive `context.WithTimeout(context.Background(), …)`.
- Viper has no v2 (latest **v1.21.0**, Sep 2025; the README "v2" link is a Google feedback form). It **lowercases all keys** and is **not concurrency-safe**. **koanf v2** is the expert default for new code: tiny core, modular providers, case-sensitive keys, precedence = call order with no hidden rules.
- stdlib `flag` does GNU-style nothing: no `--long=val` clustering, no `-abc`, no subcommands except via manual `flag.FlagSet` dispatch. The moment you want POSIX, reach for `pflag`/cobra/kong.
- `os.UserConfigDir` [1.13] already implements XDG (`$XDG_CONFIG_HOME` else `$HOME/.config`; `~/Library/Application Support` on macOS; `%AppData%` on Windows), so don't hand-roll `$HOME` joins.
- cobra ≥ v1.10.1 required to dodge the `pflag` `ParseErrorsWhitelist→ParseErrorsAllowlist` build break; cobra completion funcs return **`[]cobra.Completion`** (a `string` alias) via `CompletionFunc`, not bare `[]string`.

## Table of Contents
1. [Picking a framework: flag vs pflag vs cobra vs kong vs urfave/cli](#frameworks)
2. [stdlib flag & FlagSet subcommands](#flag-stdlib)
3. [Cobra](#cobra)
4. [Kong](#kong)
5. [Configuration precedence done right](#configuration)
6. [koanf vs viper](#koanf-viper)
7. [Env-only config (caarlos0/env, go-envconfig)](#env-config)
8. [Validation & secrets](#validation-secrets)
9. [XDG base dirs & config location](#xdg)
10. [Signals & graceful shutdown](#shutdown)
11. [Exit codes](#exit-codes)
12. [Shell completion](#completion)
13. [Testable CLI design](#testable)
14. [Process execution](#process-exec)
15. [Terminal output, color & TUI](#cli-output)
16. [Library landscape & status](#libraries)
17. [Version map](#versions)
18. [What models get wrong](#anti-patterns)

---

## Picking a framework: flag vs pflag vs cobra vs kong vs urfave/cli {#frameworks}

| Tool | Style | Subcommands | Completion | Pick when |
|---|---|---|---|---|
| stdlib `flag` | imperative | manual `FlagSet` dispatch | none | one binary, few flags, zero deps; Go-style `-flag` only |
| `spf13/pflag` | imperative | (with cobra) | (with cobra) | you want POSIX `--long`/`-l` but not the cobra tree |
| `spf13/cobra` | imperative builder | first-class tree | rich (bash/zsh/fish/pwsh) | git/kubectl-shaped tree, man pages, huge ecosystem |
| `alecthomas/kong` | declarative struct tags | typed `Run()` methods + DI | basic | typed app schema, DI into commands, minimal plumbing |
| `urfave/cli/v3` | declarative slices | nested `Commands` | built-in | medium CLI, context-first `Action`, lighter than cobra |

**Decision rule:** the framework mirrors your CLI's *shape*. Tree of commands with shell UX + generated docs → **cobra**. A typed application schema you'd rather declare than wire → **kong**. A handful of flags in one binary → **stdlib flag**. Don't import cobra for a 3-flag tool; don't hand-roll `FlagSet` dispatch for a 20-command tree. The tie-breaker in teams is contributor ergonomics: cobra for large OSS bases, kong for a small strongly-typed codebase.

---

## stdlib flag & FlagSet subcommands {#flag-stdlib}

`flag`'s ceiling is real and worth knowing before you outgrow it: single-dash only (`-v`, `-port 8080` or `-port=8080`), **no** `--long`, **no** short clustering (`-abc`), **no** required flags, **no** subcommands. Parsing **stops at the first non-flag arg**: that's the hook for subcommands via per-command `flag.FlagSet`.

```go
// CORRECT — subcommands with FlagSet; each owns its flags, error-handling is ContinueOnError so we control exit.
func run(args []string, stdout, stderr io.Writer) error {
    if len(args) < 1 {
        return fmt.Errorf("usage: app <serve|migrate> [flags]")
    }
    switch args[0] {
    case "serve":
        fs := flag.NewFlagSet("serve", flag.ContinueOnError)
        fs.SetOutput(stderr)                     // don't write usage to os.Stderr directly — testability
        port := fs.Int("port", 8080, "listen port")
        if err := fs.Parse(args[1:]); err != nil { // returns flag.ErrHelp on -h
            return err
        }
        return serve(*port, stdout)
    default:
        return fmt.Errorf("unknown command %q", args[0])
    }
}
```

**Traps:** the package-global `flag.CommandLine` uses `flag.ExitOnError`: `flag.Parse()` calls `os.Exit(2)` on a bad flag, killing testability and skipping defers; a custom `FlagSet` with `ContinueOnError` returns the error instead. A custom `flag.Value` (`String()`+`Set(string) error`) gives typed/validated flags (durations, enums); `flag` already has `flag.Duration`. `-h`/`-help` returns `flag.ErrHelp` from `Parse` on a `ContinueOnError` set; check for it to exit 0, not as an error.

---

## Cobra {#cobra}

Cobra (**v1.10.2**, Dec 2025; powers kubectl, gh, Hugo, Docker) is the builder-style command tree. The production-shaped root silences cobra's own output and maps exit **once** in `main`:

```go
func newRoot() *cobra.Command {
    cmd := &cobra.Command{
        Use:           "app",
        SilenceUsage:  true,  // don't dump full usage on a runtime RunE error
        SilenceErrors: true,  // we print the error ourselves in main (see below)
        RunE:          runRoot, // RunE, never Run — Run can't return an error
    }
    cmd.PersistentFlags().Bool("verbose", false, "verbose output")
    return cmd
}

func main() {
    ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
    defer stop()
    if err := newRoot().ExecuteContext(ctx); err != nil { // ExecuteContext → cmd.Context() in RunE
        fmt.Fprintln(os.Stderr, "app:", err)
        os.Exit(1)
    }
}
```

```go
// WRONG — duplicate error output: cobra prints "Error: ..." itself AND main prints it.
cmd := &cobra.Command{Use: "app", SilenceUsage: true} // SilenceErrors NOT set
// ...main also does fmt.Fprintln(os.Stderr, err)  → the error appears twice.
```

**Expert points models miss:**
- `ExecuteContext(ctx)` wires your signal context into every `cmd.Context()`; `Execute()` gives a `context.Background()`. Use `ExecuteContext`.
- Flag groups [v1.8+]: `MarkFlagsRequiredTogether`, `MarkFlagsMutuallyExclusive`, `MarkFlagsOneRequired`. Combine the last two for "exactly one."
- `SetErrPrefix` [v1.8] brands errors; `OutOrStdout()`/`ErrOrStderr()` are the *injectable* streams (see [testable CLI](#testable)); never `fmt.Println` inside a command.
- THE build-break trap: cobra **v1.9.1 + pflag v1.0.8** fails to compile with `undefined: flag.ParseErrorsWhitelist` because pflag renamed it to `ParseErrorsAllowlist`. Cobra's own field stayed `FParseErrWhitelist` (now aliasing the pflag allowlist type). Fix: **cobra ≥ v1.10.1** pulls a pflag that restores the deprecated name. `[verify]` exact pflag patch (v1.0.9/v1.0.10 reported across sources).
- `cobra-cli` is a separate repo (`github.com/spf13/cobra-cli`, split at cobra v1.3.0): `go install github.com/spf13/cobra-cli@latest`. It is *not* bundled in cobra.
- `spf13/viper` integration: `viper.BindPFlags(cmd.Flags())` is cobra's historical config bridge; convenient, but it inherits viper's key-lowercasing.

---

## Kong {#kong}

Kong (**v1.15.0**, Apr 2026) is the declarative struct-tag parser: define commands as structs, attach `Run(...) error` methods, let Kong dispatch with dependency injection. No code-gen, far less plumbing than cobra.

```go
type Globals struct {
    Debug bool `help:"Enable debug logging."`
}
type ServeCmd struct {
    Port int `default:"8080" help:"Listen port."`
}
func (s *ServeCmd) Run(g *Globals) error { /* g injected by Kong */ return serve(s.Port) }

type CLI struct {
    Globals
    Serve ServeCmd `cmd:"" help:"Run the server."`
}

func main() {
    var cli CLI
    ctx := kong.Parse(&cli, kong.Name("app"))
    err := ctx.Run(&cli.Globals)     // dispatches to the selected command's Run, injecting bound values
    ctx.FatalIfErrorf(err)           // exits non-zero; honors the ExitCoder interface
}
```

```go
// WRONG — treating Kong as a stringly switch throws away its typed graph + DI:
ctx := kong.Parse(&cli)
switch ctx.Command() {
case "serve": _ = serve(cli.Serve.Port) // bypasses Run() methods, kong.Bind, resolvers
}
```

**Expert points:** `kong.Bind`/`BindTo` inject dependencies (a `*sql.DB`, a `context.Context`) into `Run` signatures by type. `kong.Configuration(loader, paths...)` + the `ConfigFlag` type layer config-file defaults *under* flags natively. `FatalIfErrorf` honors `ExitCoder` (`ExitCode() int`): **entrypoint only**; library code returns errors. `type:"path"`/`type:"existingfile"` give validated path args for free.

---

## Configuration precedence done right {#configuration}

The canonical order is **defaults < config file < environment < flags** (later wins). The trap is implementing it with hidden magic instead of explicit layering. With **koanf** [v2], precedence is *literally the order of `Load` calls*, with no framework opinion:

```go
import (
    "github.com/knadh/koanf/v2"
    "github.com/knadh/koanf/providers/confmap"
    "github.com/knadh/koanf/providers/file"
    "github.com/knadh/koanf/providers/env/v2"   // env/v2 — the v1 env provider is superseded
    "github.com/knadh/koanf/providers/posflag"
    "github.com/knadh/koanf/parsers/yaml"
)

func Load(flags *pflag.FlagSet) (*Config, error) {
    k := koanf.New(".")
    k.Load(confmap.Provider(map[string]any{          // 1. defaults
        "server.port": 8080, "server.read_timeout": "5s",
    }, "."), nil)
    if err := k.Load(file.Provider("config.yml"), yaml.Parser()); err != nil { // 2. file
        if !errors.Is(err, os.ErrNotExist) { return nil, fmt.Errorf("config file: %w", err) }
    }
    k.Load(env.Provider(".", env.Opt{               // 3. env: APP_SERVER_PORT → server.port
        Prefix: "APP_",
        TransformFunc: func(key, val string) (string, any) {
            key = strings.ReplaceAll(strings.ToLower(strings.TrimPrefix(key, "APP_")), "_", ".")
            return key, val
        },
    }), nil)
    k.Load(posflag.Provider(flags, ".", k), nil)    // 4. flags win (only flags the user actually set)

    var cfg Config
    if err := k.Unmarshal("", &cfg); err != nil { return nil, fmt.Errorf("unmarshal config: %w", err) }
    return &cfg, cfg.Validate()
}
```

```go
// WRONG — order is the precedence; loading env then file makes the FILE win over env:
k.Load(env.Provider(".", env.Opt{Prefix: "APP_"}), nil)   // env
k.Load(file.Provider("config.yml"), yaml.Parser())        // file LAST → clobbers env. Backwards.
```

**Traps:** `posflag.Provider` only overrides keys whose flags were **explicitly set** (it respects `Changed`), so flag *defaults* don't stomp file/env; this is why you put defaults in `confmap`, not in `pflag` defaults. Treat "config file absent" as non-fatal (`errors.Is(err, os.ErrNotExist)`) but a malformed file as fatal. Durations as strings (`"5s"`) need a decode hook in viper; koanf's `Unmarshal` handles `time.Duration` via mapstructure but verify with `UnmarshalWithConf` + `mapstructure.StringToTimeDurationHookFunc` for edge formats.

---

## koanf vs viper {#koanf-viper}

| | **koanf/v2** (v2.3.4) | **viper** (v1.21.0) |
|---|---|---|
| Core size | tiny; providers/parsers are separate modules | monolithic; pulls afero, fsnotify, codecs |
| Key case | **case-sensitive** (honors JSON/YAML/TOML) | **lowercases everything** (breaks specs) |
| Precedence | explicit `Load` order, no hidden rules | fixed internal precedence ordering |
| Concurrency | not goroutine-safe vs `Load`; lock if hot-reloading | **not goroutine-safe** for concurrent r/w (can panic) |
| Remote K/V | providers: `consul/v2`, `etcd/v2`, `vault/v2`, `s3`, `parameterstore/v2`, `appconfig/v2` | built-in remote providers |
| mapstructure | uses `mitchellh/mapstructure` internally | moved to **`go-viper/mapstructure/v2`** (v1.20+) |

viper footguns models reproduce:
- `AutomaticEnv()` does NOT slurp arbitrary env vars: it only checks env for keys that *already exist* from defaults/config/flags. Nested env still needs `SetEnvPrefix` + `SetEnvKeyReplacer(strings.NewReplacer(".", "_"))` and often explicit `BindEnv`. Empty env vars are ignored unless `AllowEmptyEnv(true)`.
- `Unmarshal` silently ignores unknown keys: use **`UnmarshalExact`** to catch typos/dead config in production.
- `mitchellh/mapstructure` is archived: if you reference it directly (custom decode hooks), switch to `github.com/go-viper/mapstructure/v2` (viper v1.21 pins v2.4.x). v1.20 also **removed HCL/INI/Java-properties from core** → `github.com/go-viper/encoding`.
- Key lowercasing is the headline reason new code picks koanf; it's been punted to "maybe v2" for years.

```go
// viper: production-correct env mapping + strict unmarshal
v := viper.New()
v.SetEnvPrefix("APP")
v.SetEnvKeyReplacer(strings.NewReplacer(".", "_")) // server.port ← APP_SERVER_PORT
v.AutomaticEnv()
v.BindPFlags(flags)
_ = v.ReadInConfig()                  // tolerate absence at the call site
var cfg Config
err := v.UnmarshalExact(&cfg)         // not Unmarshal — reject unknown keys
```

Pick: **koanf** for new code (smaller tree, case-sensitive, explicit). **viper** when already invested or you need its all-in-one + cobra `BindPFlags` + remote providers out of the box. For pure 12-factor env, use neither (below).

---

## Env-only config {#env-config}

For 12-factor apps that configure entirely from environment, a full config lib is overkill. **`caarlos0/env`** (v11) is struct-tag + generics; **`sethvargo/go-envconfig`** is context-based with a `Lookuper` (testable/parallel, no global env mutation).

```go
import "github.com/caarlos0/env/v11"

type Config struct {
    Port    int           `env:"PORT" envDefault:"8080"`
    DBURL   string        `env:"DATABASE_URL,required"`           // missing → error
    Token   string        `env:"API_TOKEN,unset"`                 // cleared from env after read
    Timeout time.Duration `env:"TIMEOUT" envDefault:"5s"`
    Hosts   []string      `env:"HOSTS" envSeparator:","`
}
cfg, err := env.ParseAs[Config]()   // [generics] one call, typed result
```

**Expert points:** `,required` fails loudly on missing critical config (fail-fast at boot beats a nil deref at request time). `,unset` clears a secret from the process environment after parsing so it doesn't leak to child processes via `os.Environ()`. `,file` reads the value from the file *named* by the env var (Docker/K8s secret-mount pattern: `API_TOKEN_FILE=/run/secrets/token`). go-envconfig's `Lookuper` lets tests inject a fake env map without `t.Setenv`, enabling `t.Parallel()`.

---

## Validation & secrets {#validation-secrets}

**Validate immediately after load, before any component starts**: a bad config should fail at boot with a clear message, never mid-request. Prefer a method on the config over scattering checks:

```go
func (c *Config) Validate() error {
    var errs []error
    if c.Server.Port < 1 || c.Server.Port > 65535 {
        errs = append(errs, fmt.Errorf("server.port %d out of range", c.Server.Port))
    }
    if c.Database.URL == "" {
        errs = append(errs, errors.New("database.url is required"))
    }
    return errors.Join(errs...) // [1.20] report ALL problems at once, not the first
}
```

`errors.Join` surfaces every misconfiguration in one run instead of whack-a-mole. For tag-driven rules, `go-playground/validator` (`validate:"required,min=1"`) on the config struct is idiomatic.

**Secrets:** never put credentials in committed config files: source env vars, `,file` (above), or a secret manager. Never log a config struct wholesale (`slog.Any("cfg", cfg)` leaks tokens). Wrap secret fields in a redacting type whose `String()`/`LogValue()` masks the value, or implement `slog.LogValuer` on the config to allow-list safe fields. Full redaction pattern: [errors-and-resilience.md](errors-and-resilience.md#slog-errors); secret storage: [security.md](security.md).

---

## XDG base dirs & config location {#xdg}

`os` already implements the XDG Base Directory spec: **don't hand-roll `filepath.Join(os.Getenv("HOME"), ".config", app)`** (it ignores `$XDG_CONFIG_HOME` and is wrong on macOS/Windows).

| Function [ver] | Unix/Linux | macOS | Windows |
|---|---|---|---|
| `os.UserConfigDir` [1.13] | `$XDG_CONFIG_HOME` else `$HOME/.config` | `~/Library/Application Support` | `%AppData%` |
| `os.UserCacheDir` [1.11] | `$XDG_CACHE_HOME` else `$HOME/.cache` | `~/Library/Caches` | `%LocalAppData%` |
| `os.UserHomeDir` [1.12] | `$HOME` | `$HOME` | `%USERPROFILE%` |

```go
dir, err := os.UserConfigDir()
if err != nil { return err }                       // errors if $HOME unset OR $XDG_CONFIG_HOME is relative
cfgPath := filepath.Join(dir, "myapp", "config.yml") // create your app subdir; spec requires it
```

**Traps:** all three return an error when the location can't be determined (e.g. `$HOME` undefined in a minimal container) or when the XDG var is a **relative** path; handle it, don't ignore. The spec mandates an **app-specific subdirectory**: `os.UserConfigDir()` returns the *root*, you must append your app name. For multi-source config-file discovery, `github.com/adrg/xdg` adds `XDG_CONFIG_DIRS` search-path support that stdlib omits.

---

## Signals & graceful shutdown {#shutdown}

The modern lifecycle: derive a context from OS signals with **`signal.NotifyContext` [1.16]**, pass it down, shut down on a **fresh** timeout. Full HTTP-server shutdown details: [http-and-apis.md](http-and-apis.md#graceful-shutdown).

```go
func run(ctx context.Context, cfg *Config) error {
    srv := &http.Server{Addr: fmt.Sprintf(":%d", cfg.Server.Port), Handler: router}
    errCh := make(chan error, 1)
    go func() {
        if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
            errCh <- err // ErrServerClosed is the EXPECTED return from Shutdown — not an error
        }
    }()
    select {
    case err := <-errCh:
        return err
    case <-ctx.Done():    // SIGINT/SIGTERM delivered → ctx cancelled
    }
    shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second) // FRESH ctx
    defer cancel()
    return srv.Shutdown(shutdownCtx)
}

func main() {
    ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
    defer stop()
    if err := run(ctx, cfg); err != nil {
        fmt.Fprintln(os.Stderr, "app:", err); os.Exit(1)
    }
}
```

Second Ctrl-C / force-quit: `NotifyContext` traps only the *first* signal. Call `stop()` right after `<-ctx.Done()` to restore default handling so a second SIGINT kills immediately:

```go
<-ctx.Done()
stop() // restore default disposition; a second Ctrl-C now force-quits
slog.Info("shutting down; press Ctrl+C again to force")
```

Traps models reproduce:
- Unbuffered signal channel: `signal.Notify(make(chan os.Signal), …)` can **drop** the signal (runtime sends non-blocking). Always `make(chan os.Signal, 1)`. (`NotifyContext` handles this for you; prefer it.)
- `Shutdown` with the cancelled signal context: its deadline is already past; in-flight requests get no drain. Use a fresh `context.WithTimeout(context.Background(), …)`.
- Treating `http.ErrServerClosed` as a failure: it's the normal return from a clean `Shutdown`.
- `os.Kill`/`SIGKILL` in `Notify`: uncatchable; listing it does nothing.
- K8s budget: your shutdown timeout must fit inside `terminationGracePeriodSeconds` (default 30s) or the pod is SIGKILLed mid-drain.
- SIGHUP for reload belongs on a *separate* `signal.Notify` channel; don't fold reload into the shutdown context.
- `os.Interrupt` vs `syscall.SIGINT`: equal on Unix; `os.Interrupt` is the portable name (Windows has no SIGINT proper). No breaking `os/signal` changes through 1.26; [1.26] `NotifyContext` cancels with a **signal-named `context.Cause`** ([errors-and-resilience.md](errors-and-resilience.md#timeouts)).

---

## Exit codes {#exit-codes}

```go
// CORRECT — defers run because os.Exit lives only in main.
func main() { os.Exit(run()) }
func run() (code int) {
    defer cleanup()                  // RUNS — main never calls os.Exit before this returns
    if err := doWork(); err != nil {
        fmt.Fprintln(os.Stderr, "app:", err)
        return 1
    }
    return 0
}

// WRONG — defer SKIPPED; files/connections leak, buffers unflushed.
func main() {
    defer cleanup()                  // never runs
    if bad { os.Exit(1) }            // os.Exit doc: "No deferred functions are run."
}
```

`os.Exit` and `log.Fatal*` terminate the process **without running deferred functions**, the single most common CLI bug. Keep `os.Exit` in `main` only; everything below returns `error`/`int`.

Conventions: `0` success; `1` general error; `2` usage/flag error (what `flag` and cobra emit on parse failure); `130` = SIGINT (128+2), `143` = SIGTERM (128+15), though a *graceful* shutdown on signal usually still exits `0`. For daemons, BSD `sysexits.h` codes (`EX_USAGE=64`, `EX_DATAERR=65`, `EX_NOINPUT=66`, `EX_UNAVAILABLE=69`, `EX_SOFTWARE=70`, `EX_CONFIG=78`) are optional but professional.

Code-carrying errors: let any layer attach an exit code, map once at the top:

```go
type exitError struct{ code int; err error }
func (e exitError) Error() string { return e.err.Error() }
func (e exitError) Unwrap() error { return e.err }
func (e exitError) ExitCode() int { return e.code }

func main() {
    err := run()
    var ec interface{ ExitCode() int }
    switch {
    case err == nil:
    case errors.As(err, &ec): fmt.Fprintln(os.Stderr, err); os.Exit(ec.ExitCode())
    default:                  fmt.Fprintln(os.Stderr, err); os.Exit(1)
    }
}
```

kong's `FatalIfErrorf` already honors this `ExitCoder` shape; cobra returns the error from `Execute()` for you to map. Prefer `errors.AsType[E]` [1.26] over `errors.As` for the extraction.

---

## Shell completion {#completion}

cobra generates completion for bash/zsh/fish/powershell. Dynamic suggestions go through **`CompletionFunc`**, whose return type is `[]cobra.Completion` (a **type alias** `Completion = string` since v1.9, assignable to/from `[]string`, *not* generics):

```go
cmd.ValidArgsFunction = func(cmd *cobra.Command, args []string, toComplete string) ([]cobra.Completion, cobra.ShellCompDirective) {
    return []cobra.Completion{
        cobra.CompletionWithDesc("dev", "development environment"),
        cobra.CompletionWithDesc("prod", "production environment"),
    }, cobra.ShellCompDirectiveNoFileComp // suppress filename completion
}
// Enum flag: prefer the helper over a hand-rolled closure.
cmd.RegisterFlagCompletionFunc("env", cobra.FixedCompletions(
    []cobra.Completion{"dev", "staging", "prod"}, cobra.ShellCompDirectiveNoFileComp))
```

**Traps:** models return bare `[]string` and miss `CompletionWithDesc`/`FixedCompletions` [v1.9]; they assume legacy bash V1 completion: **`GenBashCompletionV2` is the default** (V1 is legacy). `ShellCompDirectiveNoFileComp` matters: without it the shell falls back to filename completion. kong supports completion via `github.com/willabides/kongplete`; urfave/cli has built-in `EnableShellCompletion`.

---

## Testable CLI design {#testable}

The two rules that make a CLI testable: **inject args and IO** (never read `os.Args`/`os.Stdout` deep in the code), and **return errors** (never `os.Exit` outside `main`). This turns the whole program into a table-testable function.

```go
// CORRECT — run() takes everything it touches; main is the only impure shell.
func run(args []string, stdin io.Reader, stdout, stderr io.Writer) error { /* ... */ }
func main() {
    if err := run(os.Args[1:], os.Stdin, os.Stdout, os.Stderr); err != nil { os.Exit(1) }
}

func TestRun(t *testing.T) {
    var out, errb bytes.Buffer
    err := run([]string{"serve", "-port", "0"}, strings.NewReader(""), &out, &errb)
    if err != nil { t.Fatalf("run: %v", err) }
    if !strings.Contains(out.String(), "listening") { t.Errorf("got %q", out.String()) }
}
```

```go
// WRONG — untestable: globals + direct os access + os.Exit.
var verbose bool                    // package global flag → tests can't isolate
func doThing() {
    fmt.Println("result")           // hard-wired to os.Stdout
    if bad { os.Exit(1) }           // kills the test binary
}
```

**Expert points:** cobra exposes `cmd.SetArgs([]string{...})`, `cmd.SetOut`/`SetErr`/`SetIn` for exactly this: set them in tests, assert on the buffers. kong takes `kong.Parse(&cli, kong.Writers(out, err), kong.Exit(func(int){}))` to capture output and neutralize exit. Avoid `flag`'s global `CommandLine`/`ExitOnError` in tested code; use a `FlagSet` with `ContinueOnError`. For env-dependent code, `t.Setenv` [1.17] auto-restores and **forbids `t.Parallel()`** in that test; go-envconfig's `Lookuper` sidesteps that.

---

## Process execution {#process-exec}

Always **`exec.CommandContext`** (not `exec.Command`): cancellation/timeouts are non-negotiable; the context kills the child when cancelled.

```go
ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
defer cancel()
cmd := exec.CommandContext(ctx, "git", "status", "--porcelain")
cmd.WaitDelay = 5 * time.Second           // [1.20] grace for the child to exit after ctx cancel before SIGKILL
out, err := cmd.CombinedOutput()           // stdout+stderr; INCLUDE output in the error
if err != nil {
    return fmt.Errorf("git status: %w (%s)", err, bytes.TrimSpace(out))
}
```

**Expert points:** an `*exec.ExitError` carries the child's exit code (`exitErr.ExitCode()`) and, on Unix, `exitErr.Stderr` when you used `Output()` (not `CombinedOutput`). [1.19] `exec.LookPath` no longer resolves a program in the **current directory** on Windows (a security fix); pass an explicit path or it errors. **Stream** large output via `cmd.StdoutPipe()` + `bufio.NewScanner` with `cmd.Start()` then `cmd.Wait()` (never `Wait` before draining the pipe → deadlock). **`WaitDelay` [1.20]** bounds how long `Wait` blocks on a child still holding stdio after the context is done. Windows: `cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}` hides console windows ([platform-and-build.md](platform-and-build.md#windows)).

---

## Terminal output, color & TUI {#cli-output}

Stream discipline: primary/machine output to **stdout**, logs and errors to **stderr**, so `app | jq` stays clean. Offer a `--json` flag that suppresses spinners/color and emits machine-readable stdout.

TTY detection: `golang.org/x/term`'s `term.IsTerminal(int(os.Stdout.Fd()))` (and `term.GetSize(fd)`); gate color/spinners/progress on it. **Color precedence** experts honor: `NO_COLOR` *present* (any value, even empty; use `os.LookupEnv`, **not** `== "1"`) disables; `CLICOLOR_FORCE`/`FORCE_COLOR ≠ 0` forces even when piped; `TERM=dumb` disables; an explicit `--color`/`--no-color` flag overrides all env.

Charm v2 stack (Feb-Mar 2026, first breaking changes in ~6 years): moved to **vanity import paths** `charm.land/{bubbletea,bubbles,lipgloss,huh}/v2`; models trained earlier emit the old `github.com/charmbracelet/*` paths for new code.

- Bubble Tea v2 (`charm.land/bubbletea/v2`): `View()` now returns **`tea.View`** (not `string`) via `tea.NewView(s)`; key messages are **`tea.KeyPressMsg`** (not `tea.KeyMsg`), space is the named key `"space"`. `WindowSizeMsg` fires once initially and on every resize; never hardcode width/height. When the outer app owns signals, run with `tea.WithContext(ctx)` + `tea.WithoutSignalHandler()` so you don't double-own Ctrl-C; `Run()` returns `tea.ErrInterrupted` on SIGINT, `tea.ErrProgramKilled` on kill. Never block in `Update`; return a `tea.Cmd`.
- Lip Gloss v2 standalone: use `lipgloss.Println`/`Fprint`, **not** `fmt.Println(style.Render(...))`, or color isn't downsampled/stripped on non-TTY. `AdaptiveColor` moved to the `compat` subpackage; the `termenv` dependency was dropped for `charmbracelet/colorprofile`.
- Huh v2 (forms): accessible mode is now **form-level only**: `form.WithAccessible(os.Getenv("ACCESSIBLE") != "")` (the per-field `WithAccessible` was removed); generic constructors `huh.NewSelect[string]()`.
- Fang v2 is an experimental styled-cobra starter (styled help/errors, auto `--version`, completion); `DefaultTheme`/`WithTheme` deprecated → `DefaultColorScheme`/`WithColorSchemeFunc`.

`[verify]` exact charm patch tags (lipgloss v2.0.3 vs v2.0.4 reported across sources; bubbletea ~v2.0.7); pin against pkg.go.dev before locking `go.mod`.

---

## Library landscape & status {#libraries}

| Library | Version [2026] | Import path | Status / notes |
|---|---|---|---|
| stdlib `flag` | 1.26 | `flag` | Tiny tools; `FlagSet` for subcommands; no POSIX/long flags |
| `spf13/cobra` | v1.10.2 | `github.com/spf13/cobra` | **Default** for command trees; needs pflag ≥ v1.0.9 (build break otherwise) |
| `spf13/pflag` | v1.0.x | `github.com/spf13/pflag` | POSIX flags; `ParseErrorsWhitelist`→`Allowlist` rename; `[verify]` patch |
| `spf13/cobra-cli` | separate | `github.com/spf13/cobra-cli` | Split from cobra at v1.3.0; `init`/`add` only |
| `alecthomas/kong` | v1.15.0 | `github.com/alecthomas/kong` | Declarative struct tags + DI; no code-gen |
| `urfave/cli` | v3.8.0 | `github.com/urfave/cli/v3` | v3 current (context-first); v2 maint-only, v1 security-only |
| `knadh/koanf/v2` | v2.3.4 | `github.com/knadh/koanf/v2` | **Default** config; modular, case-sensitive, explicit precedence |
| koanf env provider | env/v2 | `…/koanf/providers/env/v2` | v1 env provider superseded |
| `spf13/viper` | v1.21.0 | `github.com/spf13/viper` | **No v2**; lowercases keys; not concurrency-safe; `AutomaticEnv` ≠ slurp |
| `go-viper/mapstructure/v2` | v2.4.x | `github.com/go-viper/mapstructure/v2` | Replaces archived `mitchellh/mapstructure` |
| `mitchellh/mapstructure` | archived | none | Dead; use the go-viper fork |
| `caarlos0/env` | v11.x | `github.com/caarlos0/env/v11` | Env-only, generics `ParseAs[T]`, `,required`/`,file`/`,unset` |
| `sethvargo/go-envconfig` | current | `github.com/sethvargo/go-envconfig` | Env-only, context + `Lookuper` (testable/parallel) |
| `go-playground/validator` | v10 | `github.com/go-playground/validator/v10` | Tag-driven config/struct validation |
| `adrg/xdg` | current | `github.com/adrg/xdg` | XDG search paths (`XDG_CONFIG_DIRS`) beyond stdlib |
| `golang.org/x/term` | current | `golang.org/x/term` | `IsTerminal`, `GetSize` |
| Charm stack v2 | v2 | `charm.land/{bubbletea,bubbles,lipgloss,huh}/v2` | Vanity paths; old `charmbracelet/*` superseded; `[verify]` patches |
| `fatih/color` | current | `github.com/fatih/color` | `NO_COLOR`/TTY-aware; standalone alternative to colorprofile |

---

## Version map {#versions}

| Ver | CLI/config-relevant |
|---|---|
| **1.11-1.13** | `os.UserCacheDir` [1.11]; `os.UserHomeDir` [1.12]; `os.UserConfigDir` [1.13] (XDG built in) |
| **1.16** | `signal.NotifyContext`: the signal idiom |
| **1.17** | `t.Setenv` (auto-restore; forbids `t.Parallel`) |
| **1.19** | `exec.LookPath` no longer resolves cwd on Windows (security) |
| **1.20** | `exec.Cmd.WaitDelay`; `errors.Join` (report all config errors); `context.Cause` |
| **1.22** | `math/rand/v2`; range-over-int (used in CLI loops) |
| **1.24** | `tool` directives in `go.mod` supersede the `tools.go` blank-import pattern for CLI/dev tools |
| **1.26** | `errors.AsType[E]` (cleaner exit-code extraction); `signal.NotifyContext` cancels with a signal-named `Cause`; `go fix` modernizer framework |
| **1.27 (RC)** | No CLI/config-relevant breaking changes confirmed; re-verify `os/signal` and toolchain notes at GA (~Aug 2026). Treat as draft. |

---

## What models get wrong {#anti-patterns}

1. **`os.Exit`/`log.Fatal` after a `defer`**: defers skipped; cleanup/flush lost. Use `func main(){ os.Exit(run()) }`. And never `os.Exit` *outside* `main` (cobra `RunE`, kong commands, helpers); return errors, map once.
2. **Unbuffered signal channel** `signal.Notify(make(chan os.Signal), …)`: drops signals; must be size ≥ 1. Prefer `signal.NotifyContext`.
3. **`srv.Shutdown` with the cancelled signal context**: no drain; pass a fresh `context.WithTimeout(context.Background(), …)`. And `http.ErrServerClosed` is the clean-shutdown return, not a failure.
4. **Reversed config precedence**: load order *is* precedence; env-then-file makes the file win. Want defaults < file < env < flags, in that call order. Put defaults in a defaults layer (not pflag defaults); `posflag` overrides only *changed* flags.
5. **"Use viper v2"**: it doesn't exist (latest v1.21.0); the README "v2" link is a feedback form.
6. **`AutomaticEnv()` will slurp my env**: no; it matches only existing keys. Needs prefix + replacer + sometimes `BindEnv`.
7. **`viper.Unmarshal` for prod**: silently drops unknown keys; use `UnmarshalExact`. And `mitchellh/mapstructure` is archived → `go-viper/mapstructure/v2`.
8. **koanf v1 imports** (`github.com/knadh/koanf` / old `providers/env`): use `…/koanf/v2` and `providers/env/v2`. koanf is case-sensitive and order-driven (no viper-style magic).
9. **Hand-rolled `$HOME/.config` joins**: use `os.UserConfigDir` [1.13]; it handles `$XDG_CONFIG_HOME`, macOS, Windows, and the relative-path error.
10. **`os.Getenv("NO_COLOR") == "1"`**: the spec says *presence* (any value) disables; use `os.LookupEnv`. Forgetting `CLICOLOR_FORCE`/`FORCE_COLOR`.
11. **cobra completions returning `[]string`**: type is `[]cobra.Completion` via `CompletionFunc` [v1.9]; prefer `FixedCompletions`/`CompletionWithDesc`.
12. **cobra `Run` instead of `RunE`** (swallows errors); **`SilenceUsage` without `SilenceErrors`** (double-printed error); **v1.9.1 + pflag v1.0.8** build break (`ParseErrorsWhitelist`) → cobra ≥ v1.10.1; **cobra-cli** is a separate repo.
13. **`exec.Command` without context**: child can hang forever; use `exec.CommandContext` + `WaitDelay`, and include captured output in the error.
14. **Globals + direct `os.Stdout`/`os.Args` deep in code**: untestable; inject args + IO, assert on buffers (`cmd.SetArgs`/`SetOut`).
15. **Old charm imports + `View() string`**: new code is `charm.land/*/v2`, `View() tea.View`, `tea.KeyPressMsg`; standalone Lip Gloss needs `lipgloss.Println`; Huh accessible mode is form-level.
16. **Logging the whole config struct**: leaks secrets; redact via `LogValuer`/a masking type, validate at boot with `errors.Join`.

---

## See Also {#see-also}
- [errors-and-resilience.md](errors-and-resilience.md): `errors.Join`, `errors.AsType`, `context.Cause`, `signal.NotifyContext` cause, slog redaction
- [http-and-apis.md](http-and-apis.md#graceful-shutdown): full HTTP-server shutdown with drain
- [platform-and-build.md](platform-and-build.md#windows): cross-compilation, Windows `SysProcAttr`, release automation
- [security.md](security.md): secret storage, secret managers
- [observability.md](observability.md): structured logging to stderr, slog handlers

## Sources {#sources}
- pkg.go.dev/{os, flag, os/exec, os/signal, github.com/spf13/cobra, github.com/alecthomas/kong, github.com/urfave/cli/v3, github.com/knadh/koanf/v2, github.com/spf13/viper, github.com/caarlos0/env/v11}
- go.dev/doc/go1.13-go1.27 release notes; freedesktop.org XDG Base Directory spec; no-color.org; bixense.com CLICOLOR spec
- Charm upgrade guides (bubbletea/lipgloss/bubbles/huh v2, `charm.land/*`); 12factor.net/config; sysexits.h (BSD)
- Declined proposal: `main() int` (#24869)
