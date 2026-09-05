---
name: include-what-you-use
description: 'Use when reducing header bloat and compilation cascades with Include What You Use, interpreting IWYU reports, mapping files, forward declarations, or CMake integration.'
---

# Include What You Use

IWYU finds `#include` directives a file does not need and ones it implicitly relies on. Grounded against IWYU 0.26.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task reduces C/C++ header bloat or compilation cascades, runs or interprets IWYU, writes mapping files, decides between forward declarations and full includes, or wires IWYU into a build. |
| Authority | Reversible local: writes only source files (through `fix_include`), `.imp` mapping files, and build configuration; rollback is version control. No remote mutation. |
| Side effect | `fix_include` edits source files in place; IWYU analysis runs the compiler front end on each translation unit. |
| Done | The IWYU report is produced, applied or triaged, and the project still builds and passes its tests. |

## Inputs

- A C/C++ project with a compilation database (required): `compile_commands.json` from CMake, Bear, or compiledb.
- IWYU installation (required): `iwyu`/`include-what-you-use` plus `iwyu_tool.py` and `fix_include` from the same package.
- Mapping files (optional): project or third-party `.imp` files.

## Procedure

1. Produce a compilation database if none exists. Done when: `compile_commands.json` covers the files to analyze.

```bash
cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
# or for Make-based trees: bear -- make
```

2. Run IWYU. Done when: the report covers the intended translation units.

```bash
# Single file
iwyu -Xiwyu --error main.cpp 2>&1

# Whole project through the compilation database
iwyu_tool.py -p build/ 2>&1 | tee iwyu.log
```

3. Wire IWYU into CMake for continuous checking. Done when: the build emits IWYU advice per translation unit.

```cmake
find_program(IWYU_PROGRAM NAMES include-what-you-use iwyu)
if(IWYU_PROGRAM)
    set(CMAKE_CXX_INCLUDE_WHAT_YOU_USE
        ${IWYU_PROGRAM}
        -Xiwyu --mapping_file=${CMAKE_SOURCE_DIR}/iwyu.imp
        -Xiwyu --no_comments
    )
endif()
```

4. Read the report. `should add` names headers that provide symbols the file uses but does not include. `should remove` names headers whose symbols the file does not use directly. `The full include-list` is the suggested final state. Done when: each add and remove line is classified as correct, wrong, or needing a mapping.

```text
main.cpp should add these lines:
#include <string>          // for std::string
#include "mylib/widget.h"  // for Widget

main.cpp should remove these lines:
- #include <vector>       // lines 5-5

The full include-list for main.cpp:
#include <string>          // for std::string
#include "mylib/widget.h"  // for Widget
---
```

5. Apply fixes with `fix_include`, then rebuild and test before accepting. Done when: the tree builds and tests pass after the edits.

```bash
fix_include --dry_run < iwyu.log          # preview only
fix_include < iwyu.log                    # apply
fix_include --nosafe_headers < iwyu.log   # also remove "safe" system headers
fix_include --comments < iwyu.log         # keep the // for-symbol comments
fix_include --only_re='src/.*\.cpp' < iwyu.log   # limit to matching files
```

6. Prefer forward declarations in headers when the full type is not needed. Done when: headers that only name a type through a pointer or reference use a forward declaration.

```cpp
// Forward declaration suffices for:
class Widget;
void process(Widget *w);    // pointer or reference parameters
Widget *make();             // pointer return types

// Full include is required for:
class Mine : public Widget {};   // inheritance
void f() { Widget w; w.size(); } // instances, member access, sizeof
std::vector<Widget> items;       // template instantiation
```

```cpp
// IWYU-friendly header: the .cpp pays the include cost, consumers do not
#pragma once
class Widget;

class Container {
    Widget *head_;
public:
    void add(Widget *w);
    Widget *get(int idx);
};
```

7. Write mapping files for third-party headers. `.imp` files are JSON-like and allow `#` comments and trailing commas. Done when: IWYU stops suggesting private or internal headers.

```python
# iwyu.imp
[
  # Map an internal header to its public entry point
  { "include": ["<bits/types.h>", "private", "<sys/types.h>", "public"] },
  { "include": ["<bits/socket.h>", "private", "<sys/socket.h>", "public"] },

  # Map a symbol to the header that must provide it
  { "symbol": ["std::string", "private", "<string>", "public"] },
]
```

```bash
iwyu -Xiwyu --mapping_file=iwyu.imp main.cpp
# IWYU ships mappings for STL, Boost, and libc++; check the package's
# share directory, e.g. /usr/share/include-what-you-use/
```

8. Iterate. IWYU is wrong often enough that blind application breaks builds: macros, template specializations, and headers kept for ODR reasons all confuse it. Run, apply, rebuild, test, revert what breaks, repeat. Done when: the report is clean or the remaining advice is documented as rejected.

```bash
# Measure the cascade a header causes before removing it
grep -rl '#include "expensive.h"' src/ | wc -l
```

## Failure and recovery

- Build breaks after `fix_include`: revert the file and add a mapping or a `// IWYU pragma: keep` comment on the include that must stay.
- IWYU suggests a private header: add an `include` mapping from the private path to the public one.
- IWYU removes a header needed for a macro: keep it with `// IWYU pragma: keep`; macro provenance is a known blind spot.
- `iwyu_tool.py` finds no files: the compilation database is missing or empty; regenerate it with `CMAKE_EXPORT_COMPILE_COMMANDS=ON`.
- Report is huge: scope with `--only_re` or run per-directory; fix the most-included headers first, they dominate the cascade.

## Output

An IWYU report triaged into applied fixes and documented rejections, a tree that still builds and tests clean, and where useful a project `.imp` mapping file that stops recurring bad advice.
