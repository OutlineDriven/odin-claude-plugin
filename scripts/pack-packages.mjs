#!/usr/bin/env node
/**
 * Deterministic 29-package pack + release-manifest owner.
 *
 * Stages all 29 packages (via assemble-packages logic) into a temp staging
 * root, runs `npm pack` per staged package dir into .release/packages/, then
 * packs a SECOND time into a second temp dir and byte-compares every tarball
 * sha256 (double-pack determinism gate). Emits RELEASE-MANIFEST.json with
 * entries in catalog order.
 *
 * Does NOT publish anything.
 */
import {
  createHash,
  randomBytes,
} from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

import { assemblePackages, } from "./assemble-packages.mjs";
import { loadCatalog, } from "./package-surfaces.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE_VERSION = "2.0.0";
const PACKAGES_DIR = join(ROOT, ".release/packages");

// ── helpers ──────────────────────────────────────────────────────────

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function sha512Integrity(filePath) {
  const b64 = createHash("sha512").update(readFileSync(filePath)).digest("base64");
  return `sha512-${b64}`;
}


/**
 * Count files and total bytes inside a staged package directory.
 * Excludes nothing — every byte that npm pack will see is counted.
 */
function stagedStats(dir) {
  let fileCount = 0;
  let totalSize = 0;
  function walk(d) {
    for (const name of readdirSync(d)) {
      if (name === "node_modules") continue;
      const full = join(d, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else {
        fileCount += 1;
        totalSize += st.size;
      }
    }
  }
  walk(dir);
  return { fileCount, unpackedSize: totalSize };
}

/**
 * Run `npm pack --json` in a given package directory, writing the tarball
 * to destDir. Returns the parsed JSON metadata array (one element).
 */
function npmPack(pkgDir, destDir) {
  mkdirSync(destDir, { recursive: true });
  const npmResult = spawnSync(
    "npm",
    ["pack", "--json", `--pack-destination=${destDir}`],
    { cwd: pkgDir, encoding: "utf-8" },
  );
  if (npmResult.status !== 0) {
    process.stderr.write(npmResult.stderr || "");
    throw new Error(`npm pack failed in ${pkgDir} (exit ${npmResult.status})`);
  }
  const meta = JSON.parse(npmResult.stdout);
  if (!Array.isArray(meta) || meta.length !== 1) {
    throw new Error(`unexpected npm pack output in ${pkgDir}: ${npmResult.stdout}`);
  }
  return meta[0];
}

// ── main ─────────────────────────────────────────────────────────────

function packAll() {
  const catalog = loadCatalog(ROOT);
  if (catalog.entries.length !== 29) {
    throw new Error(`expected 29 catalog entries, got ${catalog.entries.length}`);
  }

  // Clean output directory
  rmSync(PACKAGES_DIR, { recursive: true, force: true });
  mkdirSync(PACKAGES_DIR, { recursive: true });

  // ── First pack (canonical) ────────────────────────────────────────
  const stagingA = join(tmpdir(), `odin-pack-a-${randomBytes(8).toString("hex")}`);
  assemblePackages(ROOT, stagingA);

  const manifestEntries = [];
  for (const entry of catalog.entries) {
    const pkgDir = join(stagingA, entry.id);
    if (!existsSync(pkgDir)) {
      throw new Error(`staging missing for ${entry.id}`);
    }
    const meta = npmPack(pkgDir, PACKAGES_DIR);
    const tarballPath = join(PACKAGES_DIR, meta.filename);
    const sha256 = sha256File(tarballPath);
    const sha512 = sha512Integrity(tarballPath);
    const { fileCount, unpackedSize } = stagedStats(pkgDir);

    manifestEntries.push({
      name: entry.package,
      version: RELEASE_VERSION,
      filename: meta.filename,
      sha256,
      sha512_integrity: sha512,
      unpacked_size: unpackedSize,
      file_count: fileCount,
    });
  }

  // ── Second pack (determinism gate) ────────────────────────────────
  const stagingB = join(tmpdir(), `odin-pack-b-${randomBytes(8).toString("hex")}`);
  const verifyDir = join(tmpdir(), `odin-verify-${randomBytes(8).toString("hex")}`);
  assemblePackages(ROOT, stagingB);

  let mismatches = 0;
  for (const entry of catalog.entries) {
    const pkgDir = join(stagingB, entry.id);
    const meta = npmPack(pkgDir, verifyDir);
    const secondPath = join(verifyDir, meta.filename);
    const secondSha = sha256File(secondPath);
    const firstEntry = manifestEntries.find((e) => e.name === entry.package);
    if (!firstEntry) {
      throw new Error(`determinism: no first-pack entry for ${entry.package}`);
    }
    if (secondSha !== firstEntry.sha256) {
      process.stderr.write(
        `DETERMINISM FAILURE: ${entry.package} sha256 mismatch\n` +
          `  first:  ${firstEntry.sha256}\n` +
          `  second: ${secondSha}\n`,
      );
      mismatches += 1;
    }
  }

  // Clean up staging/verify dirs
  rmSync(stagingA, { recursive: true, force: true });
  rmSync(stagingB, { recursive: true, force: true });
  rmSync(verifyDir, { recursive: true, force: true });

  if (mismatches > 0) {
    throw new Error(`${mismatches} tarball(s) failed double-pack determinism gate`);
  }

  // ── Emit RELEASE-MANIFEST.json ────────────────────────────────────
  const manifest = {
    releaseVersion: RELEASE_VERSION,
    packages: manifestEntries,
  };
  const manifestPath = join(PACKAGES_DIR, "RELEASE-MANIFEST.json");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return { tarballs: manifestEntries.length, manifestPath, mismatches };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const result = packAll();
  process.stdout.write(
    `packed ${result.tarballs} tarballs, ` +
      `determinism gate passed (0 mismatches), ` +
      `manifest: ${result.manifestPath}\n`,
  );
}

export { packAll };
