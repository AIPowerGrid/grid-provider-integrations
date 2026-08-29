# Summary

Adds a narrowly scoped community tutorial for connecting Open WebUI to AI Power
Grid through Open WebUI's existing OpenAI-compatible connection support. It
documents personal versus shared credentials, model discovery, streaming and
error behavior, and the remote community-worker trust boundary. It adds no
provider-specific code, logo, dependency, or endorsement claim.

# Related issue or discussion

None. The contribution documents the standard connection path verified against
Open WebUI 0.11.1 and the public AI Power Grid API. Do not submit this draft
until the credentialed runtime test is complete.

# Checklist

- [x] I have reviewed the relevant documentation and matched the existing style.
- [x] This PR meets Open WebUI's contribution standards: it is accurate, relevant to users, narrowly scoped, maintainable, and not promotional content, advertising, lead generation, SEO placement, or a request to list a product, service, provider, integration, gateway, tool, or company primarily for visibility.
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
