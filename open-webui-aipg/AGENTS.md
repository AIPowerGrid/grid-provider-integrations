# open-webui-aipg - Open WebUI guide

## Purpose

Contribution-quality instructions for connecting current Open WebUI releases
to AI Power Grid through the standard OpenAI-compatible connection surface.
There is no provider plugin: Open WebUI intentionally supports protocols rather
than provider-specific modules.

## Ownership

- `README.md` - short setup and security guide for AIPG users.
- `upstream-tutorial.mdx` - source-ready tutorial for the official
  `open-webui/docs` repository.
- `UPSTREAM_PR.md` - upstream PR body and explicit release-gate checklist.
- `scripts/check-public.mjs` - non-mutating compatibility check for discovery,
  authentication rejection, and browser CORS.
- `VERIFICATION.md` - bounded evidence and remaining upstream release gates.

## Local Contracts

- Base URL is exactly `https://api.aipowergrid.io/v1`.
- Prefer Open WebUI Direct Connections for multi-user deployments so each user
  supplies a scoped key. An admin connection shares one Grid account and credit
  balance with every permitted Open WebUI user.
- Require `inference.submit`; add `account.read` only when account status is
  needed. Never recommend a worker, validator, owner, or unrestricted key.
- Open WebUI's standard provider connection exposes Grid text chat only.
  Image, video, and audio use Grid-native endpoints and must not be represented
  as supported through this connection.
- State that prompts leave Open WebUI and run on remote community-operated
  workers. Do not claim private/confidential inference.
- Upstream instructions and UI labels must be checked against the current
  `open-webui/docs` and `open-webui/open-webui` default branches before a PR.

## Verification

- `node scripts/check-public.mjs`
- `npx prettier --check README.md upstream-tutorial.mdx UPSTREAM_PR.md`

## Child DOX Index

- None.
