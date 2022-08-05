import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'

export const getLabels =
	(db: DynamoDBClient, TableName: string) =>
	async (key: string): Promise<any> => {
		// FIXME: add proper type for labels
		return db.send(
			new GetItemCommand({
				TableName,
				Key: { image: { S: key } },
			}),
		)
	}
