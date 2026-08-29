# elizaOS Registry Submission

The active elizaOS community registry now lives inside
`elizaOS/eliza` on the `develop` branch. The archived
`elizaos-plugins/registry` repository is not the submission target.

## Upstream change

`@aipowergrid/plugin-aipg@0.1.0` is published with npm provenance and passed
the clean packed-package import plus bounded production gate. To submit it:

1. Run `elizaos plugins submit . --dry-run` from this package.
2. Compare its output with `upstream-registry-entry.json`.
3. Add the reviewed entry to
   `packages/registry/entries/third-party/aipowergrid__plugin-aipg.json` in
   `elizaOS/eliza`.
4. Run the upstream registry validation and generation commands.
5. Commit both the source entry and regenerated
   `packages/registry/generated-registry.json` in a PR against `develop`.

```bash
bun run --cwd packages/registry validate
bun run --cwd packages/registry generate
bun run --cwd packages/registry test
bun run --cwd packages/registry typecheck
```

## Release evidence required

- npm provenance resolves to the tagged
  `AIPowerGrid/grid-provider-integrations` source commit.
- The public package installs from npm in a clean ElizaOS project.
- A real `AgentRuntime` loads the packed package and invokes a bounded text
  request through a disposable `account.read` plus `inference.submit` key.
- Model discovery, streaming, media actions, HTTP failures, key scoping, and
  the remote community-worker trust boundary remain documented.
- No API key, prompt, output, account balance, media URL, or worker identity is
  retained in the evidence record.

The registry `version` field describes the published version it was reviewed
against. Registry acceptance remains separate from npm publication.
