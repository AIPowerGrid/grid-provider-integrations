# starters - runnable Grid application examples

## Purpose

Small, dependency-free examples showing how Web3 applications can use the
Grid without putting blockchain transactions or wallet secrets in the
inference hot path.

## Ownership

- `lib/` - shared fixed-origin Grid client, bounded response parsing, quote
  guard, media extraction, and receipt helpers.
- `onchain-game-npc/` - bounded NPC dialogue generation for an on-chain game.
- `dao-media-pipeline/` - proposal artwork generation and audit artifact.
- `telegram-agent/` - Telegram webhook to Grid text inference.
- `nft-media-workflow/` - image generation plus standards-shaped NFT metadata.
- `wallet-funded-agent/` - autonomous text action gated by the account's
  existing Grid credit balance.

## Local Contracts

- Read `AIPG_API_KEY` from the environment only. Never accept it in command
  arguments, URLs, generated artifacts, or logs.
- Production traffic is fixed to `https://api.aipowergrid.io`; alternate URLs
  are loopback-only test seams.
- Quote before paid work and enforce a caller-controlled maximum cost.
- Wallet funding is a cold-path user action through the Console. These
  examples never accept wallet private keys or sign transactions.
- A `grid.job_id` is a Grid receipt identifier. Do not claim it is anchored on
  Base until an independent JobAnchor lookup or proof establishes that fact.
- Generated media URLs point at remote, community-operated infrastructure.
  Validate schemes and treat all generated content as untrusted input.

## Verification

- `npm test`
- `npm run check`
- `node starters/<name>/index.mjs --help`

