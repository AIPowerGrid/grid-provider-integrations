# Summary

Adds one concise AI Power Grid entry to LangChain's existing Chat Completions
API compatibility section. The entry links to the independently hosted,
tested cookbook covering key scoping, public model discovery, invocation,
token streaming, tool calling, failures, credit authority, and the remote
community-worker trust boundary. It does not add a provider package, a hosted
integration page, or media claims through `ChatOpenAI`.

# Intended upstream files

- One paragraph in `src/oss/python/integrations/chat/index.mdx`, copied from
  `upstream-index-entry.mdx` into the existing **Chat Completions API** section.

LangChain's current integration policy does not accept a new hosted guide for
an unfeatured integration below 50,000 monthly downloads. Do not propose
`src/oss/python/integrations/chat/aipg.mdx`; the complete cookbook remains in
this repository and the upstream diff only makes that tested compatibility
path discoverable.

# Verification gate

Do not open the PR until a disposable scoped key has passed the bounded live
test in `tests/test_live_e2e.py`. Record only the production model-list shape,
non-empty invoke result, non-empty completed stream, valid forced tool call,
terminal status, versions, and timing. Do not retain the key, prompt, output,
balance, or worker identity.

Before submission, rebase on the current `langchain-ai/docs` `main`, place the
paragraph beside the existing compatible-service entries, run the repository's
changed-file checks, and verify every link in a local docs build. If maintainers
prefer the cookbook to remain entirely first-party, close the proposal without
recasting it as a new integration package.
