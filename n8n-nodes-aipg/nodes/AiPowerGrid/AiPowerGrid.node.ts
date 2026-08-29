import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes } from 'n8n-workflow';

import {
	type AipgOperation,
	OPERATION_CONTRACTS,
	optionalInteger,
	withDefinedValues,
} from './contracts';
import { getAudioModels, getImageModels, getTextModels, getVideoModels } from './loadOptions';
import { gridApiRequest } from './transport';

export class AiPowerGrid implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AI Power Grid',
		name: 'aiPowerGrid',
		icon: {
			light: 'file:../../icons/aipg-logo.svg',
			dark: 'file:../../icons/aipg-logo.dark.svg',
		},
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Generate text, images, video, or audio on AI Power Grid',
		defaults: { name: 'AI Power Grid' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'aipgApi', required: true }],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Generate Audio', value: 'audio', action: 'Generate audio' },
					{ name: 'Generate Image', value: 'image', action: 'Generate an image' },
					{ name: 'Generate Text', value: 'text', action: 'Generate text' },
					{ name: 'Generate Video', value: 'video', action: 'Generate a video' },
				],
				default: 'text',
			},
			{
				displayName: 'Model Name or ID',
				name: 'textModel',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getTextModels' },
				default: 'auto',
				required: true,
				displayOptions: { show: { operation: ['text'] } },
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Prompt',
				name: 'textPrompt',
				type: 'string',
				typeOptions: { rows: 5 },
				default: '',
				required: true,
				displayOptions: { show: { operation: ['text'] } },
			},
			{
				displayName: 'System Prompt',
				name: 'systemPrompt',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				displayOptions: { show: { operation: ['text'] } },
			},
			{
				displayName: 'Max Output Tokens',
				name: 'maxTokens',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 32768 },
				default: 512,
				displayOptions: { show: { operation: ['text'] } },
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 2 },
				default: 0.7,
				displayOptions: { show: { operation: ['text'] } },
			},
			{
				displayName: 'Model Name or ID',
				name: 'imageModel',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getImageModels' },
				default: '',
				required: true,
				displayOptions: { show: { operation: ['image'] } },
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Prompt',
				name: 'imagePrompt',
				type: 'string',
				typeOptions: { rows: 5 },
				default: '',
				required: true,
				displayOptions: { show: { operation: ['image'] } },
			},
			{
				displayName: 'Size',
				name: 'imageSize',
				type: 'string',
				default: '1024x1024',
				displayOptions: { show: { operation: ['image'] } },
				description: 'Output size as WIDTHxHEIGHT',
			},
			{
				displayName: 'Number of Images',
				name: 'imageCount',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 4 },
				default: 1,
				displayOptions: { show: { operation: ['image'] } },
			},
			{
				displayName: 'Image Options',
				name: 'imageOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { operation: ['image'] } },
				options: [
					{
						displayName: 'Negative Prompt',
						name: 'negativePrompt',
						type: 'string',
						default: '',
					},
					{ displayName: 'Seed', name: 'seed', type: 'string', default: '' },
				],
			},
			{
				displayName: 'Model Name or ID',
				name: 'videoModel',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getVideoModels' },
				default: '',
				required: true,
				displayOptions: { show: { operation: ['video'] } },
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Prompt',
				name: 'videoPrompt',
				type: 'string',
				typeOptions: { rows: 5 },
				default: '',
				required: true,
				displayOptions: { show: { operation: ['video'] } },
			},
			{
				displayName: 'Size',
				name: 'videoSize',
				type: 'string',
				default: '768x512',
				displayOptions: { show: { operation: ['video'] } },
			},
			{
				displayName: 'Seconds',
				name: 'videoSeconds',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 10, numberPrecision: 1 },
				default: 4,
				displayOptions: { show: { operation: ['video'] } },
			},
			{
				displayName: 'Frames per Second',
				name: 'videoFps',
				type: 'number',
				typeOptions: { minValue: 8, maxValue: 30 },
				default: 24,
				displayOptions: { show: { operation: ['video'] } },
			},
			{
				displayName: 'Video Options',
				name: 'videoOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { operation: ['video'] } },
				options: [
					{
						displayName: 'Negative Prompt',
						name: 'negativePrompt',
						type: 'string',
						default: '',
					},
					{ displayName: 'Seed', name: 'seed', type: 'string', default: '' },
				],
			},
			{
				displayName: 'Model Name or ID',
				name: 'audioModel',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getAudioModels' },
				default: '',
				required: true,
				displayOptions: { show: { operation: ['audio'] } },
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Music Description',
				name: 'audioPrompt',
				type: 'string',
				typeOptions: { rows: 5 },
				default: '',
				required: true,
				displayOptions: { show: { operation: ['audio'] } },
			},
			{
				displayName: 'Lyrics',
				name: 'lyrics',
				type: 'string',
				typeOptions: { rows: 8 },
				default: '',
				displayOptions: { show: { operation: ['audio'] } },
			},
			{
				displayName: 'Seconds',
				name: 'audioSeconds',
				type: 'number',
				typeOptions: { minValue: 10, maxValue: 300, numberPrecision: 1 },
				default: 30,
				displayOptions: { show: { operation: ['audio'] } },
			},
			{
				displayName: 'Inference Steps',
				name: 'inferenceSteps',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 20 },
				default: 8,
				displayOptions: { show: { operation: ['audio'] } },
			},
			{
				displayName: 'Audio Options',
				name: 'audioOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { operation: ['audio'] } },
				options: [
					{
						displayName: 'BPM',
						name: 'bpm',
						type: 'number',
						typeOptions: { minValue: 30, maxValue: 300 },
						default: 120,
					},
					{
						displayName: 'Key and Scale',
						name: 'keyScale',
						type: 'string',
						default: '',
						placeholder: 'A minor',
					},
					{ displayName: 'Seed', name: 'seed', type: 'string', default: '' },
					{
						displayName: 'Time Signature',
						name: 'timeSignature',
						type: 'options',
						options: [
							{ name: '2/4', value: '2/4' },
							{ name: '3/4', value: '3/4' },
							{ name: '4/4', value: '4/4' },
							{ name: '6/8', value: '6/8' },
						],
						default: '4/4',
					},
					{
						displayName: 'Vocal Language',
						name: 'vocalLanguage',
						type: 'string',
						default: '',
						placeholder: 'en',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: { getTextModels, getImageModels, getVideoModels, getAudioModels },
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const output: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as AipgOperation;
				const contract = OPERATION_CONTRACTS[operation];
				let body: IDataObject;

				if (operation === 'text') {
					const system = this.getNodeParameter('systemPrompt', itemIndex, '') as string;
					const messages = [];
					if (system) messages.push({ role: 'system', content: system });
					messages.push({
						role: 'user',
						content: this.getNodeParameter('textPrompt', itemIndex) as string,
					});
					body = {
						model: this.getNodeParameter('textModel', itemIndex) as string,
						messages,
						max_tokens: this.getNodeParameter('maxTokens', itemIndex) as number,
						temperature: this.getNodeParameter('temperature', itemIndex) as number,
						stream: false,
					};
				} else if (operation === 'image') {
					const options = this.getNodeParameter('imageOptions', itemIndex, {}) as IDataObject;
					body = withDefinedValues({
						model: this.getNodeParameter('imageModel', itemIndex) as string,
						prompt: this.getNodeParameter('imagePrompt', itemIndex) as string,
						size: this.getNodeParameter('imageSize', itemIndex) as string,
						n: this.getNodeParameter('imageCount', itemIndex) as number,
						negative_prompt: options.negativePrompt,
						seed: optionalInteger(options.seed, 'seed'),
					});
				} else if (operation === 'video') {
					const options = this.getNodeParameter('videoOptions', itemIndex, {}) as IDataObject;
					body = withDefinedValues({
						model: this.getNodeParameter('videoModel', itemIndex) as string,
						prompt: this.getNodeParameter('videoPrompt', itemIndex) as string,
						size: this.getNodeParameter('videoSize', itemIndex) as string,
						seconds: this.getNodeParameter('videoSeconds', itemIndex) as number,
						fps: this.getNodeParameter('videoFps', itemIndex) as number,
						negative_prompt: options.negativePrompt,
						seed: optionalInteger(options.seed, 'seed'),
					});
				} else {
					const options = this.getNodeParameter('audioOptions', itemIndex, {}) as IDataObject;
					body = withDefinedValues({
						model: this.getNodeParameter('audioModel', itemIndex) as string,
						prompt: this.getNodeParameter('audioPrompt', itemIndex) as string,
						lyrics: this.getNodeParameter('lyrics', itemIndex, '') as string,
						seconds: this.getNodeParameter('audioSeconds', itemIndex) as number,
						inference_steps: this.getNodeParameter('inferenceSteps', itemIndex) as number,
						bpm: options.bpm,
						key_scale: options.keyScale,
						time_signature: options.timeSignature,
						vocal_language: options.vocalLanguage,
						seed: optionalInteger(options.seed, 'seed'),
					});
				}

				const response = await gridApiRequest.call(
					this,
					contract.method,
					contract.path,
					body,
					contract.timeout,
				);
				output.push({ json: response as IDataObject, pairedItem: { item: itemIndex } });
			} catch (error) {
				if (this.continueOnFail()) {
					output.push({
						json: { error: error instanceof Error ? error.message : String(error) },
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
			}
		}

		return [output];
	}
}
