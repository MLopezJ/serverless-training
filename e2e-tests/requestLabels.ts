import { CloudFormationClient } from '@aws-sdk/client-cloudformation'
import { stackOutput } from '@nordicsemiconductor/cloudformation-helpers'
import { StackOutputs } from 'cdk/stacks/image-gallery'
import fetch from 'node-fetch'
import { stackNamePrefix } from '../cdk/stackName.js'
import { getCognitoUserCredentials } from './getCognitoUserCredentials'

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

	const filename = 'shark.jpg'
	const key = `private/${credentials.IdentityId}/photos/${filename}`

	const endpoint = new URL(outputs.apiUrl)

	const request: Parameters<typeof fetch> = [
		`https://${endpoint.hostname}${
			endpoint.pathname
		}images?${new URLSearchParams({
			key,
			action: 'getLabels',
		})}`,
		{
			headers: {
				Authorization: `Bearer ${credentials.IdToken}`,
			},
		},
	]
	const response = await fetch(...request)

	console.log(`${response.status} ${response.statusText}`)
	console.log(await response.json())
}

main().then(console.log).catch(console.error)
