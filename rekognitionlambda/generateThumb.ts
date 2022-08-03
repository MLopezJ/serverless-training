import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import { replaceSubstringWithColon } from './replaceSubstringWithColon'
import { streamToBuffer } from './streamToBuffer'

export const generateThumb =
	({
		s3,
		dstBucket,
		imageThumbnail,
	}: {
		s3: S3Client
		dstBucket: string
		imageThumbnail: (image: Buffer, size: number) => Promise<Buffer>
	}) =>
	async (bucket: string, key: string): Promise<void> => {
		console.log('Work in progress from generateThumb ', bucket, key)

		const photo = replaceSubstringWithColon(key)
		const srcKey = decodeURIComponent(photo.replace(/\+/g, ' '))

		// Infer the image type from the file suffix.
		const typeMatch = /\.([^.]*)$/.exec(srcKey)
		if (typeMatch === null) {
			console.log('Could not determine the image type.')
			return
		}

		// Check that the image type is supported
		const imageType = typeMatch[1].toLowerCase()
		if (imageType != 'jpg' && imageType != 'png') {
			console.log(`Unsupported image type: ${imageType}`)
			return
		}

		// Download the image from the S3 source bucket.
		const originalImage = await s3.send(
			new GetObjectCommand({
				Bucket: bucket,
				Key: srcKey,
			}),
		)
		if (originalImage === undefined) {
			console.error(`Original image ${bucket}/${srcKey} not found.`)
			return
		}
		const stream = originalImage.Body as Readable
		const buffer = await streamToBuffer(stream)

		// set thumbnail width. Resize will set the height automatically to maintain aspect ratio.
		const width = 200

		// Use the sharp module to resize the image and save in a buffer.
		//const resizedImage = await sharp(buffer).resize(width).toBuffer();
		const resizedImage = await imageThumbnail(buffer, width)
		if (resizedImage === undefined) {
			console.error(`Failed to resize image ${bucket}/${srcKey}!`)
			return
		}

		// Upload the thumbnail image to the destination bucket
		await s3.send(
			new PutObjectCommand({
				Bucket: dstBucket,
				Key: srcKey,
				Body: resizedImage,
				ContentType: 'image',
			}),
		)

		console.log(
			'Successfully resized ' +
				bucket +
				'/' +
				srcKey +
				' and uploaded to ' +
				dstBucket +
				'/' +
				srcKey,
		)
	}
