# Summary

Adds a focused AI Power Grid cookbook using LangChain's existing
`langchain-openai` compatibility surface. It covers key scoping, public model
discovery, invocation, token streaming, tool calling, failures, credit
authority, and the remote community-worker trust boundary. It does not add a
new provider package or claim media support through `ChatOpenAI`.

# Intended upstream files

- `src/oss/python/integrations/chat/aipg.mdx`, copied from
  `upstream-cookbook.mdx`.
- The chat integration index entry required by the current LangChain docs
  navigation.

# Verification gate

Do not open the PR until a disposable scoped key has passed the bounded live
test in `tests/test_live_e2e.py`. Record only the production model-list shape,
non-empty invoke result, non-empty completed stream, valid forced tool call,
terminal status, versions, and timing. Do not retain the key, prompt, output,
balance, or worker identity.

Before submission, rebase on the current `langchain-ai/docs` `main`, copy the
MDX into the intended path, run the repository's changed-file checks, and
verify every link in a local docs build.
