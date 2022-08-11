import { DynamoDBClient, GetItemCommandOutput } from '@aws-sdk/client-dynamodb'
import { RekognitionClient } from '@aws-sdk/client-rekognition'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { readFile } from 'fs/promises'
import { assertThat, is } from 'hamjest'
import { Ulid } from 'id128'
import * as path from 'path'
import { requestLabels } from './utils/requestDynamoDB'
import { requestImage } from './utils/requestS3'
import { retry } from './utils/retry'

const bucket = 'dev-awsserverlesstrainin-cdkserverlesstrainingimg-10j2jragqzpe3' // TODO: get value from env
const resizedBucket =
	'dev-awsserverlesstrainin-cdkserverlesstrainingimg-15ti38q4m09x9' // TODO: get value from env
const key = `private/eu-west-1:78ad3dad-3394-47fe-867a-2a0ddf50ba3d/photos/img-${Ulid.generate().toCanonical()}.png` // TODO: make it simpler
const TableName =
	'dev-AwsServerlessTrainingStack-dev-ImageLabelsE524135D-1M25SW87XMWZF' // TODO: get value from env
export const rekogClient = new RekognitionClient({})
export const ddbClient = new DynamoDBClient({})
const s3 = new S3Client({})

/**
 * Upload image to app, make sure a thumb image is created and labels related to image description are created as well.
 * */

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

const includeKeyword = (labels: GetItemCommandOutput, keyword: string) =>
	Object.values(labels.Item ?? {})
		.map((label) => label.S)
		.includes(keyword)

const main = async () => {
	console.log({ key })
	const image = path.join(process.cwd(), './e2e-tests/utils/shark.jpg')
	const keyword = 'Shark'
	await retry(
		async () =>
			await uploadImage({
				location: image,
				Key: key,
				Bucket: bucket,
			}),
		'Upload image',
	)

	// const thumb =
	await retry(
		async () => requestImage(s3, key, resizedBucket),
		'check generated thumb',
	)
	// TODO: validate generated thumb is smaller than original image and if thumb is an image
	const labels = await retry(
		async () => requestLabels(ddbClient, TableName, key),
		'check generated labels',
	)

	assertThat(includeKeyword(labels, keyword), is(true))

	console.log('end to end test finished successfully')
}

main().then(console.log).catch(console.error)
