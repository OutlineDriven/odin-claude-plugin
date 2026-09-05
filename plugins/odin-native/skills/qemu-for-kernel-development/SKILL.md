---
name: qemu-for-kernel-development
description: 'Use when booting custom kernels in QEMU, building Buildroot or Yocto rootfs, attaching virtio devices, or iterating kernel modules over NFS or 9p root. Not for KVM management: use qemu-kvm.'
---

# QEMU for kernel development

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Kernel and driver work under QEMU: direct kernel boot with `-kernel` and `-append root=`, Buildroot or minimal rootfs, virtio block and network devices, out-of-tree module test loops, or a GDB stub against a booting kernel. |
| Authority | Read-only. Writes nothing. Chat output only. No remote mutation. |
| Side effect | Returns QEMU command lines and workflow steps the caller runs. No source files are modified. |
| Done | A booting QEMU command line for the target architecture, a rootfs plan, and the module or debug loop are delivered. |

## Inputs

1. Target architecture (required): arm64 or x86_64 primarily, with the kernel image path.
2. Rootfs (required): an existing image, a Buildroot build, or an initramfs.
3. Development loop (optional): out-of-tree module, shared source tree over 9p, or NFS root.
4. Debug needs (optional): GDB stub, console preferences, and device tree overrides.

## Procedure

1. Boot the custom kernel directly with `-kernel`; no bootloader needed. Keep `console=` aligned with the machine's serial device, and `root=` aligned with the virtio device name.

   ```bash
   # arm64: ttyAMA0 is the PL011 UART on the virt machine
   qemu-system-aarch64 \
     -machine virt -cpu cortex-a57 -smp 4 -m 2G \
     -kernel arch/arm64/boot/Image \
     -append "console=ttyAMA0 root=/dev/vda rw" \
     -drive if=virtio,file=rootfs.ext4,format=raw \
     -netdev user,id=net0 -device virtio-net-device,netdev=net0 \
     -nographic
   ```

   ```bash
   # x86_64 with KVM; ttyS0 is the serial console
   qemu-system-x86_64 -enable-kvm -m 4G -smp 4 \
     -kernel arch/x86/boot/bzImage \
     -append "console=ttyS0 root=/dev/vda rw" \
     -drive file=rootfs.img,format=raw,if=virtio \
     -nographic
   ```

   Done when: the guest prints kernel logs to the terminal and reaches the rootfs shell.
2. Build a rootfs with Buildroot when none exists.

   ```bash
   make qemu_aarch64_virt_defconfig
   make
   # output/images/Image and output/images/rootfs.ext4
   ```

   Point Buildroot at the custom kernel with the Linux kernel menu options (custom version, custom tarball, or local tree). Done when: the built image boots under the command from step 1.
3. Run the module test loop. Build against exactly the kernel source that produced the booted image; a version or vermagic mismatch fails the `insmod`.

   ```bash
   # on the host, cross build
   make -C $KERNEL_SRC M=$PWD modules
   # in the guest
   insmod mydriver.ko
   dmesg | tail
   ```

   Share the tree into the guest over 9p to skip repacking the rootfs each cycle:

   ```bash
   -fsdev local,id=dev0,path=$PWD,security_model=none \
   -device virtio-9p-pci,fsdev=dev0,mount_tag=hostshare
   # guest: mount -t 9p -o trans=virtio hostshare /mnt
   ```

   Done when: an edit-build-insmod-dmesg cycle runs without touching the rootfs image.
4. Debug the kernel with the QEMU GDB stub for early boot; use `CONFIG_KGDB` for a live debugger inside a booted guest.

   ```bash
   qemu-system-aarch64 ... -s -S
   gdb vmlinux
   (gdb) target remote localhost:1234
   (gdb) break start_kernel
   (gdb) continue
   ```

   Done when: the breakpoint at `start_kernel` fires before the first printk.
5. Handle the device tree deliberately. The `virt` machine generates its DTB at startup, and that generated tree is what makes its UART and virtio devices discoverable. Override it with `-dtb myboard.dtb` only for a board whose DTB matches the selected machine model; a mismatched DTB hides the devices the kernel needs. Build board DTBs from the kernel tree with `make dtbs`. Done when: the source of the guest's DTB (generated or supplied) is stated and its devices are expected to appear.
6. Choose the network model per need: user-mode networking (`-netdev user`) for no-privilege testing, or a tap device for real packet flows. Route deeper work: `qemu-kvm` for KVM, VFIO, and libvirt management; `device-tree` for DT authoring behind the guest. Emulated MCU targets are outside this tree, so ground them in QEMU's own machine documentation. Done when: the delivered recipe names its networking and DT choices.

## Failure and recovery

| Symptom | Cause | Recovery |
|---|---|---|
| Kernel panic: no root | Wrong `root=` for the storage | `root=/dev/vda` for virtio-blk; confirm with the drive's `if=`. |
| No console output | Wrong or missing `console=` | `console=ttyAMA0` on arm64 virt, `console=ttyS0` on x86. |
| `insmod` vermagic error | Module built against a different tree | Rebuild against the exact `KERNEL_SRC` of the booted image. |
| Glacial boot without KVM | TCG emulation | Add `-enable-kvm` on an x86 host with VT-x. |
| Virtio devices missing | Supplied DTB does not match the machine | Drop `-dtb` and use QEMU's generated tree, or supply a matching one. |

## Output

A booting QEMU command line for the architecture; the rootfs build plan; the module edit-build-test loop with the 9p share; the GDB stub or KGDB session; the DTB sourcing statement; the routing to related skills.
