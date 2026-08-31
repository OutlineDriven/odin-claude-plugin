---
name: terraform-style-check
description: 'Use when writing, reviewing, or generating Terraform configurations. Produces HCL that follows file organization, naming, version pinning, and security best practices and passes terraform fmt and validate. Don''t use for remote state operations, `terraform apply`, or changes outside named local HCL files.'
---

# Terraform style check

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Writing, reviewing, or generating Terraform configurations |
| Authority | Reversible local: write only to named local HCL files; rollback via version control revert of the working tree |
| Side effect | Local HCL files are formatted, validated, and may have resource blocks, provider constraints, and security attributes rewritten in place |
| Done | HCL follows file organization, naming, version pinning, and security best practices and passes terraform fmt and validate |

## Inputs

- **Target directory or files** (required): the Terraform root module or specific `.tf` files to check. Must exist on disk.
- **Terraform CLI** (required): `terraform` must be available on PATH.
- **Style overrides** (optional): project-specific naming prefixes or security exceptions. If absent, apply defaults below.

## Procedure

1. Identify the target scope: enumerate `.tf` files under the target directory. Record the file set. Do not read or modify files outside this set.
2. **File organization**: verify each resource type lives in a file named after its type (e.g., `main.tf` for provider and terraform blocks, `<resource_type>.tf` for resources, `variables.tf` for variable declarations, `outputs.tf` for outputs, `versions.tf` for required_providers and required_version). Reorganize blocks into the correct files if misplaced.
3. **Naming conventions**: enforce snake_case for all resource, variable, output, and local names. Ensure resource names include a descriptive suffix matching the resource type (e.g., `aws_instance.web_server` not `aws_instance.this`). Ensure variable names use descriptive nouns (e.g., `vpc_cidr_block` not `cidr`).
4. **Version pinning**: verify every provider in `required_providers` has an exact version constraint (`= X.Y.Z` or `~> X.Y.Z` with minor pinned). Verify every `module` source has a version constraint. Add missing pins using the currently resolved version from `.terraform.lock.hcl` if available; otherwise flag for manual review.
5. **Security defaults**: verify S3 buckets have `server_side_encryption_configuration`, public access blocks (`block_public_acls`, `block_public_policy`, `restrict_public_buckets`, `ignore_public_acls` all `true`), and `versioning` enabled. Verify security groups default to deny-all ingress. Verify RDS instances have `storage_encrypted = true` and `publicly_accessible = false`. Verify EC2 instances have `metadata_options.http_tokens = "required"`. Apply these defaults where missing unless the file contains an explicit `# tfsec:ignore` or `# checkov:skip` annotation for that specific resource.
6. Run `terraform fmt -recursive -diff` on the target scope. Capture stdout and stderr. If the exit code is non-zero, report the formatting errors and stop.
7. Run `terraform validate` on the target directory. Capture stdout and stderr. If the exit code is non-zero, report the validation errors and stop.
8. Re-enumerate the target `.tf` file set. Verify no file outside the original set was created or modified. If the set expanded, report the boundary violation and stop.
9. Report the final state: list each file touched, each check category (organization, naming, version pinning, security) with pass/fail, and the terraform fmt and validate exit codes.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Syntax or validation error | Report the exact terraform validate diagnostic. Do not suppress, comment out, or work around the error. The HCL is not valid until the diagnostic resolves. |
| Scope expansion | Stop immediately. Report which file(s) were created or modified outside the original target set. Revert the out-of-scope changes via `git checkout` or manual deletion. |
| Missing terraform CLI | Report that `terraform` is not available on PATH. Do not attempt installation. The check cannot proceed. |

Partial results: if steps 1-5 complete but step 6 or 7 fails, the intermediate HCL changes are retained on disk. The failure report names the step that failed and the files already modified. The user decides whether to keep or revert the partial changes.

## Output
- Formatted and validated HCL files in place (if all checks pass).
- A compliance report listing: files touched, per-category pass/fail (organization, naming, version pinning, security), and terraform fmt/validate exit codes.
- On failure: the specific diagnostic, the step that failed, and the set of files modified before failure.

## Provenance

Adapted from `https://github.com/warpdotdev/oz-skills` at revision `6c08c49fc6c51b8f768bf8c53c041bc06a160765`, path `.agents/skills/terraform-style-check/SKILL.md`. Licensed under MIT (Copyright 2026 Warp). This adaptation is clean-room; no third-party expression is copied verbatim.
