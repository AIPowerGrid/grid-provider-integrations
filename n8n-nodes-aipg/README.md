# n8n Nodes for AI Power Grid

Use AI Power Grid in n8n workflows for text, image, video, and audio
generation. The node discovers currently advertised models instead of shipping
a stale model catalog.

## Credentials

Create a server-side API key in the
[Grid console](https://console.aipowergrid.io/dashboard/api-key). The key needs
the `account.read` and `inference.submit` scopes carried by ordinary
programmatic keys. `account.read` lets n8n validate the credential without
spending credit; `inference.submit` authorizes generation. Add it to an **AI
Power Grid API** credential in n8n. n8n stores the secret and adds it as a
bearer token. The key is never a workflow field.

Do not put the key in browser code, workflow JSON, expressions, prompts, or
screenshots. Give production workflows a separate, revocable key with only the
scopes they need.

## Operations

- **Generate Text** calls `/v1/chat/completions` and returns the completed
  OpenAI-style response. Standard n8n node executions do not relay SSE to the
  editor, so this operation deliberately uses `stream: false`.
- **Generate Image** calls `/v1/images/generations` for text-to-image. The
  first package does not claim img2img support because binary source handling
  needs a dedicated upload contract. Its model picker includes only workers
  advertising `txt2img`.
- **Generate Video** calls `/v1/videos/generations` for text-to-video.
  Its model picker excludes workers advertising only `img2video`.
- **Generate Audio** calls `/v1/audio/generations` for ACE-Step music, with
  optional lyrics and governed controls.

Image, video, and audio executions wait for the worker result and return the
Grid response, including result URLs and provenance metadata. Their request
timeouts follow Core's current modality deadlines. Use n8n queue mode and
worker execution timeouts appropriate for long media jobs.

## Errors and credits

Grid HTTP errors are surfaced as n8n node errors. Common statuses are:

- `401`: invalid or revoked API key
- `402`: insufficient usable credits
- `404`: model no longer available
- `422`: request or model parameter is unsupported
- `429`: rate or concurrency limit reached
- `503`: no compatible worker is online

Fund the same Grid account at
[console.aipowergrid.io](https://console.aipowergrid.io/dashboard/funding).
Retry only operations your workflow can safely repeat; a media timeout does not
prove that the remote job failed.

## Privacy and positioning

Grid requests are routed to remote community-operated workers. Workers may be
able to inspect plaintext prompts, source material, and outputs. Do not send
secrets, personal or regulated data, or confidential source code unless a
separately verified confidential-compute deployment satisfies your needs.

This package is maintained by AI Power Grid. It does not imply a partnership
with or endorsement by n8n.

## Development

Node.js 22 or newer is required.

```bash
npm ci
npm test
npm run lint
npm run build
npm pack --dry-run
```

A credentialed release check must exercise one bounded request in every
operation before publication. Those checks spend account credit and are not
part of the default test suite:

```bash
AIPG_LIVE_E2E=1 npm run test:e2e:live
```

Use a disposable `account.read` + `inference.submit` key and revoke it after the
run. The live test does not print the key, prompts, generated media URLs, model
output, or account balance.

## Release

`@aipowergrid/n8n-nodes-aipg@0.1.1` is public with npm provenance from tag
`n8n-nodes-aipg-v0.1.1`. Future releases publish only through the root
`publish-n8n.yml` workflow and its npm OIDC Trusted Publisher. The workflow
rejects a tag that does not exactly match `package.json`, reruns tests and lint,
and invokes n8n's supported release command. The one-time bootstrap token is
revoked; do not restore a registry token.
