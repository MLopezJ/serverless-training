import { CloudFormationClient } from '@aws-sdk/client-cloudformation'
import { stackOutput } from '@nordicsemiconductor/cloudformation-helpers'
import { StackOutputs } from 'cdk/stacks/image-gallery'
import { stackNamePrefix } from '../cdk/stackName'
import { main as deleteImage } from './deleteImage'
import { main as requestLabels } from './requestLabels'
import { main as uploadImage } from './uploadImage'

const execution = async () => {
	const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION ?? ''

	const outputs: StackOutputs = await stackOutput(
		new CloudFormationClient({}),
	)<StackOutputs>(`${stackNamePrefix}Stack`)

	const key = await uploadImage(AWS_DEFAULT_REGION, outputs)
	await requestLabels(key, outputs)
	await deleteImage(key, outputs)
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
execution()
