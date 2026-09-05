---
name: zig-build-system
description: 'Use when writing or fixing a build.zig: executables, libraries, modules, C sources, build options, test steps, custom steps, or build.zig.zon dependencies. Not for one-file builds: use zig-compiler.'
---

# Zig build system

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user creates or edits `build.zig`, adds a library or C source to a Zig project, needs a `-D` build option, wires `zig build test`, adds a custom step, or manages `build.zig.zon` dependencies. |
| Authority | Read-only. The skill emits `build.zig` and `build.zig.zon` snippets to chat; the user writes them. Rollback is not needed. No remote mutation. |
| Side effect | Chat output. Confirmation runs of `zig build` happen in a scratch copy, not the project tree. |
| Done | The `build.zig` shape for the request is reported, it matches the `std.Build` API of the installed Zig, and a scratch `zig build` of the same shape succeeds. |

## Inputs

- Zig version from `zig version`: required. The snippets below were run on Zig 0.14.1; the build API moves between releases, so re-run the scratch build on the installed version.
- Project layout: required. Which files are executables, libraries, modules, C sources, and tests.
- Build-time options wanted: optional; name, type, default.
- Dependencies: optional; URL and whether a hash is known.

## Procedure

1. Start from `zig init`, which writes `build.zig`, `build.zig.zon`, and `src/`. Build with `zig build`, run with `zig build run`, test with `zig build test`. Done when: the generated project builds.
2. Write the executable, run, and test steps in the current shape, with a module created first and handed to the compile step:

   ```zig
   const std = @import("std");
   pub fn build(b: *std.Build) void {
       const target = b.standardTargetOptions(.{});
       const optimize = b.standardOptimizeOption(.{});
       const exe = b.addExecutable(.{
           .name = "myapp",
           .root_module = b.createModule(.{
               .root_source_file = b.path("src/main.zig"),
               .target = target,
               .optimize = optimize,
           }),
       });
       b.installArtifact(exe);
       const run_cmd = b.addRunArtifact(exe);
       run_cmd.step.dependOn(b.getInstallStep());
       if (b.args) |args| run_cmd.addArgs(args);
       b.step("run", "Run the app").dependOn(&run_cmd.step);
       const unit_tests = b.addTest(.{ .root_module = exe.root_module });
       b.step("test", "Run unit tests").dependOn(&b.addRunArtifact(unit_tests).step);
   }
   ```

   `addExecutable` still accepts `.root_source_file`, `.target`, and `.optimize` directly, but Zig 0.14.1 marks those fields deprecated in favor of `.root_module`. Done when: `zig build`, `zig build run`, and `zig build test` all resolve.
3. Add libraries with `b.addLibrary(.{ .linkage = .static, .name = "mylib", .root_module = <module> })`; use `.linkage = .dynamic` plus `.version = .{ .major = 1, .minor = 0, .patch = 0 }` for a shared library. `addStaticLibrary` and `addSharedLibrary` still exist on 0.14.1. Link into an executable with `exe.linkLibrary(lib)`. Done when: `zig-out/lib` holds the artifact.
4. Add C sources: `exe.addCSourceFile(.{ .file = b.path("src/legacy.c"), .flags = &.{ "-std=c11", "-Wall" } })` for one file, `exe.addCSourceFiles(.{ .files = &.{ "src/a.c", "src/b.c" }, .flags = &.{"-std=c11"} })` for several (paths are strings relative to the package, or set `.root`). Include paths: `exe.addIncludePath(b.path("include"))`. System libraries: `exe.linkSystemLibrary("curl")`. Always `exe.linkLibC()` when C code or the C standard library is involved. Done when: the C objects link into the artifact.
5. Expose build options. Declare with `b.option(bool, "logging", "Enable debug logging") orelse false`; enums and integers work the same way. Pass them to Zig code through `const options = b.addOptions(); options.addOption(bool, "enable_logging", enable_logging); exe.root_module.addOptions("build_options", options);` and read them with `@import("build_options")`. Users set them with `zig build -Dlogging=true -Dbackend=vulkan`. Done when: `zig build --help` lists the option.
6. Share code through modules: `const utils = b.addModule("utils", .{ .root_source_file = b.path("src/utils.zig") });` then `exe.root_module.addImport("utils", utils);` and the same on any test module; source imports it with `@import("utils")`. Done when: both the executable and its tests import the module.
7. Declare dependencies in `build.zig.zon`. On 0.14.1 the manifest has `.name` as an enum literal (`.name = .myapp`), a `.fingerprint`, `.version`, `.minimum_zig_version`, `.dependencies`, and `.paths`. Each dependency is `.{ .url = "<tarball url>", .hash = "<hash>" }`; run `zig build` (or `zig fetch <url>`) and Zig prints the hash to paste when it is missing. Consume with `const dep = b.dependency("zig_clap", .{ .target = target, .optimize = optimize });` and `exe.root_module.addImport("clap", dep.module("clap"));`. Done when: `zig build --fetch` completes and the import resolves.
8. Add custom steps: `b.addSystemCommand(&.{ "python3", "scripts/gen.py", "--output", "src/generated.zig" })` with `exe.step.dependOn(&gen.step)` for generation; `b.addInstallFile(b.path("config/default.toml"), "share/myapp/config.toml")` hooked to `b.getInstallStep()` for extra install files; `b.addWriteFile` for generated sources. Inspect the graph with `zig build --verbose` and change the install root with `--prefix`. Done when: the step appears in `zig build --help` or runs in the graph.
9. Confirm the final `build.zig` with a scratch `zig build` and `zig build test` on the installed Zig before reporting. Done when: both succeed.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Field or function missing on the installed Zig | Read the API in `<zig lib dir>/std/Build.zig` (`zig env` prints `lib_dir`) and adjust; the shape changes between releases. |
| `duplicate symbol` at link | The same C file was added twice or two artifacts define one symbol; add each source once. |
| Hash mismatch for a dependency | Paste the hash Zig prints; a changed upstream tarball needs the new hash. |
| C library found only through pkg-config or a vendor path | Add the include and library paths explicitly; `linkSystemLibrary` alone finds only what the system linker sees. |
| Cross-target build in the same file | Multi-target loops over `std.Target.Query`: use zig-cross. |

## Output

A chat report holding the complete `build.zig` (and `build.zig.zon` when dependencies are involved) for the request, the `zig build` commands the user runs, and the line confirming the scratch build passed on the installed Zig version.
