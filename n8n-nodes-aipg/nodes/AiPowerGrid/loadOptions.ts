import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

import { gridApiRequest } from './transport';

interface ModelRow {
	id?: unknown;
	name?: unknown;
	type?: unknown;
	capabilities?: unknown;
}

function toOptions(rows: ModelRow[], field: 'id' | 'name'): INodePropertyOptions[] {
	return rows
		.map((row) => row[field])
		.filter((value): value is string => typeof value === 'string' && value.length > 0)
		.map((value) => ({ name: value, value }))
		.sort((left, right) => left.name.localeCompare(right.name));
}

export async function getTextModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const response = (await gridApiRequest.call(this, 'GET', '/models')) as {
		data?: ModelRow[];
	};
	return toOptions(Array.isArray(response.data) ? response.data : [], 'id');
}

async function getMediaModels(
	this: ILoadOptionsFunctions,
	type: 'image' | 'video' | 'audio',
	requiredCapability?: 'txt2img' | 'txt2video',
): Promise<INodePropertyOptions[]> {
	const response = await gridApiRequest.call(this, 'GET', '/status/models');
	const rows = Array.isArray(response) ? (response as ModelRow[]) : [];
	return toOptions(
		rows.filter(
			(row) =>
				row.type === type &&
				(requiredCapability === undefined ||
					(Array.isArray(row.capabilities) && row.capabilities.includes(requiredCapability))),
		),
		'name',
	);
}

export async function getImageModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	return await getMediaModels.call(this, 'image', 'txt2img');
}

export async function getVideoModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	return await getMediaModels.call(this, 'video', 'txt2video');
}

export async function getAudioModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	return await getMediaModels.call(this, 'audio');
}
