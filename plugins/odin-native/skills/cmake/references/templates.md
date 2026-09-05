# CMake project templates

Floors at CMake 3.25 so preset schema version 6 and current commands apply.
Standards follow the repo floor: C23 and C++23.

## Minimal C library plus executable

```text
myproject/
├── CMakeLists.txt
├── include/mylib/mylib.h
├── src/mylib.c
├── src/main.c
└── test/test_mylib.c
```

```cmake
cmake_minimum_required(VERSION 3.25)
project(MyProject VERSION 1.0 LANGUAGES C)

set(CMAKE_C_STANDARD 23)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_library(mylib STATIC src/mylib.c)
target_include_directories(mylib PUBLIC include)
target_compile_options(mylib PRIVATE -Wall -Wextra)

add_executable(myapp src/main.c)
target_link_libraries(myapp PRIVATE mylib)

enable_testing()
add_executable(test_mylib test/test_mylib.c)
target_link_libraries(test_mylib PRIVATE mylib)
add_test(NAME mylib_tests COMMAND test_mylib)

install(TARGETS myapp RUNTIME DESTINATION bin)
install(TARGETS mylib ARCHIVE DESTINATION lib)
install(DIRECTORY include/ DESTINATION include)
```

## C++ project with GoogleTest via FetchContent

```cmake
cmake_minimum_required(VERSION 3.25)
project(MyProject VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(mylib STATIC src/engine.cpp src/parser.cpp)
target_include_directories(mylib PUBLIC include PRIVATE src)
target_compile_options(mylib PRIVATE
    -Wall -Wextra
    $<$<CONFIG:Debug>:-g -Og>
    $<$<CONFIG:Release>:-O2 -DNDEBUG>
)

add_executable(myapp src/main.cpp)
target_link_libraries(myapp PRIVATE mylib)

include(FetchContent)
FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG        v1.17.0
    GIT_SHALLOW    TRUE
)
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

enable_testing()
add_executable(unit_tests test/test_engine.cpp test/test_parser.cpp)
target_link_libraries(unit_tests PRIVATE mylib GTest::gtest_main)
include(GoogleTest)
gtest_discover_tests(unit_tests)
```

## Sanitizer option pattern

```cmake
option(SANITIZE_ADDRESS   "Enable ASan"  OFF)
option(SANITIZE_THREAD    "Enable TSan"  OFF)
option(SANITIZE_UNDEFINED "Enable UBSan" OFF)

set(SANITIZER_FLAGS "")
if(SANITIZE_ADDRESS)
    list(APPEND SANITIZER_FLAGS -fsanitize=address -fno-omit-frame-pointer)
endif()
if(SANITIZE_THREAD)
    list(APPEND SANITIZER_FLAGS -fsanitize=thread)
endif()
if(SANITIZE_UNDEFINED)
    list(APPEND SANITIZER_FLAGS -fsanitize=undefined)
endif()

if(SANITIZER_FLAGS)
    add_compile_options(${SANITIZER_FLAGS})
    add_link_options(${SANITIZER_FLAGS})
endif()
```

ASan and TSan are mutually exclusive; do not enable both in one build.

## Dependency management patterns

System package with a FetchContent fallback:

```cmake
find_package(ZLIB QUIET)
if(NOT ZLIB_FOUND)
    include(FetchContent)
    FetchContent_Declare(zlib
        GIT_REPOSITORY https://github.com/madler/zlib.git
        GIT_TAG        v1.3.1
    )
    FetchContent_MakeAvailable(zlib)
    set(ZLIB_TARGET zlibstatic)
else()
    set(ZLIB_TARGET ZLIB::ZLIB)
endif()
target_link_libraries(myapp PRIVATE ${ZLIB_TARGET})
```

Vendored in-tree library:

```cmake
add_subdirectory(third_party/json)
target_link_libraries(myapp PRIVATE nlohmann_json::nlohmann_json)
```
