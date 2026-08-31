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
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { gunzipSync } from "node:zlib";

import { assemblePackages, } from "./assemble-packages.mjs";
import { loadCatalog, } from "./package-surfaces.mjs";
import { loadMembership, } from "./skill-membership.mjs";

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

function readTarMember(tarballPath, memberPath) {
  const archive = gunzipSync(readFileSync(tarballPath));
  const blockSize = 512;

  for (let offset = 0; offset + blockSize <= archive.length;) {
    const header = archive.subarray(offset, offset + blockSize);
    if (header.every((byte) => byte === 0)) break;

    const name = header.toString("utf8", 0, 100).replace(/\0.*$/s, "");
    const prefix = header.toString("utf8", 345, 500).replace(/\0.*$/s, "");
    const path = prefix ? `${prefix}/${name}` : name;
    const sizeText = header.toString("ascii", 124, 136).replace(/\0.*$/s, "").trim();
    if (sizeText !== "" && !/^[0-7]+$/.test(sizeText)) {
      throw new Error(`invalid tar size for ${path} in ${tarballPath}`);
    }

    const size = sizeText === "" ? 0 : Number.parseInt(sizeText, 8);
    const dataStart = offset + blockSize;
    const dataEnd = dataStart + size;
    if (!Number.isSafeInteger(size) || dataEnd > archive.length) {
      throw new Error(`truncated tar member ${path} in ${tarballPath}`);
    }
    if (path === memberPath) return archive.subarray(dataStart, dataEnd);

    offset = dataStart + Math.ceil(size / blockSize) * blockSize;
  }

  throw new Error(`missing tar member ${memberPath} in ${tarballPath}`);
}

function validatePackedFiles(meta, entry, expectedSlugs, tarballPath, expectedNotice) {
  if (!Array.isArray(meta.files)) {
    throw new Error(`npm pack returned no file list for ${entry.package}`);
  }

  const paths = [];
  const actualSlugs = new Set();
  for (const file of meta.files) {
    if (!file || typeof file.path !== "string") {
      throw new Error(`npm pack returned an invalid file entry for ${entry.package}`);
    }
    paths.push(file.path);
    if (!file.path.startsWith("skills/")) continue;

    const match = /^skills\/([^/]+)\//.exec(file.path);
    if (!match) {
      throw new Error(`npm pack returned an invalid skill path for ${entry.package}: ${file.path}`);
    }
    actualSlugs.add(match[1]);
  }

  const noticeCount = paths.filter((path) => path === "NOTICE").length;
  if (noticeCount !== 1) {
    throw new Error(`${entry.package} archive must contain one NOTICE, got ${noticeCount}`);
  }

  const packedNotice = readTarMember(tarballPath, "package/NOTICE");
  if (!packedNotice.equals(expectedNotice)) {
    throw new Error(`${entry.package} archive NOTICE differs from licenses/NOTICE`);
  }

  const retiredPath = paths.find(
    (path) => path === "PROVENANCE.md" || path.endsWith("/PROVENANCE.md"),
  );
  if (retiredPath) {
    throw new Error(`${entry.package} archive contains retired ${retiredPath}`);
  }

  const actual = [...actualSlugs].sort();
  const expected = [...expectedSlugs].sort();
  const missing = expected.filter((slug) => !actualSlugs.has(slug));
  const expectedSet = new Set(expected);
  const extra = actual.filter((slug) => !expectedSet.has(slug));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `${entry.package} archive skill mismatch; missing=${missing.join(",") || "-"} ` +
        `extra=${extra.join(",") || "-"}`,
    );
  }

  if (typeof meta.unpackedSize !== "number" || !Number.isInteger(meta.unpackedSize)) {
    throw new Error(`npm pack returned an invalid unpackedSize for ${entry.package}`);
  }

  return {
    fileCount: meta.files.length,
    unpackedSize: meta.unpackedSize,
  };
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
  const membership = loadMembership(ROOT);
  if (catalog.entries.length !== 29) {
    throw new Error(`expected 29 catalog entries, got ${catalog.entries.length}`);
  }

  rmSync(PACKAGES_DIR, { recursive: true, force: true });
  mkdirSync(PACKAGES_DIR, { recursive: true });

  const stagingA = join(tmpdir(), `odin-pack-a-${randomBytes(8).toString("hex")}`);
  const stagingB = join(tmpdir(), `odin-pack-b-${randomBytes(8).toString("hex")}`);
  const verifyDir = join(tmpdir(), `odin-verify-${randomBytes(8).toString("hex")}`);
  let operationError = null;

  try {
    assemblePackages(ROOT, stagingA);
    const expectedNotice = readFileSync(join(ROOT, "licenses/NOTICE"));
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
      const { fileCount, unpackedSize } = validatePackedFiles(
        meta,
        entry,
        membership.byModule.get(entry.id) ?? [],
        tarballPath,
        expectedNotice,
      );

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

    assemblePackages(ROOT, stagingB);
    let mismatches = 0;
    for (const entry of catalog.entries) {
      const pkgDir = join(stagingB, entry.id);
      const meta = npmPack(pkgDir, verifyDir);
      const secondPath = join(verifyDir, meta.filename);
      const secondSha = sha256File(secondPath);
      const firstEntry = manifestEntries.find((candidate) => candidate.name === entry.package);
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

    if (mismatches > 0) {
      throw new Error(`${mismatches} tarball(s) failed double-pack determinism gate`);
    }

    const manifest = {
      releaseVersion: RELEASE_VERSION,
      packages: manifestEntries,
    };
    const manifestPath = join(PACKAGES_DIR, "RELEASE-MANIFEST.json");
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    return { tarballs: manifestEntries.length, manifestPath, mismatches };
  } catch (error) {
    operationError = error;
    throw error;
  } finally {
    const cleanupTargets = operationError
      ? [stagingA, stagingB, verifyDir, PACKAGES_DIR]
      : [stagingA, stagingB, verifyDir];
    let firstCleanupError = null;
    for (const path of cleanupTargets) {
      try {
        rmSync(path, { recursive: true, force: true });
      } catch (error) {
        firstCleanupError ??= error;
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`cleanup failed for ${path}: ${message}\n`);
      }
    }
    if (!operationError && firstCleanupError) throw firstCleanupError;
  }
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
