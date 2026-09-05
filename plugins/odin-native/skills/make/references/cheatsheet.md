# GNU Make cheatsheet

Source: <https://www.gnu.org/software/make/manual/make.html>. Grounded against
GNU Make 4.4.

## Automatic variables

| Variable | Meaning |
|---|---|
| `$@` | Target filename |
| `$<` | First prerequisite |
| `$^` | All prerequisites, deduplicated |
| `$+` | All prerequisites, with duplicates |
| `$?` | Prerequisites newer than the target |
| `$*` | Stem matched by `%` in a pattern rule |
| `$(@D)` | Directory part of `$@` |
| `$(@F)` | File part of `$@` |
| `$(<D)` | Directory part of `$<` |
| `$(<F)` | File part of `$<` |

## Special targets

| Target | Effect |
|---|---|
| `.PHONY: all clean` | Declare targets that are not files |
| `.DEFAULT_GOAL := all` | Set the default target |
| `.SUFFIXES:` | Clear built-in suffix rules |
| `.SILENT:` | Suppress command echoing globally |
| `.ONESHELL:` | Run each recipe's lines in one shell |
| `.DELETE_ON_ERROR:` | Delete the target when its recipe fails |

## Functions

| Function | Effect |
|---|---|
| `$(wildcard *.c)` | Expand a glob |
| `$(patsubst %.c,%.o,files)` | Replace a pattern |
| `$(subst from,to,text)` | Replace a literal string |
| `$(strip text)` | Remove extra whitespace |
| `$(notdir path)` | Filename without directory |
| `$(dir path)` | Directory component |
| `$(basename file)` | Filename without extension |
| `$(suffix file)` | Extension only |
| `$(addprefix pre,list)` | Prefix each word |
| `$(addsuffix suf,list)` | Suffix each word |
| `$(filter %.c,list)` | Keep matching words |
| `$(filter-out %.c,list)` | Drop matching words |
| `$(sort list)` | Sort and deduplicate |
| `$(foreach var,list,expr)` | Map over a list |
| `$(if cond,then,else)` | Conditional |
| `$(shell cmd)` | Run a shell command |
| `$(call var,arg1,arg2)` | Call a function-like variable |
| `$(origin var)` | Where a variable came from |
| `$(value var)` | Value without expansion |
| `$(info msg)` | Print during parse |
| `$(warning msg)` | Warn during parse |
| `$(error msg)` | Fatal error during parse |

## Variable assignment

| Syntax | Type | When expanded |
|---|---|---|
| `VAR = value` | Recursive | At use |
| `VAR := value` | Simple | At definition |
| `VAR ::= value` | POSIX simple | At definition; GNU Make 4.4 and later |
| `VAR ?= value` | Conditional | Only when unset |
| `VAR += value` | Append | Follows the variable's existing type |

## Conditionals

```makefile
ifeq ($(CC),gcc)
  CFLAGS += -fanalyzer
endif

ifneq ($(BUILD),release)
  CFLAGS += -g
endif

ifdef DEBUG
  CFLAGS += -DDEBUG
endif
```

## Multi-line variables

```makefile
define HELP_TEXT
Usage: make [target]
  all    - build everything
  clean  - remove build artifacts
endef

help:
	@echo '$(HELP_TEXT)'
```

## Order-only prerequisites

```makefile
# build/ must exist, but its timestamp never triggers a rebuild
build/%.o: src/%.c | build
	$(CC) -c -o $@ $<
```

## Recursive make, use sparingly

```makefile
SUBDIRS := lib src

.PHONY: all $(SUBDIRS)
all: $(SUBDIRS)

$(SUBDIRS):
	$(MAKE) -C $@
```

Prefer included `.mk` files over `$(MAKE) -C`; recursion splits the
dependency graph and breaks parallel correctness.

## Command line

```bash
make CFLAGS="-O3 -march=native"   # override a variable
make CC=clang                     # change the compiler
make -n                           # dry run, print commands
make -B                           # force rebuild of everything
make -k                           # keep going after errors
make -j"$(nproc)"                 # parallel jobs
make -O                           # synchronize parallel output
make -p                           # print the rule database
make --warn-undefined-variables   # catch variable typos
```
