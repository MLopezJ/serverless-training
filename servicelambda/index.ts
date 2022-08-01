import {
	DeleteItemCommand,
	DynamoDBClient,
	GetItemCommand,
} from '@aws-sdk/client-dynamodb'

import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { fromEnv } from '@nordicsemiconductor/from-env'
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda'

const { TableName, bucketName, resizedBucketName } = fromEnv({
	TableName: 'TABLE',
	bucketName: 'BUCKET',
	resizedBucketName: 'RESIZEDBUCKET',
})(process.env)

const ddbClient = new DynamoDBClient({})
const s3 = new S3Client({})

type responseType = {
	statusCode: number
	body: string
	headers: { [header: string]: string }
}

const response = (
	statusCode: number,
	body = '',
	headers: { [header: string]: string } = {
		['content-type']: 'text/plain; utf-8',
	},
): responseType => {
	return {
		statusCode,
		headers,
		body,
	}
}

export const handler = async (
	event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
	// Detect requested action from the Amazon API Gateway Event
	const { action, key } = event.queryStringParameters ?? {}

	if (action !== undefined || key !== undefined) {
		console.debug('no info provided')
		return response(400, 'no info provided')
	}

	if (action === 'getLabels' && key !== undefined) {
		// requesting labels associate to image
		const result = await ddbClient.send(
			new GetItemCommand({
				TableName,
				Key: { image: { S: key } },
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

const deleteImage = async (key: string): Promise<void> => {
	// delete labels
	await ddbClient.send(
		new DeleteItemCommand({
			TableName,
			Key: { image: { S: key } },
		}),
	)

	// delete image in bucket
	const bucketRequest = new DeleteObjectCommand({
		Bucket: bucketName,
		Key: key,
	})
	await s3.send(bucketRequest)

	// delete image in resized bucket
	const resizedBucketRequest = new DeleteObjectCommand({
		Bucket: resizedBucketName,
		Key: key,
	})
	await s3.send(resizedBucketRequest)
}
