import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { RekognitionClient } from '@aws-sdk/client-rekognition'
import { imageLabels } from './imageLabels'

describe('imageLabels', () => {
	const maxLabels = 10
	const minConfidence = 80
	const TableName = 'tableName'
	const bucket =
		'dev-awsserverlesstrainin-cdkserverlesstrainingimg-10j2jragqzpe3'
	const imageKey =
		'private/eu-west-1%3A4876d49a-26d7-4fa9-9f07-d0672587cb86/photos/coffee-espresso.png'
	const photo =
		'private/eu-west-1:4876d49a-26d7-4fa9-9f07-d0672587cb86/photos/coffee-espresso.png'

	it('Should use AWS RekognitionClient to detect labels on image', async () => {
		const rekogClient: RekognitionClient = { send: jest.fn() } as any
		const ddbClient: DynamoDBClient = { send: jest.fn() } as any

		await imageLabels({
			rekogClient,
			maxLabels,
			minConfidence,
			ddbClient,
			TableName,
		})(bucket, imageKey)

		expect(rekogClient.send).toHaveBeenCalledWith(
			expect.objectContaining({
				input: {
					Image: {
						S3Object: {
							Bucket: bucket,
							Name: photo,
						},
					},
					MaxLabels: 10,
					MinConfidence: 80,
				},
			}),
		)
	})

	it('Should use AWS DynamoDBClient to save detected labels', async () => {
		const rekogClient: RekognitionClient = { send: jest.fn() } as any
		const ddbClient: DynamoDBClient = { send: jest.fn() } as any
		await imageLabels({
			rekogClient,
			maxLabels,
			minConfidence,
			ddbClient,
			TableName,
		})(bucket, imageKey)

		expect(ddbClient.send).toHaveBeenCalledWith(
			expect.objectContaining({
				input: {
					Item: {
						image: {
							S: imageKey,
						},
					},
					TableName: TableName,
				},
			}),
		)
	})
})
