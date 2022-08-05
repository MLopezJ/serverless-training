import { DeleteItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'

export const deleteImage =
	(
		TableName: string,
		bucketName: string,
		resizedBucketName: string,
		s3: S3Client,
		db: DynamoDBClient,
	) =>
	async (key: string): Promise<void> => {
		// delete labels
		await db.send(
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
