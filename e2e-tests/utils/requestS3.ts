import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'

export const requestImage = async (
	s3: S3Client,
	Key: string,
	Bucket: string,
): Promise<any> => {
	try {
		console.log({ Bucket, Key })
		return await s3.send(
			new GetObjectCommand({
				Bucket,
				Key,
			}),
		)
	} catch (err: any) {
		throw new Error(
			`{"message":"Failed to fetch image from ${Key} in ${Bucket}", "code":"${err.Code}"}`,
		)
	}
}
