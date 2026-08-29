# Verification

Checked 2026-08-28 against AI Power Grid production and the unmodified Open
WebUI `v0.11.1` container.

## Passed without spending

- Grid `GET /v1/models` returned a valid OpenAI list containing `auto` and the
  concrete text models available during the check.
- An unauthenticated chat request returned `401` before generation dispatch.
- Browser preflight for `Authorization` and `Content-Type` succeeded, which is
  required by Open WebUI Direct Connections.
- Open WebUI `v0.11.1` started healthy with the Grid base URL and discovered
  the same Grid text-model set through its own `/api/models` aggregation path.

The temporary Open WebUI container was removed after the check. The test used
an invalid placeholder key and did not submit a generation.

## Future upstream gate

The upstream scope discussion was closed without approval, so no tutorial PR
will be opened. If a maintainer later invites the contribution, first run one
low-output streamed chat in an unmodified current Open WebUI release with a
dedicated `inference.submit` test key. Record only version, HTTP outcome,
terminal finish status, and timing; do not retain the key, prompt, output,
credit balance, or worker identity.

The first-party deployment at `chat.aipowergrid.io` proves the same protocol
path on the AIPG fork, but it does not replace the current-upstream test.
