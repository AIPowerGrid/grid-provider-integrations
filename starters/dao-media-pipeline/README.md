# DAO media pipeline

Turns one governance proposal into an image, video, or instrumental audio clip
and emits a machine-readable audit artifact containing the generated URL,
seed, model, and Grid job ID.

```bash
AIPG_API_KEY='grid_...' \
  DAO_PROPOSAL='Fund an open GPU onboarding sprint for community operators' \
  node starters/dao-media-pipeline/index.mjs
```

Set `DAO_MEDIA_TYPE` to `video` or `audio` to exercise those Grid modalities.
The live defaults are `LTX Director 2.0` at four seconds and
`ace-step-v1.5-xl-turbo` at thirty seconds. Override them with
`AIPG_MEDIA_MODEL` and `DAO_MEDIA_SECONDS`.

The Grid job ID is retained for later provenance checks. It is not labeled as
on-chain until a JobAnchor lookup or proof verifies it.
