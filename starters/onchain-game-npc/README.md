# On-chain game NPC

Generates one bounded NPC response on the game server. The output includes a
content hash an application may commit to its own contract, event, or database.
That application receipt is not presented as a Grid JobAnchor proof.

```bash
AIPG_API_KEY='grid_...' \
  NPC_NAME='Mara the bridge keeper' \
  node starters/onchain-game-npc/index.mjs \
  'Offer ten iron ingots in exchange for safe passage'
```

Optional variables: `AIPG_TEXT_MODEL`, `AIPG_MAX_COST_USD`, `NPC_WORLD`, and
`NPC_MAX_TOKENS`.

