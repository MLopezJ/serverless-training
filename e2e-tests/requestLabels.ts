import { CloudFormationClient } from '@aws-sdk/client-cloudformation'
import { stackOutput } from '@nordicsemiconductor/cloudformation-helpers'
import { StackOutputs } from 'cdk/stacks/image-gallery'
import { assertThat, is } from 'hamjest'
import { stackNamePrefix } from '../cdk/stackName.js'
import { apiGatewayClient } from './utils/apiGatewayClient'
import { getCognitoUserCredentials } from './utils/getCognitoUserCredentials'

const main = async () => {
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

	const filename = 'shark.jpg'
	const key = `private/${credentials.IdentityId}/photos/${filename}`

	const response = await authenticatedClient(
		'images',
		new URLSearchParams({
			key,
			action: 'getLabels',
		}),
	)

	assertThat(response.status, is(404))
}

main().then(console.log).catch(console.error)
