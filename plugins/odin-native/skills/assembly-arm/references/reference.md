# AArch64 and ARM reference

Sources: the ARM Architecture Reference Manual and the ARM compiler intrinsics pages on developer.arm.com.

## Condition codes

| Code | Meaning | Flags |
|------|---------|-------|
| `EQ` | Equal | `Z=1` |
| `NE` | Not equal | `Z=0` |
| `CS`/`HS` | Carry set, unsigned higher or same | `C=1` |
| `CC`/`LO` | Carry clear, unsigned lower | `C=0` |
| `MI` | Minus, negative | `N=1` |
| `PL` | Plus, non-negative | `N=0` |
| `VS` | Overflow | `V=1` |
| `VC` | No overflow | `V=0` |
| `HI` | Unsigned higher | `C=1` and `Z=0` |
| `LS` | Unsigned lower or same | `C=0` or `Z=1` |
| `GE` | Signed greater or equal | `N=V` |
| `LT` | Signed less than | `N!=V` |
| `GT` | Signed greater | `Z=0` and `N=V` |
| `LE` | Signed less or equal | `Z=1` or `N!=V` |
| `AL` | Always, the default | none |

## Key instructions

Loads and stores:

```asm
ldr  x0, [x1]              // load 64-bit
ldrb w0, [x1]              // byte, zero-extended
ldrsh x0, [x1]             // halfword, sign-extended
str  x0, [x1]              // store 64-bit
strb w0, [x1]
ldp  x0, x1, [sp]          // load pair
stp  x0, x1, [sp, #-16]!   // pre-index writeback
ldr  x0, [x1, #8]!         // pre-index
ldr  x0, [x1], #8          // post-index
ldar x0, [x1]              // load-acquire
stlr x0, [x1]              // store-release
ldxr x0, [x1]              // load-exclusive
stxr w2, x0, [x1]          // store-exclusive, w2 = 0 on success
```

Arithmetic and logic:

```asm
add  x0, x1, x2
adds x0, x1, x2            // set flags
subs x0, x1, x2
adc  x0, x1, x2            // add with carry
mul  x0, x1, x2            // low half of the product
madd x0, x1, x2, x3        // x1*x2 + x3
msub x0, x1, x2, x3        // x3 - x1*x2
smull x0, w1, w2           // 32x32 to 64 signed
and  x0, x1, x2
orr  x0, x1, x2
eor  x0, x1, x2
mvn  x0, x1                // bitwise not
lsl  x0, x1, #3
asr  x0, x1, #3            // arithmetic shift right
ror  x0, x1, #3
rev  x0, x1                // reverse bytes, endian swap
```

Branches and system:

```asm
b    label
bl   func                  // call, sets x30
blr  x0                    // call through register
ret                        // return via x30
cbz  x0, label
cbnz x0, label
tbz  x0, #3, label         // test bit, branch if zero
tbnz x0, #3, label
nop
wfe                        // wait for event
sev
dsb  sy                    // data synchronization barrier
dmb  ish                   // data memory barrier, inner shareable
isb                        // instruction synchronization barrier
mrs  x0, cntvct_el0        // read the virtual timer count
msr  nzcv, x0              // write the flags register
```

## Memory ordering instructions

| Instruction | Ordering |
|-------------|----------|
| `ldar` | Load-acquire |
| `stlr` | Store-release |
| `ldxr` | Exclusive load, no ordering by itself |
| `stxr` | Exclusive store, no ordering by itself |
| `dmb ish` | Full barrier, inner shareable domain |
| `dmb ishld` | Load barrier |
| `dmb ishst` | Store barrier |
| `dsb` | Instruction synchronization barrier, all device and memory |
| `isb` | Instruction fetch barrier |

## NEON quick categories

C types from `<arm_neon.h>`:

| Type | Element shape |
|------|---------------|
| `uint8x16_t` | 16 x u8 |
| `int32x4_t` | 4 x i32 |
| `int64x2_t` | 2 x i64 |
| `float32x4_t` | 4 x f32 |
| `float64x2_t` | 2 x f64, AArch64 only |

Common patterns:

```c
float32x4_t v  = vld1q_f32(ptr);        // load
float32x4_t s  = vaddq_f32(a, b);
float32x4_t m  = vmulq_f32(a, b);
float32x4_t f  = vfmaq_f32(acc, a, b);  // acc + a*b
float32x4_t z  = vdupq_n_f32(0.0f);     // broadcast
float32x2_t r  = vadd_f32(vget_low_f32(v), vget_high_f32(v));
float          t  = vgetq_lane_f32(v, 3);
vst1q_f32(ptr, v);                      // store
```

## Thumb-2 notes

Cortex-M cores execute Thumb-2. Most 32-bit ARM instructions exist in Thumb encoding, and 16-bit encodings keep code small. Conditional execution inside `it` blocks replaces many branches, but the block is narrow; prefer real branches for long bodies. Use the `bl` and `bx lr` pair through a linker that supports `ARM`/`Thumb` interworking, and check that function pointers carry the Thumb bit. Load immediate constants through the literal pool when the value does not fit an encoding.

## SVE and SME pointers

Write NEON for baseline portability. Guard SVE code on a runtime check of the SVE feature and a length-agnostic loop, because the vector length is implementation defined. On Apple silicon, AMX is reached only through system libraries, so use Accelerate or Metal for large matrix work instead of writing AMX code.
