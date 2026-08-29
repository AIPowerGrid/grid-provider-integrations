# Telegram agent

A small webhook server that sends allowlisted Telegram messages to Grid text
inference. It acknowledges Telegram immediately, processes one request per chat
at a time, quotes before dispatch, and keeps both credentials server-side.

```bash
export AIPG_API_KEY='grid_...'
export TELEGRAM_BOT_TOKEN='123:...'
export TELEGRAM_WEBHOOK_SECRET='a-long-random-secret'
export TELEGRAM_ALLOWED_CHAT_IDS='123456789,-100987654321'
node starters/telegram-agent/index.mjs
```

Point the Telegram webhook at `https://YOUR_HOST/telegram` and set the same
secret token. A production deployment should add durable queueing and a shared
rate limiter; this starter deliberately stays one process and one in-flight
request per chat.
