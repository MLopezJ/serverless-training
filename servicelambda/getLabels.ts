import {
	DynamoDBClient,
	GetItemCommand,
	GetItemCommandOutput,
} from '@aws-sdk/client-dynamodb'

export const getLabels =
	(db: DynamoDBClient, TableName: string) =>
	async (key: string): Promise<GetItemCommandOutput> => {
		return db.send(
			new GetItemCommand({
				TableName,
				Key: { image: { S: key } },
			}),
		)
	}
