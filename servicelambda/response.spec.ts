import { response } from './response'

describe('response', () => {
	it.each([
		[
			[404, 'Image not found'],
			[
				{
					body: 'Image not found',
					headers: { 'content-type': 'text/plain; utf-8' },
					statusCode: 404,
				},
			],
		],
		[
			[200, 'labels'],
			[
				{
					body: 'labels',
					headers: {
						'content-type': 'text/plain; utf-8',
					},
					statusCode: 200,
				},
			],
		],
		[
			[202],
			[
				{
					body: '',
					headers: {
						'content-type': 'text/plain; utf-8',
					},
					statusCode: 202,
				},
			],
		],
		[
			[400, 'Impossible to delete image'],
			[
				{
					body: 'Impossible to delete image',
					headers: {
						'content-type': 'text/plain; utf-8',
					},
					statusCode: 400,
				},
			],
		],
		[
			[500, 'Internal server error', { 'Transfer-Encoding': 'chunked' }],
			[
				{
					body: 'Internal server error',
					headers: {
						'Transfer-Encoding': 'chunked',
						'content-type': 'text/plain; utf-8',
					},
					statusCode: 500,
				},
			],
		],
	])(
		'Sould return proper response format to: %p',
		([code, body, headers], [expected]) => {
			expect(
				response(
					code as number,
					body as string,
					headers as Record<string, string>,
				),
			).toStrictEqual(expected)
		},
	)
})
