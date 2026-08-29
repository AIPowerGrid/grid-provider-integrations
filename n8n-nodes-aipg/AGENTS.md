# n8n-nodes-aipg - n8n community node

## Purpose

Native n8n community node for AI Power Grid text, image, video, and audio
generation. This package uses only the documented production `/v1` API and
keeps Grid credentials in n8n's encrypted credential store.

## Local Contracts

- Keep the production API base fixed to `https://api.aipowergrid.io/v1`.
- Never expose a custom remote base URL or place API keys in node parameters.
- Discover text models from `/v1/models` and media models from
  `/v1/status/models`; do not hard-code availability claims.
- Ordinary n8n node executions return completed responses. Do not claim that
  this node relays token streaming through the editor.
- Preserve Core's bounds for token, image, video, and audio inputs. Unsupported
  source-media workflows must remain absent rather than silently dropping data.
- HTTP errors, including `401`, `402`, `404`, `422`, `429`, and `503`, must be
  surfaced to n8n so workflow error branches can handle them.

## Verification

- `npm ci`
- `npm test`
- `npm run lint`
- `npm run build`
- `npm pack --dry-run`
