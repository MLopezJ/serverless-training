import { DeleteItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { deleteImage } from './deleteImage'

describe('deleteImage', () => {
	const key = 'key'
	const TableName = 'tableName'
	const bucketName = 'bucketName'
	const resizedBucketName = 'resizedBucketName'

	it('Should delete all the reference from the image in AWS', async () => {
		const dynomoSend = jest.fn()
		const db: DynamoDBClient = {
			send: dynomoSend,
		} as any

		const s3send = jest.fn()
		const s3: S3Client = {
			send: s3send,
		} as any

		await deleteImage(TableName, bucketName, resizedBucketName, s3, db)(key)

		// Remove labels from dynamoDB
		expect(dynomoSend.mock.lastCall[0]).toBeInstanceOf(DeleteItemCommand)
		expect(dynomoSend).toHaveBeenCalledWith(
			expect.objectContaining({
				input: {
					TableName,
					Key: { image: { S: key } },
				},
			}),
		)

		expect(s3send).toHaveBeenCalledTimes(2)

		// Remove image from s3
		expect(s3send).toHaveBeenCalledWith(
			expect.objectContaining({
				input: {
					Bucket: bucketName,
					Key: key,
				},
			}),
		)
		expect(s3send.mock.calls[0][0]).toBeInstanceOf(DeleteObjectCommand)

		// Remove image from 'resized' s3 bucket
		expect(s3send).toHaveBeenCalledWith(
			expect.objectContaining({
				input: {
					Bucket: resizedBucketName,
					Key: key,
				},
			}),
		)
		expect(s3send.mock.calls[1][0]).toBeInstanceOf(DeleteObjectCommand)
	})
})
