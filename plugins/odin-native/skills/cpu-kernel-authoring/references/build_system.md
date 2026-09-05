# build.toml multi-target CPU compilation

## Overview

Each CPU kernel uses `build.toml` to define multiple compilation targets with different compiler flags. The `kernel-builder` CLI reads this file to produce a Python wheel with all SIMD tiers compiled separately.

## Rules

1. Every section needs `include`. kernel-builder does not add the kernel directory to the header search path, so without it headers fail to resolve across source files.
2. Each ISA tier (generic, AVX2, AVX512) gets its own `[kernel.*]` section and so its own translation unit and flag set.
3. The base section has no `cxx-flags`. It compiles with default flags and no SIMD intrinsics.
4. The AVX2 tier is optional. Only rmsnorm has one; GEMM kernels go from generic to AVX512.

## Example: element-wise kernel with AVX2

Based on `kernels-community/rmsnorm/build.toml`:

```toml
[general]
name = "rmsnorm"
license = "Apache-2.0"
version = 1
backends = ["cpu"]

[general.hub]
repo-id = "kernels-community/rmsnorm"

[torch]
src = ["torch-ext/torch_binding.cpp"]

[kernel.rmsnorm_cpu]
backend = "cpu"
depends = ["torch"]
include = ["rmsnorm_cpu"]
src = [
    "rmsnorm_cpu/rmsnorm_cpu_torch.cpp",
    "rmsnorm_cpu/rmsnorm_cpu.cpp",
    "rmsnorm_cpu/rmsnorm_cpu.hpp",
    "rmsnorm_cpu/cpu_features.hpp",
]

[kernel.rmsnorm_cpu_avx2]
backend = "cpu"
cxx-flags = ["-mavx2", "-mfma", "-fopenmp", "-mf16c"]
depends = ["torch"]
include = ["rmsnorm_cpu"]
src = [
    "rmsnorm_cpu/rmsnorm_avx2.cpp",
    "rmsnorm_cpu/rmsnorm_avx2.hpp",
    "rmsnorm_cpu/cpu_types_avx2.hpp",
]

[kernel.rmsnorm_cpu_avx512]
backend = "cpu"
cxx-flags = ["-mfma", "-fopenmp", "-mf16c", "-mavx512f", "-mavx512bf16", "-mavx512vl"]
depends = ["torch"]
include = ["rmsnorm_cpu"]
src = [
    "rmsnorm_cpu/rmsnorm_avx512.cpp",
    "rmsnorm_cpu/rmsnorm_avx512.hpp",
    "rmsnorm_cpu/cpu_types_avx512.hpp",
]
```

Note: rmsnorm AVX512 only needs `-mavx512f -mavx512bf16 -mavx512vl`. GEMM kernels additionally need `-mavx512dq -mavx512bw -mavx512vbmi` for nibble manipulation.

## Example: GEMM kernel without AVX2

Based on `kernels-community/quantization-gptq/build.toml`:

```toml
[general]
name = "quantization-gptq"
license = "MIT"
version = 1
backends = ["cpu"]

[general.hub]
repo-id = "kernels-community/quantization-gptq"

[torch]
src = ["torch-ext/torch_binding.cpp"]

[kernel.gptq_cpu]
backend = "cpu"
depends = ["torch"]
include = ["gptq_cpu"]
src = [
    "gptq_cpu/gptq_cpu_torch.cpp",
    "gptq_cpu/gptq_cpu.cpp",
    "gptq_cpu/gptq_cpu.hpp",
    "gptq_cpu/cpu_features.hpp",
]

[kernel.gptq_cpu_avx512]
backend = "cpu"
cxx-flags = ["-mfma", "-fopenmp", "-mf16c", "-mavx512f", "-mavx512bf16", "-mavx512vl", "-mavx512dq", "-mavx512bw", "-mavx512vbmi", "-mamx-tile", "-mamx-bf16", "-mamx-int8"]
depends = ["torch"]
include = ["gptq_cpu"]
src = [
    "gptq_cpu/gptq_avx512.cpp",
    "gptq_cpu/gptq_avx512.hpp",
]
```

Note: for GEMM kernels, always include the `-mamx-tile`, `-mamx-bf16`, and `-mamx-int8` flags. Even if `brgemm` dispatches to AMX internally via oneDNN, these flags are required if the kernel (like flash-attn2 or megablocks) uses custom AMX definitions or `cpuid` based checks that compile conditionally.

## Section fields

| Field | Required | Description |
|-------|----------|-------------|
| `backend` | Yes | Always `"cpu"` for CPU kernels |
| `depends` | Yes | Always `["torch"]` |
| `include` | Yes | Header search dirs, typically `["<kernel>_cpu"]` |
| `src` | Yes | List of source files (`.cpp` and `.hpp`) |
| `cxx-flags` | No | Compiler flags. Omit for generic (no-SIMD) sections |

## Compiler flag groups

### AVX2 (element-wise only)
```toml
cxx-flags = ["-mavx2", "-mfma", "-mf16c", "-fopenmp"]
```

### AVX512 (element-wise kernels like rmsnorm)
```toml
cxx-flags = ["-mfma", "-fopenmp", "-mf16c", "-mavx512f", "-mavx512bf16", "-mavx512vl"]
```

### AVX512 (GEMM kernels; vbmi, dq, and bw are needed for nibble manipulation)
```toml
cxx-flags = ["-mfma", "-fopenmp", "-mf16c", "-mavx512f", "-mavx512bf16", "-mavx512vl", "-mavx512dq", "-mavx512bw", "-mavx512vbmi", "-mamx-tile", "-mamx-bf16", "-mamx-int8"]
```

Note: for GEMM kernels, always include the `-mamx-tile`, `-mamx-bf16`, and `-mamx-int8` flags. Even if `brgemm` dispatches to AMX internally via oneDNN, these flags are required if the kernel (like flash-attn2 or megablocks) uses custom AMX definitions or `cpuid` based checks that compile conditionally.

### `at::vec::Vectorized` needs a `CPU_CAPABILITY` macro; `-mavx512f` is not enough

This only applies if your kernel uses ATen's portable vector wrapper
`at::vec::Vectorized<T>` (e.g. `convert_from_float`, `Vectorized<float>::exp()`)
instead of raw `_mm512_*` intrinsics. Raw intrinsics are fine with the flags above.

`<ATen/cpu/vec/vec.h>` picks the vec512 or scalar implementation from a PyTorch
preprocessor macro, not from the `-m` arch flags:

```cpp
#if defined(CPU_CAPABILITY_AVX512)
#include <ATen/cpu/vec/vec512/vec512.h>   // real AVX512 + Sleef
#else
#include <ATen/cpu/vec/vec256/vec256.h>   // and without CPU_CAPABILITY_AVX2 falls to scalar vec_base.h
#endif
```

- `-mavx512f` only defines the compiler macro `__AVX512F__`. It does not define
  `CPU_CAPABILITY_AVX512`, so `at::vec` silently falls back to the scalar
  `vec_base.h`. `-march=native` has the same problem.
- Consequence is worst for transcendentals: scalar `Vectorized<float>::exp()` calls
  `std::expf` element-by-element, while the vec512 path calls `Sleef_expf16_u10`
  (16-wide). In one fused silu kernel this alone cost about 2x against PyTorch until fixed.

Fix: do one of these for any TU that uses `at::vec`:

```cpp
// (a) Source-level, before including vec.h (what gptq_avx512.cpp does):
#define CPU_CAPABILITY_AVX512
#include <ATen/cpu/vec/vec.h>
```
```toml
# (b) Or in build.toml cxx-flags for that section:
cxx-flags = [..., "-DCPU_CAPABILITY_AVX512"]
```

`-DCPU_CAPABILITY=AVX512` (the inline-namespace name) is what upstream PyTorch also
passes; it is optional for correctness and harmless to add alongside.

### Verify that the build vectorized

After building, confirm that the `.so` emitted AVX512 and, if it uses `at::vec`
transcendentals, linked Sleef. A scalar fallback is otherwise invisible:

```bash
objdump -d *.so | grep -c '%zmm'     # AVX512 active: expect > 0
nm -C *.so | grep -i sleef           # at::vec exp and friends: expect U Sleef_expf16_u10
```

If `%zmm` count is 0 or you see `U expf@GLIBC` (scalar libm) where you expected
vectorized math, the `CPU_CAPABILITY_AVX512` macro above is missing.

## File naming conventions

| File | Purpose |
|------|---------|
| `<kernel>_cpu/<kernel>_cpu.cpp` | Dispatcher: checks cpu_features and calls the best tier |
| `<kernel>_cpu/<kernel>_cpu.hpp` | Shared declarations |
| `<kernel>_cpu/<kernel>_cpu_torch.cpp` | Python to C++ bridge (torch tensor wrapping) |
| `<kernel>_cpu/cpu_features.hpp` | CPUID detection (kernel's own namespace) |
| `<kernel>_cpu/<kernel>_avx2.cpp` | AVX2 implementation (optional) |
| `<kernel>_cpu/<kernel>_avx512.cpp` | AVX512 implementation |
| `<kernel>_cpu/cpu_types_avx512.hpp` | Vector type abstractions (optional) |
| `torch-ext/torch_binding.cpp` | Op registration with registration.h macros |

## torch_binding.cpp pattern

Located at `torch-ext/torch_binding.cpp`, referenced by the `[torch]` section in build.toml:

```cpp
#include "registration.h"

// Forward declarations, guarded for multi-device kernels
#if defined(CPU_KERNEL)
torch::Tensor my_kernel_cpu_forward(torch::Tensor input, torch::Tensor weight, float eps);
#endif

TORCH_LIBRARY_EXPAND(TORCH_EXTENSION_NAME, ops) {
    ops.def("forward(Tensor input, Tensor weight, float eps) -> Tensor");
    ops.impl("forward", torch::kCPU, &my_kernel_cpu_forward);
}

REGISTER_EXTENSION(TORCH_EXTENSION_NAME)
```

Note: rmsnorm uses `c10::DispatchKey::CompositeExplicitAutograd` instead of `torch::kCPU` since it handles device routing internally. GPTQ/BnB use `torch::kCPU`.
