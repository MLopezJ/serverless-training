import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { RekognitionClient } from '@aws-sdk/client-rekognition'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { readFile } from 'fs/promises'
import { assertThat, is, lessThan } from 'hamjest'
import { Ulid } from 'id128'
import * as path from 'path'
import { streamToBuffer } from 'rekognitionlambda/streamToBuffer'
import { Readable } from 'stream'
import { includeKeyword } from './utils/includeKeyword'
import { requestLabels } from './utils/requestDynamoDB'
import { requestImage } from './utils/requestS3'
import { retry } from './utils/retry'

const bucket = process.env.BUCKET ?? ''
const resizedBucket = process.env.RESIZED_BUCKET ?? ''
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

const checkThumbSize = async (key: string, originalImgLocation: string) => {
	const thumb = await requestImage(s3, key, resizedBucket)
	const thumbStream = thumb.Body as Readable
	const thumBuffer = await streamToBuffer(thumbStream)
	const thumbSize = Buffer.byteLength(thumBuffer)

	const originalImg = await readFile(originalImgLocation)
	const originalImgSize = Buffer.byteLength(originalImg)

	assertThat(thumbSize, is(lessThan(originalImgSize)))
}

export const main = async (): Promise<string> => {
	console.log('-- Start Upload Image --')
	const key = `private/${process.env.AWS_DEFAULT_REGION ?? 'eu-west-1'}:${
		process.env.BUCKET_KEY ?? ''
	}/photos/img-${Ulid.generate().toCanonical()}.png`
	console.log({ key })
	const imageLocation = path.join(process.cwd(), './e2e-tests/utils/shark.jpg')
	const keyword = 'Shark'
	await retry(
		async () =>
			await uploadImage({
				location: imageLocation,
				Key: key,
				Bucket: bucket,
			}),
		'Upload image',
	)

	await retry(
		async () => checkThumbSize(key, imageLocation),
		'Check generated thumb size',
	)

	const labels = await retry(
		async () => requestLabels(ddbClient, TableName, key),
		'Check generated labels',
	)

	assertThat(includeKeyword(labels, keyword), is(true))

	console.log('-- Finish Upload Image --')

	return key
}
