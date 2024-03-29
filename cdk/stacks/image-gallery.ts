import * as cdk from 'aws-cdk-lib'
import { CfnOutput } from 'aws-cdk-lib'
import * as apigw from 'aws-cdk-lib/aws-apigateway'
import {
	AuthorizationType,
	CognitoUserPoolsAuthorizer,
	EndpointType,
	MethodLoggingLevel,
} from 'aws-cdk-lib/aws-apigateway'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as event_sources from 'aws-cdk-lib/aws-lambda-event-sources'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { HttpMethods } from 'aws-cdk-lib/aws-s3'
import * as s3n from 'aws-cdk-lib/aws-s3-notifications'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'
import * as path from 'path'

// This is the CDK internal resource ID, not the S3 bucket name!
const imageBucketResourceId = 'cdk-serverlesstraining-imgbucket'
const resizedBucketId = imageBucketResourceId + '-resized'
const websiteBucketName = 'cdk-rekn-publicbucket'

export class ImageGalleryStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props)

		/** Helper functions for creating outputs which makes sure all outputs are documented via the StackOutputs. */
		const output = (name: keyof StackOutputs, value: string) =>
			new cdk.CfnOutput(this, name, {
				value,
			})

		// =====================================================================================
		// Image Bucket
		// =====================================================================================
		const imageBucket = new s3.Bucket(this, imageBucketResourceId, {
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		})
		output('imageBucket', imageBucket.bucketName)
		const imageBucketArn = imageBucket.bucketArn
		imageBucket.addCorsRule({
			allowedMethods: [HttpMethods.GET, HttpMethods.PUT],
			allowedOrigins: ['*'],
			allowedHeaders: ['*'],
			maxAge: 3000,
		})

		// =====================================================================================
		// Thumbnail Bucket
		// =====================================================================================
		const resizedBucket = new s3.Bucket(this, resizedBucketId, {
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		})
		output('resizedBucket', resizedBucket.bucketName)
		const resizedBucketArn = resizedBucket.bucketArn
		resizedBucket.addCorsRule({
			allowedMethods: [HttpMethods.GET, HttpMethods.PUT],
			allowedOrigins: ['*'],
			allowedHeaders: ['*'],
			maxAge: 3000,
		})

		// =====================================================================================
		// Construct to create our Amazon S3 Bucket to host our website
		// =====================================================================================
		const uiBucket = new s3.Bucket(this, websiteBucketName, {
			websiteIndexDocument: 'index.html',
			websiteErrorDocument: 'index.html',
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			publicReadAccess: true, // comment if want to make it private
		})

		output('bucketURL', uiBucket.bucketWebsiteDomainName)

		// =====================================================================================
		// Amazon DynamoDB table for storing image labels
		// =====================================================================================
		const table = new dynamodb.Table(this, 'ImageLabels', {
			partitionKey: { name: 'image', type: dynamodb.AttributeType.STRING },
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		})
		output('ddbTable', table.tableName)

		const sharpLayer = new lambda.LayerVersion(this, 'sharp-layer', {
			compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
			code: lambda.Code.fromAsset('layers/sharp'),
			description: 'Uses a 3rd party library called Sharp to resize images',
		})

		// =====================================================================================
		// Building our AWS Lambda Function; compute for our serverless microservice
		// =====================================================================================

		const rekFn = new NodejsFunction(this, 'rekognitionFunction', {
			memorySize: 1024,
			timeout: cdk.Duration.seconds(30),
			runtime: lambda.Runtime.NODEJS_14_X,
			handler: 'handler',
			entry: path.join(__dirname, `../../rekognitionlambda/index.ts`),
			environment: {
				TABLE: table.tableName,
				BUCKET: imageBucket.bucketName,
				RESIZEDBUCKET: resizedBucket.bucketName,
			},
			/**/
			bundling: {
				minify: false,
				externalModules: ['aws-sdk', 'sharp', '/opt/nodejs/node_modules/sharp'],
			},
			layers: [sharpLayer],
		})

		// remove bucket creationn because labda is triggered now by the sqs queu
		imageBucket.grantRead(rekFn)
		resizedBucket.grantPut(rekFn)
		table.grantWriteData(rekFn)

		rekFn.addToRolePolicy(
			new iam.PolicyStatement({
				effect: iam.Effect.ALLOW,
				actions: ['rekognition:DetectLabels'],
				resources: ['*'],
			}),
		)

		// =====================================================================================
		// Cognito User Pool Authentication
		// =====================================================================================
		const userPool = new cognito.UserPool(this, 'UserPool', {
			selfSignUpEnabled: true, // Allow users to sign up
			autoVerify: { email: true }, // Verify email addresses by sending a verification code
			signInAliases: { username: true, email: true }, // Set email as an alias
		})

		const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
			userPool,
			generateSecret: false, // Don't need to generate secret for web app running on browsers
			authFlows: {
				adminUserPassword: true,
			},
		})

		const developerProviderName = 'developerAuthenticated'
		const identityPool = new cognito.CfnIdentityPool(
			this,
			'ImageRekognitionIdentityPool',
			{
				allowUnauthenticatedIdentities: false, // Don't allow unathenticated users
				cognitoIdentityProviders: [
					{
						clientId: userPoolClient.userPoolClientId,
						providerName: userPool.userPoolProviderName,
					},
				],
				developerProviderName,
			},
		)
		output('developerProviderName', developerProviderName)

		const authenticatedRole = new iam.Role(
			this,
			'ImageRekognitionAuthenticatedRole',
			{
				assumedBy: new iam.FederatedPrincipal(
					'cognito-identity.amazonaws.com',
					{
						StringEquals: {
							'cognito-identity.amazonaws.com:aud': identityPool.ref,
						},
						'ForAnyValue:StringLike': {
							'cognito-identity.amazonaws.com:amr': 'authenticated',
						},
					},
					'sts:AssumeRoleWithWebIdentity',
				),
			},
		)

		// IAM policy granting users permission to upload, download and delete their own pictures
		authenticatedRole.addToPolicy(
			new iam.PolicyStatement({
				actions: ['s3:GetObject', 's3:PutObject'],
				effect: iam.Effect.ALLOW,
				resources: [
					imageBucketArn + '/private/${cognito-identity.amazonaws.com:sub}/*',
					imageBucketArn + '/private/${cognito-identity.amazonaws.com:sub}',
					resizedBucketArn + '/private/${cognito-identity.amazonaws.com:sub}/*',
					resizedBucketArn + '/private/${cognito-identity.amazonaws.com:sub}',
				],
			}),
		)

		// IAM policy granting users permission to list their pictures
		authenticatedRole.addToPolicy(
			new iam.PolicyStatement({
				actions: ['s3:ListBucket'],
				effect: iam.Effect.ALLOW,
				resources: [imageBucketArn, resizedBucketArn],
				conditions: {
					StringLike: {
						's3:prefix': ['private/${cognito-identity.amazonaws.com:sub}/*'],
					},
				},
			}),
		)

		new cognito.CfnIdentityPoolRoleAttachment(
			this,
			'IdentityPoolRoleAttachment',
			{
				identityPoolId: identityPool.ref,
				roles: { authenticated: authenticatedRole.roleArn },
			},
		)

		// Export values of Cognito
		new CfnOutput(this, 'UserPoolId', {
			value: userPool.userPoolId,
		})
		new CfnOutput(this, 'AppClientId', {
			value: userPoolClient.userPoolClientId,
		})
		new CfnOutput(this, 'IdentityPoolId', {
			value: identityPool.ref,
		})

		// =====================================================================================
		// Lambda for Front End
		// =====================================================================================

		const serviceFn = new NodejsFunction(this, 'serviceFunction', {
			memorySize: 1024,
			timeout: cdk.Duration.seconds(5),
			runtime: lambda.Runtime.NODEJS_14_X,
			handler: 'handler',
			entry: path.join(__dirname, `../../servicelambda/index.ts`),
			environment: {
				TABLE: table.tableName,
				BUCKET: imageBucket.bucketName,
				RESIZEDBUCKET: resizedBucket.bucketName,
			},
		})
		// define permisions
		imageBucket.grantReadWrite(serviceFn)
		resizedBucket.grantWrite(serviceFn)
		table.grantReadWriteData(serviceFn)

		const api = new apigw.LambdaRestApi(this, 'imageAPI', {
			defaultCorsPreflightOptions: {
				allowOrigins: apigw.Cors.ALL_ORIGINS,
				allowMethods: apigw.Cors.ALL_METHODS,
			},
			defaultMethodOptions: {
				authorizationType: AuthorizationType.COGNITO,
				authorizer: new CognitoUserPoolsAuthorizer(
					this,
					'APIGatewayAuthorizer',
					{
						cognitoUserPools: [userPool],
					},
				),
			},
			deployOptions: {
				loggingLevel: MethodLoggingLevel.INFO,
			},
			endpointTypes: [EndpointType.REGIONAL],
			handler: serviceFn,
			proxy: false,
		})
		output('apiUrl', api.url)

		// =====================================================================================
		// API Gateway
		// =====================================================================================
		const imageAPI = api.root.addResource('images')

		// GET /images
		imageAPI.addMethod('GET')

		// DELETE /images
		imageAPI.addMethod('DELETE')

		// =====================================================================================
		// Building SQS queue and DeadLetter Queue
		// =====================================================================================
		const dlQueue = new sqs.Queue(this, 'ImageDLQueue', {
			// is noy a good practice to give it a name for scalability reason
		})

		const queue = new sqs.Queue(this, 'ImageQueue', {
			visibilityTimeout: cdk.Duration.seconds(30),
			receiveMessageWaitTime: cdk.Duration.seconds(20),
			deadLetterQueue: {
				maxReceiveCount: 2,
				queue: dlQueue,
			},
		})

		// =====================================================================================
		// Building S3 Bucket Create Notification to SQS
		// =====================================================================================
		imageBucket.addObjectCreatedNotification(new s3n.SqsDestination(queue), {
			prefix: 'private/',
		})

		// =====================================================================================
		// Lambda(Rekognition) to consume messages from SQS
		// =====================================================================================
		rekFn.addEventSource(new event_sources.SqsEventSource(queue))
	}
}

export type StackOutputs = {
	AppClientId: string
	IdentityPoolId: string
	UserPoolId: string
	bucketURL: string
	ddbTable: string
	imageAPIEndpointD64DB231: string
	imageBucket: string
	resizedBucket: string
	developerProviderName: string
	apiUrl: string
}
