---
name: summarize-google-docs
description: 'Authenticates with Google Drive, fetches recently modified internal Google Docs, summarizes themes and conflicts, and opens a PR with the cited report. Every external call and file mutation requires explicit human approval.'
disable-model-invocation: true
---

# Summarize Google Docs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to summarize recently modified internal Google Docs or research internal docs. |
| Authority | Human must approve every external call (Google Drive API, Google Docs API, GitHub API) and every file-system mutation (directory creation, file write, PR creation). The skill executes no external or irreversible action autonomously. |
| Side effect | Saves a summary report to `reports/google_doc_summaries/`. Creates one GitHub pull request. No other files are written. |
| Done | A summary report exists at `reports/google_doc_summaries/<timestamp>.md` containing identified themes, identified conflicts, and cited document names and links. |

## Inputs

| Input | Required | Description |
|---|---|---|
| Human query | Required | A natural-language request to summarize specific or recently modified internal Google Docs or research documents. |
| Google Drive credentials or OAuth token | Required | Credentials that grant read access to the internal Google Drive account. |
| Document scope | Optional | A list of specific document IDs or a folder ID to restrict scope. If omitted, the skill fetches recently modified documents from the authenticated account. |
| Output filename | Optional | A filename for the summary report. If omitted, the filename is `<timestamp>.md`. |
| PR target | Required | The repository and branch to open the PR against (e.g., `owner/repo:branch`). |

## Procedure

1. **Confirm authority.** Ask the human to confirm the exact scope of the request (which documents, which folder, or "recently modified"). Do not proceed until the human specifies the scope or approves a default of recently modified documents.

2. **Authenticate with Google Drive.** Use the provided credentials or OAuth token to obtain a valid Google Drive API access token. If the credentials are absent, invalid, or expired, stop and report the authentication failure.

3. **Fetch document metadata.** Call the Google Drive API `files.list` endpoint with `q="modifiedTime > '<timestamp>' and mimeType='application/vnd.google-apps.document'"` and `fields="files(id,name,webViewLink,modifiedTime)"`. Use the provided scope to filter if document IDs or a folder ID were given. Stop if the response contains no files.

4. **Fetch document content.** For each document ID returned, call the Google Docs API `documents.get` endpoint with `includeTextContent=true`. Stop and report if any individual document fetch fails.

5. **Create the output directory.** Create the directory `reports/google_doc_summaries/` if it does not exist. Stop and report if directory creation fails.

6. **Analyse the documents.** Identify the following from the document text and metadata:
   - **Themes:** recurring topics, decisions, or concerns across the documents.
   - **Conflicts:** any statements, decisions, or data that contradict each other across documents.
   - **Citations:** for each document, record its name and its `webViewLink`.

7. **Write the summary report.** Write a Markdown file to `reports/google_doc_summaries/<timestamp>.md` (or the human-specified filename) containing:
   - A header with the generation timestamp and the list of summarised document names with their links.
   - A **Themes** section listing each identified theme with a brief description.
   - A **Conflicts** section listing each identified conflict with the two conflicting document names cited.
   - A **Recommendations** section containing any non-conflicting synthesis the analysis supports.

8. **Confirm PR intent.** Present the human with the summary report path and the proposed PR target. Ask the human to confirm they want a PR opened. Do not open a PR without explicit human confirmation.

9. **Create the pull request.** Use the GitHub API to open a PR against the confirmed target repository and branch with the summary report as the added file. Stop and report if the PR creation call fails.

10. **Report the done predicate.** State the path of the saved report and the URL of the opened pull request.

## Failure and recovery
| Failure class | Partial-result rule | Recovery |
|---|---|---|
| Authentication failure | No file written. | Present the authentication error. Do not retry without new credentials. |
| No documents found | No file written. | State that no documents matched the scope and timestamp filter. |
| Document fetch failure | Any already-fetched content is discarded. | Stop. Report which document ID could not be fetched. |
| Directory creation failure | No file written. | Stop. Report the filesystem error. |
| Analysis failure | No file written. | Stop. Report the analysis failure without claiming the done predicate holds. |
| Write failure | No file written. | Stop. Report the write error. |
| Human rejects PR confirmation | Report is already saved; PR not opened. | Present the report path. Do not open a PR. |
| PR creation failure | Report is already saved. | Report the GitHub API error and the report path. Do not claim PR success. |

## Output
A Markdown file at `reports/google_doc_summaries/<timestamp>.md` and, if the human confirmed, a GitHub pull request URL. No other files are written. No external calls are made without human approval at each step.

## Provenance

**Origin:** warpdotdev/competitive-intelligence-agent-oss
**Revision:** 9e0363e810a14405ef876fb354562735002797fb
**Source path:** `.warp/skills/summarize_google_docs/SKILL.md`
**License:** MIT — MIT notice retained; mechanism adapted.
**Adaptation:** The original skill targeted the Warp agent ecosystem. The module is remapped to `odin-research` for internal-docs research synthesis. The authority level is raised to `human-only` with mandatory human confirmation before every external call and every file-system mutation. The output path is `reports/google_doc_summaries/` with PR creation requiring explicit human confirmation. Source mechanism for document fetching (Google Drive `files.list` + Google Docs `documents.get`) is retained.
