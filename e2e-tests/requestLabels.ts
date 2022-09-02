import { GetItemCommandOutput } from '@aws-sdk/client-dynamodb'
import { StackOutputs } from 'cdk/stacks/image-gallery'
import { assertThat, is } from 'hamjest'
import { apiGatewayClient } from './utils/apiGatewayClient'
import { getCognitoUserCredentials } from './utils/getCognitoUserCredentials'
import { includeKeyword } from './utils/includeKeyword.js'
import { retry } from './utils/retry.js'

export const main = async (
	key: string,
	outputs: StackOutputs,
): Promise<void> => {
	console.log('-- Start Request Labels --')
	const keyword = 'Shark'

	const credentials = await getCognitoUserCredentials({
		userPoolId: outputs.UserPoolId,
		userPoolClientId: outputs.AppClientId,
		identityPoolId: outputs.IdentityPoolId,
		developerProviderName: outputs.developerProviderName,
		emailAsUsername: false,
	})
	const endpoint = new URL(outputs.apiUrl)
	const authenticatedClient = apiGatewayClient(endpoint, credentials.IdToken)

	const response = await retry(
		async () =>
			authenticatedClient(
				'images',
				new URLSearchParams({
					key,
					action: 'getLabels',
				}),
			).then(async (response) => response.json()),
		'Request Labels',
	)

	assertThat(
		includeKeyword(response as GetItemCommandOutput, keyword),
		is(true),
	)
	console.log('-- Finish Request Labels --')
}
