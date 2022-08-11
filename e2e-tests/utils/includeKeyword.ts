import { GetItemCommandOutput } from '@aws-sdk/client-dynamodb'

export const includeKeyword = (
	labels: GetItemCommandOutput,
	keyword: string,
): boolean =>
	Object.values(labels.Item ?? {})
		.map((label) => label.S)
		.includes(keyword)
