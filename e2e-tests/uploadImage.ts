/*
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

import { GetItemCommand } from '@aws-sdk/client-dynamodb'
*/

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { RekognitionClient } from '@aws-sdk/client-rekognition'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { readFile } from 'fs/promises'
import { Ulid } from 'id128'
import * as path from 'path'

const bucket = 'dev-awsserverlesstrainin-cdkserverlesstrainingimg-10j2jragqzpe3'

export const rekogClient = new RekognitionClient({})
export const ddbClient = new DynamoDBClient({})
const s3 = new S3Client({})

const tests = async () => {
	const img = await readFile(path.join(process.cwd(), 'e2eTest.jpg'))
	console.log(img)
	const imageKey = `e2e-test-${Ulid.generate().toCanonical()}.png`
	console.log({ imageKey })

	// upload image
	const res = await s3.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: imageKey,
			Body: img,
			ContentType: 'image',
		}),
	)
	console.log(res)
}

tests().catch((err) => {
	console.error(err)
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
