# West manifest reference

Checked against `doc/develop/west/manifest.rst`, `doc/develop/modules.rst`, and the upstream `west.yml` in the Zephyr repository on 2026-09-05. Current Zephyr release: v4.4.2.

## west.yml structure

The manifest repository is the one `west init -m <url>` clones. With the application as the manifest repository (the "T2" topology in the Zephyr docs), Zephyr is pulled in as an ordinary project.

```yaml
manifest:
  remotes:
    - name: zephyrproject-rtos
      url-base: https://github.com/zephyrproject-rtos

  defaults:
    remote: zephyrproject-rtos

  projects:
    - name: zephyr
      revision: v4.4.2          # pin to a release tag
      import: true              # bring in the modules Zephyr's own west.yml lists

    - name: my-drivers
      url: https://github.com/myorg/my-drivers
      revision: main
      path: modules/my-drivers

  self:
    path: app                   # where this repository lives in the workspace
```

The optional `version:` key states the minimum manifest schema the file uses; quote it as a string (`version: "0.10"`) because unquoted `0.10` parses as the float `0.1`. Only versions that introduced schema features are valid values, so leave the key out unless the file uses a feature that needs it.

## Common commands

```bash
west init -m https://github.com/myorg/my-manifest workspace
west update                          # check out every project at its manifest revision
west list                            # projects and their paths
west status                          # git status across projects
west forall -c "git log --oneline -3"
west manifest --resolve              # print the manifest with imports expanded
west manifest --freeze               # print it with every revision replaced by a commit SHA
```

Commit the output of `west manifest --freeze` as a snapshot when a build must be reproducible to the commit.

## Adding a module

A module is a repository with a `zephyr/module.yml` that tells the build where its CMake and Kconfig entry points are.

```yaml
# modules/my-hal/zephyr/module.yml
build:
  cmake: .
  kconfig: Kconfig
  settings:
    dts_root: .      # if the module ships devicetree bindings under dts/bindings
    board_root: .    # if the module defines boards under boards/
```

```cmake
# modules/my-hal/CMakeLists.txt
zephyr_include_directories(include)
zephyr_library()
zephyr_library_sources(src/my_hal.c)
```

```
# modules/my-hal/Kconfig
config MY_HAL
	bool "My HAL driver"
	depends on I2C
	help
	  Enable the My HAL I2C driver.
```

Add the module as a project in `west.yml` and run `west update`; the build system finds it through the manifest.
