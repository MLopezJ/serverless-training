import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { RekognitionClient } from '@aws-sdk/client-rekognition'
import { S3Client } from '@aws-sdk/client-s3'
import { fromEnv } from '@nordicsemiconductor/from-env'
import type * as sharpType from 'sharp'
import { generateThumb } from './generateThumb'
import { handler as recognitionHandler } from './handler'
import { imageLabels } from './imageLabels'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as sharpModule from '/opt/nodejs/node_modules/sharp' // Uses the location of the module IN the layer
export const sharp = sharpModule.default as typeof sharpType

const { dstBucket, TableName } = fromEnv({
	dstBucket: 'RESIZEDBUCKET',
	TableName: 'TABLE',
})(process.env)

export const maxLabels = parseInt(process.env.MAX_LABELS ?? '10', 10)
export const minConfidence = parseInt(process.env.MIN_CONFIDENCE ?? '50', 10)

export const rekogClient = new RekognitionClient({})
export const ddbClient = new DynamoDBClient({})
const s3 = new S3Client({})

export const handler = recognitionHandler({
	generateThumb: generateThumb({
		s3,
		dstBucket,
		imageThumbnail: async (image, width) =>
			sharp(image).resize(width).toBuffer(),
	}),
	imageLabels: imageLabels({
		rekogClient,
		maxLabels,
		minConfidence,
		ddbClient,
		TableName,
	}),
})
