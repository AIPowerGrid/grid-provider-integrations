# AI Power Grid Provider for the Vercel AI SDK

Use AI Power Grid through the standard AI SDK interfaces for streamed text,
image generation, and experimental video generation. The package also exposes
a typed music-generation helper for the Grid's ACE-Step models.

## Install

```bash
npm install ai @aipowergrid/ai-sdk-provider
```

Create a scoped API key in the [Grid Console](https://console.aipowergrid.io/)
with `inference.submit` for generation and `account.read` if your application
shows balances. Keep it server-side:

```bash
AIPG_API_KEY=grid_...
```

Do not expose the key through `NEXT_PUBLIC_*`, `VITE_*`, client components, or
browser JavaScript. A server key identifies one Grid account and spends that
account's credits. For a multi-user product, mint user-scoped credentials or
use the Grid's delegated-user flow instead of sharing a privileged service key.
Long media jobs can run for several minutes; pass `timeoutMs` to `createAipg`
only when your deployment needs a tighter deadline, and use request abort
signals for user cancellation.

## Text

```ts
import { generateText, streamText } from "ai";
import { aipg } from "@aipowergrid/ai-sdk-provider";

const result = await generateText({
  model: aipg("auto"),
  prompt: "Explain verifiable inference in two sentences.",
});

const stream = streamText({
  model: aipg("auto"),
  prompt: "Give me three names for a decentralized image app.",
});

for await (const chunk of stream.textStream) process.stdout.write(chunk);
```

`auto` lets the Grid route to an available text model. You may also pass a
public text model ID returned by `await aipg.listTextModels()`.

## Images

```ts
import { generateImage } from "ai";
import { aipg } from "@aipowergrid/ai-sdk-provider";

const result = await generateImage({
  model: aipg.imageModel("Krea 2 Turbo"),
  prompt: "A solar-powered compute cooperative, editorial photography",
  size: "1024x1024",
  providerOptions: {
    aipg: { negativePrompt: "text, watermark", outputFormat: "webp" },
  },
});
```

Image-to-image accepts one inline AI SDK file. Remote source URLs and masks are
rejected because the current Grid contract does not support them. Supported
advanced `aipg` options are `negativePrompt`, `steps`, `cfgScale`, `sampler`,
`scheduler`, `strength`, and `outputFormat`.

## Video

AI SDK v7 marks its video interface experimental:

```ts
import { experimental_generateVideo as generateVideo } from "ai";
import { aipg } from "@aipowergrid/ai-sdk-provider";

const result = await generateVideo({
  model: aipg.videoModel("LTX Director 2.0"),
  prompt: "Slow camera push through a luminous server hall",
  resolution: "768x512",
  duration: 4,
  fps: 24,
});
```

Image-to-video models such as `LTX-2.3` require one inline start-frame file.
AI SDK `frameImages`, `inputReferences`, and remote URL inputs are rejected
rather than ignored.

## Music

Music generation is deliberately not presented as text-to-speech:

```ts
const song = await aipg.generateMusic({
  prompt: "Upbeat synth-rock, confident, clean harmony",
  lyrics: "Power moves across the grid",
  seconds: 30,
  bpm: 112,
  keyScale: "A minor",
  timeSignature: "4/4",
  vocalLanguage: "en",
});
```

## Discovery and credits

```ts
const textModels = await aipg.listTextModels();
const onlineCapacity = await aipg.listOnlineModels();
const credits = await aipg.credits();
const estimate = await aipg.quote({
  model: "Krea 2 Turbo",
  modality: "image",
  n: 1,
});
```

Media calls preflight the live model/modality list before submitting paid work.
Availability can still change between the preflight and dispatch, so callers
must handle API errors.

## Trust and privacy

AIPG routes jobs to remote, community-operated workers. Inputs and outputs are
not end-to-end encrypted from the worker executing the job, so operators may be
able to inspect plaintext content. Do not send secrets, credentials, personal
data, or regulated content unless a separately documented confidential tier
meets your requirements. On-chain settlement and public payout records improve
economic transparency; they do not make inference private or fully trustless.

This package does not imply a partnership with Vercel. It is a community
provider maintained by AI Power Grid.

## Release verification

Default tests use local protocol fixtures and never spend credits. Before a
release, run one bounded streamed request through the real AI SDK runtime with
a disposable scoped key:

```bash
AIPG_API_KEY="..." npm run test:e2e:live
```

The live test records only assertions and timing through the test runner. It
must never print the key, prompt, generated text, or account balance.

After that gate passes, publish only through the root `publish-packages.yml`
workflow using a tag that exactly matches the package version, such as
`ai-sdk-provider-v0.1.0`. Configure npm Trusted Publishing for the
`AIPowerGrid/grid-provider-integrations` repository and that workflow; use a
package-scoped `NPM_TOKEN` only if npm requires one for the first publication.
