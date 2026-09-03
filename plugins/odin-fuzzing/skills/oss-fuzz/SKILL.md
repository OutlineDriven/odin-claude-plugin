---
name: oss-fuzz
description: 'Use when asked to enroll a project in OSS-Fuzz or run its helper workflow locally. Builds the project image and fuzzers, runs the named harness, and checks enrollment metadata. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# OSS-Fuzz

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs to enroll an open-source project in OSS-Fuzz, run its helper workflow locally, or reproduce an OSS-Fuzz report. |
| Authority | Write only named local artifacts (oss-fuzz clone, Docker images, project enrollment files); rollback path is `docker rmi` for images and filesystem deletion for the clone. |
| Side effect | OSS-Fuzz project integration files, Docker image builds, and local fuzzing campaign artifacts written to the oss-fuzz working directory. |
| Done | The project Docker image builds, fuzzers compile with AddressSanitizer, the named harness executes, and `projects/<name>/project.yaml`, `Dockerfile`, and `build.sh` are present and structurally valid. |

## Inputs

| Input | Required | Description |
|---|---|---|
| `project_name` | Required | OSS-Fuzz project identifier (slug used in `infra/helper.py` commands and the `projects/` subdirectory). |
| `harness_name` | Required for local run | Fuzzer executable name inside the project's build output directory. |
| `language` | Required for enrollment | Project language (e.g. `c++`, `python`, `rust`, `go`). |
| `main_repo` | Required for enrollment | URL of the project's primary source repository. |
| `sanitizer` | Optional | Sanitizer for `build_fuzzers`: `address` (default), `undefined`, `coverage`. |
| `fuzzer_args` | Optional | Extra arguments passed through to the fuzzer binary. |
| `oss_fuzz_dir` | Optional | Local path of the cloned oss-fuzz repository; defaults to `./oss-fuzz`. |
| `primary_contact` | Required for enrollment | Maintainer email for `project.yaml`. |

## Procedure

### Task A: run an enrolled project locally

1. Verify `docker` is available and the user has permission to run containers (`docker info` exits 0). Done when: `docker info` exits 0.
2. Clone oss-fuzz if `oss_fuzz_dir` does not exist or is not a git repository:
   ```bash
   git clone https://github.com/google/oss-fuzz "$oss_fuzz_dir"
   ```
   Done when: the oss-fuzz repository is cloned and present at `oss_fuzz_dir`.
3. Change to the oss-fuzz directory:
   ```bash
   cd "$oss_fuzz_dir"
   ```
   Done when: the working directory is the oss-fuzz directory.
4. Build the project Docker image:
   ```bash
   uv run --no-project python infra/helper.py build_image --pull "$project_name"
   ```
   If `build_image` reports the project directory does not exist under `projects/`, stop and return `enrollment-missing`. Done when: the project Docker image builds successfully or `enrollment-missing` is returned.
5. Build the fuzzers with AddressSanitizer:
   ```bash
   uv run --no-project python infra/helper.py build_fuzzers --sanitizer="${sanitizer:-address}" "$project_name"
   ```
   Capture stdout/stderr. If the build exits non-zero, return `build-failed` with the captured output. Done when: fuzzers compile with the configured sanitizer and stdout/stderr are captured.
6. Run the named harness:
   ```bash
   uv run --no-project python infra/helper.py run_fuzzer "$project_name" "$harness_name" ${fuzzer_args:+"$fuzzer_args"}
   ```
   Observe for at least 10 seconds. If the harness exits with a sanitizer report, return `crash-detected` with the report path. Otherwise return `harness-ran`. Done when: the harness runs for at least 10 seconds and returns `harness-ran` or `crash-detected`.

### Task B: enroll a new project

1. Verify the project has an OSS-Fuzz-compatible harness at `$main_repo` or an associated harness repository. Done when: a compatible harness is confirmed at `$main_repo` or the associated repository.
2. Create `projects/<project_name>/` under the oss-fuzz directory. Done when: the project directory is created.
3. Write `projects/<project_name>/project.yaml`:
   ```yaml
   homepage: "<main_repo>"
   language: "<language>"
   primary_contact: "<primary_contact>"
   main_repo: "<main_repo>"
   fuzzing_engines:
     - libfuzzer
   sanitizers:
     - address
   ```
   Extend `sanitizers` and `fuzzing_engines` if the task specifies additional values. Done when: `project.yaml` is written with all required fields and any extensions.
4. Write `projects/<project_name>/Dockerfile` using `gcr.io/oss-fuzz-base/base-builder` as the base image; add language-specific and project-specific `RUN` commands to install build dependencies. Do not copy source code directly; use `git clone` in the Dockerfile. Done when: `Dockerfile` is written with the base image and `git clone` for source.
5. Write `projects/<project_name>/build.sh` as an executable script:
   - Set `#!/bin/bash -eu`.
   - Clone or build project dependencies.
   - Compile harnesses using `$CXX`, `$CXXFLAGS`, `$LIB_FUZZING_ENGINE`, `$SRC`, and `$OUT` as provided by the OSS-Fuzz environment.
   - Copy corpus and dictionary files to `$OUT` if present.
   Done when: `build.sh` is written as an executable script with all four elements.
6. Return `enrollment-artifacts-written` listing the three files and their paths. Done when: the three artifact paths are returned.

## Failure and recovery

| Failure class | Trigger | Result |
|---|---|---|
| `docker-unavailable` | `docker info` exits non-zero | Return `blocked: docker-unavailable`. Do not attempt container operations. |
| `enrollment-missing` | `projects/<project_name>` absent and task is local run | Return `blocked: enrollment-missing`. Enrollment is out of scope for local-run unless explicitly requested. |
| `build-failed` | `build_fuzzers` exits non-zero | Return `failed: build-failed` with captured stderr. Do not proceed to run step. |
| `crash-detected` | Harness exits with ASan/UBSan report | Return `crash-detected` with the report file path. Do not suppress or dismiss the report. |
| `rollback` | Any step fails; Docker images written by this session | Rollback: `docker rmi $(docker images -q "gcr.io/oss-fuzz/$(basename "$project_name")*") 2>/dev/null`; delete the `oss_fuzz_dir` clone if this session created it. |

## Output

| Outcome | Output |
|---|---|
| Local run, build success, no crash | `done: harness-ran`: fuzzer is running and producing coverage or execution output. |
| Local run, crash detected | `crash-detected: <report-path>`: sanitizer report written to the build output directory. |
| Enrollment artifacts written | `done: enrollment-artifacts-written`: `project.yaml`, `Dockerfile`, `build.sh` paths listed. |
| Build failed | `failed: build-failed`: full build log for diagnosis. |
| Prerequisites not met | `blocked: <failure-class>`: reason stated, no progress claimed. |
