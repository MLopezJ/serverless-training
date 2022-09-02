#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import 'source-map-support/register'
import { stackNamePrefix } from '../cdk/stackName'
import { ContinuousDeploymentPipelineStack } from '../cdk/stacks/continuous-deployment-pipeline'
import { ImageGalleryStack } from '../cdk/stacks/image-gallery'

const app = new cdk.App({
	context: {
		'backend.repository':
			process.env.BACKEND_REPOSITORY ?? 'MLopezJ/serverless-training',
		'backend.branch': process.env.BACKEND_BRANCH ?? 'saga',
	},
})

new ImageGalleryStack(app, `${stackNamePrefix}Stack`)

new ContinuousDeploymentPipelineStack(
	app,
	`${stackNamePrefix}PipelineStack`,
	{},
)
