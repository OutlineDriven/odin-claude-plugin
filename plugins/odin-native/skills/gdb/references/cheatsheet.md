# GDB command cheatsheet

Source: the GDB manual at sourceware.org/gdb/documentation/.

## Startup

```gdb
gdb prog                         # load binary
gdb prog core                    # load with core
gdb -p PID                       # attach to process
gdb --args prog a b c            # pass arguments
gdb -batch -ex 'run' -ex 'bt'    # non-interactive
set args a b c                   # set args after load
```

## Execution control

```gdb
run / r [args]                   # start
continue / c                     # resume
next / n                         # step over, source line
step / s                         # step into, source line
nexti / ni                       # step over, one instruction
stepi / si                       # step into, one instruction
finish                           # run to end of function
until N                          # run to line N in the current file
until file.c:N                   # run to a specific line
advance foo                      # run to the next call of foo
return [expr]                    # force a return value
signal SIGUSR1                   # deliver a signal
kill                             # kill the program
```

## Breakpoints and watchpoints

```gdb
break main                       # function
break file.c:42                  # line
break *0x400abc                  # address
break foo if x > 0               # conditional
tbreak foo                       # temporary, fires once
rbreak regex                     # all matching functions
catch throw                      # C++ exception thrown
catch syscall mmap               # syscall breakpoint

watch var                        # write watchpoint
rwatch var                       # read watchpoint
awatch var                       # read/write watchpoint
watch *(int*)addr                # memory watchpoint

info breakpoints                 # list
delete N                         # remove
disable N / enable N             # toggle
ignore N count                   # skip N hits
commands N                       # run commands on each hit
```

## Inspection

```gdb
print expr / p expr              # print an expression
print/x expr                     # hex
print/t expr                     # binary
print/f expr                     # float
print/c expr                     # char
print/d expr                     # signed decimal
print/u expr                     # unsigned decimal
print/a expr                     # as address

print arr[0]@N                   # N elements starting at arr[0]
print *ptr                       # dereference
print *((int*)ptr)               # cast and dereference

display expr                     # print on every stop
undisplay N                      # remove an auto-display
info display                     # list them

ptype var                        # full type
whatis var                       # brief type
info locals                      # all locals
info args                        # function arguments
info variables                   # all globals
```

## Stack

```gdb
backtrace / bt                   # call stack
bt N                             # top N frames
bt full                          # frames plus locals
bt -N                            # bottom N frames
frame N / f N                    # select frame N
up / down                        # move in the stack
info frame                       # frame details
```

## Memory

```gdb
x/Nuf addr                       # examine memory
#   N = count
#   u = unit: b byte, h halfword (2), w word (4), g giant (8)
#   f = format: x hex, d dec, u uint, o octal, t binary, f float, s string, i insn

x/10wx 0x7fff0000                # 10 words in hex
x/4gx $rsp                       # 4 giants at the stack top
x/20i $rip                       # 20 instructions from RIP
x/s 0x400abc                     # string
x/b &var                         # single byte

set {int}0xaddr = 42             # write memory
set variable x = 42              # set a variable
```

## Threads

```gdb
info threads                     # list
thread N                         # switch
thread apply all bt              # backtrace all
thread apply all bt full
thread apply 1 2 print x         # specific threads
set scheduler-locking on/off     # lock other threads during a step
```

## Reverse debugging

```gdb
record                           # start software record
record btrace                    # start hardware branch trace
record stop                      # stop recording
reverse-continue / rc            # back to the last event
reverse-next / rn                # reverse step over
reverse-step / rs                # reverse step into
reverse-finish                   # reverse out of the function
set exec-direction reverse       # make n/s go backward
set exec-direction forward       # restore
record instruction-history       # recorded instructions, btrace
record function-call-history     # recorded calls, btrace
```

## Display formats

| Format | Code | Example |
|---|---|---|
| Hex | `/x` | `p/x var` |
| Decimal | `/d` | `p/d var` |
| Binary | `/t` | `p/t var` |
| Float | `/f` | `p/f var` |
| Char | `/c` | `p/c var` |
| String | `/s` | `x/s ptr` |
| Instruction | `/i` | `x/5i $pc` |
