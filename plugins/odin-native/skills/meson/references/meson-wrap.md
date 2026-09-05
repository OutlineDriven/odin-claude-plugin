# Meson wrap reference

Grounded against Meson 1.12.0. Wrap files live in `subprojects/` and describe
how Meson obtains a dependency it cannot find on the system.

## Wrap file types

Archive download:

```ini
[wrap-file]
directory = libfoo-1.2.3
source_url = https://example.com/libfoo-1.2.3.tar.gz
source_hash = <sha256 of the archive>

[provide]
libfoo = libfoo_dep
```

Git clone:

```ini
[wrap-git]
url = https://github.com/example/libfoo.git
revision = v1.2.3
depth = 1

[provide]
libfoo = libfoo_dep
```

Redirect to in-tree build files:

```ini
[wrap-redirect]
filename = subprojects/packagefiles/libfoo/meson.build
```

## WrapDB

```bash
meson wrap search ""        # list everything in WrapDB
meson wrap search zlib      # find one package
meson wrap install zlib
meson wrap install gtest
meson wrap list             # installed wraps
meson wrap update           # refresh wraps from WrapDB
meson wrap status           # installed vs available versions
```

## Subproject without WrapDB

Drop the source into `subprojects/` with its own `meson.build` that defines a
dependency variable:

```text
subprojects/
└── libfoo/
    ├── meson.build    # defines libfoo_dep
    └── src/
```

```python
libfoo_proj = subproject('libfoo')
libfoo_dep = libfoo_proj.get_variable('libfoo_dep')
```

## Patching a wrapped project

`patch_directory` merges `subprojects/packagefiles/<name>/` over the unpacked
source, which is how Meson build files reach projects that ship none:

```text
subprojects/
├── zlib.wrap
└── packagefiles/
    └── zlib/
        └── meson.build
```

```ini
[wrap-file]
directory = zlib-1.3
source_url = https://zlib.net/zlib-1.3.tar.gz
source_hash = <sha256>
patch_directory = zlib
```

## Dependency fallback patterns

```python
# System first, wrap fallback
zlib_dep = dependency('zlib', fallback : ['zlib', 'zlib_dep'])

# Wrap only, for reproducible builds
zlib_dep = dependency('zlib',
  fallback : ['zlib', 'zlib_dep'],
  allow_fallback : true,
)

# Optional dependency, manual fallback
zlib_dep = dependency('zlib', required : false)
if not zlib_dep.found()
  zlib_dep = subproject('zlib').get_variable('zlib_dep')
endif

# Force a static build from the wrap
gtest_dep = dependency('gtest',
  fallback : ['gtest', 'gtest_dep'],
  default_options : ['default_library=static'],
)
```

## Common meson.build patterns

Conditional configuration header:

```python
conf = configuration_data()
conf.set('VERSION', meson.project_version())
conf.set10('HAVE_FEATURE', cc.has_function('feature_func'))
configure_file(input : 'config.h.in', output : 'config.h',
               configuration : conf)
```

Compiler feature checks:

```python
cc = meson.get_compiler('c')

have_mmap = cc.has_function('mmap', prefix : '#include <sys/mman.h>')
have_sys_epoll = cc.has_header('sys/epoll.h')
have_int128 = cc.has_type('__int128')
have_atomics = cc.compiles('''
  #include <stdatomic.h>
  int main(void) { atomic_int x = 0; return atomic_load(&x); }
''', name : 'C11 atomics')
```

Install rules:

```python
executable('myapp', ..., install : true)
install_headers('include/mylib.h', subdir : 'mylib')
install_data('data/config.json',
             install_dir : get_option('datadir') / 'myapp')
install_man('doc/myapp.1')
```
