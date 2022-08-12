import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import {
	DetectLabelsCommand,
	Label,
	RekognitionClient,
} from '@aws-sdk/client-rekognition'
import { replaceSubstringWithColon } from './replaceSubstringWithColon'

// Move code below here to external modules
export const imageLabels =
	({
		rekogClient,
		maxLabels,
		minConfidence,
		ddbClient,
		TableName,
	}: {
		rekogClient: RekognitionClient
		maxLabels: number
		minConfidence: number
		ddbClient: DynamoDBClient
		TableName: string
	}) =>
	async (
		bucket: string,
		imageKey: string,
	): Promise<Record<string, Record<string, string>>> => {
		const photo = replaceSubstringWithColon(imageKey)

		console.log('Currently processing the following image')
		console.log('Bucket: ' + bucket + ' photo name: ' + photo)

		const labelsRequest = await rekogClient.send(
			new DetectLabelsCommand({
				Image: {
					S3Object: {
						Bucket: bucket,
						Name: photo,
					},
				},
				MaxLabels: maxLabels,
				MinConfidence: minConfidence,
			}),
		)

		const labels: Record<
			string,
			Record<string, string>
		> = labelsRequest?.Labels?.reduce(
			(
				previousValue: { [k: string]: { [k: string]: string } },
				currentValue: Label,
				currentIndex: number,
			) => {
				previousValue[`object${currentIndex}`] = {
					S: currentValue.Name ?? 'unknown',
				}
				return previousValue
			},
			{},
		) ?? {}

		await ddbClient.send(
			new PutItemCommand({
				TableName,
				Item: {
					...labels,
					image: { S: photo },
				},
			}),
		)
		return labels
	}
