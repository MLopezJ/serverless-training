/**
 * Delete image from S3 bucket (main bucket and resized images bucket) and their related labels in DynamoDB
 * */
import { CloudFormationClient } from '@aws-sdk/client-cloudformation'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { S3Client } from '@aws-sdk/client-s3'
import { stackOutput } from '@nordicsemiconductor/cloudformation-helpers'
import { StackOutputs } from 'cdk/stacks/image-gallery'
import { assertThat, is } from 'hamjest'
import { stackNamePrefix } from '../cdk/stackName.js'
import { apiGatewayClient } from './utils/apiGatewayClient'
import { getCognitoUserCredentials } from './utils/getCognitoUserCredentials'
import { requestLabels } from './utils/requestDynamoDB.js'
import { requestImage } from './utils/requestS3.js'
import { retry } from './utils/retry.js'

export const main = async (key: string): Promise<void> => {
	console.log('-- Start Delete Image --')
	const ddbClient = new DynamoDBClient({})
	const s3 = new S3Client({})
	const bucket = process.env.BUCKET ?? ''
	const resizedBucket = process.env.RESIZED_BUCKET ?? ''

	const TableName = process.env.TABLE_NAME ?? ''
	const outputs = await stackOutput(new CloudFormationClient({}))<StackOutputs>(
		`${stackNamePrefix}Stack`,
	)

	const credentials = await getCognitoUserCredentials({
		userPoolId: outputs.UserPoolId,
		userPoolClientId: outputs.AppClientId,
		identityPoolId: outputs.IdentityPoolId,
		developerProviderName: outputs.developerProviderName,
		emailAsUsername: false,
	})
	const endpoint = new URL(outputs.apiUrl)
	const authenticatedClient = apiGatewayClient(endpoint, credentials.IdToken)

	const deleteImageAction = await retry(
		async () =>
			authenticatedClient(
				'images',
				new URLSearchParams({
					key,
					action: 'deleteImage',
				}),
			),
		'Delete Image',
	)

	assertThat(deleteImageAction.status, is(202))

	// check dynamodb
	const labels = await retry(
		async () => requestLabels(ddbClient, TableName, key),
		'Check deleted labels',
	)
	assertThat(labels.Item, is(undefined))

	// check bucket
	await requestImage(s3, key, bucket)
		.then()
		.catch((err) => {
			const { code } = JSON.parse(err.message)
			assertThat(code, is('NoSuchKey'))
		})

	// check resized bucket
	await requestImage(s3, key, resizedBucket)
		.then()
		.catch((err) => {
			const { code } = JSON.parse(err.message)
			assertThat(code, is('NoSuchKey'))
		})

	console.log('-- Finish Delete Image --')
}
