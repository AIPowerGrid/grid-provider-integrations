# n8n Creator Portal Submission

## Package

- npm name: `@aipowergrid/n8n-nodes-aipg`
- version: `0.1.1`
- source: `AIPowerGrid/grid-provider-integrations`, directory
  `n8n-nodes-aipg`
- license: MIT
- operations: completed text, image, video, and audio generation
- credential: encrypted bearer key with `account.read` and
  `inference.submit`

## Publication path

The verified-node intake requires npm publication from GitHub Actions with
provenance. Publish only through `.github/workflows/publish-n8n.yml` using the
tag `n8n-nodes-aipg-v0.1.1`. Configure npm Trusted Publishing for:

- repository owner: `AIPowerGrid`
- repository: `grid-provider-integrations`
- workflow: `publish-n8n.yml`

After publication, verify that npm provenance resolves to the tagged commit
and that a clean n8n `2.36.8` instance can discover and load the package.

## Creator Portal evidence

- `npm run lint`, `npm test`, `npm run build`, and `npm pack --dry-run` pass.
- The package has no runtime dependencies, as required for verified community
  nodes.
- A clean local n8n editor lists all four operations.
- The credential test calls authenticated read-only `/account/credits`; public
  model discovery is not used as proof that a key is valid.
- One bounded live request per advertised operation passes through the exact
  built transport with a disposable scoped key.
- HTTP `401`, `402`, `404`, `422`, `429`, and `503` remain visible to workflow
  error branches.
- Documentation states that standard n8n executions return completed text and
  do not relay token streaming through the editor.
- Documentation states that plaintext requests may be inspected by remote
  community workers and makes no n8n partnership claim.

Do not submit to the Creator Portal before the npm package and provenance are
public. Portal acceptance is separate from package publication.
