import fetch from 'node-fetch'

export const request = async (
	endpoint: string,
	parameters: { action: string; key: string },
): Promise<any> => {
	const url = `${endpoint} ${new URLSearchParams(parameters)}`
	return fetch(url)
}
