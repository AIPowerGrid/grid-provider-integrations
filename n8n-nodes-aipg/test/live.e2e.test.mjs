import assert from 'node:assert/strict';
import test from 'node:test';

import { OPERATION_CONTRACTS } from '../dist/nodes/AiPowerGrid/contracts.js';
import {
	getAudioModels,
	getImageModels,
	getTextModels,
	getVideoModels,
} from '../dist/nodes/AiPowerGrid/loadOptions.js';
import { gridApiRequest } from '../dist/nodes/AiPowerGrid/transport.js';

const enabled = process.env.AIPG_LIVE_E2E === '1';
const apiKey = process.env.AIPG_API_KEY;

function liveContext() {
	return {
		helpers: {
			httpRequestWithAuthentication: async (_credentialType, options) => {
				assert.ok(apiKey, 'AIPG_API_KEY must contain a disposable scoped key');
				const response = await fetch(options.url, {
					method: options.method,
					headers: {
						Accept: 'application/json',
						Authorization: `Bearer ${apiKey}`,
						...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
					},
					body: options.body === undefined ? undefined : JSON.stringify(options.body),
					signal: AbortSignal.timeout(options.timeout ?? 30_000),
				});
				const payload = await response.json();
				if (!response.ok) throw new Error(`Grid returned HTTP ${response.status}`);
				return payload;
			},
		},
	};
}

function firstModel(options, label, preferred) {
	assert.ok(options.length > 0, `no compatible ${label} model is currently online`);
	return options.find((option) => option.value === preferred)?.value ?? options[0].value;
}

function assertResult(payload, label) {
	assert.ok(payload && typeof payload === 'object', `${label} returned no JSON result`);
}

test(
	'live n8n transport discovers models and executes every advertised operation',
	{ skip: !enabled },
	async () => {
		const context = liveContext();
		await gridApiRequest.call(context, 'GET', '/account/credits');

		const textModel = firstModel(await getTextModels.call(context), 'text', 'Smollm-135m');
		const imageModel = firstModel(await getImageModels.call(context), 'image', 'z-image-turbo');
		const videoModel = firstModel(
			await getVideoModels.call(context),
			'video',
			'LTX Director 2.0',
		);
		const audioModel = firstModel(
			await getAudioModels.call(context),
			'audio',
			'ace-step-v1.5-xl-turbo',
		);

		const text = await gridApiRequest.call(
			context,
			OPERATION_CONTRACTS.text.method,
			OPERATION_CONTRACTS.text.path,
			{
				model: textModel,
				messages: [{ role: 'user', content: 'Reply with ready.' }],
				max_tokens: 4,
				stream: false,
			},
			OPERATION_CONTRACTS.text.timeout,
		);
		assert.ok(Array.isArray(text?.choices) && text.choices.length > 0);

		const image = await gridApiRequest.call(
			context,
			OPERATION_CONTRACTS.image.method,
			OPERATION_CONTRACTS.image.path,
			{ model: imageModel, prompt: 'A plain amber square on black.', size: '512x512', n: 1 },
			OPERATION_CONTRACTS.image.timeout,
		);
		assertResult(image, 'image');

		const video = await gridApiRequest.call(
			context,
			OPERATION_CONTRACTS.video.method,
			OPERATION_CONTRACTS.video.path,
			{
				model: videoModel,
				prompt: 'A plain amber square moves slowly to the right.',
				size: '768x512',
				seconds: 1,
				fps: 8,
			},
			OPERATION_CONTRACTS.video.timeout,
		);
		assertResult(video, 'video');

		const audio = await gridApiRequest.call(
			context,
			OPERATION_CONTRACTS.audio.method,
			OPERATION_CONTRACTS.audio.path,
			{
				model: audioModel,
				prompt: 'A simple instrumental pulse in A minor.',
				seconds: 10,
				inference_steps: 1,
			},
			OPERATION_CONTRACTS.audio.timeout,
		);
		assertResult(audio, 'audio');
	},
);
