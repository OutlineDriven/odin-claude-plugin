# cli.md — non-interactive CLI surfaces

Surface reference for command-line tools — the non-interactive sibling of `references/tui.md`. Covers argument-parsing libraries (clap, cobra, cmdliner, typer/click), the env-var contracts every CLI must respect, and the conventions for exit codes, progress, and help text.

**Snapshot date: April 2026.** Re-verify versions and capability tables before relying on them in production.

## 1. Posture

CLIs run on terminals that may or may not support color, may or may not be a TTY, and may or may not have width. Detect, do not assume. NO_COLOR compliance is non-negotiable; a CLI that ignores `NO_COLOR` is broken on accessibility-conscious systems and will lose pipe-friendliness on the next sysadmin's review.

The shared theme-token shape lives in `references/tui.md` §6 — capability tier, semantic role names, and `NO_COLOR` handling apply identically here. The difference is interactivity: a CLI prints once and exits; a TUI loops. Anything that loops belongs in `references/tui.md`.

## 2. clap (Rust)

`clap` 4.x is the current stable line as of April 2026. Derive macros are the recommended surface for new code; the builder API remains supported.

- `ColorChoice::Auto` — auto-respects `NO_COLOR`, `CLICOLOR`, and TTY detection. Default for color-aware clap apps.
- `ColorChoice::Always` / `Never` — flag-driven overrides; wire them to `--color=always|never|auto`.

```rust
use clap::{Parser, ColorChoice};

#[derive(Parser)]
#[command(name = "rg-lite", color = ColorChoice::Auto, version)]
struct Cli {
    pattern: String,
    #[arg(long, value_enum, default_value_t = OutputMode::Auto)]
    color: ColorMode,
}
```

Pair with `clap_complete` for shell completions and `is-terminal` (or `std::io::IsTerminal`) for branch points beyond clap's own color decision.

## 3. cobra (Go)

`cobra` 1.x is the current stable line; flag-tree composition is its core selling point. Cobra does not ship a color decision — bring your own (typically `lipgloss` writer-layer downsampling, or `fatih/color` with its `NO_COLOR` honour).

```go
var rootCmd = &cobra.Command{
    Use:   "myctl",
    Short: "Operate the cluster",
    Run: func(cmd *cobra.Command, args []string) {
        // ... subcommand body
    },
}

func init() {
    rootCmd.PersistentFlags().StringVar(&theme, "color", "auto", "auto|always|never")
    rootCmd.AddCommand(statusCmd, applyCmd)
}
```

The reference cobra application for status-color register is the GitHub CLI (`gh`) — its mapping of issue/PR state to ANSI colors and its `--json` mode are worth copying outright. Anti-pattern: subcommand sprawl (six levels deep). Flatten when a tree gets that tall.

## 4. cmdliner (OCaml)

`cmdliner` 1.3+ is the current stable line. Declarative term-based CLI definition; arguments and options are values combined into a `Term` that the runtime evaluates against argv.

```ocaml
let pattern =
  let doc = "Pattern to match." in
  Arg.(required & pos 0 (some string) None & info [] ~docv:"PATTERN" ~doc)

let cmd =
  let doc = "Search files for PATTERN." in
  let info = Cmd.info "rg-lite" ~version:"0.1.0" ~doc in
  Cmd.v info Term.(const run $ pattern)

let () = exit (Cmd.eval cmd)
```

Posture: declarative > imperative for OCaml CLIs. The `Term` algebra composes; manual `Sys.argv` walking does not. Cmdliner also generates man pages (`--help=groff`) — use that surface, do not roll a parallel doc tree.

## 5. typer / click (Python)

`typer` (a typed wrapper around `click`) for new code; `click` directly for codebases that already depend on it.

```python
import typer

app = typer.Typer(no_args_is_help=True)

@app.command()
def grep(pattern: str, path: str = ".", color: str = "auto"):
    """Search PATH for PATTERN."""
    ...

if __name__ == "__main__":
    app()
```

Typer reads type hints to derive option types and validations; click's manual `@click.option` decorators stay available when the type-hint surface is not enough. Both honour `NO_COLOR` through their styling helpers, but the application is responsible for branching on `--color=auto|always|never` if a flag is exposed.

## 6. NO_COLOR + capability detection

The non-negotiable contract for any CLI that emits color or formatting:

- **`NO_COLOR` env var** — `https://no-color.org` standard; if set to a non-empty value (any non-empty string), all color output is disabled and the CLI must remain usable. An empty `NO_COLOR=` is treated as unset. Explicit user-level config files and per-invocation flags (`--color=always`) override `NO_COLOR` per the spec — the env var is the default, not a ceiling.
- **`CLICOLOR` / `CLICOLOR_FORCE`** — older convention from BSD ls. `CLICOLOR=0` disables color; `CLICOLOR_FORCE=1` enables color even when stdout is not a TTY. Honour both for compatibility with mixed toolchains.
- **TTY detection** — check `isatty(stdout)` before emitting ANSI escapes. Pipes (`| less`, `| jq`, `| bat`) get plain text by default; force-on requires `CLICOLOR_FORCE=1` or `--color=always`.
- **Capability degradation** — truecolor → 256 → 16, one-way. Never assume `$TERM=xterm-256color` implies truecolor. Probe `$COLORTERM=truecolor` for the upper tier; otherwise downsample.
- **Three-mode output** — `--json` (machine-parseable, never colored), `--plain` (line-oriented, grep-friendly, no color), and pretty-tty (default when stdout is a TTY). Never force color on pipes; never emit JSON to a TTY by default unless the tool is JSON-native.

```text
# Pseudocode for the resolution order — apply top-to-bottom.
# Per-invocation flag wins; user config wins next; env vars are the default;
# TTY detection is the final fallback.
if flag --color == "always"          -> color = on
elif flag --color == "never"         -> color = off
elif user_config sets color override -> color = config value
elif env("NO_COLOR") is non-empty    -> color = off    # empty NO_COLOR= is unset
elif env("CLICOLOR_FORCE") == "1"    -> color = on
elif env("CLICOLOR")       == "0"    -> color = off
elif isatty(stdout)                  -> color = on
else                                 -> color = off
```

Capability tier resolves separately: probe `$COLORTERM`, then `$TERM`, then default to 16-color. The two decisions (color on/off, tier) are orthogonal — do not collapse them.

## 7. Exit codes + progress + help

- **Exit codes** — `0` success, `1` generic failure, `2` misuse / bad args. Beyond that, the BSD `sysexits.h` range `64-78` carries semantic meaning (`64` usage, `65` data error, `66` no input, `69` unavailable, `70` software, `74` IO, `77` permission). Pick a discipline and document it; fragmented exit codes break orchestrators.
- **Progress bars** — `indicatif` (Rust), `tqdm` (Python), `pterm` (Go) are the typical libraries. Show progress only with an explicit `--progress` flag, or when stdout is a TTY *and* the operation is long enough to warrant it. Never emit progress on pipes — the carriage returns corrupt downstream parsers.
- **Help text typography** — fixed-width-friendly; align flag descriptions on a column; section breaks via blank lines, not colored rules. Wrap to 80 columns or `$COLUMNS`, whichever is smaller. Help is read on terminals without color as often as with.
- **Pager handling** — long output respects `$PAGER` (or defaults to `less -FRX`); offer `--no-pager` as the opt-out. `gh` and `git` are the conventions to copy.

## 8. Cite-and-defer

Citations: `cli.github.com` (gh), `docs.rs/clap`, `github.com/spf13/cobra`, `erratique.ch/software/cmdliner`, `typer.tiangolo.com`, `no-color.org`, `bixense.com/clicolors`. Anchors to study: `gh` CLI status colors and `--json` modes; `ripgrep` `--color=auto`; `bat` capability handling.

Defer to upstream docs for current flag surfaces — clap, cobra, and cmdliner all evolve their option surfaces between minor releases. Verify before relying on a specific derive macro or term combinator in production.
