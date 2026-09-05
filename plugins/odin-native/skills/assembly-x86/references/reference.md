# x86-64 assembly reference

Sources: Intel SDM, the System V AMD64 ABI, and GCC inline asm documentation.

## Data movement

| Instruction | Effect |
|-------------|--------|
| `mov src, dst` | Copy |
| `movzx src, dst` | Copy with zero extend |
| `movsx src, dst` | Copy with sign extend |
| `lea mem, reg` | Compute the address into a register, no memory access |
| `push reg` | Push onto the stack |
| `pop reg` | Pop from the stack |
| `xchg a, b` | Exchange operands, implicit `LOCK` for memory |
| `cmpxchg a, b` | Compare and exchange, sets `ZF` |

## Arithmetic

| Instruction | Effect |
|-------------|--------|
| `add src, dst` | `dst += src` |
| `sub src, dst` | `dst -= src` |
| `imul r/m` | Signed multiply, `rdx:rax = rax * operand` in one-operand form |
| `mul r/m` | Unsigned multiply, same two-operand split |
| `idiv r/m` | Signed divide, quotient in `rax`, remainder in `rdx` |
| `div r/m` | Unsigned divide, same split |
| `inc`, `dec` | Increment, decrement without touching `CF` |
| `neg dst` | Two's complement negate |

## Bit operations

| Instruction | Effect |
|-------------|--------|
| `and`, `or`, `xor`, `not` | Bitwise logic |
| `shl`/`sal` | Shift left |
| `shr` | Shift right, logical |
| `sar` | Shift right, arithmetic |
| `rol`, `ror`, `rcl`, `rcr` | Rotates through carry or not |
| `bsf src, dst` | Index of lowest set bit |
| `bsr src, dst` | Index of highest set bit |
| `tzcnt`, `lzcnt` | Trailing and leading zero counts, BMI or ABM |
| `popcnt` | Count set bits |
| `bt`, `bts`, `btr`, `btc` | Bit test and set, reset, complement |

## Comparison and branching

| Instruction | Effect |
|-------------|--------|
| `cmp a, b` | Set flags from `a - b` without storing |
| `test a, b` | Set flags from `a & b` without storing |
| `jmp target` | Unconditional jump |
| `jcc target` | Conditional jump, see the table below |
| `cmovcc src, dst` | Conditional move |
| `setcc reg8` | Store the condition as 0 or 1 |
| `loop label` | Decrement `rcx`, jump when nonzero |

## rflags bits

| Bit | Flag | Set when |
|-----|------|----------|
| CF | Carry | Unsigned overflow |
| PF | Parity | Low byte has an even count of set bits |
| AF | Adjust | Carry from bit 3 to bit 4 |
| ZF | Zero | Result is zero |
| SF | Sign | Result is negative |
| TF | Trap | Single step enabled |
| IF | Interrupt | Interrupts enabled |
| DF | Direction | String ops go downward |
| OF | Overflow | Signed overflow |

## Conditional jumps

| Instruction | Condition | Flags |
|-------------|-----------|-------|
| `je`/`jz` | Equal | `ZF=1` |
| `jne`/`jnz` | Not equal | `ZF=0` |
| `js` | Sign set | `SF=1` |
| `jns` | Sign clear | `SF=0` |
| `jc` | Carry | `CF=1` |
| `jnc` | No carry | `CF=0` |
| `jo` | Overflow | `OF=1` |
| `jno` | No overflow | `OF=0` |
| `jl`/`jnge` | Signed less | `SF!=OF` |
| `jle`/`jng` | Signed less or equal | `ZF=1` or `SF!=OF` |
| `jg`/`jnle` | Signed greater | `ZF=0` and `SF=OF` |
| `jge`/`jnl` | Signed greater or equal | `SF=OF` |
| `jb`/`jnae` | Unsigned below | `CF=1` |
| `jbe`/`jna` | Unsigned below or equal | `CF=1` or `ZF=1` |
| `ja`/`jnbe` | Unsigned above | `CF=0` and `ZF=0` |
| `jae`/`jnb` | Unsigned above or equal | `CF=0` |

## SIMD header map

| Header | Provides |
|--------|----------|
| `<xmmintrin.h>` | SSE, `__m128` |
| `<emmintrin.h>` | SSE2, `__m128d` and `__m128i` |
| `<pmmintrin.h>` | SSE3 |
| `<tmmintrin.h>` | SSSE3 |
| `<smmintrin.h>` | SSE4.1 |
| `<nmmintrin.h>` | SSE4.2 |
| `<immintrin.h>` | Everything through AVX-512, use this one |

## Prologue patterns

Frame pointer kept:

```asm
push %rbp
mov  %rsp, %rbp
sub  $N, %rsp          # allocate locals, keep rsp 16-byte aligned
# body
leave                  # mov %rbp, %rsp; pop %rbp
ret
```

Frame pointer omitted, the default at `-O2`:

```asm
sub $N, %rsp
# body, locals addressed through rsp
add $N, %rsp
ret
```

Callee-saved registers used by the body:

```asm
push %rbx
push %r12
push %r13
# body that uses rbx, r12, r13
pop %r13
pop %r12
pop %rbx
ret
```

Restore in reverse push order. On Linux the kernel is built with `-mno-red-zone`, so kernel-mode code never relies on the 128-byte red zone.
