import { APIGatewayEvent } from 'aws-lambda'
import { response } from './response'
import { serviceHandler } from './serviceHandler'

describe('serviceHandler', () => {
	it("Should request delete image method if action is 'deleteImage'", async () => {
		const key = 'key'
		const action = 'deleteImage'
		const event: APIGatewayEvent = {
			queryStringParameters: {
				action,
				key,
			},
		} as any

		const getLabels = jest.fn()
		const deleteImage = jest.fn()
		await serviceHandler({ getLabels, deleteImage })(event)
		expect(deleteImage).toBeCalledWith(key)
	})

	it("Should request get labels method if action is 'getLabels'", async () => {
		const key = 'key'
		const action = 'getLabels'
		const event: APIGatewayEvent = {
			queryStringParameters: {
				action,
				key,
			},
		} as any

		const getLabels = jest.fn().mockImplementation(() => {
			return { Item: '' }
		})
		const deleteImage = jest.fn()
		await serviceHandler({ getLabels, deleteImage })(event)
		expect(getLabels).toBeCalledWith(key)
	})

	it('Should return status code 202 if image is deleted', async () => {
		const key = 'key'
		const action = 'deleteImage'
		const event: APIGatewayEvent = {
			queryStringParameters: {
				action,
				key,
			},
		} as any

		const getLabels = jest.fn()
		const deleteImage = jest.fn()
		const handler = await serviceHandler({ getLabels, deleteImage })(event)
		expect(handler).toStrictEqual(response(202))
	})

	it('Should return status code 404 if image is not deleted', async () => {
		const key = 'key'
		const action = 'deleteImage'
		const event: APIGatewayEvent = {
			queryStringParameters: {
				action,
				key,
			},
		} as any

		const getLabels = jest.fn()
		const deleteImage = jest.fn().mockImplementation(() => {
			throw new Error('some error happens')
		})
		const handler = await serviceHandler({ getLabels, deleteImage })(event)
		expect(handler).toStrictEqual(
			response(400, `Impossible to delete image: ${key}`),
		)
	})

	it('Should return status code 202 if labels are returned', async () => {
		const key = 'key'
		const action = 'getLabels'
		const event: APIGatewayEvent = {
			queryStringParameters: {
				action,
				key,
			},
		} as any

		const getLabels = jest.fn().mockImplementation(() => {
			return { Item: ['animal', 'cat'] }
		})
		const deleteImage = jest.fn()
		const handler = await serviceHandler({ getLabels, deleteImage })(event)
		expect(handler).toStrictEqual(response(200, `{"Item":["animal","cat"]}`))
	})

	it('Should return status code 404 if labels are not returned', async () => {
		const key = 'key'
		const action = 'getLabels'
		const event: APIGatewayEvent = {
			queryStringParameters: {
				action,
				key,
			},
		} as any

		const getLabels = jest.fn().mockImplementation(() => {
			return { Item: undefined }
		})
		const deleteImage = jest.fn()
		const handler = await serviceHandler({ getLabels, deleteImage })(event)
		expect(handler).toStrictEqual(response(404, `No labels related to ${key}`))
	})

	it('Should return status code 400 if action is not provided', async () => {
		const event: APIGatewayEvent = {
			queryStringParameters: {
				action: undefined,
				key: 'key',
			},
		} as any

		const getLabels = jest.fn()
		const deleteImage = jest.fn()
		const handler = await serviceHandler({ getLabels, deleteImage })(event)
		expect(handler).toStrictEqual(response(400, 'no info provided'))
	})

	it('Should return status code 400 if key is not provided', async () => {
		const event: APIGatewayEvent = {
			queryStringParameters: {
				action: 'action',
				key: undefined,
			},
		} as any

		const getLabels = jest.fn()
		const deleteImage = jest.fn()
		const handler = await serviceHandler({ getLabels, deleteImage })(event)
		expect(handler).toStrictEqual(response(400, 'no info provided'))
	})

	it('Should return status code 400 if uknown action is provided', async () => {
		const action = 'ramdomAction'
		const event: APIGatewayEvent = {
			queryStringParameters: {
				action,
				key: 'key',
			},
		} as any

		const getLabels = jest.fn()
		const deleteImage = jest.fn()
		const handler = await serviceHandler({ getLabels, deleteImage })(event)
		expect(handler).toStrictEqual(
			response(400, `Unknown action provided: ${action}!`),
		)
	})
})
