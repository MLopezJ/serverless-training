import * as aws4 from 'aws4'
import fetch from 'node-fetch'

// request API

// check labels

const main = async () => {
	const cognitoID = 'eu-west-1:78ad3dad-3394-47fe-867a-2a0ddf50ba3d'
	const filename = 'shark.jpg'
	const key = `private/${cognitoID}/photos/${filename}`

	const opts = {
		method: 'GET',
		host: 'gqppnr4yg4.execute-api.eu-west-1.amazonaws.com',
		path: `/prod/images?${new URLSearchParams({
			key,
			action: 'getLabels',
		})}`,
		port: 0,
		service: 'execute-api',
		payload: '',
		region: 'eu-west-1',
	}

	aws4.sign(opts)

	console.log(opts)
	const response = await fetch('https://' + opts.host + opts.path, {
		headers: (opts as any).headers,
	})

	console.log(await response.json())
}

main().then(console.log).catch(console.error)
