# Summary

Adds a narrowly scoped community tutorial for connecting Open WebUI to AI Power
Grid through Open WebUI's existing OpenAI-compatible connection support. It
documents personal versus shared credentials, model discovery, streaming and
error behavior, and the remote community-worker trust boundary. It adds no
provider-specific code, logo, dependency, or endorsement claim.

# Policy gate

Open WebUI's current PR template rejects contributions whose primary purpose is
to list or promote a provider. An AIPG-specific tutorial can reasonably be
read that way even when the content is technically accurate. Do not open a
drive-by documentation PR.

After the credentialed runtime test passes, open a narrowly scoped upstream
issue or discussion first. Explain the concrete operator problem this guide
solves: personal versus shared credentials, streaming failures, model
discovery, and the privacy boundary of a remote community-worker endpoint.
Only open the tutorial PR if an Open WebUI maintainer confirms that a
provider-specific page is welcome. If they prefer the generic compatibility
guide, keep the AIPG page first-party and contribute only an accepted generic
documentation improvement.

The scope question is open as
[open-webui/docs discussion #1364](https://github.com/open-webui/docs/discussions/1364).
Do not open this PR draft unless a maintainer answers that the tutorial is in
scope and the credentialed runtime gate passes.

# Checklist

- [x] I have reviewed the relevant documentation and matched the existing style.
- [ ] A maintainer has confirmed that this provider-specific tutorial is in
      scope under Open WebUI's anti-promotion contribution standard.
- [x] I understand that PRs that do not meet these standards may be closed without review and will not be merged. Repeated, low-quality, off-topic, promotional, or intentionally misleading submissions may result in the contributor being blocked from future participation in Open WebUI repositories.

# Notes for reviewers

- Uses only Open WebUI's standard OpenAI-compatible connection.
- `GET /v1/models` discovers the live text catalog.
- Direct Connection and admin Connection behavior are documented separately so
  multi-user operators do not accidentally share one funded service key.
- The tutorial prominently discloses that inference is remote and may run on
  independently operated community workers.
- Final validation evidence is pending one disposable-key streamed chat through
  the exact Open WebUI runtime. Do not open the upstream PR before that passes.
