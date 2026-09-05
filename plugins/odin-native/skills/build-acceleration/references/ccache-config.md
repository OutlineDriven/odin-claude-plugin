# ccache configuration reference

Grounded against ccache 4.14. Compression uses Zstandard, not zlib; the level
semantics below are the zstd ones.

## Configuration file locations

ccache reads configuration in this order; later files override earlier ones:

1. System-wide `<sysconfdir>/ccache.conf` (typically `/etc/ccache.conf`).
2. The user file: `$XDG_CONFIG_HOME/ccache/ccache.conf` (usually
   `~/.config/ccache/ccache.conf`), or `~/.ccache/ccache.conf` when the XDG
   file is absent.
3. `<cache_dir>/ccache.conf`, a per-cache override.

Setting `CCACHE_CONFIGPATH` replaces this search with a single file.

## Key settings

```ini
max_size = 20G                  # cache size cap; K, M, G, T suffixes
cache_dir = /var/cache/ccache   # non-default location

compression = true              # zstd compression, on by default
compression_level = 3           # zstd level; 0 is the default, positive
                                # values go to at least 19; stay at 5 or
                                # lower, higher levels slow compiles

hash_dir = false                # exclude CWD from the hash (shared caches)
base_dir = /project             # strip this prefix from hashed paths

# sloppiness relaxes what the hash covers
sloppiness = include_file_mtime,include_file_ctime,time_macros,pch_defines
# time_macros: ignore __DATE__ and __TIME__ changes
# pch_defines: needed for GCC precompiled headers
```

## CI and shared cache

```yaml
- name: Restore ccache
  uses: actions/cache@v4
  with:
    path: ~/.cache/ccache
    key: ccache-${{ runner.os }}-${{ hashFiles('**/CMakeLists.txt') }}
    restore-keys: ccache-${{ runner.os }}-

- name: Configure ccache
  run: |
    ccache --set-config=max_size=500M
    ccache --set-config=hash_dir=false
    ccache --set-config=base_dir=${{ github.workspace }}

- name: ccache stats
  run: ccache -s
```

## Troubleshooting hit rate

```bash
ccache -s -v          # full statistics with miss reasons
ccache --zero-stats   # reset counters, cache contents stay
CCACHE_READONLY=1 make   # probe for hits without writing new entries
```

| Miss reason | Fix |
|---|---|
| Absolute paths in source | Set `base_dir` to the project root |
| `__DATE__`/`__TIME__` macros | Add `time_macros` to `sloppiness` |
| PCH changes invalidate entries | Add `pch_defines` to `sloppiness` |
| Different working directory | Set `hash_dir=false` |
| Compiler version change | Expected; the hash is correct to differ |
| Response files (`@file`) | Set `CCACHE_COMPILERCHECK=content` |
| `called for preprocessing` | The compiler ran as a preprocessor only; not cacheable |
| `unsupported code directive` | Inline asm or a pragma ccache cannot hash |
