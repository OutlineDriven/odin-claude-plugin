---
name: cpp-modules
description: 'Use when a C++ project adopts C++20 modules: named modules, partitions, header units, the global module fragment, CMake CXX_MODULES, or a BMI lookup error. Not for flag basics: use clang.'
---

# C++20 modules

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user writes or builds `export module` code, asks how named modules differ from header units, needs the CMake wiring for module interface units, or gets a module-not-found, redefinition, or stale-BMI error. |
| Authority | Read-only. The skill emits module source shapes, compiler invocations, and CMake snippets to chat; the user applies them. Rollback is not needed. No remote mutation. |
| Side effect | Chat output. Any scratch build to confirm a flag runs on scratch files. |
| Done | The module layout, the per-compiler build commands, and the CMake wiring are reported for the user's compiler and CMake version, and every error in the request maps to a cause and fix. |

## Inputs

- Compiler and version: required. Clang 23.1.0 and GCC 16.2 are current stable; both accept the commands below.
- CMake version when CMake is in use: required. Current stable is 4.4.3; the stable `CXX_MODULES` file set needs 3.28 or later.
- Generator: required with CMake. Ninja 1.11 or later, Ninja Multi-Config, or Visual Studio; Makefile generators do not support modules.
- Module layout the user has or wants: required. Primary interface, partitions, implementation units, and any legacy headers with macros.

## Procedure

1. Classify each translation unit. Primary interface unit: `export module m;` in a `.cppm` (or `.ixx`) file. Partition interface: `export module m:part;`, re-exported from the primary with `export import :part;`. Implementation unit: `module m;` with no exports. Header unit: `import <vector>;` or `import "local.h";`, a bridge for legacy headers. Prefer named modules; use header units only to bridge. Done when: every file has one classification.
2. Handle macros. Macros do not cross `import`. Code that needs a header's macros puts `#include` in the global module fragment: a file that opens with `module;`, then the includes, then `export module m;`. Wrap a C library the same way and re-export with `export using ::name;`. Done when: every macro dependency is in a global module fragment.
3. Build with Clang. Precompile the interface: `clang++ -std=c++20 --precompile math.cppm -o math.pcm`. Compile users against it: `clang++ -std=c++20 -fmodule-file=math=math.pcm -c main.cpp -o main.o`. Link the interface's object as well: `clang++ -std=c++20 -fmodule-file=math=math.pcm math.pcm main.o -o prog`. Done when: the three commands are given in dependency order.
4. Build with GCC. `g++ -std=c++20 -fmodules-ts -c math.cppm -o math.o` writes `math.gcm` under `gcm.cache/` in the working directory, and `g++ -std=c++20 -fmodules-ts main.cpp math.o -o prog` finds it there. GCC 16 also accepts `-fmodules`; both spellings compile on the installed 16 line. Done when: the interface is compiled before its importers and the cache directory is named.
5. Wire CMake 3.28 or later:

   ```cmake
   cmake_minimum_required(VERSION 3.28)
   project(myproject LANGUAGES CXX)
   set(CMAKE_CXX_STANDARD 20)
   add_library(math)
   target_sources(math
       PUBLIC FILE_SET CXX_MODULES FILES src/math.cppm src/math-core.cppm
       PRIVATE src/math-impl.cpp)
   add_executable(myapp main.cpp)
   target_link_libraries(myapp PRIVATE math)
   ```

   Configure with `cmake -S . -B build -G Ninja` and build with `cmake --build build`. Install the interfaces with `install(TARGETS math FILE_SET CXX_MODULES DESTINATION include/math)`. Done when: interface units are in the `CXX_MODULES` file set and the generator supports dynamic dependencies.
6. Map errors from the table; reproduce on scratch files when the message is not listed. Done when: each error has a cause and fix.

   | Error | Cause | Fix |
   |---|---|---|
   | module `m` not found | BMI absent or not on the lookup path | Compile the interface first; pass `-fmodule-file=m=<path>` (Clang) or run in the directory holding `gcm.cache/` (GCC) |
   | `#include` inside the module purview rejected | Include placed after `export module` | Move it to the global module fragment or import a header unit |
   | redefinition of module `m` | Two files declare the same primary interface | One primary interface per module; make the second a partition |
   | macro undefined after `import` | Macros do not cross module boundaries | Global module fragment with `#include` |
   | ODR violation across partitions | One name exported from two partitions | Export each name from exactly one partition |
   | stale results after an edit | BMI not rebuilt | Rebuild the interface; with CMake, use a generator that tracks module dependencies |

7. Confirm the commands on the installed compiler with a two-file scratch module before reporting. Done when: the scratch build links and runs.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| CMake older than 3.28 | Report that stable module support starts at 3.28; the experimental 3.25 API is not recommended. |
| Makefile generator selected | Switch to Ninja; report that Make lacks the dynamic dependency support modules need. |
| `import std;` requested | Report it as toolchain-dependent and confirm on the user's standard library before promising it. |
| Compiler older than the current line | Confirm each flag with a scratch build; module support in earlier lines is uneven. |
| Precompiled headers as an alternative | PCH and build caching: use build-acceleration. |

## Output

A chat report with the classified module layout, the ordered build commands for the user's compiler, the CMake snippet when CMake is in use, and the error table entries that apply.
