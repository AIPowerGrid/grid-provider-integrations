# NFT media workflow

Generates one image and writes standards-shaped metadata without owning or
using a minting key. Review the result, pin it to your chosen durable storage,
then mint through a separately secured wallet or Safe.

```bash
AIPG_API_KEY='grid_...' \
  NFT_NAME='Grid Genesis' \
  NFT_PROMPT='A community GPU city waking at dawn' \
  node starters/nft-media-workflow/index.mjs
```

The default output is `./aipg-nft-output/metadata.json`.

