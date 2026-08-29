# AI Power Grid Weekly Proof Post - 2026-08-29

Snapshot captured at `2026-08-29T03:16:12Z` from the public Grid API.

## Thread copy

### Post 1

AI Power Grid proof snapshot, Aug 29:

59,980 completed jobs all time, including 2,720 in the last 24 hours. 7 workers
are online across 10 live model routes for text, image, video, and audio.

Live status: https://api.aipowergrid.io/v1/status/network

### Post 2

Worker payouts: 63,514.5652 AIPG across 1,262 on-chain Base payouts to 8 payout
addresses.

Verify the transactions: https://console.aipowergrid.io/transparency

### Post 3

Validator preview: 5 validators participated in 24h, with 563 assignments
completed and 95.6% agreement.

Honest limits: no economic authority yet, independent operators are unverified,
and every live model remains below the 3-worker redundancy target.

### Post 4

Distribution: the LiteLLM provider and docs PRs now cover text and text-to-image
and are awaiting current-head CI, CLA, and review. Dify, ElizaOS, AI SDK,
LangChain, n8n, and Open WebUI work is tested or source-ready. Publication and
upstream acceptance are tracked separately.

https://github.com/AIPowerGrid/grid-provider-integrations

### Post 5

Two metrics we will not fake: charging remains allowlist-only, so completed jobs
are not presented as paid purchases; the public status API reports a current
operational snapshot, not historical uptime. Both need first-class public
measurement before they enter this report.

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
- Open WebUI scope discussion:
  https://github.com/open-webui/docs/discussions/1364

## Calculation record

- All-time jobs: `58,906 text + 23 3D + 106 video + 766 image + 179 audio =
59,980`.
- Last-24-hour jobs: `2,718 text + 2 image = 2,720`.
- Agreement display: `0.9558541266794626`, rounded to `95.6%`.
- Charging mode: `allowlist`; global charging: `false`.
- Public incident-history availability: `false`.

This is a point-in-time operational and ledger snapshot. It is not an uptime
promise, a paid-demand claim, proof of operator independence, or evidence of
upstream adoption.
