import { GetItemCommandOutput } from '@aws-sdk/client-dynamodb'
import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import { response } from './response'

export const serviceHandler =
	(
		/* dependencies or collaborators */ {
			getLabels,
			deleteImage,
		}: {
			getLabels: (key: string) => Promise<GetItemCommandOutput>
			deleteImage: (key: string) => Promise<void>
		},
	) =>
	async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
		console.debug(JSON.stringify({ event }))

		const { action, key } = event.queryStringParameters ?? {}
		if (action === undefined || key === undefined) {
			console.debug('no info provided')
			return response(400, 'no info provided')
		}

		if (action === 'getLabels' && key !== undefined) {
			// requesting labels associate to image
			const result = getLabels(key)
			console.debug(
				JSON.stringify({
					action,
					key,
					result,
				}),
			)

			if (result === undefined) {
				console.debug(`No labels related to ${key}`)
				return response(404, `No labels related to ${key}`)
			}

			return response(200, JSON.stringify(result))
		}

		if (action === 'deleteImage' && key !== undefined) {
			console.log('deleting image from buckets')

			// requesting labels associate to image
			try {
				await deleteImage(key)
				return response(202)
			} catch {
				console.error(`Impossible to delete image: ${key}`)
				return response(400, `Impossible to delete image: ${key}`)
			}
		}

		// Unknown action provided
		console.debug(`Unknown action provided: ${action}!`)
		return response(400, `Unknown action provided: ${action}!`)
	}
