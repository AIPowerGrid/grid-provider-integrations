# Telegram agent

A small webhook server that sends allowlisted Telegram messages to Grid text
inference. It acknowledges Telegram immediately, processes one request per chat
at a time, quotes before dispatch, and keeps both credentials server-side.

```bash
export AIPG_API_KEY='grid_...'
export TELEGRAM_BOT_TOKEN='123:...'
export TELEGRAM_WEBHOOK_SECRET='a-long-random-secret'
export TELEGRAM_ALLOWED_CHAT_IDS='123456789,-100987654321'
export TELEGRAM_ALLOWED_USER_IDS='123456789'
node starters/telegram-agent/index.mjs
```

Point the Telegram webhook at `https://YOUR_HOST/telegram` and set the same
secret token. `TELEGRAM_ALLOWED_USER_IDS` is optional for a private bot, but set
it for any group or channel so an allowed chat does not authorize every member
to spend the service account's credits.

The process rejects duplicate Telegram update IDs within a bounded in-memory
window. A production deployment should add durable deduplication and queueing
plus a shared rate limiter; this starter deliberately stays one process and one
in-flight request per chat.
