import { APIGatewayProxyResultV2 } from 'aws-lambda'

export const response = (
	statusCode: number,
	body = '',
	headers?: Record<string, string>,
): APIGatewayProxyResultV2 => {
	const response: APIGatewayProxyResultV2 = {
		statusCode,
		headers: {
			'content-type': 'text/plain; utf-8',
			...(headers ?? {}),
		},
		body,
	}
	console.log({ response })
	return response
}
