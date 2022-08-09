import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { RekognitionClient } from '@aws-sdk/client-rekognition'
import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3'
import { readFile } from 'fs/promises'
import { Ulid } from 'id128'
import * as path from 'path'
import { retry } from './retry'

const bucket = 'dev-awsserverlesstrainin-cdkserverlesstrainingimg-10j2jragqzpe3'
const resizedBucket =
	'dev-awsserverlesstrainin-cdkserverlesstrainingimg-15ti38q4m09x9'
const key = `private/eu-west-1:78ad3dad-3394-47fe-867a-2a0ddf50ba3d/photos/img-${Ulid.generate().toCanonical()}.png` // make it simpler
export const rekogClient = new RekognitionClient({})
export const ddbClient = new DynamoDBClient({})
const s3 = new S3Client({})

// upload image to AWS S3
const uploadImage = async ({
	location,
	Key,
	Bucket,
}: {
	Key: string
	location: string
	Bucket: string
}) => {
	const img = await readFile(location)
	return await s3.send(
		new PutObjectCommand({
			Bucket,
			Key,
			Body: img,
			ContentType: 'image',
		}),
	)
}

// Request image
const requestImage = async (Key: string, Bucket: string) => {
	try {
		return await s3.send(
			new GetObjectCommand({
				Bucket,
				Key,
			}),
		)
	} catch (err: any) {
		console.log(err['$metadata'].httpStatusCode, 'failing here')
		throw new Error(`Failed to fetch image from key`)
	}
}

const main = async () => {
	await uploadImage({
		location: path.join(process.cwd(), 'shark.jpg'),
		Key: key,
		Bucket: bucket,
	})
	const res = await retry(async () => requestImage(key, resizedBucket))
	console.log({ res })
}

main().then(console.log).catch(console.error)

/*
uploadImage()
	.then(() => checkThumb.start())
	.catch((err) => {
		console.log('fails here')
		console.error(err)
		throw err
	})
	*/

/*

checkThumb(
	'private/eu-west-1:78ad3dad-3394-47fe-867a-2a0ddf50ba3d/photos/img-01GA166WYBPQVG36ZYK71XNXV6.png',
).catch((err) => {
	console.error(err)
	throw err
})

*/

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
