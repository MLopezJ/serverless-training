import {
	CognitoIdentityClient,
	GetCredentialsForIdentityCommand,
	GetOpenIdTokenForDeveloperIdentityCommand,
} from '@aws-sdk/client-cognito-identity'
import {
	AdminCreateUserCommand,
	AdminInitiateAuthCommand,
	AdminRespondToAuthChallengeCommand,
	CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider'

const randSeq = () =>
	Math.random()
		.toString(36)
		.replace(/[^a-z]+/g, '')

export const getCognitoUserCredentials = async ({
	userPoolId,
	userPoolClientId,
	identityPoolId,
	emailAsUsername,
	developerProviderName,
}: {
	emailAsUsername?: boolean
	userPoolId: string
	userPoolClientId: string
	identityPoolId: string
	developerProviderName: string
}): Promise<{
	IdentityId: string
	Token: string
	AccessKeyId: string
	SecretKey: string
	SessionToken: string
}> => {
	const Username = randSeq()
	const email = `${Username.toLowerCase()}@example.com`
	const cognitoUsername = (emailAsUsername ?? true) === true ? email : Username
	console.debug('Cognito', `Registering user ${cognitoUsername}`)
	const TemporaryPassword = `${randSeq()}${randSeq().toUpperCase()}${Math.random()}`
	const ci = new CognitoIdentityClient({})
	const cisp = new CognitoIdentityProviderClient({})

	await cisp.send(
		new AdminCreateUserCommand({
			UserPoolId: userPoolId,
			Username: cognitoUsername,
			UserAttributes: [
				{
					Name: 'email',
					Value: email,
				},
				{
					Name: 'email_verified',
					Value: 'True',
				},
			],
			TemporaryPassword,
		}),
	)

	const newPassword = `${randSeq()}${randSeq().toUpperCase()}${Math.random()}`
	const { Session } = await cisp.send(
		new AdminInitiateAuthCommand({
			AuthFlow: 'ADMIN_NO_SRP_AUTH',
			UserPoolId: userPoolId,
			ClientId: userPoolClientId,
			AuthParameters: {
				USERNAME: cognitoUsername,
				PASSWORD: TemporaryPassword,
			},
		}),
	)
	await cisp.send(
		new AdminRespondToAuthChallengeCommand({
			ChallengeName: 'NEW_PASSWORD_REQUIRED',
			UserPoolId: userPoolId,
			ClientId: userPoolClientId,
			Session: Session ?? '',
			ChallengeResponses: {
				USERNAME: cognitoUsername,
				NEW_PASSWORD: newPassword,
			},
		}),
	)

	const { IdentityId, Token } = await ci.send(
		new GetOpenIdTokenForDeveloperIdentityCommand({
			IdentityPoolId: identityPoolId,
			Logins: {
				[developerProviderName]: Username,
			},
			TokenDuration: 3600,
		}),
	)

	const { Credentials } = await ci.send(
		new GetCredentialsForIdentityCommand({
			IdentityId: IdentityId ?? '',
			Logins: {
				['cognito-identity.amazonaws.com']: Token ?? '',
			},
		}),
	)

	return {
		IdentityId: IdentityId ?? '',
		Token: Token ?? '',
		AccessKeyId: Credentials?.AccessKeyId ?? '',
		SecretKey: Credentials?.SecretKey ?? '',
		SessionToken: Credentials?.SessionToken ?? '',
	}
}
