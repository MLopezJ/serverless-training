import { S3Event, SQSEvent } from 'aws-lambda'

export const handler =
	({
		generateThumb,
		imageLabels,
	}: {
		imageLabels: (bucketName: string, bucketKey: string) => Promise<unknown>
		generateThumb: (bucketName: string, bucketKey: string) => Promise<unknown>
	}) =>
	async (event: SQSEvent): Promise<void> => {
		console.log('Lambda processing event: ')
		console.log(JSON.stringify(event))
		const records = event.Records
		for await (const payload of records) {
			const eventInformation = JSON.parse(payload.body) as S3Event
			for await (const element of eventInformation?.Records ?? []) {
				const bucketName = element.s3.bucket.name
				const bucketKey = element.s3.object.key
				await imageLabels(bucketName, bucketKey)
				await generateThumb(bucketName, bucketKey)
			}
		}
	}
