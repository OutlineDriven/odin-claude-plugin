# OCaml strict-mode bootstrap (2026)

OCaml's strict surface lives in dune flags, ocamlformat config, and the `.mli`-first interface discipline. There is no single strict-mode preset.

## dune-project

```dune
(lang dune 3.16)
(generate_opam_files true)

(implicit_transitive_deps false)

(formatting
 (enabled_for ocaml dune))
```

`implicit_transitive_deps false` forces explicit dependency declarations — every transitive dep used must be a direct dep. This is the 2026 strict default.

## dune (per-library)

```dune
(library
 (name my_lib)
 (public_name my-lib)
 (flags (:standard
          -strict-sequence
          -strict-formats
          -short-paths
          -principal
          -w +a-4-9-29-30-40..42-44..46-48-50-58-66-67))
 (modules_without_implementation))
```

Flag breakdown:
- `-strict-sequence` — sequenced expressions must have type `unit`.
- `-strict-formats` — reject loose printf formats.
- `-short-paths` — error messages use shortest valid type path.
- `-principal` — force principal type checking; rejects code that depends on type-inference accidents.
- `-w +a` — enable all warnings, then disable a curated noise set; 4 (fragile match), 29 (line break in string literal), 30 (duplicated definitions in different modules) are commonly silenced for pragmatic reasons.

Convert warnings to errors in CI via `(flags (:standard -warn-error +a))`.

## .ocamlformat

```
profile = janestreet
version = 0.27.0
margin = 100
break-cases = fit-or-vertical
```

## Interface-first discipline

Every public module ships a `.mli`. Type `t` is abstract by default; expose smart constructors. Never use `Obj.magic`. This is the user's stated OCaml standard; encode in the project's `AGENTS.md` rather than the dune file (since dune cannot enforce it).

```ocaml
(* user.mli *)
type t  (* abstract *)
val create : id:string -> name:string -> (t, [`Empty_id | `Empty_name]) result
val id : t -> string
val name : t -> string
```

## Test-side gates

- Alcotest for unit tests (`dune runtest`).
- QCheck for property-based tests.
- Crowbar for fuzzing — defers to `ocaml-dev:fuzz`.

## Notes

- `dune --release` is a build mode (optimizations + warnings-as-errors), not a strict-mode flag in the typechecker sense.
- Effects (OCaml 5+) need a separate strictness discipline — `Effect.Deep.try_with` is the safer wrapper than catch-all `try ... with _`.
- Eio direct-style concurrency interacts with `-principal`; some inferred types degrade. Add explicit annotations on Eio entry points.
