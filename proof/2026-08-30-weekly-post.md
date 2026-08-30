# AI Power Grid Weekly Proof Post - 2026-08-30

Snapshot captured at `2026-08-30T02:01:41.899Z` from the public Grid API.

## Thread copy

### Post 1

AIPG proof snapshot, Aug 30:

64,472 jobs recorded all time; 4,833 in the current 24h window. 8 workers are online across 11 text, image, video, and audio routes.

Live status: https://api.aipowergrid.io/v1/status/network

### Post 2

Worker payouts: 67,760.0777 AIPG across 1,318 on-chain Base payouts to 8 payout addresses.

Verify the transactions: https://console.aipowergrid.io/transparency

### Post 3

Validator preview: 7 participants, 570 assignments, 96.3% agreement.

Limits: no economic authority; 0 independently verified operators; 11/11 live routes below the 3-worker redundancy target.

### Post 4

Distribution shipped: Vercel AI SDK, ElizaOS, n8n packages are public on npm with provenance.

Upstream reviews: LiteLLM open; Vercel AI SDK open; ElizaOS registry open; LangChain docs open.

https://github.com/AIPowerGrid/grid-provider-integrations

### Post 5

Metrics we will not fake: charging mode=allowlist; global=false. The public API does not prove paid-request count, independent worker ownership, external builders, or historical uptime. Incident history available=false.

## Evidence

- Current health: https://api.aipowergrid.io/health
- Network status and validator aggregates:
  https://api.aipowergrid.io/v1/status/network
- Day, month, and all-time job counts:
  https://api.aipowergrid.io/v1/stats/totals
- Public payout ledger: https://api.aipowergrid.io/v1/payouts/public
- Payout explorer: https://console.aipowergrid.io/transparency
- Provider campaign source:
  https://github.com/AIPowerGrid/grid-provider-integrations
- npm @aipowergrid/ai-sdk-provider@0.1.0 with provenance: https://www.npmjs.com/package/@aipowergrid/ai-sdk-provider
- npm @aipowergrid/plugin-aipg@0.1.0 with provenance: https://www.npmjs.com/package/@aipowergrid/plugin-aipg
- npm @aipowergrid/n8n-nodes-aipg@0.1.2 with provenance: https://www.npmjs.com/package/@aipowergrid/n8n-nodes-aipg
- LiteLLM PR (open): https://github.com/BerriAI/litellm/pull/38725
- Vercel AI SDK PR (open): https://github.com/vercel/ai/pull/20003
- ElizaOS registry PR (open): https://github.com/elizaOS/eliza/pull/29964
- LangChain docs PR (open): https://github.com/langchain-ai/docs/pull/5770
- Open WebUI scope discussion:
  https://github.com/open-webui/docs/discussions/1364

## Calculation record

- All-time jobs: `63,381 text + 23 3d + 107 video + 781 image + 180 audio = 64,472`.
- Current day-window jobs: `4,816 text + 1 video + 15 image + 1 audio = 4,833`.
- Agreement display: `0.9630314232902033`, rounded to `96.3%`.
- Charging mode: `allowlist`; global charging: `false`.
- Public incident-history availability: `false`.
- Published package evidence: `@aipowergrid/ai-sdk-provider@0.1.0, @aipowergrid/plugin-aipg@0.1.0, @aipowergrid/n8n-nodes-aipg@0.1.2`.
- Upstream pull-request states: `LiteLLM open; Vercel AI SDK open; ElizaOS registry open; LangChain docs open`.

This is a point-in-time operational and ledger snapshot. It is not an uptime
promise, a paid-demand claim, proof of operator independence, or evidence of
upstream adoption.
