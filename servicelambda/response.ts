import { APIGatewayProxyResult } from 'aws-lambda'

export const response = (
	statusCode: number,
	body = '',
	headers?: Record<string, string>,
): APIGatewayProxyResult => ({
	statusCode,
	headers: {
		'content-type': 'text/plain; utf-8',
		...(headers ?? {}),
	},
	body,
})
