# SIMD intrinsics quick reference

## x86 headers

`<immintrin.h>` provides every x86 intrinsic through AVX-512; include it and skip the per-level headers.

## x86 vector types

| Type | Width | Elements |
|------|-------|----------|
| `__m128` | 128-bit | 4 x f32 |
| `__m128d` | 128-bit | 2 x f64 |
| `__m128i` | 128-bit | integer variants |
| `__m256` | 256-bit | 8 x f32 |
| `__m256d` | 256-bit | 4 x f64 |
| `__m256i` | 256-bit | integer variants |
| `__m512` | 512-bit | 16 x f32 |
| `__m512d` | 512-bit | 8 x f64 |
| `__m512i` | 512-bit | integer variants |

## Float intrinsics, SSE2 versus AVX2

| Operation | SSE2 (4 x f32) | AVX2 (8 x f32) |
|-----------|----------------|----------------|
| Aligned load | `_mm_load_ps` | `_mm256_load_ps` |
| Unaligned load | `_mm_loadu_ps` | `_mm256_loadu_ps` |
| Aligned store | `_mm_store_ps` | `_mm256_store_ps` |
| Unaligned store | `_mm_storeu_ps` | `_mm256_storeu_ps` |
| Add | `_mm_add_ps` | `_mm256_add_ps` |
| Subtract | `_mm_sub_ps` | `_mm256_sub_ps` |
| Multiply | `_mm_mul_ps` | `_mm256_mul_ps` |
| Divide | `_mm_div_ps` | `_mm256_div_ps` |
| FMA, needs FMA feature | `_mm_fmadd_ps` | `_mm256_fmadd_ps` |
| Min, max | `_mm_min_ps`, `_mm_max_ps` | `_mm256_min_ps`, `_mm256_max_ps` |
| Sqrt | `_mm_sqrt_ps` | `_mm256_sqrt_ps` |
| Broadcast | `_mm_set1_ps` | `_mm256_set1_ps` |
| Zero | `_mm_setzero_ps` | `_mm256_setzero_ps` |
| Compare equal | `_mm_cmpeq_ps` | `_mm256_cmp_ps(v, v, _CMP_EQ_OQ)` |
| Blend | `_mm_blend_ps` | `_mm256_blend_ps` |
| Shuffle | `_mm_shuffle_ps` | `_mm256_shuffle_ps` |
| Horizontal add | `_mm_hadd_ps`, SSE3 | `_mm256_hadd_ps` |

## AVX2 integer intrinsics

| Operation | 32-bit integer, 8 lanes |
|-----------|-------------------------|
| Load | `_mm256_loadu_si256` |
| Store | `_mm256_storeu_si256` |
| Add | `_mm256_add_epi32` |
| Multiply low | `_mm256_mullo_epi32` |
| And, or, xor | `_mm256_and_si256`, `_mm256_or_si256`, `_mm256_xor_si256` |
| Shift left or right | `_mm256_slli_epi32`, `_mm256_srli_epi32` |
| Gather | `_mm256_i32gather_epi32(base, idx, scale)` |
| Broadcast | `_mm256_set1_epi32` |
| Compare equal | `_mm256_cmpeq_epi32` |
| Blend by mask | `_mm256_blendv_epi8` |

## ARM NEON types

| Type | Elements | Width |
|------|----------|-------|
| `uint8x16_t` | 16 x u8 | 128-bit |
| `uint32x4_t` | 4 x u32 | 128-bit |
| `int32x4_t` | 4 x i32 | 128-bit |
| `float32x4_t` | 4 x f32 | 128-bit |
| `float64x2_t` | 2 x f64 | 128-bit, AArch64 |

## NEON operations

| Operation | NEON (4 x f32) |
|-----------|----------------|
| Load | `vld1q_f32` |
| Store | `vst1q_f32` |
| Add, subtract | `vaddq_f32`, `vsubq_f32` |
| Multiply | `vmulq_f32` |
| FMA | `vfmaq_f32(acc, a, b)`, computes `acc + a*b` |
| Min, max | `vminq_f32`, `vmaxq_f32` |
| Abs, sqrt | `vabsq_f32`, `vsqrtq_f32` |
| Broadcast | `vdupq_n_f32` |
| Horizontal sum | `vaddvq_f32` |

## Feature guards and dispatch

Compile one function for a wider target than the file:

```c
__attribute__((target("avx2,fma")))
void kernel_avx2(float *dst, const float *src, int n) { }

__attribute__((target("sse4.2")))
uint32_t crc32_sse42(const char *data, size_t len) { }
```

Runtime dispatch through an indirect resolver:

```c
__attribute__((ifunc("resolve_kernel")))
void kernel(float *dst, const float *src, int n);

static void *resolve_kernel(void) {
    __builtin_cpu_init();
    if (__builtin_cpu_supports("avx2")) return kernel_avx2;
    if (__builtin_cpu_supports("sse4.2")) return kernel_sse42;
    return kernel_scalar;
}
```

## References

- Intel intrinsics guide: <https://www.intel.com/content/www/us/en/docs/intrinsics-guide/>
- ARM intrinsics pages: <https://developer.arm.com/architectures/instruction-sets/intrinsics/>
- Instruction timings: <https://uops.info/>
- Generated assembly: Compiler Explorer, <https://godbolt.org/>
