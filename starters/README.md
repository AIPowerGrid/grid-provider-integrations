# AI Power Grid Web3 starters

Five small applications demonstrate the useful Web3 integration boundary:
fund one Grid account on Base, issue a scoped API key, and call open text,
image, video, and audio models without making an on-chain transaction for
every inference request.

All examples require Node.js 20 or newer and a key with `account.read` and
`inference.submit` scopes:

```bash
export AIPG_API_KEY='grid_...'
```

Create and fund accounts at
[console.aipowergrid.io](https://console.aipowergrid.io). The examples never
ask for a wallet private key.

| Starter | Run | What it proves |
| --- | --- | --- |
| [On-chain game NPC](onchain-game-npc/) | `node starters/onchain-game-npc/index.mjs "Ask the blacksmith about the ruined bridge"` | A game server can buy bounded NPC dialogue and commit the returned receipt hash in its own state. |
| [DAO media pipeline](dao-media-pipeline/) | `DAO_PROPOSAL='Fund public GPU onboarding' node starters/dao-media-pipeline/index.mjs` | A DAO workflow can produce proposal art and retain the Grid job ID as audit metadata. |
| [Telegram agent](telegram-agent/) | `node starters/telegram-agent/index.mjs` | A webhook bot can relay bounded messages without exposing the Grid key to Telegram users. |
| [NFT media workflow](nft-media-workflow/) | `NFT_NAME='Grid Genesis' NFT_PROMPT='...' node starters/nft-media-workflow/index.mjs` | An application can generate media and write portable metadata without placing a minting key in the generator. |
| [Wallet-funded agent](wallet-funded-agent/) | `AGENT_TASK='Summarize the governance proposal' node starters/wallet-funded-agent/index.mjs` | An agent can check one universal balance, quote its action, and stop before overspending. |

Each command quotes before dispatch and respects `AIPG_MAX_COST_USD` (default
`0.02`). The wallet-funded example also respects `AIPG_MIN_BALANCE_USD`
(default `0.05`). Generated files go to an explicitly selected output directory
and contain no credentials.

## Base and provenance

Base belongs in the funding, settlement, ownership, and optional provenance
layers. It does not belong in every model request. The media APIs return
`grid.job_id`; these examples retain it as a receipt identifier. A job is only
an on-chain JobAnchor fact after the Grid publishes the relevant anchor and a
contract lookup or Merkle proof verifies it. The examples deliberately avoid
claiming more.

The deployed Grid diamond and JobAnchor addresses are maintained in the
[smart-contract address registry](https://github.com/AIPowerGrid/aipg-smart-contracts/blob/main/docs/ADDRESSES.md).
