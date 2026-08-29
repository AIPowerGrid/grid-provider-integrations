## Background

AI Power Grid publishes an AI SDK 7 community provider for text, image,
experimental video, and music generation. This documentation gives AI SDK
users the provider's actual install, scoping, discovery, billing, error, and
remote-worker trust boundaries instead of implying that OpenAI compatibility
alone covers every modality.

Do not open this PR until `@aipowergrid/ai-sdk-provider` is published and the
credentialed runtime gate below is complete.

## Summary

Adds a community-provider page for `@aipowergrid/ai-sdk-provider`, covering:

- server-side scoped credentials;
- `generateText` and `streamText`;
- AI SDK image and experimental video models;
- the explicit music-generation helper;
- live model discovery, credit summaries, and canonical quotes;
- bounded provider errors and community-worker privacy limitations.

## Intended upstream files

- `content/providers/05-community-providers/55-aipg.mdx`, copied from
  `upstream-provider.mdx`.
- One AI Power Grid entry in
  `content/docs/02-foundations/02-providers-and-models.mdx`.

This is a documentation-only community-provider listing. It does not add or
modify a Vercel-owned package.

## End-to-End Verification

Pending. Before submission, replace this paragraph with the package version,
AI SDK version, one bounded production stream result, discovery result shape,
and finish reason. Do not record the key, prompt, generated text, or balance.

## Checklist

- [ ] All commits are signed (PRs with unsigned commits cannot be merged)
- [x] Tests are not applicable to the upstream docs-only diff; the external
      package carries its own provider and production E2E tests.
- [x] Documentation has been added / updated (for bug fixes / features)
- [x] A changeset is not applicable because no upstream package or package
      README changes.
- [x] I have reviewed this pull request (self-review)

## Future Work

Model availability follows independently operated workers and changes over
time. The package documentation, live discovery APIs, and Grid quote endpoint
remain the source of truth rather than a static model or price table in this
page.
