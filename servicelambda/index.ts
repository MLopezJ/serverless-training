import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { S3Client } from '@aws-sdk/client-s3'
import { fromEnv } from '@nordicsemiconductor/from-env'
import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import { deleteImage } from './deleteImage'
import { getLabels } from './getLabels'
import { serviceHandler } from './serviceHandler'

const { TableName, bucketName, resizedBucketName } = fromEnv({
	TableName: 'TABLE',
	bucketName: 'BUCKET',
	resizedBucketName: 'RESIZEDBUCKET',
})(process.env)

const ddbClient = new DynamoDBClient({})
const s3 = new S3Client({})

const boundGetLabels = getLabels(ddbClient, TableName)
const boundDeleteImage = deleteImage(
	TableName,
	bucketName,
	resizedBucketName,
	s3,
	ddbClient,
)

export const handler: (
	event: APIGatewayEvent,
) => Promise<APIGatewayProxyResultV2> = serviceHandler({
	getLabels: boundGetLabels,
	deleteImage: boundDeleteImage,
})
