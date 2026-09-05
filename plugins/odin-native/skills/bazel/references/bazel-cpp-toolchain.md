# Bazel C++ toolchain reference

Grounded against Bazel 9.2.0 and rules_cc 0.2.x. Bazel 9 removed the native C++
rules and the old `@bazel_tools//tools/cpp:cc_toolchain_config.bzl` macro. C++
rules and toolchain support now live in `rules_cc`.

## Loading C++ rules

Every BUILD file that uses a C++ rule loads it explicitly:

```python
load("@rules_cc//cc:defs.bzl", "cc_library", "cc_binary", "cc_test", "cc_toolchain")
```

`rules_cc` must be a `bazel_dep` in `MODULE.bazel`:

```python
bazel_dep(name = "rules_cc", version = "0.2.17")
bazel_dep(name = "platforms", version = "1.0.0")
```

## Platform and toolchain registration

```python
# platforms/BUILD
platform(
    name = "linux_x86_64",
    constraint_values = [
        "@platforms//os:linux",
        "@platforms//cpu:x86_64",
    ],
)
```

```python
# toolchains/BUILD
load("@rules_cc//cc:defs.bzl", "cc_toolchain")

cc_toolchain(
    name = "k8_toolchain",
    all_files = ":empty",
    ar_files = ":empty",
    as_files = ":empty",
    compiler_files = ":empty",
    dwp_files = ":empty",
    linker_files = ":empty",
    objcopy_files = ":empty",
    strip_files = ":empty",
    toolchain_config = ":k8_toolchain_config",
    toolchain_identifier = "k8-toolchain",
)

toolchain(
    name = "cc_toolchain_k8",
    exec_compatible_with = [
        "@platforms//cpu:x86_64",
        "@platforms//os:linux",
    ],
    target_compatible_with = [
        "@platforms//cpu:x86_64",
        "@platforms//os:linux",
    ],
    toolchain = ":k8_toolchain",
    toolchain_type = "@rules_cc//cc:toolchain_type",
)

filegroup(name = "empty")
```

```python
# MODULE.bazel
register_toolchains("//toolchains:cc_toolchain_k8")
```

The `toolchain_config` attribute takes a target providing
`CcToolchainConfigInfo`. Build one with the primitives in
`@rules_cc//cc:cc_toolchain_config_lib.bzl` (`feature`, `flag_set`,
`flag_group`, `action_config`, `tool_path`, `env_set`), or use the
rule-based toolchain API under `@rules_cc//cc/toolchains`. Read the rules_cc
source for the current signatures; the API changed between Bazel 8 and 9 and
examples written for `@bazel_tools` no longer apply.

## Common build flags

```bash
bazel build //... -c opt          # optimized build
bazel build //... -c dbg          # debug build

# Select a registered toolchain explicitly
bazel build //... --extra_toolchains=//toolchains:cc_toolchain_k8

# Pass compiler and linker flags
bazel build //... --copt=-fsanitize=address --linkopt=-fsanitize=address

# Target a specific platform
bazel build //... --platforms=//platforms:linux_x86_64
```

## Cross-compilation sketch

A cross toolchain pairs a `platform` for the target (for example
`@platforms//cpu:aarch64` plus `@platforms//os:linux`) with a `cc_toolchain`
whose tool paths point at the cross prefix (`aarch64-linux-gnu-gcc` and
friends) and whose config passes `--sysroot` through `compile_flags` and
`link_flags`. Register it the same way and select it with `--platforms`.
