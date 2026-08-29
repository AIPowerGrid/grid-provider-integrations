# Use AI Power Grid In Open WebUI

Open WebUI already speaks the OpenAI Chat Completions protocol, so AIPG does
not need a custom plugin or fork. The connection provides text chat with the
models currently served by Grid workers.

Create a key at the [AIPG developer console](https://console.aipowergrid.io/dashboard/api-key)
with `inference.submit`. Keep the key out of screenshots, chat messages, and
source control.

## Recommended: personal direct connection

This is the safer choice for a multi-user Open WebUI deployment because every
user controls their own Grid account and credits.

1. The Open WebUI admin enables **Settings > Admin > Connections > Direct
   Connections**.
2. The user opens **User Settings > Connections** and adds an OpenAI connection.
3. Set **Base URL** to `https://api.aipowergrid.io/v1`.
4. Paste the scoped Grid API key and save.
5. Choose one of the discovered models. `auto` lets Grid select an available
   text worker.

Grid currently permits the browser CORS requests required by Direct
Connections. Open WebUI stores the personal key in that browser's local
storage, not on the Open WebUI server. Treat that browser profile as sensitive.

## Trusted/single-user server connection

An admin can instead open **Settings > Admin > Connections**, add an OpenAI API
connection, and use the same base URL and scoped key. This key and its Grid
credit balance are shared by everyone allowed to use that Open WebUI
connection. Do not use this pattern for an open public instance without your
own account controls, rate limits, and abuse budget.

For an immutable first-boot configuration:

```env
OPENAI_API_BASE_URL=https://api.aipowergrid.io/v1
OPENAI_API_KEY=your-scoped-grid-key
```

Open WebUI persists connection settings. If an old connection remains after an
environment change, edit or remove it in the admin connection screen rather
than assuming the environment value replaced stored configuration.

## Behavior and limits

- `GET /v1/models` supplies the live text model list.
- Chat supports OpenAI-style streaming and normal HTTP errors.
- Model availability follows connected workers and can change. A listed model
  is not an uptime guarantee.
- This standard Open WebUI connection does not expose Grid's native image,
  video, or music endpoints.
- Prompts and outputs leave Open WebUI and are processed by remote,
  community-operated workers selected by Grid Core. Do not send secrets or
  assume confidential inference.
- Usage consumes the credits attached to the Grid account behind the key.

The first-party demonstration at [chat.aipowergrid.io](https://chat.aipowergrid.io/)
shows the compatibility path in use. It is not proof of Open WebUI endorsement
or independent adoption.
