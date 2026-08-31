---
name: read-google-doc
description: 'Use when the user provides a Google Doc URL or ID and asks to read its content. Returns the document title, ID, link, and plain text or JSON; surfaces permission and auth errors. Not for editing Google Docs — this skill is read-only retrieval.'
---

# Read Google Doc

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User provides a Google Doc URL or ID and asks to read its content. |
| Authority | Read-only: no file write, no VCS change, no credential write, no paid mutation, no published artifact, no deployment, no remote write. |
| Side effect | Returns document title, ID, link, and plain text or JSON. No file, network, or credential mutation. |
| Done | Content is extracted and returned; permission and auth errors are surfaced. |

## Refusals

- **Editing or writing to a Google Doc**: rejected. This skill retrieves content only.
- **Fabricating content when the API fails**: rejected. Each error is surfaced with its exact HTTP status and message.
- **Falling back or guessing credentials**: rejected. State the auth failure and stop.

## Inputs

Required:

- **Document URL or ID**: a Google Docs URL string (e.g. `https://docs.google.com/document/d/DOC_ID/edit`) or a bare document ID string.

Optional:

- **Format**: `text` (default) or `json`. When `json`, return the full document model as structured JSON.

## Procedure

1. Parse the document identifier. If a full URL is provided, extract the document ID from the path between `/d/` and the next `/`. Validate that the ID is non-empty. Fail with `invalid-input` if the URL or ID cannot be parsed. **Done when**: a non-empty document ID is extracted or `invalid-input` is reported.
2. Authenticate using the Google Docs API with the ambient credentials available in the execution environment (e.g. via a `GOOGLE_API_KEY` or OAuth token). Fail with `auth-failure` if no credentials are present or the token is invalid. **Done when**: authentication succeeds or `auth-failure` is reported.
3. Retrieve the document. Call `GET https://www.googleapis.com/drive/v3/files/{documentId}?fields=id,name,webViewLink` to fetch metadata. Then call `GET https://docs.googleapis.com/v1/documents/{documentId}` to fetch the full body. Fail with `not-found` on HTTP 404, `permission-denied` on HTTP 403. **Done when**: metadata and body are retrieved or the exact error class is reported.
4. Format the response: `text` extracts plain text from the document body alongside title, ID, and webViewLink; `json` returns the raw document model JSON alongside the metadata. **Done when**: the content is formatted per the requested format.
5. Return the result: title, ID, link, and formatted content. Surface each error with its exact HTTP status and message. **Done when**: the result or error is returned to the caller.

## Failure and recovery

- **`invalid-input`**: state exactly what was received and why it is invalid. Do not proceed.
- **`auth-failure`**: state the auth failure. Do not fall back or guess credentials.
- **`not-found`**: state that the document was not found. Do not fabricate content.
- **`permission-denied`**: state that access was denied. Do not expose document content.
- **`api-error`**: surface the status code and error message verbatim. Do not suppress or retry silently.

If the metadata call succeeds but the document body call fails, return the metadata with the error annotated rather than returning nothing.

## Output

A report with `title`, `id`, `link`, and `content` (plain text or JSON per format), or on error the error class and message only.
