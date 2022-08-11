import { APIGatewayProxyResultV2 } from 'aws-lambda'

export const response = (
	statusCode: number,
	body = '',
	headers?: Record<string, string>,
): APIGatewayProxyResultV2 => {
	return {
		statusCode,
		headers: {
			'content-type': 'text/plain; utf-8',
			...(headers ?? {}),
		},
		body,
	}
}
