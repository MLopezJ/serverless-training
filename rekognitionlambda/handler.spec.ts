import { SQSEvent } from 'aws-lambda'
import { handler } from './handler'

describe('handler', () => {
	it('should handle the event', async () => {
		const bucketName =
			'dev-awsserverlesstrainin-cdkserverlesstrainingimg-10j2jragqzpe3'
		const objectKey =
			'private/eu-west-1%3A4876d49a-26d7-4fa9-9f07-d0672587cb86/photos/coffee-espresso.png'
		const event: SQSEvent = {
			Records: [
				{
					messageId: '0014981b-8343-4bf9-8a9f-b063ad641974',
					receiptHandle:
						'AQEBARrI/LRBKNVidochtcNGsA/wlTuohVMc71pUtiQfCIN7p4HgWP9gfJS8jlEZHeX66vcvT7OR7sJYQ2E68GHyPGnwxFnz5cxuEN+XNnWpO/It647jIFxheCqRWVDFL3yr2ZNNoVxVOh9wsy3+zDy2kDia0ssAKzcmKN+c0nxMam2s8nSiRpYINgxhTrXhQU6BOYSounehaQz6+GBzeJpQLZNNumygJ7/f63wKAFwB+4U6eRnXJgMI4MBPKOKrKtC2BBfXFeY/py3lACpTWBX0HId1m5tEzR+cRH7g48XQw/aEDKb5hsQodknLGQfYDJw9K/SApM1bMoYVMPZrARyF8yX3MG/69yRSWyjYO6fxG8MLNxvLvBZoIYbiGsqLzMtQjCxvS5iB/+iEoCWTguRKrKDIklE43DdkmR5jkxPlwPFdkyHu9S571k+ycuZvopF4kCEMnzxkd85rVIExZjjyKw==',
					body: JSON.stringify({
						Records: [
							{
								eventVersion: '2.1',
								eventSource: 'aws:s3',
								awsRegion: 'eu-west-1',
								eventTime: '2022-06-27T15:41:26.059Z',
								eventName: 'ObjectCreated:Put',
								userIdentity: {
									principalId:
										'AWS:AROAUHWSKDOWCWB2ZXY6A:CognitoIdentityCredentials',
								},
								requestParameters: {
									sourceIPAddress: '194.19.86.146',
								},
								responseElements: {
									'x-amz-request-id': 'BY4XRCT85ZM5P3EW',
									'x-amz-id-2':
										'ZmZK9jXbo3UWdQQpI8X/ihqiMC9PXN/l02YRtzG84ZxWYKUatQ73LVdBjQLqUoVqrLevCvh7xaivHJbAOQRSNC4MjZe/h5ci',
								},
								s3: {
									s3SchemaVersion: '1.0',
									configurationId:
										'OGU2MDEzNjUtNzllMy00NWI2LTg2ZjItYmZlOTA4Y2Q2ZGRh',
									bucket: {
										name: bucketName,
										ownerIdentity: {
											principalId: 'A1QF6ZMQN0JHGN',
										},
										arn: 'arn:aws:s3:::dev-awsserverlesstrainin-cdkserverlesstrainingimg-10j2jragqzpe3',
									},
									object: {
										key: objectKey,
										size: 150885,
										eTag: 'f684faa823d16e702c512e9181786b45',
										sequencer: '0062B9CFA5EE1D0792',
									},
								},
							},
						],
					}),
					attributes: {
						ApproximateReceiveCount: '1',
						SentTimestamp: '1656344487677',
						SenderId: 'AIDAJQOC3SADRY5PEMBNW',
						ApproximateFirstReceiveTimestamp: '1656344487683',
					},
					messageAttributes: {},
					md5OfBody: '3bb8e82b1bc08c48a138296d30f1ed1f',
					eventSource: 'aws:sqs',
					eventSourceARN:
						'arn:aws:sqs:eu-west-1:291425098668:dev-AwsServerlessTrainingStack-dev-ImageQueueB29E40E5-yLhYHKzJPh15',
					awsRegion: 'eu-west-1',
				},
			],
		}

		const generateThumb = jest.fn()
		const imageLabels = jest.fn()

		await handler({ generateThumb, imageLabels })(event)
		expect(imageLabels).toHaveBeenCalledWith(bucketName, objectKey)
		expect(generateThumb).toHaveBeenCalledWith(bucketName, objectKey)
	})
})
