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

The package and provenance are public. It was submitted to the Creator Portal
on 2026-08-30. The package's portal page is
[`/nodes/@aipowergrid%2Fn8n-nodes-aipg/integration`](https://creators.n8n.io/nodes/@aipowergrid%2Fn8n-nodes-aipg/integration).
At submission time, the portal reported **Automated Review: In Progress**.
Submission and automated review are not Creator Portal acceptance, manual
approval, or n8n endorsement.

### Reverification on 2026-08-30

- `npx @n8n/scan-community-package @aipowergrid/n8n-nodes-aipg` passed
  provenance, source retrieval, and package security checks for public version
  `0.1.2`.
- The scanner resolved the attested source to repository commit `447a56b`.
- `npm run lint`, `npm test`, and `npm pack --dry-run` passed after updating
  the development-only `@n8n/node-cli` toolchain to `0.46.0` on `main`.
- `npm audit --omit=dev` reports zero production dependency advisories. The
  published package still has no runtime dependencies.

## Portal field pack

The values below are the copy used for the submitted package. The Creator
Portal's current field names and package status remain authoritative.

- **npm package:** `@aipowergrid/n8n-nodes-aipg`
- **Display name:** `AI Power Grid`
- **Short description:** `Generate text, images, video, and audio with community-powered models through the AI Power Grid API.`
- **Category:** `AI`
- **Source repository:** `https://github.com/AIPowerGrid/grid-provider-integrations/tree/main/n8n-nodes-aipg`
- **Documentation:** `https://github.com/AIPowerGrid/grid-provider-integrations/tree/main/n8n-nodes-aipg#readme`
- **API key console:** `https://console.aipowergrid.io/dashboard/api-key`
- **Support:** `https://github.com/AIPowerGrid/grid-provider-integrations/issues`
- **License:** `MIT`

Long description:

> AI Power Grid connects n8n workflows to open text, image, video, and audio
> models served by community-operated workers. The node discovers currently
> available models, keeps API credentials in n8n's encrypted credential store,
> returns completed generation responses, and surfaces Grid HTTP errors to
> normal workflow error branches. Requests are sent to remote workers, so users
> should not submit secrets or regulated data without a separately verified
> confidential-compute deployment.

Do not claim Creator Portal acceptance, n8n endorsement, token streaming, or
confidential inference in the submission.

## Portal submission

`@aipowergrid/n8n-nodes-aipg` was submitted through
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
