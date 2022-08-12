import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { RekognitionClient } from '@aws-sdk/client-rekognition'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { readFile } from 'fs/promises'
import { assertThat, is } from 'hamjest'
import { Ulid } from 'id128'
import * as path from 'path'
import { includeKeyword } from './utils/includeKeyword'
import { requestLabels } from './utils/requestDynamoDB'
import { requestImage } from './utils/requestS3'
import { retry } from './utils/retry'

const bucket = process.env.BUCKET ?? ''
const resizedBucket = process.env.RESIZED_BUCKET ?? ''
const key = `private/${process.env.AWS_DEFAULT_REGION ?? 'eu-west-1'}:${
	process.env.BUCKET_KEY ?? ''
}/photos/img-${Ulid.generate().toCanonical()}.png` // TODO: make it simpler
const TableName = process.env.TABLE_NAME ?? ''
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

const main = async () => {
	console.log('-- Start --')
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
		'Check generated thumb',
	)
	// TODO: validate generated thumb is smaller than original image and if thumb is an image
	const labels = await retry(
		async () => requestLabels(ddbClient, TableName, key),
		'Check generated labels',
	)

	assertThat(includeKeyword(labels, keyword), is(true))

	console.log('-- Finish --')
}

main().then(console.log).catch(console.error)
