/*
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

import { GetItemCommand } from '@aws-sdk/client-dynamodb'
*/

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { RekognitionClient } from '@aws-sdk/client-rekognition'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const bucket = 'dev-awsserverlesstrainin-cdkserverlesstrainingimg-10j2jragqzpe3'
const imageKey =
	'private/eu-west-1:78ad3dad-3394-47fe-867a-2a0ddf50ba3d/photos/e2e-test.png'

export const rekogClient = new RekognitionClient({})
export const ddbClient = new DynamoDBClient({})
const s3 = new S3Client({})

// upload image
;(async () => {
	const res = s3.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: imageKey,
			Body: imageKey,
			ContentType: 'image',
		}),
	)
	console.log(await res)
})().catch((err) => {
	throw err
})

/*
;(async () => {
	const res = s3.send(new GetObjectCommand({ Bucket: bucket, Key: imageKey }))
	console.log(await res)
})().catch((err) => {
	throw err
})
*/
// upload image

/*
const image = resizedImage
const uploadImage = await s3.send(
	new PutObjectCommand({
		Bucket: srcKey,
		Key: srcKey,
		Body: image,
		ContentType: 'image',
	}),
)

// check thumb (s3)
const thumbImg = await s3.send(
	new GetObjectCommand({
		Bucket: dstBucket,
		Key: srcKey,
	}),
)

// check labels (dynamo)
const checkLabels = await ddbClient.send(
	new GetItemCommand({
		TableName,
	}),
)
*/
