---
name: read-google-doc
description: 'Use when asked to read the content of a Google Doc by URL or ID. Triggered when the user provides a Google Doc URL or ID and asks to read its content. Returns the document title, ID, link, and plain text or JSON; surfaces permission and auth errors. Don''t use for tasks that require source or remote-system changes.'
---

# Read Google Doc

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User provides a Google Doc URL or ID and asks to read its content. |
| Authority | read-only: no file write, no VCS change, no credential write, no paid mutation, no published artifact, no deployment, no remote write |
| Side effect | Returns document title, ID, link, and plain text or JSON. No file, network, or credential mutation. |
| Done | Content is extracted and returned; permission and auth errors are surfaced. |

## Inputs

Required:
- Document URL or ID: a Google Docs URL string (e.g. `https://docs.google.com/document/d/DOC_ID/edit`) or a bare document ID string.

Optional:
- Format: `text` (default) or `json`. When `json`, return the full document model as structured JSON.

## Procedure

1. **Parse the document identifier.** If a full URL is provided, extract the document ID from the path between `/d/` and the next `/`. Validate that the ID is non-empty. Fail with `invalid-input` if the URL or ID cannot be parsed.
2. **Authenticate.** Use the Google Docs API with the ambient credentials available in the execution environment (e.g. via a `GOOGLE_API_KEY` or OAuth token in the environment). Fail with `auth-failure` if no credentials are present or the token is invalid.
3. **Retrieve the document.** Call `GET https://www.googleapis.com/drive/v3/files/{documentId}?fields=id,name,webViewLink` to fetch metadata. Then call `GET https://docs.googleapis.com/v1/documents/{documentId}` to fetch the full body. Fail with `not-found` if the API returns HTTP 404. Fail with `permission-denied` if the API returns HTTP 403.
4. **Format the response.**
   - `text`: extract plain text from the document body and return it alongside the title, ID, and webViewLink.
   - `json`: return the raw document model JSON alongside the metadata.
5. **Return the result.** Present the title, ID, link, and formatted content. Surface all errors with their exact HTTP status and message.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| `invalid-input` | URL cannot be parsed or ID is empty | State exactly what was received and why it is invalid. Do not proceed. |
| `auth-failure` | No credentials or invalid/expired token | State the auth failure. Do not fall back or guess credentials. |
| `not-found` | HTTP 404 from Docs API | State that the document was not found. Do not fabricate content. |
| `permission-denied` | HTTP 403 from Docs API | State that access was denied. Do not expose document content. |
| `api-error` | Other non-2xx HTTP response | Surface the status code and error message verbatim. Do not suppress or retry silently. |

Partial-result rule: if the metadata call succeeds but the document body call fails, return the metadata with the error annotated rather than returning nothing.

## Output
A structured report containing:
- `title`: the document's name
- `id`: the document ID
- `link`: the document's webViewLink
- `content`: either plain text (default) or the full document model as JSON, per the optional format input

If an error occurred, return the error class and message only.

## Provenance

Origin: `warpdotdev/competitive-intelligence-agent-oss`, pinned at `9e0363e810a14405ef876fb354562735002797fb`. License: MIT. MIT notice retained; mechanism adapted. ADAPT as a focused read utility for odin-research module (read-only external-source retrieval). Support paths: none.
