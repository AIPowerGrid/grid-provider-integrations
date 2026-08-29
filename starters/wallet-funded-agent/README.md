# Wallet-funded autonomous agent

Runs a bounded planning loop against the Grid's universal credit balance. The
human funds the account with USDC, ETH, or AIPG through the Console and gives
the process a scoped Grid key. The process never sees a wallet private key.

```bash
AIPG_API_KEY='grid_...' \
  AGENT_TASK='Produce a three-step launch checklist for proposal 42' \
  node starters/wallet-funded-agent/index.mjs
```

The loop defaults to two model calls, stops after three at most, and quotes
every step against one cumulative `AIPG_MAX_COST_USD` budget.

