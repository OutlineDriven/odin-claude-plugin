# Conan and vcpkg patterns reference

Grounded against Conan 2.32.0 and vcpkg 2026.07.29.

## vcpkg baseline pinning

`builtin-baseline` pins every package to the versions at one vcpkg commit:

```json
{
    "name": "myapp",
    "version": "1.0.0",
    "builtin-baseline": "<vcpkg commit sha>",
    "dependencies": [
        "zlib",
        "fmt",
        { "name": "openssl", "version>=": "3.0.0" }
    ]
}
```

```bash
git -C /path/to/vcpkg rev-parse HEAD   # current baseline
vcpkg x-update-baseline                # refresh the baseline field
```

## vcpkg features and triplets

```json
{
    "dependencies": [
        { "name": "boost", "features": ["filesystem", "program_options"] },
        { "name": "openssl", "default-features": false, "features": ["ssl", "crypto"] }
    ]
}
```

```cmake
# triplets/x64-linux-release.cmake
set(VCPKG_TARGET_ARCHITECTURE x64)
set(VCPKG_CRT_LINKAGE static)
set(VCPKG_LIBRARY_LINKAGE static)
set(VCPKG_CMAKE_SYSTEM_NAME Linux)
set(VCPKG_BUILD_TYPE release)   # build release only, skip debug
```

```bash
cmake -S . -B build \
    -DCMAKE_TOOLCHAIN_FILE=/vcpkg/scripts/buildsystems/vcpkg.cmake \
    -DVCPKG_TARGET_TRIPLET=x64-linux-release \
    -DVCPKG_OVERLAY_TRIPLETS=triplets/
```

## vcpkg in CI

Bootstrap vcpkg in the workflow, then configure with its toolchain file.
Pin the vcpkg commit in `builtin-baseline` so CI and local builds resolve the
same package set.

```bash
git clone https://github.com/microsoft/vcpkg.git "$VCPKG_ROOT"
"$VCPKG_ROOT"/bootstrap-vcpkg.sh -disableMetrics
cmake -S . -B build \
    -DCMAKE_TOOLCHAIN_FILE="$VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake" \
    -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

## vcpkg overlay ports

Overlay ports add packages the registry does not carry:

```text
my-project/
├── vcpkg.json
└── ports/
    └── mylib/
        ├── vcpkg.json
        ├── portfile.cmake
        └── usage
```

```cmake
# portfile.cmake
vcpkg_from_github(
    OUT_SOURCE_PATH SOURCE_PATH
    REPO myorg/mylib
    REF v1.2.3
    SHA512 <sha512 of the archive>
    HEAD_REF main
)
vcpkg_cmake_configure(SOURCE_PATH "${SOURCE_PATH}")
vcpkg_cmake_install()
vcpkg_cmake_config_fixup()   # provided by the vcpkg-cmake-config helper port
file(INSTALL "${SOURCE_PATH}/LICENSE"
     DESTINATION "${CURRENT_PACKAGES_DIR}/share/${PORT}")
```

```bash
cmake -S . -B build \
    -DCMAKE_TOOLCHAIN_FILE=/vcpkg/scripts/buildsystems/vcpkg.cmake \
    -DVCPKG_OVERLAY_PORTS=ports/
```

## Conan remotes and binary cache

```bash
conan remote list
conan remote add mycompany https://artifactory.example.com/artifactory/api/conan/conan-local

# Upload is a remote write; run it only on explicit request
conan upload "*" --remote mycompany --confirm

# Consume prebuilt binaries without --build=missing
conan install . --remote mycompany
```

## Conan lockfiles

```bash
conan lock create . --build=missing        # write conan.lock
conan install . --lockfile=conan.lock      # reproduce from the lockfile
conan lock update conan.lock               # refresh after a dependency change
```

`--lockfile-out=<path>` on `conan install` writes the resolved lockfile to a
separate file; `--lockfile-partial` tolerates deps missing from the lock.

## Mixing Conan and non-Conan dependencies

```cmake
# Conan-managed
find_package(fmt REQUIRED)
find_package(OpenSSL REQUIRED)

# System-provided
find_package(Threads REQUIRED)
find_package(X11)

# Vendored in-tree
add_subdirectory(third_party/myhdr)
```

## Packaging your own library with Conan

```python
from conan import ConanFile
from conan.tools.cmake import CMake, cmake_layout

class MyLibConan(ConanFile):
    name = "mylib"
    version = "1.0.0"
    settings = "os", "compiler", "build_type", "arch"
    exports_sources = "src/*", "include/*", "CMakeLists.txt"

    def layout(self):
        cmake_layout(self)

    def build(self):
        cmake = CMake(self)
        cmake.configure()
        cmake.build()

    def package(self):
        CMake(self).install()

    def package_info(self):
        self.cpp_info.libs = ["mylib"]
```

```bash
conan create . --build=missing   # builds and exports to the local cache
# consumers then require: mylib/1.0.0
```
