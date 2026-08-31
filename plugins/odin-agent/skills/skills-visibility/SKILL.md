---
name: skills-visibility
description: 'Use when a publisher wants a discoverable, integrity-protected agent-skill catalog served from a domain they control. Builds the discovery index with SHA-256 digests, deterministic flat archives, and verified install commands, then hands the publisher a post-deploy verification checklist. Not for remote mutation or deployment — the publisher deploys the output tree.'
---

# Skills visibility

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Publisher wants to build, distribute, or self-host a discoverable integrity-protected agent-skill catalog |
| Authority | Reversible local write only: build artifacts and index in the output tree. The publisher deploys; the skill never pushes or mutates remotes |
| Side effect | Produces `SKILL.md` files or flat `.tar.gz` archives and `.well-known/agent-skills/index.json` with SHA-256 digests and install commands. No remote mutation, no credential access, no VCS operation |
| Done | A complete publishable local tree (schema-valid index, flat deterministic archives, digests matching the produced bytes) plus a per-skill report of shape, digest, and install commands, with post-deploy verification results recorded when run |

## Inputs

- Skill source directory (required): a directory tree where each skill lives at `skills/<name>/SKILL.md`, optionally with sibling files. Must be a Git repo if repo-based install methods are used.
- Publisher-controlled https origin (required): the `https://` origin the publisher controls and serves from (e.g., `https://yourdomain.com`). Never `raw.githubusercontent.com` or any host whose delivery the publisher does not control.
- Local output directory (required): local path where the publishable tree is written. The publisher copies or deploys this tree to their domain.
- Optional bundle slug: if publishing a bundle of multiple skills as one combined archive, the bundle slug. Each contained skill still gets its own index entry.

## Procedure

1. Classify each skill as single-file, multi-file, or bundle container and fail on duplicate names. For every `skills/<name>/` directory: if it contains only `SKILL.md`, shape is single-file. If it contains `SKILL.md` plus sibling files (references, scripts, assets), shape is multi-file. If it contains nested `skills/` subdirectories, shape is bundle container. Check every name for uniqueness across the entire source tree. A duplicate shadows rather than adds; abort before writing the index. Done when: every skill is classified and no duplicate names are found.
2. Build deterministic flat artifacts. For each skill, produce the artifact its shape requires in the output directory under `agent-skills/`:
   - Single-file: copy `SKILL.md` as-is to `agent-skills/<name>/SKILL.md`.
   - Multi-file: create a reproducible tar with sorted entries, zeroed owner, and fixed mtime (`tar --sort=name --owner=0 --group=0 --mtime=@0 -cf agent-skills/<name>.tar.gz -C <skill-dir> .`). Verify `tar -tzf` shows no wrapping folder.
   - Bundle container: create a reproducible tar of the entire bundle directory with the same deterministic flags.
   Done when: every artifact is produced as a flat deterministic archive or copied file.
3. Write `.well-known/agent-skills/index.json` with the exact schema and sha256 digests computed from the exact artifact bytes. The document has exactly two top-level keys: `$schema` and `skills[]`. Per-skill fields: `name` (lowercase letters, digits, single dashes, unique), `description` (from frontmatter), `type` (`skill-md` for single-file, `archive` for multi-file or bundle), `url` (pointing at the publisher-controlled domain), and `digest` (`sha256:<hex>` computed over the exact bytes of the produced artifact). Hash in the same pass that builds the artifact, never from a separate copy. Done when: the index is written with every digest matching its produced bytes and conforming to the schema.
4. Generate at least two install methods per skill. Produce `pnpm dlx skills add https://<domain>/agent-skills --skill <name> -a <agent> -g` plus a curl fallback (`curl -sL https://<domain>/agent-skills/<name>/SKILL.md`). When a Git source exists, add repo-based methods (`gh skill install <owner>/<repo> --skill <name>` or Claude plugin marketplace install). Done when: at least two install methods are generated per skill.
5. Hand the publisher a verification checklist to run after deploy. The checklist contains: digest re-hash against served bytes (`curl -sL <url> | sha256sum`), tar layout listing (`curl -sL <url> | tar -tzf -`), real install into a target agent (run one install command and confirm the skill loads), and an activation probe (trigger the skill and confirm it fires). Report each check's result when the publisher runs it, without claiming pre-deploy completion. Done when: the checklist is delivered and any results the publisher provides are recorded.

## Failure and recovery

- Duplicate name in index: abort before writing the index. Two skills sharing a `name` causes one to shadow the other. Rename or remove the duplicate.
- Digest mismatch: the hash was computed from bytes other than what is served. Rebuild the artifact and recompute the digest in one pass. Never publish a digest that cannot be reproduced.
- Non-flat archive: `tar -tzf` shows a wrapping folder. Rebuild from inside the skill directory, not its parent.
- Uncontrolled-host URL: replace with a URL on the publisher's domain. A digest over bytes whose delivery is not controlled will drift on any upstream change.
- Index schema violation: missing required field, extra undefined field, or wrong `type` value. Fix against the schema before publishing.
- Incomplete tree: if verification fails after writing files, delete or overwrite the output directory; do not serve it. The publisher deploys only a complete, verified tree.

## Output

A complete publishable tree in the output directory: `.well-known/agent-skills/index.json` conforming to the discovery schema, `agent-skills/<name>/SKILL.md` for each single-file skill, `agent-skills/<name>.tar.gz` for each multi-file skill (flat archive, deterministic build), optionally `agent-skills/<bundle>-bundle.tar.gz` for bundles, and a per-skill report listing each skill, its shape, its digest, and its install commands, with post-deploy verification results recorded when the publisher runs them.
