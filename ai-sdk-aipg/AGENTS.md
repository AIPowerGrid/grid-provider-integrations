# ai-sdk-aipg - Vercel AI SDK provider

## Purpose

Native AI SDK v7 provider for AI Power Grid text, image, video, and music
generation. Text uses the standard OpenAI-compatible language model; image and
video implement the AI SDK V4 model interfaces against the Grid's actual media
contracts; music is an explicit Grid helper because it is not speech synthesis.

## Ownership

- `src/provider.ts` - provider factory and public API.
- `src/client.ts` - authenticated, bounded Grid HTTP client.
- `src/image-model.ts` - `ImageModelV4` adapter.
- `src/video-model.ts` - experimental `VideoModelV4` adapter.
- `src/types.ts` - public model, media, credit, and option types.
- `tests/` - deterministic request/response contract tests plus an explicit
  credentialed production lane. Default tests must not spend credits.
- `upstream-provider.mdx` - Vercel community-provider documentation draft.
- `UPSTREAM_PR.md` - AI SDK documentation PR body and release-gate checklist.

## Local Contracts

- Production requests default to `https://api.aipowergrid.io/v1`; prompt or
  model input must never select an alternate credential destination.
- Read `AIPG_API_KEY` in server-side environments. Never place a Grid key in a
  browser bundle or prefix it with a public environment-variable convention.
- Media adapters must verify the selected model is online in the matching
  modality before sending a paid generation request.
- Never claim embedding, transcription, TTS, or arbitrary remote-media input
  support. Music generation is not TTS.
- Image/video source inputs must be inline files. Reject URL inputs because Core
  accepts inline base64/data URIs, not arbitrary fetch URLs.
- Keep upstream provider docs factual: remote community workers can inspect
  plaintext inputs unless a separately documented confidential tier is used.
- The intended upstream contribution is docs-only: one community-provider MDX
  page and one provider-list entry. Publish and production-test the external
  package before opening that PR.

## Verification

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm publish --dry-run --access public`
- `npm run test:package:ai-sdk` from the repository root - pack, install, and
  import the exact release payload in a disposable clean AI SDK consumer.
- `AIPG_API_KEY="..." npm run test:e2e:live` - supervised bounded production
  stream with a disposable scoped key; never run in default CI.
- Publish only through `.github/workflows/publish-packages.yml` using a matching
  `ai-sdk-provider-vX.Y.Z` tag and npm provenance.
