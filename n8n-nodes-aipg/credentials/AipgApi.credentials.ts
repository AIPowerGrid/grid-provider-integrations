import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AipgApi implements ICredentialType {
	name = 'aipgApi';

	displayName = 'AI Power Grid API';

	icon: Icon = {
		light: 'file:../icons/aipg-logo.svg',
		dark: 'file:../icons/aipg-logo.dark.svg',
	};

	documentationUrl = 'https://console.aipowergrid.io/dashboard/api-key';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'A server-side Grid key with account.read and inference.submit scopes',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.aipowergrid.io/v1',
			url: '/account/credits',
			method: 'GET',
			disableFollowRedirect: true,
		},
	};
}
