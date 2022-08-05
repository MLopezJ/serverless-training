import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { getLabels } from './getLabels'

describe('getLabels', () => {
	const key = 'key'
	const TableName = 'tableName'

	it('Should use AWS DynamoDBClient to request detected labels', async () => {
		const dynomoSend = jest.fn()
		const db: DynamoDBClient = {
			send: dynomoSend,
		} as any

		await getLabels(db, TableName)(key)

		// get labels from dynamoDB
		expect(dynomoSend.mock.lastCall[0]).toBeInstanceOf(GetItemCommand)
		expect(dynomoSend).toHaveBeenCalledWith(
			expect.objectContaining({
				input: {
					TableName,
					Key: { image: { S: key } },
				},
			}),
		)
	})
})
