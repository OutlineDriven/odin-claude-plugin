#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = "odin-skill-membership/v1";
const RELEASE_VERSION = "2.0.0";

export function loadMembership(root = ROOT) {
  const membershipPath = process.env.ODIN_MEMBERSHIP_PATH
    ? process.env.ODIN_MEMBERSHIP_PATH
    : join(root, "catalog/skill-membership.json");
  const data = JSON.parse(readFileSync(membershipPath, "utf8"));
  const catalog = JSON.parse(readFileSync(join(root, "catalog/packages.json"), "utf8"));
  const modules = new Set(catalog.entries.map((entry) => entry.id).filter((id) => id !== "odin"));

  if (data.schema !== SCHEMA) {
    throw new Error(`skill-membership schema must be ${SCHEMA}, got ${data.schema}`);
  }
  if (data.releaseVersion !== RELEASE_VERSION) {
    throw new Error(`skill-membership releaseVersion must be ${RELEASE_VERSION}, got ${data.releaseVersion}`);
  }
  if (typeof data.skill_count !== "number" || !Number.isInteger(data.skill_count)) {
    throw new Error(`skill-membership skill_count must be an integer, got ${data.skill_count}`);
  }
  if (!Array.isArray(data.rows)) {
    throw new Error("skill-membership rows must be an array");
  }
  if (data.rows.length !== data.skill_count) {
    throw new Error(
      `skill-membership rows (${data.rows.length}) must match skill_count (${data.skill_count})`,
    );
  }

  const rows = data.rows;
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    if (typeof row !== "object" || row === null) {
      throw new Error("skill-membership row must be an object");
    }
    const keys = Object.keys(row);
    if (keys.length !== 2 || !Object.hasOwn(row, "slug") || !Object.hasOwn(row, "module")) {
      throw new Error(
        `skill-membership row must have exactly slug and module keys, got ${keys.join(", ")}`,
      );
    }
    if (typeof row.slug !== "string" || row.slug.length === 0) {
      throw new Error(`skill-membership row has empty or non-string slug at index ${index}`);
    }
    if (typeof row.module !== "string" || row.module.length === 0) {
      throw new Error(`skill-membership row has empty or non-string module for slug ${row.slug}`);
    }
    if (!modules.has(row.module)) {
      throw new Error(`skill-membership row has unknown module ${row.module} for slug ${row.slug}`);
    }
    if (seen.has(row.slug)) {
      throw new Error(`skill-membership duplicate slug: ${row.slug}`);
    }
    seen.add(row.slug);
  }

  const sortedSlugs = rows.map((r) => r.slug).sort();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].slug !== sortedSlugs[i]) {
      throw new Error(
        `skill-membership slugs must be sorted; first unsorted at index ${i}: ${rows[i].slug} (expected ${sortedSlugs[i]})`,
      );
    }
  }

  const byModule = new Map();
  for (const row of rows) {
    if (!byModule.has(row.module)) byModule.set(row.module, []);
    byModule.get(row.module).push(row.slug);
  }

  return {
    rows,
    all: sortedSlugs,
    byModule,
    skillCount: data.skill_count,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const membership = loadMembership();
  process.stdout.write(`skill-membership ok ${membership.skillCount} skills\n`);
}
