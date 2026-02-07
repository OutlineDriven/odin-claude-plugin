# DeepWiki Recursive Notes: `alexpovel/srgn`

## Table of Contents
1. Coverage Scope
2. Overview
3. Key Concepts
4. Installation and Quick Start
5. Core Architecture
6. Language Support
7. Text Processing Actions
8. Command-Line Interface
9. Development and Testing
10. CI/CD and Release Notes
11. Contribution Notes
12. How to Use These Notes in Skill Responses

## Coverage Scope

These notes summarize recursively fetched DeepWiki pages for `alexpovel/srgn`, including:
1. Overview
2. Key Concepts
3. Installation and Quick Start
4. Core Architecture sections
5. Language support sections
6. Text processing action sections
7. CLI sections
8. Development, testing, CI/CD, and contribution sections

## Overview

`srgn` combines:
1. grep-style regex matching
2. syntax-aware language scoping via tree-sitter
3. transformation actions similar to `tr`/`sed`

Main value:
1. precise code manipulation with syntax boundaries
2. reliable scoping for refactor and migration tasks

## Key Concepts

Core model:
1. Scope selects text regions.
2. Action transforms selected regions.

Scope families:
1. regex scope
2. literal scope
3. language-aware scope (prepared/custom tree-sitter queries)

Composition:
1. language scopes apply before regex scope
2. multiple language scopes intersect by default
3. `-j` switches to joined (OR) behavior

## Installation and Quick Start

Documented install paths:
1. prebuilt binaries from releases
2. Homebrew
3. Nix
4. Arch AUR
5. MacPorts
6. cargo / cargo-binstall
7. CI install via GitHub Actions

Quick use flow:
1. pass scope
2. optionally pass action
3. use language scope for syntax targeting

## Core Architecture

Major components:
1. CLI entrypoint
2. scoping system
3. action pipeline
4. language modules

Data flow:
1. input text/files
2. scoper(s) produce in-scope and out-of-scope regions
3. actions apply to in-scope regions
4. transformed output emitted or written

Internal concept often referenced:
1. scoped view abstraction built from scopers

## Language Support

DeepWiki notes support for:
1. Python
2. Rust
3. Go
4. TypeScript
5. C#
6. HCL
7. C

Language modules provide prepared queries and custom-query escape hatches.
Prepared queries cover comments, strings, imports, type/function constructs, and other language features.

## Text Processing Actions

Actions highlighted in DeepWiki:
1. replacement (with captures)
2. deletion
3. squeeze
4. case conversion
5. normalization
6. symbols substitution
7. german text processing

Behavior notes:
1. replacement runs before other composable actions
2. some actions are standalone in CLI semantics (`-d`, `-s`)
3. inversion applies where mappings are reversible (not universal)

## Command-Line Interface

DeepWiki and README-aligned CLI themes:
1. search mode vs transform mode
2. file processing with `--glob`
3. dry-run behavior for previews
4. output detection (`tty` vs `pipe`)
5. explicit failure flags for CI workflows

Output modes:
1. human-readable line output
2. machine-readable `<file>:<line>:<cols>:<text>` style output

## Development and Testing

DeepWiki testing notes mention:
1. README command validation tests
2. CLI tests
3. property-based tests
4. snapshot tests
5. language-specific tests

Development quality checks include:
1. formatting
2. linting
3. test suite runs

## CI/CD and Release Notes

Pipeline patterns noted:
1. build-and-test automation
2. lint/format enforcement
3. feature combination checks
4. coverage reporting
5. release automation and artifact publishing
6. installation verification across platforms

## Contribution Notes

Contributor guidance emphasizes:
1. pre-commit checks
2. test discipline
3. snapshot handling
4. language support extension path through tree-sitter parsers and queries

## How to Use These Notes in Skill Responses

Use this file as background context.
For concrete user requests, prefer:
1. `cli-cookbook.md` for command recipes
2. `language-scopes.md` for query selection
3. `advanced-patterns.md` for custom queries and CI guardrails

Only pull architecture/development details from this file when users explicitly ask for internals, contribution, or ecosystem context.
