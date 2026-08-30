# AI Power Grid Weekly Proof Post - 2026-08-30

Snapshot captured at `2026-08-30T20:32:51.060Z` from the public Grid API.

## Thread copy

### Post 1

AIPG proof snapshot, Aug 30:

67,625 jobs recorded all time; 4,231 in the current 24h window. 9 workers are online across 12 text, image, video, and audio routes.

Live status: https://api.aipowergrid.io/v1/status/network

### Post 2

Worker payouts: 70,657.2829 AIPG across 1,366 on-chain Base payouts to 8 payout addresses.

Verify the transactions: https://console.aipowergrid.io/transparency

### Post 3

Validator preview: 8 participants, 616 assignments, 96.7% agreement.

Limits: no economic authority; 0 independently verified operators; 12/12 live routes below the 3-worker redundancy target.

Run a worker or validator: https://aipowergrid.io/run

### Post 4

Distribution shipped: Vercel AI SDK, ElizaOS, n8n packages are public on npm with provenance.

Upstream reviews: LiteLLM open; Dify marketplace open; Vercel AI SDK open; ElizaOS registry open; LangChain docs open.

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
- npm @aipowergrid/n8n-nodes-aipg@0.1.3 with provenance: https://www.npmjs.com/package/@aipowergrid/n8n-nodes-aipg
- LiteLLM PR (open): https://github.com/BerriAI/litellm/pull/38725
- Dify marketplace PR (open): https://github.com/langgenius/dify-plugins/pull/2986
- Vercel AI SDK PR (open): https://github.com/vercel/ai/pull/20003
- ElizaOS registry PR (open): https://github.com/elizaOS/eliza/pull/29964
- LangChain docs PR (open): https://github.com/langchain-ai/docs/pull/5770
- Open WebUI scope discussion:
  https://github.com/open-webui/docs/discussions/1364

## Calculation record

- All-time jobs: `66,523 text + 23 3d + 107 video + 789 image + 183 audio = 67,625`.
- Current day-window jobs: `4,210 text + 18 image + 3 audio = 4,231`.
- Agreement display: `0.9671848013816926`, rounded to `96.7%`.
- Charging mode: `allowlist`; global charging: `false`.
- Public incident-history availability: `false`.
- Published package evidence: `@aipowergrid/ai-sdk-provider@0.1.0, @aipowergrid/plugin-aipg@0.1.0, @aipowergrid/n8n-nodes-aipg@0.1.3`.
- Upstream pull-request states: `LiteLLM open; Dify marketplace open; Vercel AI SDK open; ElizaOS registry open; LangChain docs open`.

This is a point-in-time operational and ledger snapshot. It is not an uptime
promise, a paid-demand claim, proof of operator independence, or evidence of
upstream adoption.
