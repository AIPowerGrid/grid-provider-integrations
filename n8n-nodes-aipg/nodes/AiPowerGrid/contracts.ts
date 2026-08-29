import type { IDataObject, IHttpRequestMethods } from 'n8n-workflow';

export const AIPG_API_BASE = 'https://api.aipowergrid.io/v1';

export type AipgOperation = 'text' | 'image' | 'video' | 'audio';

export interface OperationContract {
	method: IHttpRequestMethods;
	path: string;
	timeout: number;
}

export const OPERATION_CONTRACTS: Record<AipgOperation, OperationContract> = {
	text: { method: 'POST', path: '/chat/completions', timeout: 120_000 },
	image: { method: 'POST', path: '/images/generations', timeout: 330_000 },
	video: { method: 'POST', path: '/videos/generations', timeout: 630_000 },
	audio: { method: 'POST', path: '/audio/generations', timeout: 1_980_000 },
};

export function withDefinedValues(input: IDataObject): IDataObject {
	return Object.fromEntries(
		Object.entries(input).filter(([, value]) => value !== undefined && value !== ''),
	);
}

export function optionalInteger(value: unknown, name: string): number | undefined {
	if (value === '' || value === undefined || value === null) return undefined;
	const parsed = typeof value === 'number' ? value : Number(value);
	if (!Number.isSafeInteger(parsed)) throw new Error(`${name} must be an integer`);
	return parsed;
}
