---
name: conan-vcpkg
description: 'Use when adding C/C++ dependencies with Conan or vcpkg, managing binary compatibility, integrating with CMake via conanfile.txt or vcpkg.json, or choosing between Conan and vcpkg.'
---

# Conan and vcpkg

C/C++ dependency management with Conan and vcpkg. Grounded against Conan 2.32.0 and vcpkg 2026.07.29.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task adds a third-party C/C++ library, writes `conanfile.txt`/`conanfile.py` or `vcpkg.json`, integrates a package manager with CMake, manages binary compatibility, or picks between Conan and vcpkg. |
| Authority | Reversible local: writes only `conanfile.*`, `vcpkg.json`, profiles, triplets, overlay ports, and the local package caches; rollback is version control plus clearing the cache. No remote mutation. |
| Side effect | Package installs download sources or binaries into the local Conan or vcpkg cache; `conan upload` pushes to a remote and requires an explicit user request. |
| Done | The declared dependencies resolve and the project configures and builds against them, or the failing command is reported. |

## Inputs

- Dependency list (required): library names; versions come from ConanCenter or the vcpkg registry.
- Build system (required): CMake integration is assumed below.
- Platform constraints (optional): cross-compilation target, static vs shared linkage, MSVC vs GCC/Clang.
- Private remote (optional): an Artifactory or Conan remote URL supplied by the user.

## Procedure

1. Pick the package manager. Done when: one tool is chosen with a stated reason.

| Situation | Pick |
|---|---|
| MSVC-first Windows team | vcpkg: tighter MSVC and Visual Studio integration |
| Prebuilt binaries in CI, no source builds | Conan: binary package cache and package IDs |
| Cross-compilation profiles | Conan: host/build profile split |
| Exact version pinning per package | Conan: explicit version references |
| Fast setup for a small project | vcpkg manifest mode |
| Open-source project with broad audience | vcpkg: lower barrier for contributors |

2. Set up vcpkg in manifest mode. Done when: `vcpkg.json` exists and CMake configures with the vcpkg toolchain file.

```bash
git clone https://github.com/microsoft/vcpkg.git
./vcpkg/bootstrap-vcpkg.sh     # Linux/macOS; .bat on Windows
```

```json
{
    "name": "myapp",
    "version": "1.0.0",
    "dependencies": [
        "zlib",
        "curl",
        { "name": "openssl", "version>=": "3.0.0" },
        { "name": "boost-filesystem", "platform": "!windows" },
        { "name": "fmt", "features": ["core"] }
    ],
    "builtin-baseline": "<vcpkg commit sha>"
}
```

Pin `builtin-baseline` to a vcpkg commit so every build resolves the same package set; get it with `git -C /path/to/vcpkg rev-parse HEAD` and refresh it with `vcpkg x-update-baseline`.

```bash
cmake -S . -B build \
    -DCMAKE_TOOLCHAIN_FILE=/path/to/vcpkg/scripts/buildsystems/vcpkg.cmake
cmake --build build
```

```cmake
find_package(ZLIB REQUIRED)
find_package(CURL REQUIRED)
find_package(fmt REQUIRED)
target_link_libraries(myapp PRIVATE ZLIB::ZLIB CURL::libcurl fmt::fmt)
```

3. Set up Conan 2 with the CMake generators. Done when: `conan install` produces `conan_toolchain.cmake` and the project configures against it.

```bash
pip install conan
conan profile detect     # writes a default profile for the local compiler
conan profile show       # inspect it
```

```ini
# conanfile.txt; versions are examples, check ConanCenter for current releases
[requires]
zlib/1.3
fmt/10.2.1
openssl/3.2.0

[generators]
CMakeDeps
CMakeToolchain

[options]
openssl/*:shared=False
```

```bash
conan install . --output-folder=build --build=missing
cmake -S . -B build \
    -DCMAKE_TOOLCHAIN_FILE=build/conan_toolchain.cmake \
    -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

```cmake
find_package(ZLIB REQUIRED)
find_package(fmt REQUIRED)
find_package(OpenSSL REQUIRED)
target_link_libraries(myapp PRIVATE ZLIB::ZLIB fmt::fmt OpenSSL::SSL OpenSSL::Crypto)
```

4. Cross-compile with Conan profiles. The host profile describes the target; the build profile describes the machine running the build. Done when: `conan install --profile:host=<target>` resolves packages for the target.

```ini
# ~/.conan2/profiles/linux-arm64
[settings]
os=Linux
arch=armv8
compiler=gcc
compiler.version=12
compiler.libcxx=libstdc++11
build_type=Release

[buildenv]
CC=aarch64-linux-gnu-gcc
CXX=aarch64-linux-gnu-g++
```

```bash
conan install . \
    --profile:build=default \
    --profile:host=linux-arm64 \
    --output-folder=build-arm \
    --build=missing
```

5. Use `conanfile.py` when logic is needed: conditional requirements, custom generate or build steps. Done when: the recipe's `requirements`, `generate`, and `build` methods cover the project's conditions.

```python
from conan import ConanFile
from conan.tools.cmake import CMakeToolchain, CMakeDeps, CMake

class MyAppConan(ConanFile):
    name = "myapp"
    version = "1.0"
    settings = "os", "compiler", "build_type", "arch"

    def requirements(self):
        self.requires("zlib/1.3")
        self.requires("fmt/10.2.1")
        if self.settings.os == "Linux":
            self.requires("openssl/3.2.0")

    def generate(self):
        CMakeToolchain(self).generate()
        CMakeDeps(self).generate()

    def build(self):
        cmake = CMake(self)
        cmake.configure()
        cmake.build()
```

6. Map common libraries between the two registries. Done when: each needed library has a name in the chosen registry.

| Library | vcpkg name | Conan name |
|---|---|---|
| zlib | `zlib` | `zlib` |
| OpenSSL | `openssl` | `openssl` |
| libcurl | `curl` | `libcurl` |
| {fmt} | `fmt` | `fmt` |
| spdlog | `spdlog` | `spdlog` |
| Boost | `boost` | `boost` |
| nlohmann-json | `nlohmann-json` | `nlohmann_json` |
| GoogleTest | `gtest` | `gtest` |
| Google Benchmark | `benchmark` | `benchmark` |
| SQLite | `sqlite3` | `sqlite3` |
| protobuf | `protobuf` | `protobuf` |

For baseline pinning, triplets, overlay ports, binary caches, and lockfiles see `references/package-manager-patterns.md`.

## Failure and recovery

- Package not found: check the name against the registry (`conan search` or `vcpkg search`); names differ between the two.
- `conan install --build=missing` builds from source and fails: read the package build log; a missing system tool or an unsupported setting (`compiler.libcxx`, `arch`) is the usual cause.
- Binary incompatibility (link errors, ABI mismatch): rebuild the package with the project's `build_type` and compiler settings; Conan package IDs encode these.
- vcpkg resolves wrong versions: pin `builtin-baseline`; without it the registry floats.
- CMake cannot find Conan-generated files: confirm `-DCMAKE_TOOLCHAIN_FILE` points at the `conan_toolchain.cmake` under the `--output-folder` used at install time.
- `conan upload` is a remote write: run it only when the user explicitly asks to publish.

## Output

A working dependency declaration (`conanfile.txt`/`conanfile.py` or `vcpkg.json`), the matching CMake integration, and a verified configure and build. For selection tasks, the decision table row that applies with its reason.
