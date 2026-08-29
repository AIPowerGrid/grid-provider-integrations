# n8n Creator Portal Submission

## Package

- npm name: `@aipowergrid/n8n-nodes-aipg`
- version: `0.1.2`
- source: `AIPowerGrid/grid-provider-integrations`, directory
  `n8n-nodes-aipg`
- license: MIT
- operations: completed text, image, video, and audio generation
- credential: encrypted bearer key with `account.read` and
  `inference.submit`

## Publication path

`@aipowergrid/n8n-nodes-aipg@0.1.2` was published from GitHub Actions with
provenance on npm using tag `n8n-nodes-aipg-v0.1.2`. Its Trusted Publisher is:

- repository owner: `AIPowerGrid`
- repository: `grid-provider-integrations`
- workflow: `publish-n8n.yml`

The public package resolves to the tagged commit, and a clean n8n `2.36.8`
instance discovered and loaded all four operations.

## Creator Portal evidence

- The official `@n8n/scan-community-package` scanner passes the public npm
  package, its GitHub provenance, the attested TypeScript source, and the
  shipped JavaScript artifact.
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

The package and provenance are public. Creator Portal acceptance is separate
from package publication.

## Portal submission

Submit `@aipowergrid/n8n-nodes-aipg` at
[creators.n8n.io/nodes](https://creators.n8n.io/nodes). The current official
requirements are satisfied:

- scoped package name follows `@<scope>/n8n-nodes-*`
- `n8n-community-node-package` keyword and `n8n` manifest entries are present
- public MIT source repository matches npm metadata
- package has no runtime dependencies or file-system/environment access
- English README includes credentials, operations, examples, errors, and
  privacy guidance
- publication comes from GitHub Actions with npm provenance

The Creator Portal may email an ownership token to the package author or
maintainer address. Never place that token in source, issues, screenshots, or
workflow JSON. Portal submission does not require an npm login or npm token.
