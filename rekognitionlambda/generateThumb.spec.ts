import { S3Client } from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import { generateThumb } from './generateThumb'

describe('generateThumb', () => {
	const dstBucket = 'RESIZEDBUCKET'
	const bufferMock = Buffer.from('imageThumbnail')
	const bucket =
		'dev-awsserverlesstrainin-cdkserverlesstrainingimg-10j2jragqzpe3'
	const imageKey = 'private/photos/coffee-espresso.png'
	const photo = 'private/photos/coffee-espresso.png'

	it('Should download image freom AWS S3', async () => {
		const s3: S3Client = {
			send: jest.fn().mockImplementation(() => {
				const redable = new Readable()
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				redable._read = () => {}
				redable.push('something')
				redable.push(null)
				return { Body: redable }
			}),
		} as any
		const imageThumbnail = jest.fn().mockImplementation(() => bufferMock)

		await generateThumb({ s3, dstBucket, imageThumbnail })(bucket, imageKey)

		// download image
		expect(s3.send).toHaveBeenCalledWith(
			expect.objectContaining({
				input: {
					Bucket: bucket,
					Key: photo,
				},
			}),
		)
	})

	it('Should resize image', async () => {
		const buffer = 'something'
		const s3: S3Client = {
			send: jest.fn().mockImplementation(() => {
				const redable = new Readable()
				redable.push(buffer)
				redable.push(null)
				return { Body: redable }
			}),
		} as any
		const imageThumbnail = jest.fn().mockImplementation(() => bufferMock)
		await generateThumb({ s3, dstBucket, imageThumbnail })(bucket, imageKey)

		expect(imageThumbnail).toHaveBeenCalledWith(Buffer.from(buffer), 200)

		expect(imageThumbnail).toHaveBeenCalled()
	})

	it('Should save resized image in AWS S3', async () => {
		const s3: S3Client = {
			send: jest.fn().mockImplementation(() => {
				const redable = new Readable()
				redable.push('something')
				redable.push(null)
				return { Body: redable }
			}),
		} as any
		const imageThumbnail = jest.fn().mockImplementation(() => bufferMock)
		await generateThumb({ s3, dstBucket, imageThumbnail })(bucket, imageKey)

		// download image
		expect(s3.send).toHaveBeenCalledWith(
			expect.objectContaining({
				input: {
					Bucket: bucket,
					Key: photo,
				},
			}),
		)

		// save image
		expect(s3.send).toHaveBeenCalledWith(
			expect.objectContaining({
				input: {
					Body: bufferMock,
					Bucket: dstBucket,
					ContentType: 'image',
					Key: photo,
				},
			}),
		)
	})

	it('Should return true if the process was successful', async () => {
		const s3: S3Client = {
			send: jest.fn().mockImplementation(() => {
				const redable = new Readable()
				redable.push('something')
				redable.push(null)
				return { Body: redable }
			}),
		} as any
		const imageThumbnail = jest.fn().mockImplementation(() => bufferMock)
		const result = await generateThumb({ s3, dstBucket, imageThumbnail })(
			bucket,
			imageKey,
		)

		// download image
		expect(s3.send).toHaveBeenCalledWith(
			expect.objectContaining({
				input: {
					Bucket: bucket,
					Key: photo,
				},
			}),
		)

		// save image
		expect(s3.send).toHaveBeenCalledWith(
			expect.objectContaining({
				input: {
					Body: bufferMock,
					Bucket: dstBucket,
					ContentType: 'image',
					Key: photo,
				},
			}),
		)

		const success = 'error' in result ? false : true

		expect(success).toBe(true)
	})

	it('Should return error if is not possible to infer image type', async () => {
		const imgKey = 'hola'
		const s3: S3Client = {
			send: jest.fn().mockImplementation(() => {
				const redable = new Readable()
				redable.push('something')
				redable.push(null)
				return { Body: redable }
			}),
		} as any
		const imageThumbnail = jest.fn().mockImplementation(() => bufferMock)
		const result = await generateThumb({ s3, dstBucket, imageThumbnail })(
			bucket,
			imgKey,
		)

		const error = 'error' in result ? result.error : false

		expect(error).toStrictEqual(
			new Error(`Could not determine the image type of '${imgKey}'`),
		)
	})

	it('Should return error if image type is not supported', async () => {
		const imgKey = 'hola.com'
		const s3: S3Client = {
			send: jest.fn().mockImplementation(() => {
				const redable = new Readable()
				redable.push('something')
				redable.push(null)
				return { Body: redable }
			}),
		} as any
		const imageThumbnail = jest.fn().mockImplementation(() => bufferMock)
		const result = await generateThumb({ s3, dstBucket, imageThumbnail })(
			bucket,
			imgKey,
		)

		const error = 'error' in result ? result.error : false
		const imgType = /\.([^.]*)$/.exec(imgKey)?.[1].toLowerCase()

		expect(error).toStrictEqual(new Error(`Unsupported image type: ${imgType}`))
	})

	it('Should return error if image was not possible to be downloaded from AWS S3', async () => {
		const s3: S3Client = {
			send: jest.fn().mockImplementation(() => undefined),
		} as any
		const imageThumbnail = jest.fn().mockImplementation(() => bufferMock)
		const result = await generateThumb({ s3, dstBucket, imageThumbnail })(
			bucket,
			imageKey,
		)
		const error = 'error' in result ? result.error : false
		expect(error).toStrictEqual(
			new Error(`Original image not found in ${bucket}/${photo} .`),
		)
	})

	it('Should return error if image was not able to resize', async () => {
		const s3: S3Client = {
			send: jest.fn().mockImplementation(() => {
				const redable = new Readable()
				redable.push('something')
				redable.push(null)
				return { Body: redable }
			}),
		} as any
		const imageThumbnail = jest.fn().mockImplementation(() => undefined)
		const result = await generateThumb({ s3, dstBucket, imageThumbnail })(
			bucket,
			imageKey,
		)

		const error = 'error' in result ? result.error : false
		expect(error).toStrictEqual(
			new Error(`Failed to resize image ${bucket}/${photo}!`),
		)
	})

	it('Should return error if resize image was not possible to be upload', async () => {
		const s3: S3Client = {
			send: jest
				.fn()
				.mockImplementationOnce(() => {
					const redable = new Readable()
					redable.push('something')
					redable.push(null)
					return { Body: redable }
				})
				.mockImplementationOnce(() => undefined),
		} as any
		const imageThumbnail = jest.fn().mockImplementation(() => bufferMock)
		const result = await generateThumb({ s3, dstBucket, imageThumbnail })(
			bucket,
			imageKey,
		)

		const error = 'error' in result ? result.error : false
		expect(error).toStrictEqual(
			new Error(`Failed to upload resize image ${dstBucket}/${photo}`),
		)
	})
})
