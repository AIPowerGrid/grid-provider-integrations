# Open WebUI Documentation Scope Question

Posted as [open-webui/docs discussion #1364](https://github.com/open-webui/docs/discussions/1364)
on 2026-08-29. The discussion was closed the same day without a comment or
invitation to submit. No tutorial PR has been opened; the tested AIPG guide
remains first-party documentation unless upstream explicitly reopens the
scope.

## Title

Would a tested third-party OpenAI-compatible setup guide be in scope?

## Body

I maintain AI Power Grid, a remote community-worker inference service that
implements OpenAI-compatible model discovery and chat completions. Open WebUI
already connects to it through the standard OpenAI connection, so this would
not need provider-specific code, a Function, a Pipe, a dependency, or a logo.

We have a first-party configuration guide covering both supported Open WebUI
paths:

- a personal Direct Connection, where each user supplies their own scoped key;
- an admin connection, where one key and credit balance are shared by the
  instance.

The draft also documents model discovery, streaming and terminal failures,
authentication and credit errors, changing worker availability, and the fact
that plaintext requests leave Open WebUI and may be inspected by remote
community-operated workers. It makes no affiliation claims and does not claim
that Open WebUI's standard text connection exposes separate image, video, or
audio endpoints.

I read the current PR template's rule against provider-listing and promotional
contributions. Before opening anything, would a narrowly scoped, tested setup
tutorial like this be useful in the Open WebUI docs, or should it remain in our
own documentation and only link to Open WebUI's generic OpenAI-compatible
provider guide?

If it is in scope, I will first complete a bounded runtime check on the current
Open WebUI release, then submit only the tutorial source with the evidence and
no promotional assets.
