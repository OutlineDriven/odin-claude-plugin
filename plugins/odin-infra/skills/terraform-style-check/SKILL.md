---
name: terraform-style-check
description: 'Use when writing, reviewing, or generating Terraform HCL that must pass fmt and validate. Not for module authoring, state operations, `terraform apply`, or remote state.'
---

# Terraform style check

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Writing, reviewing, or generating Terraform configurations. |
| Authority | Reversible local: writes only named local HCL files; rollback is version control. No remote mutation. |
| Side effect | Local HCL files are formatted, validated, and may have resource blocks, provider constraints, and security attributes rewritten in place. |
| Done | HCL follows file organization, naming, version pinning, and security best practices and passes terraform fmt and validate. |

## Inputs

- Target directory or files (required): the Terraform root module or specific `.tf` files to check. Must exist on disk.
- Terraform CLI (required): `terraform` must be available on PATH.
- Style overrides (optional): project-specific naming prefixes or security exceptions. If absent, apply defaults below.

## Refusals

- Will not run `terraform apply`, `terraform plan`, or any state-mutating command.
- Will not modify files outside the declared target set, except that conventionally named destination files (`main.tf`, `<resource_type>.tf`, `variables.tf`, `outputs.tf`, `versions.tf`) may be created or modified by the file-organization step when blocks are moved into them.
- Will not suppress, comment out, or work around a validation diagnostic. The HCL is not valid until the diagnostic resolves.
- Will not install the Terraform CLI if it is missing.

## Procedure

1. **Define the target scope.** Enumerate `.tf` files under the target directory and record the file set. Do not read or modify files outside this set. **Done when:** the complete `.tf` file set is recorded.
2. **File organization.** Verify each resource type lives in a file named after its type (`main.tf` for provider and terraform blocks, `<resource_type>.tf` for resources, `variables.tf` for variable declarations, `outputs.tf` for outputs, `versions.tf` for required_providers and required_version). Reorganize misplaced blocks by moving them into their conventionally named file, creating that file if it does not yet exist. **Done when:** every block resides in its conventionally named file.
3. **Naming conventions.** Enforce snake_case for all resource, variable, output, and local names. Ensure resource names include a descriptive suffix matching the resource type (`aws_instance.web_server` not `aws_instance.this`). Ensure variable names use descriptive nouns (`vpc_cidr_block` not `cidr`). **Done when:** every name is snake_case and descriptively suffixed.
4. **Version pinning.** Verify every provider in `required_providers` has an exact version constraint (`= X.Y.Z` or `~> X.Y.Z` with minor pinned). Verify every `module` source has a version constraint. Add missing pins using the currently resolved version from `.terraform.lock.hcl` if available; otherwise flag for manual review. Flagging a missing pin for manual review is a non-blocking partial success: the step is done for that provider or module, and the flag is recorded in the compliance report. **Done when:** every provider and module source has a version constraint or a recorded manual-review flag.
5. **Security defaults.** Verify S3 buckets have `server_side_encryption_configuration`, public access blocks (`block_public_acls`, `block_public_policy`, `restrict_public_buckets`, `ignore_public_acls` all `true`), and `versioning` enabled. Verify security groups default to deny-all ingress. Verify RDS instances have `storage_encrypted = true` and `publicly_accessible = false`. Verify EC2 instances have `metadata_options.http_tokens = "required"`. Apply defaults where missing unless the file contains an explicit `# tfsec:ignore` or `# checkov:skip` annotation for that resource. **Done when:** every checked resource has its security defaults or an explicit skip annotation.
6. Run `terraform fmt -recursive -diff` on the target scope. When the input is a specific file list rather than a directory, run `terraform fmt -diff` on each file individually instead of `-recursive`. Capture stdout and stderr. **Done when:** `terraform fmt` exits zero.
7. Run `terraform validate` on the target directory. When the input is a specific file list rather than a directory, skip `terraform validate` (it requires a full module directory) and note the skip in the compliance report. Capture stdout and stderr. **Done when:** `terraform validate` exits zero, or the skip is recorded for single-file input.
8. **Re-enumerate the target `.tf` file set.** Verify no file outside the original set was created or modified, except for conventionally named destination files created or modified by the file-organization step (Step 2). **Done when:** the file set is accounted for, with any new conventionally named files explicitly listed.
9. **Report the final state.** List each file touched, each check category (organization, naming, version pinning, security) with pass/fail, and the terraform fmt and validate exit codes. **Done when:** the compliance report is emitted.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Syntax or validation error | Report the exact terraform validate diagnostic. Do not suppress, comment out, or work around the error. The HCL is not valid until the diagnostic resolves. |
| Scope expansion | Stop immediately. Report which file(s) were created or modified outside the original target set and the conventionally named destination files allowed by Step 2. Revert the out-of-scope changes via `git checkout` or manual deletion. |
| Missing terraform CLI | Report that `terraform` is not available on PATH. Do not attempt installation. The check cannot proceed. |
| Partial result (steps 1-5 pass, 6 or 7 fails) | Intermediate HCL changes are retained on disk. The failure report names the step that failed and the files already modified. The user decides whether to keep or revert. |

## Output

Formatted and validated HCL files in place, plus a compliance report listing files touched, per-category pass/fail (organization, naming, version pinning, security), and terraform fmt/validate exit codes. On failure, the report includes the specific diagnostic, the failed step, and the set of files modified before failure.
