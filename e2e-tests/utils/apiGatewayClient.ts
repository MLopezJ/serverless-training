import fetch, { Response } from 'node-fetch'

export const apiGatewayClient =
	(endpoint: URL, IdToken: string) =>
	async (
		resource: string,
		params?: URLSearchParams,
		method = 'GET',
	): Promise<Response> => {
		const request: Parameters<typeof fetch> = [
			`https://${endpoint.hostname}${endpoint.pathname}${resource}${
				params === undefined ? '' : `?${params}`
			}`,
			{
				headers: {
					Authorization: `Bearer ${IdToken}`,
				},
				method,
			},
		]
		return fetch(...request)
	}
