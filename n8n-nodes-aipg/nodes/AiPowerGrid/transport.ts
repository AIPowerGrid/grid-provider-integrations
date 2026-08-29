import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

import { AIPG_API_BASE } from './contracts';

type GridRequestFunctions = IExecuteFunctions | ILoadOptionsFunctions;

export async function gridApiRequest(
	this: GridRequestFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
	timeout = 30_000,
): Promise<unknown> {
	const options: IHttpRequestOptions = {
		method,
		url: `${AIPG_API_BASE}${path}`,
		json: true,
		timeout,
	};
	if (body !== undefined) options.body = body;
	return await this.helpers.httpRequestWithAuthentication.call(this, 'aipgApi', options);
}
