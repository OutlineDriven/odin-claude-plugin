---
name: skills-visibility
description: 'Use when asked to publish a discoverable integrity-protected agent-skill catalog served from a publisher-controlled domain. Produces .well-known/agent-skills/index.json with SHA-256 digests, flat archives, and verified install commands.'
---

# Skills visibility

## Contract

| Field | Bound contract |
|---|---|
| Trigger | user wants to publish, distribute, or self-host a discoverable integrity-protected agent-skill catalog |
| Authority | reversible-local write only. All produced artifacts are local files the publisher serves; rollback is deleting the output tree |
| Side effect | produces `SKILL.md` files or flat `.tar.gz` archives and `.well-known/agent-skills/index.json` with SHA-256 digests and installation commands. No remote mutation, no credential access, no VCS operation |
| Done | the index is valid `application/json` with exact schema fields (`$schema`, `skills[]` with `name`, `description`, `type`, `url`, `digest`); all URLs point at a publisher-controlled domain; every `digest` matches the bytes actually served at its `url`; archive types are correct (`skill-md` for single-file, `archive` for multi-file); at least two install methods (`pnpm dlx skills` plus one repo-based method) work against the published tree |

## Inputs

- **Skill source directory** (required): a directory tree where each skill lives at `skills/<name>/SKILL.md`, optionally with sibling files. Must be a Git repo if `gh skill` or Claude plugin marketplace install paths are used.
- **Publisher domain base URL** (required): the `https://` origin the publisher controls and serves from (e.g., `https://yourdomain.com`). Never `raw.githubusercontent.com` or any host whose delivery the publisher does not control.
- **Output directory** (required): local path where the publishable tree is written. The publisher copies or deploys this tree to their domain.
- **Bundle name** (optional): if publishing a bundle of multiple skills as one combined archive, the bundle slug. Each contained skill still gets its own index entry.

## Procedure

1. **Classify each skill's shape.** For every `skills/<name>/` directory:
   - If the directory contains only `SKILL.md` → shape is **single-file**.
   - If the directory contains `SKILL.md` plus sibling files → shape is **multi-file**.
   - If multiple skills are published together and a bundle archive is requested → each skill is still classified individually; the bundle is a container, not a skill, and has no `SKILL.md` of its own.
   - Getting the shape wrong silently drops files on install. Verify before proceeding.
   **Done when:** every skill is classified as single-file, multi-file, or bundle container.

2. **Build the served artifacts.** For each skill, produce the artifact its shape requires in the output directory under `agent-skills/`:
   - **Single-file**: copy `SKILL.md` as-is to `agent-skills/<name>/SKILL.md`.
   - **Multi-file**: build a *flat* `<name>.tar.gz`: `SKILL.md` and its siblings at the archive root, no wrapping folder. Use reproducible flags so the archive is deterministic:
     ```bash
     cd <skill-dir>
     find . -type f -exec chmod 0644 {} +
     tar --sort=name --owner=0 --group=0 --numeric-owner \
         --mtime='UTC 2020-01-01' -cf - * \
       | gzip -n > <output>/agent-skills/<name>.tar.gz
     ```
     Running `tar` from inside the skill dir keeps the archive flat. A wrapping `<name>/<name>/SKILL.md` nesting breaks every installer.
   - **Bundle** (if applicable): build `<bundle>-bundle.tar.gz` with each skill as its own `<name>/` folder side by side at the archive root. Run the same tar command one level up.
   **Done when:** every artifact is built in the output directory with the correct shape.

3. **Compute SHA-256 digests from served bytes.** For every artifact produced in step 2, compute `sha256:<hex>` over the exact bytes that will be served. Hash in the same pass that builds the artifact, never from a separate copy or a different build. A digest computed from bytes the publisher does not serve is a broken integrity check.
   **Done when:** every artifact has a digest matching its served bytes.

4. **Write the discovery index.** Create `.well-known/agent-skills/index.json` in the output directory, served as `application/json`. The document has exactly two top-level keys:
   ```json
   {
     "$schema": "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
     "skills": [
       {
         "name": "<slug>",
         "description": "<one-line trigger from the skill's front matter>",
         "type": "skill-md",
         "url": "https://<domain>/agent-skills/<name>/SKILL.md",
         "digest": "sha256:<hex>"
       }
     ]
   }
   ```
   Per-skill fields:
   - `name`: lowercase letters, digits, single dashes. Unique across the entire index. A duplicate shadows rather than adds. Fail the build on a duplicate.
   - `description`: the one-line trigger the agent reads to decide relevance. Copied from the skill's own front matter `description`.
   - `type`: `skill-md` for single-file (the `url` is the `SKILL.md` itself) or `archive` for multi-file (the `url` is the tarball).
   - `url`: the full `https://` URL on the publisher's domain. Never a `raw.githubusercontent.com` URL. The publisher must serve and hash from the same location they control.
   - `digest`: `sha256:<hex>` of the exact bytes at `url`. Conformant clients re-hash what they download and reject content that fails.
   A bundle is represented only as its member skills, each a normal entry under its own name. There is no entry for the bundle as a whole, and no `version`, `origin`, or `bundles` key.
   **Done when:** `.well-known/agent-skills/index.json` is written with the exact schema and no duplicates.

5. **Produce install commands.** For each skill, generate at least two working install methods:
   - **`pnpm dlx skills`**: `pnpm dlx skills add https://<domain>/agent-skills --skill <name> -a <agent> -g`. Omit `--skill` for interactive pick-list, pass `--skill '*'` for the whole catalog.
   - **`curl`** (dependency-free fallback):
     - Single-file: `curl -fsSL --create-dirs https://<domain>/agent-skills/<name>/SKILL.md -o <dir>/<name>/SKILL.md`
     - Multi-file: `mkdir -p <dir>/<name> && curl -fsSL https://<domain>/agent-skills/<name>.tar.gz | tar -xz -C <dir>/<name>`
     - Bundle: `mkdir -p <dir> && curl -fsSL https://<domain>/agent-skills/<bundle>-bundle.tar.gz | tar -xz -C <dir>`
   - **Repo-based** (if the source is a Git repo): `gh skill install <owner>/<repo> <name>` or Claude plugin marketplace `claude plugin install <name>@<marketplace>`.
   The `mkdir -p` before `tar -C` is not optional. `tar` fails with "could not chdir" when the target is missing.
   **Done when:** at least two working install methods are generated for each skill.

6. **Verify the published tree.** Run every check before declaring done:
   - `.well-known/agent-skills/index.json` exists and is valid JSON with the exact schema.
   - Every `url` is on the publisher's domain, no raw repo URLs.
   - For one entry, `curl -fsSL <its url> | sha256sum` matches the published `digest`.
   - `tar -tzf <name>.tar.gz` lists `SKILL.md` at the archive root, not `<name>/SKILL.md`.
   - `pnpm dlx skills add https://<domain>/agent-skills --skill <name>` installs cleanly into the target agent's skills directory.
   - The installed skill loads when the agent is asked something the skill covers.
   **Done when:** every verification check passes or a specific failure is reported.

## Failure and recovery

- **Duplicate name in index:** abort before writing the index. Two skills sharing a `name` causes one to shadow the other. Rename or remove the duplicate.
- **Digest mismatch:** the hash was computed from bytes other than what is served. Rebuild the artifact and recompute the digest in one pass. Never publish a digest that cannot be reproduced.
- **Non-flat archive:** `tar -tzf` shows a wrapping folder. Rebuild from inside the skill directory, not its parent.
- **URL points at uncontrolled host:** replace with a URL on the publisher's domain. A digest over bytes whose delivery is not controlled will drift on any upstream change.
- **Index schema violation:** missing required field, extra undefined field (`version`, `origin`, `bundles`), or wrong `type` value. Fix against the schema before publishing.
- **Partial result:** if verification fails after writing files, the output directory contains an incomplete or broken publishable tree. Delete or overwrite it; do not serve it.
- **Rollback:** all artifacts are local files. Delete the output directory to fully reverse the operation.

## Output

A complete publishable tree in the output directory: `.well-known/agent-skills/index.json` conforming to the discovery schema, `agent-skills/<name>/SKILL.md` for each single-file skill, `agent-skills/<name>.tar.gz` for each multi-file skill (flat archive, deterministic build), optionally `agent-skills/<bundle>-bundle.tar.gz` for bundles, and a report listing each skill, its shape, its digest, and the install commands that were verified.
