# AI Power Grid Weekly Proof Post - 2026-08-29

Snapshot captured at `2026-08-29T05:47:29.688Z` from the public Grid API.

## Thread copy

### Post 1

AI Power Grid proof snapshot, Aug 29:

60,644 recorded jobs all time, including 2,766 in the current
24-hour statistics window. 8 workers are online across
11 model routes for text, image, video, and audio.

Live status: https://api.aipowergrid.io/v1/status/network

### Post 2

Worker payouts: 63,882.7109 AIPG across 1,265 on-chain Base
payouts to 8 payout addresses.

Verify the transactions: https://console.aipowergrid.io/transparency

### Post 3

Validator preview: 5 validators participated in the status window,
with 573 assignments completed and 95.3% agreement.

Honest limits: validators have no economic authority, 0 validator operators are
independently verified, and 11 of 11 live model
routes remain below the 3-worker redundancy target.

### Post 4

Distribution: native integration source and reproducible release evidence are public.
LiteLLM provider and documentation, elizaOS registry, and LangChain documentation
PRs are submitted; Dify, AI SDK, n8n, and Open WebUI remain tracked separately.

https://github.com/AIPowerGrid/grid-provider-integrations

### Post 5

Metrics we will not fake: charging mode is `allowlist` and global charging is
`false`, so the public API does not prove a paid-request count. It also
does not identify independent worker ownership, external builders, or historical uptime.
Incident history is currently reported as `false`.

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
- LiteLLM provider PR: https://github.com/BerriAI/litellm/pull/38725
- elizaOS registry PR: https://github.com/elizaOS/eliza/pull/29964
- LangChain documentation PR: https://github.com/langchain-ai/docs/pull/5770
- Open WebUI scope discussion:
  https://github.com/open-webui/docs/discussions/1364

## Calculation record

- All-time jobs: `59,570 text + 23 3d + 106 video + 766 image + 179 audio = 60,644`.
- Current day-window jobs: `2,764 text + 2 image = 2,766`.
- Agreement display: `0.9532710280373832`, rounded to `95.3%`.
- Charging mode: `allowlist`; global charging: `false`.
- Public incident-history availability: `false`.

This is a point-in-time operational and ledger snapshot. It is not an uptime
promise, a paid-demand claim, proof of operator independence, or evidence of
upstream adoption.
