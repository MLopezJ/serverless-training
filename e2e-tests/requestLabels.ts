import { fromEnv } from '@nordicsemiconductor/from-env'
import * as aws4 from 'aws4'
import fetch from 'node-fetch'
import { getCognitoUserCredentials } from './getCognitoUserCredentials'

const { userPoolId, userPoolClientId, identityPoolId, developerProviderName } =
	fromEnv({
		userPoolId: 'COGNITO_USER_POOL_ID',
		userPoolClientId: 'COGNITO_USER_POOL_CLIENT_ID',
		identityPoolId: 'COGNITO_IDENTITY_POOL_ID',
		developerProviderName: 'COGNITO_DEVELOPER_PROVIDER_NAME',
	})(process.env)

const main = async () => {
	const cognitoID = 'eu-west-1:78ad3dad-3394-47fe-867a-2a0ddf50ba3d'
	const filename = 'shark.jpg'
	const key = `private/${cognitoID}/photos/${filename}`

	const credentials = await getCognitoUserCredentials({
		userPoolId,
		userPoolClientId,
		identityPoolId,
		developerProviderName,
		emailAsUsername: false,
	})

	const opts: aws4.Request = {
		method: 'GET',
		host: 'gqppnr4yg4.execute-api.eu-west-1.amazonaws.com',
		path: `/prod/images?${new URLSearchParams({
			key,
			action: 'getLabels',
		})}`,
		service: 'execute-api',
		region: 'eu-west-1',
	}

	aws4.sign(opts, {
		accessKeyId: credentials.AccessKeyId,
		secretAccessKey: credentials.SecretKey,
		sessionToken: credentials.SessionToken,
	})

	console.log(opts)
	const response = await fetch(`https://${opts.host}${opts.path}`, {
		headers: (opts as any).headers,
	})

	console.log(response.headers)
	console.log(await response.json())
}

main().then(console.log).catch(console.error)
