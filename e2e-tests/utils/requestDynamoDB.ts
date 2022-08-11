import {
	DynamoDBClient,
	GetItemCommand,
	GetItemCommandOutput,
} from '@aws-sdk/client-dynamodb'

export const requestLabels = async (
	ddbClient: DynamoDBClient,
	TableName: string,
	Key: string,
): Promise<GetItemCommandOutput> => {
	try {
		return await ddbClient.send(
			new GetItemCommand({
				TableName,
				Key: { image: { S: Key } },
			}),
		)
	} catch (err: any) {
		throw new Error(`Failed to fetch labels`)
	}
}
