import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import {
	DetectLabelsCommand,
	RekognitionClient,
} from '@aws-sdk/client-rekognition'
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

	it('Should store recognized labels', async () => {
		// response from rekogClient
		const labels = {
			Labels: [
				{ Name: 'drink', Confidence: 78 },
				{ Name: 'cup', Confidence: 65 },
				{ Name: 'coffee', Confidence: 89 },
				{ Name: 'spoon', Confidence: 90 },
				{ Name: undefined, Confidence: 5 },
			],
		}
		// Check the code sets the expected data struct format to the detected labels
		const spectedLabelsFormat: Record<string, Record<string, string>> = {
			object0: { S: 'drink' },
			object1: { S: 'cup' },
			object2: { S: 'coffee' },
			object3: { S: 'spoon' },
			object4: { S: 'unknown' },
		}
		const rekogClientSend = jest.fn().mockImplementation(() => labels)
		const rekogClient: RekognitionClient = {
			send: rekogClientSend,
		} as any
		const ddbClientSend = jest.fn()
		const ddbClient: DynamoDBClient = { send: ddbClientSend } as any

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
		expect(rekogClientSend.mock.lastCall[0]).toBeInstanceOf(DetectLabelsCommand)

		expect(ddbClient.send).toHaveBeenCalledWith(
			expect.objectContaining({
				input: {
					Item: {
						image: {
							S: photo,
						},
						...spectedLabelsFormat,
					},
					TableName: TableName,
				},
			}),
		)
		expect(ddbClientSend.mock.lastCall[0]).toBeInstanceOf(PutItemCommand)
	})
})
